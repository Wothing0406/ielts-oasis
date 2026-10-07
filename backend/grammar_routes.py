from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from database import get_db
from models import GrammarTopic, GrammarLesson, GrammarExercise, UserGrammarProgress, WritingLog, Vocabulary, User
from schemas import (
    GrammarTopicResponse,
    GrammarLessonResponse,
    GrammarExerciseResponse,
    ExerciseSubmitPayload,
    CustomExamGenRequest,
    MirrorErrorRequest,
)
from services.ai_service import ai_service
from logger import setup_logger
import json
from datetime import datetime, timedelta

logger = setup_logger("grammar_routes")

grammar_router = APIRouter(prefix="/grammar", tags=["Grammar Engine"])

# Helper function to get current user id from Authorization header
def get_optional_user(request: Request, db: Session = Depends(get_db)) -> Optional[User]:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ")[1]
    # In Oasis, users can be identified by discord_id or user.id
    user = db.query(User).filter(User.discord_id == token).first()
    if not user and token.isdigit():
        user = db.query(User).filter(User.id == int(token)).first()
    return user


@grammar_router.get("/taxonomy")
def get_taxonomy(db: Session = Depends(get_db)):
    """
    Trả về toàn bộ cây 6 cụm chuyên đề CEFR A1-C1 và 42 bài học cốt lõi.
    Nếu DB chưa có dữ liệu, tự động seed taxonomy ban đầu.
    """
    topics = db.query(GrammarTopic).order_index if hasattr(db.query(GrammarTopic), "order_index") else db.query(GrammarTopic).order_by(GrammarTopic.order_index).all()
    
    if not topics:
        seed_initial_taxonomy(db)
        topics = db.query(GrammarTopic).order_by(GrammarTopic.order_index).all()

    result = []
    for t in topics:
        lessons_data = []
        for l in t.lessons:
            lessons_data.append({
                "id": l.id,
                "topic_id": l.topic_id,
                "title_en": l.title_en,
                "title_vi": l.title_vi,
                "cefr_level": l.cefr_level,
                "ielts_relevance": l.ielts_relevance,
                "formula": l.formula or {},
                "rule_summary": l.rule_summary,
                "ielts_application": l.ielts_application,
                "common_pitfalls": l.common_pitfalls or [],
                "academic_examples": l.academic_examples or []
            })
        result.append({
            "id": t.id,
            "title_vi": t.title_vi,
            "title_en": t.title_en,
            "icon_name": t.icon_name,
            "order_index": t.order_index,
            "lessons": lessons_data
        })
    return {"success": True, "data": result}


@grammar_router.get("/drills")
def get_drills(
    topic_id: Optional[str] = None,
    lesson_id: Optional[str] = None,
    mechanic: Optional[str] = None,
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """
    Lấy danh sách bài tập câu hỏi được lọc theo topic, lesson hoặc mechanic.
    """
    query = db.query(GrammarExercise)
    if lesson_id:
        query = query.filter(GrammarExercise.lesson_id == lesson_id)
    if mechanic:
        query = query.filter(GrammarExercise.mechanic == mechanic)
    
    exercises = query.limit(limit).all()
    data = []
    for ex in exercises:
        data.append({
            "id": ex.id,
            "lesson_id": ex.lesson_id,
            "mechanic": ex.mechanic,
            "cefr_level": ex.cefr_level,
            "target_concept": ex.target_concept,
            "dataset_source": ex.dataset_source,
            "prompt": ex.prompt,
            "content_payload": ex.content_payload,
            "explanation": ex.explanation,
            "ielts_tip": ex.ielts_tip,
            "vault_word_slot": ex.vault_word_slot
        })
    return {"success": True, "data": data}


@grammar_router.post("/custom-generate")
async def generate_custom_drills(
    payload: CustomExamGenRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Sinh đề thi thích ứng AI:
    - Nếu có custom_text: trích xuất ngữ pháp từ đoạn văn nhập vào.
    - Nếu có infused_words: lồng ghép từ vựng cá nhân vào câu hỏi.
    """
    user = get_optional_user(request, db)
    
    if payload.custom_text and payload.custom_text.strip():
        # Sinh đề từ văn bản nhập vào
        generated = await ai_service.generate_grammar_from_custom_text(
            text=payload.custom_text.strip(),
            mechanics=payload.mechanics,
            count=payload.count or 4
        )
        return {"success": True, "data": generated, "source": "custom_text"}
    
    # Sinh đề lồng ghép từ vựng cá nhân
    vocab_list = []
    if payload.infused_words:
        vocab_list = [{"word": w} for w in payload.infused_words]
    elif user:
        user_vocabs = db.query(Vocabulary).filter(Vocabulary.user_id == user.id).limit(10).all()
        vocab_list = [{"word": v.word, "meaning": v.meaning} for v in user_vocabs]

    generated = await ai_service.generate_vault_infused_exercises(
        vocab_list=vocab_list,
        topic_id=payload.topic_id or "tenses",
        count=payload.count or 4
    )
    return {"success": True, "data": generated, "source": "vault_infused"}


@grammar_router.post("/mirror-errors")
async def generate_mirror_errors(
    payload: MirrorErrorRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Tạo bài tập 'Mirror Error Spotting' từ chính lịch sử bài Writing đã chấm của User.
    """
    user = get_optional_user(request, db)
    writing_samples = []
    
    if user:
        logs = db.query(WritingLog).filter(WritingLog.user_id == user.id).order_by(WritingLog.created_at.desc()).limit(payload.limit_writings or 5).all()
        for l in logs:
            writing_samples.append({
                "content": l.content,
                "feedback": l.feedback,
                "band_score": l.band_score
            })

    if not writing_samples:
        # Fallback mẫu bài viết tiêu biểu có lỗi thông dụng để học viên luyện tập
        writing_samples = [
            {
                "content": "Although the government invested in infrastructure, but the economic progress remained stagnant.",
                "feedback": "Lỗi dùng đồng thời Although và But trong cùng một câu ghép.",
                "band_score": "6.0"
            },
            {
                "content": "The number of vehicles were increasing dramatically between 2005 and 2015.",
                "feedback": "Lỗi hòa hợp chủ vị: 'The number of + N số nhiều' đi với động từ số ít 'was increasing'.",
                "band_score": "6.5"
            }
        ]

    exercises = await ai_service.generate_mirror_error_exercises(writing_samples)
    return {"success": True, "data": exercises, "source": "mirror_writing_logs"}


@grammar_router.post("/submit")
def submit_exercise(
    payload: ExerciseSubmitPayload,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Ghi nhận kết quả làm bài tập và cập nhật tiến trình Spaced Repetition (SRS)
    """
    user = get_optional_user(request, db)
    if not user:
        return {"success": True, "data": {"message": "Submitted without user account"}}

    lesson_id = payload.lesson_id or "general_practice"
    progress = db.query(UserGrammarProgress).filter(
        UserGrammarProgress.user_id == user.id,
        UserGrammarProgress.lesson_id == lesson_id
    ).first()

    if not progress:
        progress = UserGrammarProgress(
            user_id=user.id,
            lesson_id=lesson_id,
            mastery_score=10.0,
            streak=1,
            total_attempts=1,
            correct_attempts=1,
            last_practiced=datetime.utcnow(),
            next_review_due=datetime.utcnow() + timedelta(days=1)
        )
        db.add(progress)
    else:
        progress.total_attempts += 1
        progress.streak += 1
        progress.mastery_score = min(100.0, progress.mastery_score + 5.0)
        progress.last_practiced = datetime.utcnow()
        # SRS interval
        days_ahead = min(30, 2 ** min(progress.streak, 5))
        progress.next_review_due = datetime.utcnow() + timedelta(days=days_ahead)

    db.commit()
    return {
        "success": True,
        "data": {
            "mastery_score": progress.mastery_score,
            "streak": progress.streak,
            "next_review_due": progress.next_review_due.isoformat()
        }
    }


def seed_initial_taxonomy(db: Session):
    """
    Seed 6 Cụm chuyên đề lớn chuẩn Raymond Murphy & Cambridge English Grammar Profile
    """
    topics_seed = [
        {
            "id": "tenses",
            "title_vi": "Các Thì & Thời Gian (Tenses & Aspects)",
            "title_en": "Tenses & Aspects",
            "icon_name": "Clock",
            "order_index": 1,
            "lessons": [
                {
                    "id": "past_simple_task1",
                    "title_en": "Past Simple with Closed Time Frames",
                    "title_vi": "Quá Khứ Đơn - Vũ Khí Biểu Đồ Task 1",
                    "cefr_level": "A2",
                    "ielts_relevance": "Writing Task 1",
                    "formula": {"positive": "S + V-ed / V2", "negative": "S + did not + V-inf", "question": "Did + S + V-inf?"},
                    "rule_summary": "Diễn tả hành động bắt đầu và kết thúc hoàn toàn tại mốc thời gian xác định trong quá khứ.",
                    "ielts_application": "Bắt buộc dùng trong Task 1 khi biểu đồ có các năm quá khứ (ví dụ: between 2000 and 2010).",
                    "common_pitfalls": ["Quên chia thì quá khứ khi thấy năm trong biểu đồ", "Lẫn lộn với Present Perfect khi có năm cụ thể"],
                    "academic_examples": [{"sentence": "Between 2005 and 2015, car ownership escalated by 35%.", "band_score": "Band 8.0"}]
                },
                {
                    "id": "past_perfect_milestones",
                    "title_en": "Past Perfect with Reference Points",
                    "title_vi": "Quá Khứ Hoàn Thành - Điểm Nhấn GRA Task 1",
                    "cefr_level": "B2",
                    "ielts_relevance": "Writing Task 1",
                    "formula": {"positive": "S + had + V3/V-ed", "negative": "S + had not + V3", "question": "Had + S + V3?"},
                    "rule_summary": "Diễn tả hành động xảy ra trước một mốc hoặc hành động khác trong quá khứ.",
                    "ielts_application": "Rất đắt giá khi dùng với 'By [Past Year]' hoặc 'Prior to'.",
                    "common_pitfalls": ["Lạm dụng khi chỉ có 1 mốc thời gian đơn lẻ"],
                    "academic_examples": [{"sentence": "By 2010, renewable energy had overtaken coal as the dominant source.", "band_score": "Band 8.5"}]
                },
                {
                    "id": "future_projections",
                    "title_en": "Future Projections & Academic Forecasting",
                    "title_vi": "Dự Báo Tương Lai - Tuyệt Đối Tránh 'Will' Trong Task 1",
                    "cefr_level": "B2",
                    "ielts_relevance": "Writing Task 1 & 2",
                    "formula": {"positive": "S + is/are projected / forecasted to + V-inf", "negative": "S + is/are not anticipated to + V-inf", "question": "Is/Are + S + projected to + V-inf?"},
                    "rule_summary": "Diễn đạt xu hướng tương lai mang tính dự đoán khoa học khách quan.",
                    "ielts_application": "Thay thế hoàn toàn 'will increase' bằng 'is projected to rise' để đạt chuẩn học thuật.",
                    "common_pitfalls": ["Dùng 'will' tạo cảm giác khẳng định chủ quan"],
                    "academic_examples": [{"sentence": "By 2050, the urban population is projected to exceed 68%.", "band_score": "Band 8.5"}]
                }
            ]
        },
        {
            "id": "modals",
            "title_vi": "Động Từ Khuyết Thiếu (Modals & Hedging)",
            "title_en": "Modals & Semi-modals",
            "icon_name": "ShieldAlert",
            "order_index": 2,
            "lessons": [
                {
                    "id": "academic_hedging",
                    "title_en": "Hedging with Could, May, Might",
                    "title_vi": "Kỹ Thuật Hedging - Giảm Tính Quả Quyết Trong Task 2",
                    "cefr_level": "B2",
                    "ielts_relevance": "Writing Task 2",
                    "formula": {"positive": "S + may / might / could + V-inf", "negative": "S + may not + V-inf", "question": "Could + S + V-inf?"},
                    "rule_summary": "Tránh các phát ngôn tuyệt đối (overgeneralization) như 'All people will become lazy'.",
                    "ielts_application": "Giúp bài viết đạt tiêu chí Task Achievement và Lexical Resource chuẩn Band 8.0+.",
                    "common_pitfalls": ["Khẳng định 100% bằng 'will always' hoặc 'every person'"],
                    "academic_examples": [{"sentence": "Excessive smartphone usage could potentially impair cognitive focus.", "band_score": "Band 8.0"}]
                }
            ]
        },
        {
            "id": "sentence_structures",
            "title_vi": "Cấu Trúc Câu Học Thuật (Sentence Structures)",
            "title_en": "Sentence Structures & Inversion",
            "icon_name": "Layers",
            "order_index": 3,
            "lessons": [
                {
                    "id": "inversion_negative_adverbs",
                    "title_en": "Negative Adverb Inversion (Seldom, Rarely)",
                    "title_vi": "Đảo Ngữ Với Trạng Từ Phủ Định",
                    "cefr_level": "C1",
                    "ielts_relevance": "Writing Task 2",
                    "formula": {"positive": "Seldom / Rarely + do/does/did + S + V-inf", "negative": "Under no circumstances + should + S + V-inf", "question": "N/A"},
                    "rule_summary": "Đưa trạng từ phủ định lên đầu câu để nhấn mạnh mức độ hiếm hoi hoặc cấm đoán.",
                    "ielts_application": "Tạo điểm nhấn ngữ pháp đặc sắc trong kết bài hoặc câu luận điểm.",
                    "common_pitfalls": ["Quên đảo trợ động từ lên trước chủ ngữ"],
                    "academic_examples": [{"sentence": "Seldom do developing nations allocate sufficient funds for wildlife preservation.", "band_score": "Band 8.5"}]
                },
                {
                    "id": "passive_reporting",
                    "title_en": "Passive Voice with Reporting Verbs",
                    "title_vi": "Thể Bị Động Khách Quan (It is believed that...)",
                    "cefr_level": "B2",
                    "ielts_relevance": "Writing Task 2",
                    "formula": {"positive": "It is widely believed / argued that + S + V", "negative": "It cannot be denied that + S + V", "question": "N/A"},
                    "rule_summary": "Diễn đạt quan điểm xã hội một cách khách quan, tránh xưng 'I/we'.",
                    "ielts_application": "Câu mở đầu thân bài luận điểm phản biện.",
                    "common_pitfalls": ["Quên 'that' sau động từ trần thuật"],
                    "academic_examples": [{"sentence": "It is widely argued that compulsory community service fosters civic responsibility.", "band_score": "Band 8.0"}]
                }
            ]
        },
        {
            "id": "clauses",
            "title_vi": "Mệnh Đề & Liên Từ (Clauses & Linking)",
            "title_en": "Clauses & Connectors",
            "icon_name": "GitBranch",
            "order_index": 4,
            "lessons": [
                {
                    "id": "reduced_relative_clauses",
                    "title_en": "Reduced Relative Clauses (V-ing / V-ed)",
                    "title_vi": "Rút Gọn Mệnh Đề Quan Hệ",
                    "cefr_level": "B2",
                    "ielts_relevance": "Writing Task 1 & 2",
                    "formula": {"positive": "N + V-ing (chủ động) / N + V3 (bị động)", "negative": "N + not + V-ing/V3", "question": "N/A"},
                    "rule_summary": "Lược bỏ đại từ quan hệ và to be để câu văn cô đọng, thanh thoát hơn.",
                    "ielts_application": "Giúp tăng tốc độ viết và giảm độ dài rườm rà của câu phức.",
                    "common_pitfalls": ["Nhầm lẫn giữa chủ động (V-ing) và bị động (V-ed)"],
                    "academic_examples": [{"sentence": "Policies implemented by the ministry yielded tangible outcomes.", "band_score": "Band 8.5"}]
                }
            ]
        },
        {
            "id": "verb_forms",
            "title_vi": "Dạng Của Động Từ (Verb Forms)",
            "title_en": "Verb Forms & Participles",
            "icon_name": "CheckCircle2",
            "order_index": 5,
            "lessons": [
                {
                    "id": "gerund_as_subject",
                    "title_en": "Gerunds (V-ing) as Subjects",
                    "title_vi": "Danh Động Từ Làm Chủ Ngữ & Sự Hòa Hợp",
                    "cefr_level": "B1",
                    "ielts_relevance": "Writing Task 2",
                    "formula": {"positive": "V-ing + Singular Verb (V-s/es / is / has)", "negative": "Not + V-ing + Singular Verb", "question": "Does + V-ing + V-inf?"},
                    "rule_summary": "Khi cả cụm hành động làm chủ ngữ, động từ theo sau luôn chia ở ngôi thứ ba số ít.",
                    "ielts_application": "Cách mở đầu câu luận điểm tự nhiên nhất trong Task 2.",
                    "common_pitfalls": ["Chia động từ số nhiều theo danh từ phụ trong cụm V-ing"],
                    "academic_examples": [{"sentence": "Implementing comprehensive emission standards demands international cooperation.", "band_score": "Band 8.0"}]
                }
            ]
        },
        {
            "id": "modifiers",
            "title_vi": "Mạo Từ & Lượng Từ (Modifiers & Determiners)",
            "title_en": "Modifiers & Determiners",
            "icon_name": "Sparkles",
            "order_index": 6,
            "lessons": [
                {
                    "id": "articles_the_a_zero",
                    "title_en": "Mastering Articles (The, A/An, Zero Article)",
                    "title_vi": "Khắc Chế 70% Lỗi Mạo Từ Trong IELTS",
                    "cefr_level": "B1",
                    "ielts_relevance": "Writing Task 1 & 2",
                    "formula": {"positive": "The (xác định) / A-An (số ít chung) / Ø (khái quát/số nhiều)", "negative": "N/A", "question": "N/A"},
                    "rule_summary": "Quy tắc dùng mạo từ với danh từ đếm được, không đếm được và tên địa danh.",
                    "ielts_application": "Luôn dùng 'The proportion of...', không dùng 'The' với danh từ trừu tượng nói chung như 'Education'.",
                    "common_pitfalls": ["Viết 'The education plays...' thay vì 'Ø Education plays...'"],
                    "academic_examples": [{"sentence": "The proportion of commuters relying on public transit grew rapidly.", "band_score": "Band 8.5"}]
                }
            ]
        }
    ]

    for t_data in topics_seed:
        topic = GrammarTopic(
            id=t_data["id"],
            title_vi=t_data["title_vi"],
            title_en=t_data["title_en"],
            icon_name=t_data["icon_name"],
            order_index=t_data["order_index"]
        )
        db.add(topic)
        db.flush()

        for l_data in t_data.get("lessons", []):
            lesson = GrammarLesson(
                id=l_data["id"],
                topic_id=topic.id,
                title_en=l_data["title_en"],
                title_vi=l_data["title_vi"],
                cefr_level=l_data["cefr_level"],
                ielts_relevance=l_data["ielts_relevance"],
                formula=l_data["formula"],
                rule_summary=l_data["rule_summary"],
                ielts_application=l_data["ielts_application"],
                common_pitfalls=l_data["common_pitfalls"],
                academic_examples=l_data["academic_examples"]
            )
            db.add(lesson)

    db.commit()
    logger.info("Successfully seeded 6 CEFR Grammar Clusters into Database!")
