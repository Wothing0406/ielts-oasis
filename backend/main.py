from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Boolean, desc, text, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from pydantic import BaseModel
import os
import uuid
import json
from datetime import datetime, timedelta
from PIL import Image
from io import BytesIO
from ultralytics import YOLO
from services.ai_service import ai_service
from services.tts_service import tts_service
from logger import setup_logger

logger = setup_logger("fastapi_main")

from database import SessionLocal, engine, Base, get_db
from sqlalchemy.orm import Session
from models import Vocabulary, WritingLog, User, Like, Comment, DailyPlan, WordleGame, GameLeaderboard
from schemas import VocabIn

# Load wordle vocabulary lists for fast validation
VALID_WORDLE_DICTIONARY = set()
try:
    current_dir = os.path.dirname(os.path.abspath(__file__))
    keywords_path = os.path.join(current_dir, "services", "wordle_keywords.json")
    guess_path = os.path.join(current_dir, "services", "wordle_guess_words.json")
    
    if os.path.exists(keywords_path):
        with open(keywords_path, "r", encoding="utf-8") as f:
            keywords_list = json.load(f)
            VALID_WORDLE_DICTIONARY.update([w.upper() for w in keywords_list])
            
    if os.path.exists(guess_path):
        with open(guess_path, "r", encoding="utf-8") as f:
            guess_list = json.load(f)
            VALID_WORDLE_DICTIONARY.update([w.upper() for w in guess_list])
            
    logger.info(f"Loaded {len(VALID_WORDLE_DICTIONARY)} words into local Wordle validation dictionary.")
except Exception as e:
    logger.error(f"Failed to load local Wordle dictionary files: {e}")

class TranslateInput(BaseModel):
    text: str

def seed_db():
    from database import get_db_context
    with get_db_context() as db:
        if db.query(Vocabulary).count() == 0:
            starter_words = [
                ("Academic", "Học thuật", "/ˌæk.əˈdem.ɪk/"),
                ("Innovative", "Sáng tạo", "/ˈɪn.ə.veɪ.tɪv/"),
                ("Sustainable", "Bền vững", "/səˈsteɪ.nə.bəl/"),
                ("Evaluate", "Đánh giá", "/ɪˈvæl.ju.eɪt/"),
                ("Significant", "Quan trọng", "/sɪɡˈnɪf.ɪ.kənt/"),
                ("Crucial", "Thiết yếu, quan trọng", "/ˈkruː.ʃəl/"),
                ("Viable", "Khả thi", "/ˈvaɪ.ə.bəl/"),
                ("Feasible", "Khả thi", "/ˈfiː.zə.bəl/"),
                ("Empower", "Trao quyền, tạo điều kiện", "/ɪmˈpaʊ.ər/"),
                ("Collaboration", "Sự hợp tác", "/kəˌlæb.əˈreɪ.ʃən/"),
                ("Innovation", "Đổi mới, sáng tạo", "/ˌɪn.əˈveɪ.ʃən/"),
                ("Integrity", "Sự chính trực", "/ɪnˈteɡ.rə.ti/"),
                ("Resilience", "Sự kiên cường, phục hồi nhanh", "/rɪˈzɪl.i.əns/"),
                ("Promote", "Thúc đẩy", "/prəˈməʊt/"),
                ("Enhance", "Nâng cao", "/ɪnˈhɑːns/"),
                ("Deteriorate", "Suy thoái, xấu đi", "/dɪˈtɪə.ri.ə.reɪt/"),
                ("Stagnant", "Trì trệ", "/ˈstæɡ.nənt/"),
                ("Infrastructure", "Cơ sở hạ tầng", "/ˈɪn.frə.strʌk.tʃər/"),
                ("Inequality", "Sự bất bình đẳng", "/ˌɪn.iˈkwɒl.ə.ti/"),
                ("Entrepreneur", "Doanh nhân", "/ˌɒn.trə.prəˈnɜːr/"),
                ("Productivity", "Năng suất", "/ˌprɒd.ʌkˈtɪv.ə.ti/"),
                ("Authentic", "Chân thực", "/ɔːˈθen.tɪk/"),
                ("Comprehensive", "Toàn diện", "/ˌkɒm.prɪˈhen.sɪv/"),
                ("Imminent", "Sắp xảy ra, cận kề", "/ˈɪm.ɪ.nənt/"),
                ("Vital", "Thiết yếu", "/ˈvaɪ.təl/"),
                ("Ambiguous", "Mơ hồ", "/æmˈbɪɡ.ju.əs/"),
                ("Pragmatic", "Thực dụng", "/præɡˈmæt.ɪk/"),
                ("Advocate", "Ủng hộ, người ủng hộ", "/ˈæd.və.keɪt/"),
                ("Undermine", "Làm suy yếu", "/ˌʌn.dəˈmaɪn/"),
                ("Exacerbate", "Làm trầm trọng thêm", "/ɪɡˈzæs.ə.beɪt/"),
                ("Mitigate", "Giảm nhẹ", "/ˈmɪt.ɪ.ɡeɪt/"),
                ("Implement", "Thực hiện", "/ˈɪm.plɪ.ment/"),
                ("Facilitate", "Tạo điều kiện thuận lợi", "/fəˈsɪl.ɪ.teɪt/"),
                ("Comprehensive", "Toàn diện", "/ˌkɒm.prɪˈhen.sɪv/"),
                ("Indigenous", "Bản địa", "/ɪnˈdɪdʒ.ɪ.nəs/"),
                ("Perception", "Nhận thức", "/pəˈsep.ʃən/"),
                ("Cognitive", "Thuộc về nhận thức", "/ˈkɒɡ.nə.tɪv/"),
                ("Subtle", "Tinh tế", "/ˈsʌt.l/"),
                ("Eloquent", "Lưu loát, có tài hùng biện", "/ˈel.ə.kwənt/"),
                ("Compelling", "Thuyết phục, hấp dẫn", "/kəmˈpel.ɪŋ/"),
                ("Tentative", "Do dự, tạm thời", "/ˈten.tə.tɪv/"),
                ("Abundant", "Dồi dào", "/əˈbʌn.dənt/"),
                ("Scarce", "Khan hiếm", "/skeəs/"),
                ("Pivotal", "Then chốt", "/ˈpɪv.ə.təl/"),
                ("Pervasive", "Lan tỏa", "/pəˈveɪ.sɪv/")
            ]
            for word, meaning, phonetic in starter_words:
                v = Vocabulary(word=word, meaning=meaning, phonetic=phonetic, is_global=True, source="Hệ thống", creator_username="System")
                db.add(v)
            db.commit()


# VocabIn is imported from schemas

from auth_routes import router as auth_router
from auth_routes import get_current_user
from fastapi import Depends

app = FastAPI(title="IELTS Oasis API")
app.include_router(auth_router)

async def backfill_vocabularies():
    # Wait a bit for the server to be fully up
    await asyncio.sleep(3)
    try:
        from database import get_db_context
        with get_db_context() as db:
            empty_vocab_ids = [v.id for v in db.query(Vocabulary).filter(
                (Vocabulary.example == None) | (Vocabulary.example == "") | 
                (Vocabulary.memory_hook == None) | (Vocabulary.memory_hook == "")
            ).all()]
            
        if empty_vocab_ids:
            logger.info(f"Found {len(empty_vocab_ids)} words missing details, enriching in background...")
            for v_id in empty_vocab_ids:
                with get_db_context() as db:
                    v = db.query(Vocabulary).filter(Vocabulary.id == v_id).first()
                    if not v:
                        continue
                    try:
                        data = await ai_service.refine_vocabulary(v.word)
                        if data and data.get("phonetic") != "/.../":
                            v.example = data.get("example", v.example)
                            v.synonyms = data.get("synonyms", v.synonyms)
                            v.topic = data.get("topic", v.topic)
                            v.memory_hook = data.get("memory_hook", v.memory_hook)
                            if not v.phonetic or v.phonetic == "/.../":
                                v.phonetic = data.get("phonetic", v.phonetic)
                            db.commit()
                    except Exception as ex:
                        db.rollback()
                        logger.error(f"Failed to enrich ID {v_id}: {ex}")
                await asyncio.sleep(5.0)  # Sleep 5s to avoid hitting 15 req/min rate limit
            logger.info("Background vocabulary enrichment completed.")
    except Exception as e:
        logger.error(f"Auto-enrich failed: {e}")

@app.on_event("startup")
async def startup_event():
    logger.info("FastAPI Server Starting...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database initialized.")
    try:
        with engine.connect() as conn:
            # Check source column
            res = conn.execute(text("SHOW COLUMNS FROM vocabulary LIKE 'source';")).fetchone()
            if not res:
                conn.execute(text("ALTER TABLE vocabulary ADD COLUMN source VARCHAR(100) DEFAULT 'Tự thêm';"))
                conn.commit()
                logger.info("Migration: Added 'source' column to vocabulary.")
            # Check creator_username column
            res_creator = conn.execute(text("SHOW COLUMNS FROM vocabulary LIKE 'creator_username';")).fetchone()
            if not res_creator:
                conn.execute(text("ALTER TABLE vocabulary ADD COLUMN creator_username VARCHAR(100) NULL;"))
                conn.commit()
                logger.info("Migration: Added 'creator_username' column to vocabulary.")
            # Check weekly_plan column in discord_schedules
            res_weekly = conn.execute(text("SHOW COLUMNS FROM discord_schedules LIKE 'weekly_plan';")).fetchone()
            if not res_weekly:
                conn.execute(text("ALTER TABLE discord_schedules ADD COLUMN weekly_plan JSON NULL;"))
                conn.commit()
                logger.info("Migration: Added 'weekly_plan' column to discord_schedules.")
            # Check last_ip column in users table
            res_ip = conn.execute(text("SHOW COLUMNS FROM users LIKE 'last_ip';")).fetchone()
            if not res_ip:
                conn.execute(text("ALTER TABLE users ADD COLUMN last_ip VARCHAR(50) NULL;"))
                conn.commit()
                logger.info("Migration: Added 'last_ip' column to users.")
            # Check password_hash column in users table
            res_pwd = conn.execute(text("SHOW COLUMNS FROM users LIKE 'password_hash';")).fetchone()
            if not res_pwd:
                conn.execute(text("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NULL;"))
                conn.commit()
                logger.info("Migration: Added 'password_hash' column to users.")
    except Exception as e:
        logger.error(f"Migration failed: {e}")
    try:
        seed_db()
    except Exception as e:
        logger.error(f"Seeding failed: {e}")
        
    # Start background enrichment
    asyncio.create_task(backfill_vocabularies())

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

static_dir = "static"
if not os.path.exists(static_dir):
    os.makedirs(static_dir)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

yolo_model = YOLO("yolov8n.pt")

YOLO_TRANSLATIONS = {
    'person': ('Con người', '/ˈpɜː.sən/'), 'bicycle': ('Xe đạp', '/ˈbaɪ.sɪ.kəl/'),
    'car': ('Xe ô tô', '/kɑːr/'), 'motorcycle': ('Xe máy', '/ˈməʊ.tə.saɪ.kəl/'),
    'laptop': ('Máy tính xách tay', '/ˈlæp.tɒp/'), 'mouse': ('Chuột máy tính', '/maʊs/'),
    'cell phone': ('Điện thoại di động', '/ˈsel ˌfəʊn/'), 'tv': ('Tivi', '/ˌtiːˈviː/'),
    'keyboard': ('Bàn phím', '/ˈkiː.bɔːd/'), 'bottle': ('Chai lọ', '/ˈbɒt.əl/'),
    'cup': ('Cái cốc', '/kʌp/'), 'chair': ('Cái ghế', '/tʃeər/'),
    'book': ('Quyển sách', '/bʊk/'), 'clock': ('Đồng hồ', '/klɒk/'),
    'vase': ('Bình hoa', '/vɑːz/'), 'potted plant': ('Chậu cây', '/ˌpɒt.ɪd ˈplɑːnt/'),
    'orange': ('Cam', '/ˈɒr.ɪndʒ/'), 'orange': ('Cam', '/ˈɒr.ɪndʒ/')
    
}

@app.get("/vocabulary")
async def get_vocabulary(user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(Vocabulary)
    if user:
        query = query.filter(Vocabulary.user_id == user["user_id"])
    else:
        query = query.filter(Vocabulary.is_global == True)
    vocabs = query.order_by(desc(Vocabulary.id)).all()
    return vocabs

@app.post("/vocabulary")
async def add_vocabulary(vocab_in: VocabIn, user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if not user:
        raise HTTPException(status_code=401, detail="Vui lòng đăng nhập để lưu từ vựng")
    user_id = user["user_id"]
    existing = db.query(Vocabulary).filter(
        func.lower(Vocabulary.word) == func.lower(vocab_in.word),
        Vocabulary.user_id == user_id
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Từ vựng '{vocab_in.word}' đã có trong kho của bạn rồi!")
    
    # Check if this word already exists globally in the database
    is_already_global = db.query(Vocabulary).filter(
        func.lower(Vocabulary.word) == func.lower(vocab_in.word),
        Vocabulary.is_global == True
    ).first() is not None
    
    # Determine is_global: only share if not copied from community, and not already global, and user allowed it
    is_global_val = False
    if vocab_in.is_global and vocab_in.source != "Oasis Community" and not is_already_global:
        is_global_val = True
        
    vocab = Vocabulary(
        user_id=user_id,
        word=vocab_in.word, 
        meaning=vocab_in.meaning, 
        phonetic=vocab_in.phonetic,
        example=vocab_in.example,
        topic=vocab_in.topic or "General",
        synonyms=vocab_in.synonyms or [],
        memory_hook=vocab_in.memory_hook,
        image_url=vocab_in.image_url,
        is_global=is_global_val,
        source=vocab_in.source or "Tự thêm",
        creator_username=vocab_in.creator_username or (user["username"] if user else "Anonymous")
    )
    
    # Handle crop if from Matcha Lens (box is present and image_url is a static path)
    if vocab_in.image_url and vocab_in.box and vocab_in.image_url.startswith("/static/"):
        try:
            parent_filename = vocab_in.image_url.replace("/static/", "")
            parent_path = os.path.join(static_dir, parent_filename)
            if os.path.exists(parent_path):
                with Image.open(parent_path) as img:
                    w, h = img.size
                    box = vocab_in.box
                    # box is [xmin, ymin, xmax, ymax]
                    left = int(box[0] * w)
                    top = int(box[1] * h)
                    right = int(box[2] * w)
                    bottom = int(box[3] * h)
                    
                    # Ensure bounds are within image size
                    left = max(0, min(w - 1, left))
                    top = max(0, min(h - 1, top))
                    right = max(left + 1, min(w, right))
                    bottom = max(top + 1, min(h, bottom))
                    
                    cropped = img.crop((left, top, right, bottom))
                    cropped_filename = f"crop-{uuid.uuid4()}.jpg"
                    cropped.save(os.path.join(static_dir, cropped_filename))
                    vocab.image_url = f"/static/{cropped_filename}"
        except Exception as e:
            print(f"Matcha Lens crop failed: {e}")
    
    # Force AI Refinement only if core fields are missing (meaning or phonetic)
    if not vocab.meaning or not vocab.phonetic or vocab.phonetic == "/.../":
        try:
            data = await ai_service.refine_vocabulary(vocab_in.word)
            # Only update if the API successfully returned a real translation (avoiding the fallback object)
            if data and data.get("phonetic") != "/.../":
                vocab.word = data.get("word", vocab.word)
                vocab.phonetic = data.get("phonetic", vocab.phonetic)
                vocab.meaning = data.get("meaning", vocab.meaning)
                vocab.example = data.get("example", vocab.example)
                vocab.synonyms = data.get("synonyms", vocab.synonyms)
                vocab.topic = data.get("topic", vocab.topic)
                vocab.memory_hook = data.get("memory_hook", vocab.memory_hook)
        except Exception as e:
            print(f"Refinement failed: {e}")

    # Fetch image from Unsplash if still empty
    if not vocab.image_url:
        try:
            img_url = await ai_service.search_unsplash_image(vocab.word)
            if img_url:
                vocab.image_url = img_url
        except Exception as e:
            print(f"Unsplash image search failed: {e}")

    try:
        audio_file = await tts_service.generate_speech(vocab.word)
        vocab.audio_url = f"/static/{audio_file}"
    except: pass

    db.add(vocab)
    db.commit()
    db.refresh(vocab)
    return vocab

@app.post("/vocabulary/detect")
async def detect_vocabulary(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        img = Image.open(BytesIO(contents)).convert("RGB")
        img_filename = f"{uuid.uuid4()}.jpg"
        img.save(os.path.join(static_dir, img_filename))
        detected_items = []
        try:
            ai_items = await ai_service.detect_all_objects(img)
            print(f"AI detected {len(ai_items)} items: {[i.get('word') for i in ai_items]}")
            for item in ai_items:
                box = item.get("box", [0.1, 0.1, 0.3, 0.3])
                detected_items.append({
                    "word": item.get("word", "Unknown"),
                    "meaning": item.get("meaning", "Nghĩa"),
                    "phonetic": item.get("phonetic", "/.../"),
                    "box": box,  # Keep original box order [xmin, ymin, xmax, ymax]
                    "confidence": 0.9
                })
        except Exception as e:
            print(f"Gemini detect failed: {e}")

        # Only fallback to YOLO if AI returned nothing at all
        if len(detected_items) == 0:
            print("AI returned nothing, falling back to YOLO...")
            import asyncio
            results = await asyncio.to_thread(yolo_model, img)
            for r in results:
                for box in r.boxes:
                    label = yolo_model.names[int(box.cls[0])].lower()
                    meaning, phonetic = YOLO_TRANSLATIONS.get(label, (label.capitalize(), "/.../"))
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    w, h = img.size
                    detected_items.append({
                        "word": label.capitalize(),
                        "meaning": meaning,
                        "phonetic": phonetic,
                        "box": [x1/w, y1/h, x2/w, y2/h],
                        "confidence": float(box.conf[0])
                    })

        return {"items": detected_items, "image_url": f"/static/{img_filename}"}
    except Exception as e:
        print(f"Detect Error: {e}")
        return {"items": [], "image_url": ""}

@app.post("/scroll/extract")
async def extract_scroll(file: UploadFile = File(...)):
    filename = file.filename.lower()
    extracted_words = []
    text_content = ""
    layout_type = "plain_text"

    try:
        if filename.endswith((".png", ".jpg", ".jpeg")):
            contents = await file.read()
            img = Image.open(BytesIO(contents)).convert("RGB")
            extracted_words = await ai_service.extract_scroll_vocabulary_from_image(img)
            layout_type = "table"
        elif filename.endswith(".pdf"):
            from pypdf import PdfReader
            contents = await file.read()
            pdf_file = BytesIO(contents)
            reader = PdfReader(pdf_file)
            
            pages_text = []
            for i in range(min(5, len(reader.pages))):
                page_text = reader.pages[i].extract_text()
                if page_text:
                    pages_text.append(page_text)
            
            text_content = "\n".join(pages_text)
            if not text_content.strip():
                raise HTTPException(status_code=400, detail="Không thể trích xuất văn bản từ PDF này. File có thể bị quét dưới dạng ảnh.")
            
            extracted_words = await ai_service.extract_scroll_vocabulary_from_text(text_content)
        elif filename.endswith(".docx"):
            import docx
            contents = await file.read()
            docx_file = BytesIO(contents)
            doc = docx.Document(docx_file)
            
            paragraphs_text = [p.text for p in doc.paragraphs if p.text]
            text_content = "\n".join(paragraphs_text)
            if not text_content.strip():
                raise HTTPException(status_code=400, detail="Văn bản trong file Word này bị trống.")
                
            extracted_words = await ai_service.extract_scroll_vocabulary_from_text(text_content)
        else:
            raise HTTPException(status_code=400, detail="Định dạng file không được hỗ trợ. Vui lòng tải lên PDF, Word (.docx) hoặc Hình ảnh.")
            
        return {
            "text": text_content,
            "layout_type": layout_type,
            "extracted_words": extracted_words
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Scroll extraction failed: {e}")
        raise HTTPException(status_code=500, detail=f"Lỗi trích xuất: {str(e)}")

@app.post("/translate")
async def translate_text(data: TranslateInput):
    """Dịch nhanh một từ/cụm từ cho tính năng Click to Translate"""
    try:
        prompt = f"Dịch và giải thích ngắn gọn ý nghĩa của từ/cụm từ sau sang tiếng Việt (nếu là từ đơn hãy kèm phiên âm và loại từ, nếu là cụm từ thì dịch sát nghĩa ngữ cảnh): '{data.text}'"
        response = await ai_service.get_advice(prompt)
        return {"meaning": response or "Không thể dịch."}
    except Exception as e:
        logger.error(f"Translate error: {e}")
        return {"error": str(e), "meaning": "Lỗi dịch."}

@app.post("/tts")
async def text_to_speech(data: dict):
    word = data.get("word")
    if not word: raise HTTPException(status_code=400)
    audio_file = await tts_service.generate_speech(word)
    return {"audio_url": f"/static/{audio_file}"}

import asyncio

analysis_jobs = {}

class WritingIn(BaseModel):
    content: str

async def process_analysis(task_id: str, content: str, user_id: int = None):
    try:
        result = await ai_service.analyze_writing(content)
        analysis_jobs[task_id] = {"status": "completed", "result": result}

    except Exception as e:
        analysis_jobs[task_id] = {"status": "failed", "error": str(e)}

@app.post("/writing/analyze/start")
async def start_writing_analysis(writing: WritingIn, user: dict = Depends(get_current_user)):
    task_id = str(uuid.uuid4())
    analysis_jobs[task_id] = {"status": "processing"}
    user_id = user["user_id"] if user else None
    asyncio.create_task(process_analysis(task_id, writing.content, user_id))
    return {"task_id": task_id}

@app.get("/writing/analyze/status/{task_id}")
async def get_analysis_status(task_id: str):
    job = analysis_jobs.get(task_id)
    if not job:
        raise HTTPException(status_code=404, detail="Task not found")
    return job

@app.get("/encouragement")
async def get_encouragement():
    msg = await ai_service.get_encouragement()
    return {"message": msg}

@app.delete("/vocabulary/{id}")
async def delete_vocab(id: int, user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user_id = user["user_id"] if user else None
    vocab = db.query(Vocabulary).filter(Vocabulary.id == id).first()
    if not vocab:
        raise HTTPException(status_code=404, detail="Vocabulary not found")
    
    if vocab.user_id != user_id:
        raise HTTPException(status_code=403, detail="Không có quyền xóa từ vựng này")
        
    word_to_delete = vocab.word
    db.query(Vocabulary).filter(
        func.lower(Vocabulary.word) == func.lower(word_to_delete),
        Vocabulary.user_id == user_id
    ).delete(synchronize_session=False)
    
    db.commit()
    return {"ok": True}

class ReviewPayload(BaseModel):
    is_correct: bool

@app.post("/vocabulary/review/{id}")
async def review_vocabulary(id: int, payload: ReviewPayload, user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    vocab = db.query(Vocabulary).filter(Vocabulary.id == id, Vocabulary.user_id == user["user_id"]).first()
    if not vocab:
        raise HTTPException(status_code=404, detail="Vocabulary not found in your vault")
        
    vocab.last_reviewed = datetime.utcnow()
    vocab.is_learned = True
    
    if payload.is_correct:
        vocab.mastery_level = min(5, vocab.mastery_level + 1)
    else:
        vocab.mastery_level = 1
        
    intervals = {
        1: 1,
        2: 3,
        3: 7,
        4: 14,
        5: 30
    }
    interval_days = intervals.get(vocab.mastery_level, 1)
    vocab.next_review = datetime.utcnow() + timedelta(days=interval_days)
    
    db.commit()
    db.refresh(vocab)
    
    return {
        "status": "success",
        "word": vocab.word,
        "mastery_level": vocab.mastery_level,
        "next_review": vocab.next_review.isoformat()
    }

@app.get("/stats")
async def get_stats(user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    db = db # keep as db
    now = datetime.utcnow()
    
    user_id = user["user_id"] if user else None
    
    query = db.query(Vocabulary)
    if user_id:
        query = query.filter(Vocabulary.user_id == user_id)
        
    # History: last 15 words
    recent_words = query.order_by(desc(Vocabulary.last_reviewed)).limit(15).all()
    history = [{"word": w.word, "meaning": w.meaning, "last_reviewed": w.last_reviewed} for w in recent_words]
    
    # Mastered this week
    one_week_ago = now.timestamp() - (7 * 24 * 60 * 60)
    
    mastered_query = db.query(Vocabulary).filter(
        Vocabulary.mastery_level > 1,
        Vocabulary.last_reviewed >= datetime.fromtimestamp(one_week_ago)
    )
    if user_id:
        mastered_query = mastered_query.filter(Vocabulary.user_id == user_id)
    mastered = mastered_query.count()
    
    # Basic streak calculation based on unique dates of activity
    all_dates_query = db.query(Vocabulary.last_reviewed)
    if user_id:
        all_dates_query = all_dates_query.filter(Vocabulary.user_id == user_id)
    all_dates = all_dates_query.all()
    
    unique_dates = sorted(list(set([d[0].date() for d in all_dates if d[0]])), reverse=True)
    
    streak = 0
    current_date = now.date()
    for d in unique_dates:
        if d == current_date or (streak == 0 and (current_date - d).days == 1):
            streak += 1
            current_date = d - timedelta(days=1)
        elif (current_date - d).days > 1:
            break
            
    if streak == 0 and len(unique_dates) > 0 and (now.date() - unique_dates[0]).days == 1:
        streak = 1 # Played yesterday, streak is alive
    
    return {
        "streak": max(1, streak) if len(unique_dates) > 0 else 0,
        "mastered_this_week": mastered,
        "history": history
    }

class RephraseIn(BaseModel):
    content: str
    selected_phrase: str

@app.post("/writing/rephrase")
async def writing_rephrase(payload: RephraseIn):
    try:
        suggestions = await ai_service.get_rephrase_suggestions(payload.content, payload.selected_phrase)
        return {"suggestions": suggestions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/quiz/grammar")
async def quiz_grammar():
    try:
        questions = await ai_service.generate_grammar_questions()
        return {"questions": questions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class YoutubeIn(BaseModel):
    url: str
    mode: str = "quiz"

class ObjectDetectionInput(BaseModel):
    image_url: str

class TranslateInput(BaseModel):
    text: str

@app.post("/listening/youtube")
async def listening_youtube(payload: YoutubeIn):
    result = await ai_service.generate_youtube_listening(payload.url, mode=payload.mode)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

class DailyPlanIn(BaseModel):
    topic: str

@app.post("/study-plan/generate")
async def generate_daily_plan(payload: DailyPlanIn):
    result = await ai_service.generate_daily_plan(payload.topic)
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    return result

from sqlalchemy import func
from typing import Optional

@app.get("/community/feed")
async def get_community_feed(sort_by: Optional[str] = "new", filter_mine: Optional[bool] = False, topic: Optional[str] = None, user: Optional[dict] = Depends(get_current_user), db: Session = Depends(get_db)):
    user_id = user["user_id"] if user else None
    
    # Get vocabularies
    vocab_query = db.query(Vocabulary)
    if filter_mine:
        if not user_id:
            return {"vocabularies": [], "writings": []}
        vocab_query = vocab_query.filter(Vocabulary.user_id == user_id)
    else:
        # Show global vocabularies only (prevent private leaking)
        vocab_query = vocab_query.filter(Vocabulary.is_global == True)
    
    if topic and topic.strip() and topic.lower() != "all":
        vocab_query = vocab_query.filter(func.lower(Vocabulary.topic) == func.lower(topic.strip()))

    if sort_by == "top":
        # For vocab, 'top' might just be popularity
        vocab_query = vocab_query.order_by(desc(Vocabulary.popularity))
    else:
        vocab_query = vocab_query.order_by(desc(Vocabulary.id))
    
    # Fetch a larger batch to filter duplicates by word name
    vocabs = vocab_query.limit(500).all()
    vocab_list = []
    seen_words = set()
    for v in vocabs:
        word_lower = v.word.strip().lower()
        if word_lower in seen_words:
            continue
        seen_words.add(word_lower)
        
        user_obj = db.query(User).filter(User.id == v.user_id).first() if v.user_id else None
        likes_count = db.query(Like).filter(Like.post_type == 'vocabulary', Like.post_id == v.id).count()
        comments_count = db.query(Comment).filter(Comment.post_type == 'vocabulary', Comment.post_id == v.id).count()
        vocab_list.append({
            "id": v.id,
            "word": v.word,
            "meaning": v.meaning,
            "phonetic": v.phonetic,
            "user_id": v.user_id,
            "username": v.creator_username or (user_obj.username if user_obj else "Anonymous"),
            "avatar_url": user_obj.avatar_url if user_obj else None,
            "image_url": v.image_url,
            "likes": likes_count,
            "comments": comments_count,
            # Extra fields to skip AI refinement during save
            "example": v.example,
            "synonyms": v.synonyms,
            "memory_hook": v.memory_hook,
            "source": v.source
        })
        if len(vocab_list) >= 100:
            break
        
    # Get writings
    writing_query = db.query(WritingLog)
    if filter_mine:
        if not user_id:
            return {"vocabularies": [], "writings": []}
        writing_query = writing_query.filter(WritingLog.user_id == user_id)

    if sort_by == "top":
        # Sort by band score (highest first). Note: band_score is string so "9.0" > "8.0"
        writing_query = writing_query.order_by(desc(WritingLog.band_score))
    else:
        writing_query = writing_query.order_by(desc(WritingLog.id))
        
    writings = writing_query.limit(100).all()
    writing_list = []
    for w in writings:
        user_obj = db.query(User).filter(User.id == w.user_id).first() if w.user_id else None
        likes_count = db.query(Like).filter(Like.post_type == 'writing', Like.post_id == w.id).count()
        comments_count = db.query(Comment).filter(Comment.post_type == 'writing', Comment.post_id == w.id).count()
        
        # Calculate hotness manually and sort later if sort_by == "hot"
        hotness = likes_count * 2 + comments_count
        
        writing_list.append({
            "id": w.id,
            "content": w.content[:200] + "..." if len(w.content) > 200 else w.content,
            "full_content": w.content,
            "band_score": w.band_score,
            "user_id": w.user_id,
            "username": user_obj.username if user_obj else "Anonymous",
            "avatar_url": user_obj.avatar_url if user_obj else None,
            "likes": likes_count,
            "comments": comments_count,
            "hotness": hotness
        })
        
    if sort_by == "hot":
        vocab_list = sorted(vocab_list, key=lambda x: (x['likes'] * 2 + x['comments']), reverse=True)
        writing_list = sorted(writing_list, key=lambda x: x['hotness'], reverse=True)
        
    db.close()
    return {"vocabularies": vocab_list, "writings": writing_list}

from typing import Any

class ShareWritingIn(BaseModel):
    content: str
    band_score: Any
    feedback: Any

@app.post("/community/share-writing")
async def share_writing(payload: ShareWritingIn, user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if not user:
        raise HTTPException(status_code=401, detail="Vui lòng đăng nhập để đăng bài")
    
    log = WritingLog(
        user_id=user["user_id"],
        content=payload.content,
        feedback=json.dumps(payload.feedback),
        band_score=str(payload.band_score),
        word_count=len(payload.content.split())
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return {"message": "Đã chia sẻ bài viết", "id": log.id}

@app.delete("/community/writing/{id}")
async def delete_writing(id: int, user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if not user:
        raise HTTPException(status_code=401, detail="Vui lòng đăng nhập")
    user_id = user["user_id"]
    writing = db.query(WritingLog).filter(WritingLog.id == id).first()
    if not writing:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài viết")
    if writing.user_id != user_id:
        raise HTTPException(status_code=403, detail="Bạn không có quyền xóa bài viết này")
    
    # Also delete associated likes and comments to keep database clean
    db.query(Like).filter(Like.post_type == 'writing', Like.post_id == id).delete()
    db.query(Comment).filter(Comment.post_type == 'writing', Comment.post_id == id).delete()
    
    db.delete(writing)
    db.commit()
    return {"ok": True}

@app.post("/community/convert/{writing_id}")
async def convert_writing_to_lesson(writing_id: int, db: Session = Depends(get_db)):
    writing = db.query(WritingLog).filter(WritingLog.id == writing_id).first()
    if not writing:
        raise HTTPException(status_code=404, detail="Writing not found")
        
    result = await ai_service.generate_lesson_from_writing(writing.content)
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
        
    # Generate TTS for the writing content so they can practice listening
    audio_file = await tts_service.generate_speech(writing.content)
    result["audio_url"] = f"/static/{audio_file}"
    
    return result

@app.get("/listening/mock-test")
async def get_listening_mock_test():
    # Simulate an IELTS listening test payload
    context_text = "Hello, this is Peter. I am calling to apply for the Receptionist job. I will make sure to bring my passport to the interview tomorrow."
    audio_file = "matcha-default.jpg"
    try:
        audio_file = await tts_service.generate_speech(context_text)
    except:
        pass
    
    return {
        "title": "Cambridge IELTS 16 - Test 1 - Part 1",
        "context": "A phone conversation between a man and a woman about a part-time job.",
        "audio_url": f"/static/{audio_file}", 
        "questions": [
            {
                "id": 1,
                "type": "fill_in_the_blank",
                "text": "The man's first name is _______.",
                "answer": "Peter"
            },
            {
                "id": 2,
                "type": "multiple_choice",
                "text": "What type of job is he applying for?",
                "options": ["Waiter", "Receptionist", "Cleaner"],
                "answer": "Receptionist"
            },
            {
                "id": 3,
                "type": "fill_in_the_blank",
                "text": "He needs to bring his _______ to the interview.",
                "answer": "passport"
            }
        ]
    }

@app.get("/reading/mock-test")
async def get_reading_mock_test():
    # Simulate an IELTS reading test payload
    return {
        "title": "The History of Matcha",
        "content": "Matcha is a finely ground powder of specially grown and processed green tea leaves, traditionally consumed in East Asia.\n\nThe green tea plants used for matcha are shade-grown for three to four weeks before harvest; the stems and veins are removed in processing.\n\nDuring shaded growth, the plant Camellia sinensis produces more theanine and caffeine. This combination of chemicals is considered to account for the calm energy people might feel from drinking matcha.\n\nMatcha has seen a huge surge in popularity worldwide in recent years, often used in lattes, desserts, and health drinks.",
        "questions": [
            {
                "id": 1,
                "type": "multiple_choice",
                "text": "How long are the tea plants shade-grown before harvest?",
                "options": ["1-2 weeks", "3-4 weeks", "5-6 weeks", "They are not shade-grown"],
                "answer": "3-4 weeks"
            },
            {
                "id": 2,
                "type": "fill_in_the_blank",
                "text": "The combination of theanine and _______ creates a calm energy.",
                "answer": "caffeine"
            },
            {
                "id": 3,
                "type": "multiple_choice",
                "text": "Matcha is NOT commonly used in:",
                "options": ["Lattes", "Desserts", "Health drinks", "Fried chicken"],
                "answer": "Fried chicken"
            }
        ]
    }

class ReadingGenIn(BaseModel):
    text: str

class ListeningGenIn(BaseModel):
    text: str
    mode: str = "paragraph"

@app.post("/listening/generate-from-text")
async def generate_listening_from_text_endpoint(payload: ListeningGenIn):
    result = await ai_service.generate_listening_from_text(payload.text, mode=payload.mode)
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
        
    try:
        audio_file = await tts_service.generate_speech(payload.text)
        result["audio_url"] = f"/static/{audio_file}"
    except Exception as e:
        print(f"TTS failed for listening generation: {e}")
        
    return result

@app.post("/reading/generate")
async def generate_reading_test(payload: ReadingGenIn):
    result = await ai_service.generate_reading_questions(payload.text)
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    return result

class LikeIn(BaseModel):
    post_type: str
    post_id: int

class CommentIn(BaseModel):
    post_type: str
    post_id: int
    content: str

@app.post("/community/like")
async def toggle_like(payload: LikeIn, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user_id = current_user["user_id"]
    existing = db.query(Like).filter(Like.user_id == user_id, Like.post_type == payload.post_type, Like.post_id == payload.post_id).first()
    if existing:
        db.delete(existing)
        db.commit()
        liked = False
    else:
        new_like = Like(user_id=user_id, post_type=payload.post_type, post_id=payload.post_id)
        db.add(new_like)
        db.commit()
        liked = True
    return {"liked": liked}

@app.post("/community/comment")
async def add_comment(payload: CommentIn, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user_id = current_user["user_id"]
    new_comment = Comment(user_id=user_id, post_type=payload.post_type, post_id=payload.post_id, content=payload.content)
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    
    # Return with user info
    user = db.query(User).filter(User.id == user_id).first()
    result = {
        "id": new_comment.id,
        "content": new_comment.content,
        "username": user.username if user else "Anonymous",
        "avatar_url": user.avatar_url if user else None,
        "created_at": new_comment.created_at.isoformat()
    }
    return result

@app.get("/community/comments/{post_type}/{post_id}")
async def get_comments(post_type: str, post_id: int, db: Session = Depends(get_db)):
    comments = db.query(Comment).filter(Comment.post_type == post_type, Comment.post_id == post_id).order_by(desc(Comment.created_at)).all()
    res = []
    for c in comments:
        user = db.query(User).filter(User.id == c.user_id).first() if c.user_id else None
        res.append({
            "id": c.id,
            "content": c.content,
            "username": user.username if user else "Anonymous",
            "avatar_url": user.avatar_url if user else None,
            "created_at": c.created_at.isoformat()
        })
    return {"comments": res}

class SavePlanIn(BaseModel):
    topic: str = ""
    plan_data: dict

@app.get("/notifications")
async def get_user_notifications(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user:
        return {"notifications": [], "due_count": 0}
    
    user_id = current_user["user_id"]
    
    # Get user's vocabulary IDs
    user_vocabs = db.query(Vocabulary).filter(Vocabulary.user_id == user_id).all()
    vocab_ids = [v.id for v in user_vocabs]
    vocab_map = {v.id: v.word for v in user_vocabs}
    
    # Get user's writing IDs
    user_writings = db.query(WritingLog).filter(WritingLog.user_id == user_id).all()
    writing_ids = [w.id for w in user_writings]
    
    notifications = []
    
    # Helper to calculate friendly time
    def get_time_str(dt):
        now = datetime.utcnow()
        diff = now - dt
        if diff.days > 0:
            return f"{diff.days} ngày trước"
        seconds = diff.seconds
        hours = seconds // 3600
        if hours > 0:
            return f"{hours} giờ trước"
        minutes = seconds // 60
        if minutes > 0:
            return f"{minutes} phút trước"
        return "Vừa xong"

    # 1. Fetch likes on user's vocabulary
    if vocab_ids:
        vocab_likes = db.query(Like).filter(
            Like.post_type == 'vocabulary',
            Like.post_id.in_(vocab_ids),
            Like.user_id != user_id
        ).order_by(desc(Like.created_at)).limit(10).all()
        
        for l in vocab_likes:
            liker = db.query(User).filter(User.id == l.user_id).first()
            username = liker.username if liker else "Ai đó"
            word = vocab_map.get(l.post_id, "từ vựng")
            notifications.append({
                "id": f"like-vocab-{l.id}",
                "icon": "favorite",
                "color": "text-red-500 bg-red-50",
                "title": f"{username} đã thích từ vựng",
                "content": f"{username} đã thích từ vựng '{word}' của bạn.",
                "time": get_time_str(l.created_at),
                "created_at": l.created_at
            })
            
    # 2. Fetch likes on user's writings
    if writing_ids:
        writing_likes = db.query(Like).filter(
            Like.post_type == 'writing',
            Like.post_id.in_(writing_ids),
            Like.user_id != user_id
        ).order_by(desc(Like.created_at)).limit(10).all()
        
        for l in writing_likes:
            liker = db.query(User).filter(User.id == l.user_id).first()
            username = liker.username if liker else "Ai đó"
            notifications.append({
                "id": f"like-writing-{l.id}",
                "icon": "favorite",
                "color": "text-red-500 bg-red-50",
                "title": f"{username} đã thích bài viết",
                "content": f"{username} đã thích bài viết Writing của bạn.",
                "time": get_time_str(l.created_at),
                "created_at": l.created_at
            })

    # 3. Fetch comments on user's vocabulary
    if vocab_ids:
        vocab_comments = db.query(Comment).filter(
            Comment.post_type == 'vocabulary',
            Comment.post_id.in_(vocab_ids),
            Comment.user_id != user_id
        ).order_by(desc(Comment.created_at)).limit(10).all()
        
        for c in vocab_comments:
            commenter = db.query(User).filter(User.id == c.user_id).first()
            username = commenter.username if commenter else "Ai đó"
            word = vocab_map.get(c.post_id, "từ vựng")
            notifications.append({
                "id": f"comment-vocab-{c.id}",
                "icon": "chat",
                "color": "text-blue-500 bg-blue-50",
                "title": f"{username} đã bình luận từ vựng",
                "content": f'{username}: "{c.content}" (trên từ vựng {word})',
                "time": get_time_str(c.created_at),
                "created_at": c.created_at
            })

    # 4. Fetch comments on user's writings
    if writing_ids:
        writing_comments = db.query(Comment).filter(
            Comment.post_type == 'writing',
            Comment.post_id.in_(writing_ids),
            Comment.user_id != user_id
        ).order_by(desc(Comment.created_at)).limit(10).all()
        
        for c in writing_comments:
            commenter = db.query(User).filter(User.id == c.user_id).first()
            username = commenter.username if commenter else "Ai đó"
            notifications.append({
                "id": f"comment-writing-{c.id}",
                "icon": "chat",
                "color": "text-blue-500 bg-blue-50",
                "title": f"{username} đã bình luận bài viết",
                "content": f'{username}: "{c.content}"',
                "time": get_time_str(c.created_at),
                "created_at": c.created_at
            })

    # Sort notifications by created_at descending
    notifications.sort(key=lambda x: x["created_at"], reverse=True)
    
    # Remove datetime objects so it is JSON serializable
    for n in notifications:
        del n["created_at"]
        
    # Calculate due count (total user vocab count)
    due_count = db.query(Vocabulary).filter(Vocabulary.user_id == user_id).count()
    
    return {"notifications": notifications, "due_count": due_count}

def evaluate_guess(guess: str, secret: str) -> list[str]:
    result = ['gray'] * 5
    secret_letters = list(secret)
    
    # First pass: correct position (green)
    for i in range(5):
        if guess[i] == secret[i]:
            result[i] = 'green'
            secret_letters[i] = None
            
    # Second pass: wrong position but present (yellow)
    for i in range(5):
        if result[i] != 'green' and guess[i] in secret_letters:
            idx = secret_letters.index(guess[i])
            result[i] = 'yellow'
            secret_letters[idx] = None
            
    return result

@app.post("/study-plan/save")
async def save_study_plan(payload: SavePlanIn, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    new_plan = DailyPlan(user_id=current_user["user_id"], plan_json=payload.plan_data)
    db.add(new_plan)
    db.commit()
    return {"status": "success", "message": "Lộ trình đã được lưu!"}

# --- Wordle Matcha Endpoints ---

class GuessInput(BaseModel):
    guess: str

@app.get("/game/wordle/state")
async def get_wordle_state(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    user_id = current_user["user_id"]
    
    game = db.query(WordleGame).filter(WordleGame.user_id == user_id).first()
    if not game:
        word_data = await ai_service.generate_wordle_word(1)
        game = WordleGame(
            user_id=user_id,
            current_level=1,
            secret_word=word_data["word"],
            theme=word_data["theme"],
            hint=word_data["hint"],
            guesses=[],
            points=0,
            status="playing",
            hint_used=False,
            level_start_time=datetime.utcnow()
        )
        db.add(game)
        db.commit()
        db.refresh(game)
        
    evaluations = [evaluate_guess(g, game.secret_word) for g in game.guesses]
    
    return {
        "current_level": game.current_level,
        "theme": game.theme,
        "hint": game.hint,
        "guesses": game.guesses,
        "evaluations": evaluations,
        "points": game.points,
        "status": game.status,
        "hint_used": game.hint_used or False,
        "secret_word_revealed": game.secret_word if game.status in ["won", "lost"] else None
    }

@app.post("/game/wordle/hint")
async def get_wordle_hint(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    user_id = current_user["user_id"]
    game = db.query(WordleGame).filter(WordleGame.user_id == user_id).first()
    if not game or game.status != "playing":
        raise HTTPException(status_code=400, detail="Không có màn chơi nào đang diễn ra.")
    if game.hint_used:
        raise HTTPException(status_code=400, detail="Bạn đã dùng gợi ý cho lượt này rồi!")
    guesses_count = len(game.guesses) if game.guesses else 0
    if guesses_count < 5:
        raise HTTPException(status_code=400, detail=f"Cần đoán ít nhất 5 lần mới được dùng gợi ý! (hiện tại: {guesses_count}/5)")
    
    import random
    secret = game.secret_word
    hint_types = []
    # Type 1: Reveal a random letter position
    unrevealed_positions = list(range(5))
    if game.guesses:
        evaluations = [evaluate_guess(g, secret) for g in game.guesses]
        for ev in evaluations:
            for i, status in enumerate(ev):
                if status == "green" and i in unrevealed_positions:
                    unrevealed_positions.remove(i)
    if unrevealed_positions:
        pos = random.choice(unrevealed_positions)
        hint_types.append(f"Chữ cái ở vị trí {pos + 1} là '{secret[pos]}'.")
    # Type 2: Word type hint
    word_types = ["danh từ (noun)", "động từ (verb)", "tính từ (adjective)", "trạng từ (adverb)"]
    hint_types.append(f"Từ này có thể là một {random.choice(word_types)} trong ngữ cảnh IELTS.")
    # Type 3: First or last letter
    hint_types.append(f"Chữ cái cuối cùng của từ là '{secret[-1]}'.")
    
    chosen_hint = random.choice(hint_types)
    game.hint_used = True
    db.commit()
    
    return {"hint_text": chosen_hint, "hint_used": True}

@app.post("/game/wordle/guess")
async def guess_wordle(payload: GuessInput, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    user_id = current_user["user_id"]
    
    game = db.query(WordleGame).filter(WordleGame.user_id == user_id).first()
    if not game:
        word_data = await ai_service.generate_wordle_word(1)
        game = WordleGame(
            user_id=user_id,
            current_level=1,
            secret_word=word_data["word"],
            theme=word_data["theme"],
            hint=word_data["hint"],
            guesses=[],
            points=0,
            status="playing",
            hint_used=False,
            level_start_time=datetime.utcnow()
        )
        db.add(game)
        db.commit()
        db.refresh(game)
        
    if game.status != "playing":
        raise HTTPException(status_code=400, detail="Màn chơi đã kết thúc. Vui lòng lấy trạng thái mới.")
        
    guess = payload.guess.strip().upper()
    if len(guess) != 5:
        raise HTTPException(status_code=400, detail="Từ đoán phải có đúng 5 chữ cái.")
        
    # Check if guess is a valid English word using local dictionary first, then Free Dictionary API
    if guess not in VALID_WORDLE_DICTIONARY:
        import httpx
        guess_url = f"https://api.dictionaryapi.dev/api/v2/entries/en/{guess.lower()}"
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                response = await client.get(guess_url)
                if response.status_code == 404:
                    raise HTTPException(status_code=400, detail=f"Từ '{guess}' không có trong từ điển tiếng Anh!")
        except HTTPException:
            raise
        except Exception as e:
            # Fallback: if dictionary API is offline or times out, allow the word
            pass
        
    current_guesses = list(game.guesses) if game.guesses else []
    current_guesses.append(guess)
    game.guesses = current_guesses
    db.commit()
    
    if guess == game.secret_word:
        base_points = game.current_level * 100
        guess_bonus = (7 - len(current_guesses)) * 50
        
        elapsed = (datetime.utcnow() - game.level_start_time).total_seconds()
        speed_bonus = max(0, int(30 - elapsed)) * 5
        
        level_score = base_points + guess_bonus + speed_bonus
        game.points += level_score
        game.status = "won"
        db.commit()
        
        # Calculate evaluations for the level that was just won
        evaluations = [evaluate_guess(g, game.secret_word) for g in current_guesses]
        
        leaderboard_entry = GameLeaderboard(
            user_id=user_id,
            points=game.points,
            max_level=game.current_level
        )
        db.add(leaderboard_entry)
        
        next_level = game.current_level + 1
        try:
            word_data = await ai_service.generate_wordle_word(next_level)
        except Exception as e:
            logger.error(f"Failed to generate word for level {next_level}: {e}")
            import random
            fallback_word = random.choice(ai_service.wordle_keywords)
            word_data = {"word": fallback_word, "theme": "Từ vựng IELTS", "hint": f"Từ vựng học thuật 5 chữ cái bắt đầu bằng '{fallback_word[0]}'."}
        
        game.current_level = next_level
        game.secret_word = word_data["word"]
        game.theme = word_data["theme"]
        game.hint = word_data["hint"]
        game.guesses = []
        game.status = "playing"
        game.hint_used = False
        game.level_start_time = datetime.utcnow()
        db.commit()
        
        return {
            "result": "won",
            "message": "Tuyệt vời! Bạn đã đoán đúng từ bí ẩn! 🎉",
            "points_earned": level_score,
            "total_points": game.points,
            "evaluations": evaluations,
            "guesses": current_guesses,
            "next_level": next_level,
            "next_theme": game.theme,
            "next_hint": game.hint
        }
        
    elif len(current_guesses) >= 6:
        final_score = game.points
        
        # Calculate evaluations using the secret word of the completed level
        evaluations = [evaluate_guess(g, game.secret_word) for g in current_guesses]
        
        failed_secret_word = game.secret_word
        
        game.status = "lost"
        db.commit()
        
        leaderboard_entry = GameLeaderboard(
            user_id=user_id,
            points=final_score,
            max_level=game.current_level
        )
        db.add(leaderboard_entry)
        
        try:
            word_data = await ai_service.generate_wordle_word(1)
        except Exception as e:
            logger.error(f"Failed to generate word for reset: {e}")
            import random
            fallback_word = random.choice(ai_service.wordle_keywords)
            word_data = {"word": fallback_word, "theme": "Từ vựng IELTS", "hint": f"Từ vựng học thuật 5 chữ cái bắt đầu bằng '{fallback_word[0]}'."}
        game.current_level = 1
        game.secret_word = word_data["word"]
        game.theme = word_data["theme"]
        game.hint = word_data["hint"]
        game.guesses = []
        game.points = 0
        game.status = "playing"
        game.hint_used = False
        game.level_start_time = datetime.utcnow()
        db.commit()
        
        return {
            "result": "lost",
            "message": "Rất tiếc, bạn đã hết lượt đoán! Game Over. 😢",
            "final_score": final_score,
            "evaluations": evaluations,
            "guesses": current_guesses,
            "secret_word_revealed": failed_secret_word,
            "reset_level": 1,
            "next_theme": game.theme,
            "next_hint": game.hint
        }
        
    else:
        evaluations = [evaluate_guess(g, game.secret_word) for g in game.guesses]
        return {
            "result": "playing",
            "guesses": game.guesses,
            "evaluations": evaluations,
            "theme": game.theme,
            "hint": game.hint,
            "points": game.points
        }

@app.post("/game/wordle/reset")
async def reset_wordle(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    user_id = current_user["user_id"]
    
    game = db.query(WordleGame).filter(WordleGame.user_id == user_id).first()
    try:
        word_data = await ai_service.generate_wordle_word(1)
    except Exception as e:
        logger.error(f"Failed to generate word for manual reset: {e}")
        import random
        fallback_word = random.choice(ai_service.wordle_keywords)
        word_data = {"word": fallback_word, "theme": "Từ vựng IELTS", "hint": f"Từ vựng học thuật 5 chữ cái bắt đầu bằng '{fallback_word[0]}'."}
    if game:
        game.current_level = 1
        game.secret_word = word_data["word"]
        game.theme = word_data["theme"]
        game.hint = word_data["hint"]
        game.guesses = []
        game.points = 0
        game.status = "playing"
        game.hint_used = False
        game.level_start_time = datetime.utcnow()
    else:
        game = WordleGame(
            user_id=user_id,
            current_level=1,
            secret_word=word_data["word"],
            theme=word_data["theme"],
            hint=word_data["hint"],
            guesses=[],
            points=0,
            status="playing",
            level_start_time=datetime.utcnow()
        )
        db.add(game)
    db.commit()
    return {"status": "success", "message": "Đã reset game về cấp độ 1."}

@app.get("/game/leaderboard")
async def get_game_leaderboard(db: Session = Depends(get_db)):
    one_week_ago = datetime.utcnow() - timedelta(days=7)
    
    results = db.query(
        GameLeaderboard.user_id,
        func.max(GameLeaderboard.points).label("max_points"),
        func.max(GameLeaderboard.max_level).label("max_level")
    ).filter(
        GameLeaderboard.created_at >= one_week_ago
    ).group_by(
        GameLeaderboard.user_id
    ).order_by(
        desc("max_points")
    ).limit(10).all()
    
    leaderboard = []
    for idx, r in enumerate(results):
        user = db.query(User).filter(User.id == r.user_id).first()
        if user:
            leaderboard.append({
                "rank": idx + 1,
                "username": user.username,
                "avatar_url": user.avatar_url,
                "points": r.max_points,
                "max_level": r.max_level
            })
            
    # Find all-time highest level player record
    highest_lvl_record = db.query(
        GameLeaderboard.user_id,
        func.max(GameLeaderboard.max_level).label("absolute_max_level")
    ).group_by(
        GameLeaderboard.user_id
    ).order_by(
        desc("absolute_max_level")
    ).first()
    
    highest_level_player = None
    if highest_lvl_record:
        top_user = db.query(User).filter(User.id == highest_lvl_record.user_id).first()
        if top_user:
            highest_level_player = {
                "username": top_user.username,
                "avatar_url": top_user.avatar_url,
                "max_level": highest_lvl_record.absolute_max_level
            }
            
    return {
        "leaderboard": leaderboard,
        "highest_level_player": highest_level_player
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
