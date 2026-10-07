
# pyrefly: ignore [missing-import]
from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    discord_id = Column(String(50), unique=True, index=True)
    username = Column(String(100))
    avatar_url = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, default=datetime.utcnow)
    last_ip = Column(String(50), nullable=True)
    password_hash = Column(String(255), nullable=True)

class Vocabulary(Base):
    __tablename__ = "vocabulary"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    word = Column(String(255), index=True) # Removed unique=True to allow multiple users to have the same word
    phonetic = Column(String(255))
    meaning = Column(Text)
    example = Column(Text)
    topic = Column(String(100), default="General")
    audio_url = Column(String(255))
    image_url = Column(String(255), nullable=True)
    synonyms = Column(JSON, default=[])
    memory_hook = Column(Text, nullable=True)
    
    # Spaced Repetition (SRS) Fields
    mastery_level = Column(Integer, default=1) # 1 to 5
    last_reviewed = Column(DateTime, default=datetime.utcnow)
    next_review = Column(DateTime, default=datetime.utcnow)
    is_learned = Column(Boolean, default=False)
    
    is_global = Column(Boolean, default=False)
    popularity = Column(Integer, default=1)
    source = Column(String(100), default="Tự thêm")
    creator_username = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class ImageStore(Base):
    __tablename__ = "image_store"
    id = Column(Integer, primary_key=True, index=True)
    word_id = Column(Integer)
    image_path = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)

class WritingLog(Base):
    __tablename__ = "user_writing_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    content = Column(Text)
    feedback = Column(Text)
    band_score = Column(String(10))
    word_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

class Like(Base):
    __tablename__ = "likes"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    post_type = Column(String(50)) # 'vocabulary' or 'writing'
    post_id = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    post_type = Column(String(50)) # 'vocabulary' or 'writing'
    post_id = Column(Integer)
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class DailyPlan(Base):
    __tablename__ = "daily_plans"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    plan_json = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)

class DiscordSchedule(Base):
    __tablename__ = "discord_schedules"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    study_time = Column(String(10)) # e.g. "20:00"
    level = Column(String(50))
    topic = Column(String(100), default="General")
    study_focus = Column(String(50), default="Toàn diện") # "Toàn diện", "Từ vựng", "Nói", "Viết"
    active_days = Column(String(255), default="Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday")
    weekly_plan = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class AbsenceLog(Base):
    __tablename__ = "absence_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    absent_date = Column(String(20)) # e.g. "YYYY-MM-DD"
    reason = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class WordleGame(Base):
    __tablename__ = "wordle_games"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    current_level = Column(Integer, default=1)
    secret_word = Column(String(5))
    theme = Column(String(100))
    hint = Column(Text)
    guesses = Column(JSON, default=[])
    points = Column(Integer, default=0)
    status = Column(String(20), default="playing") # playing, won, lost
    hint_used = Column(Boolean, default=False)
    level_start_time = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class GameLeaderboard(Base):
    __tablename__ = "game_leaderboard"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    points = Column(Integer, default=0)
    max_level = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

class AuthRateLimit(Base):
    __tablename__ = "auth_rate_limits"
    id = Column(Integer, primary_key=True, index=True)
    ip_address = Column(String(50), index=True)
    action = Column(String(50))
    request_timestamp = Column(Float)


class MeowchaVocab(Base):
    """
    Kho từ vựng IELTS phân tầng của trò chơi Meow-Cha: Vạn Kiếm Quy Tông.
    Phân loại theo 4 cấp độ ma thạch:
    - 0: Band 4.0 - 5.0 (FROST - Huyền Băng Cực Phách)
    - 1: Band 6.0 - 6.5 (INFERNO - Cửu U Hỏa Diễm)
    - 2: Band 7.0 - 7.5 (VOID - Hắc Diệu Hư Không)
    - 3: Band 8.0+ (BLOOD_THUNDER - Vạn Kiếp Huyết Lôi)
    """
    __tablename__ = "meowcha_vocab"

    id = Column(Integer, primary_key=True, index=True)
    word = Column(String(100), index=True, nullable=False)
    ipa = Column(String(100), nullable=False)
    part_of_speech = Column(String(50), default="vocab")
    meaning = Column(Text, nullable=False)
    band_level = Column(Integer, index=True, default=0) # 0, 1, 2, 3
    asteroid_type = Column(String(50), default="FROST") # FROST, INFERNO, VOID, BLOOD_THUNDER
    difficulty_score = Column(Integer, default=1)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class MeowchaSave(Base):
    """
    Lưu trữ tiến trình tu vi (Cloud Save 3 Slot) cho người chơi Meow-Cha.
    Hỗ trợ cả người dùng có tài khoản lẫn khách vãng lai thông qua guest_token.
    """
    __tablename__ = "meowcha_saves"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    guest_token = Column(String(64), nullable=True, index=True)
    slot_id = Column(Integer, index=True, nullable=False) # 1, 2, 3
    slot_name = Column(String(100), default="FILE 1 - Chính")
    is_occupied = Column(Boolean, default=True)
    realm = Column(String(50), default="Luyện Khí Kỳ")
    realm_idx = Column(Integer, default=0)
    title = Column(String(100), default="Kiếm Đồng")
    hp = Column(Integer, default=50)
    max_hp = Column(Integer, default=50)
    score = Column(Integer, default=0)
    words_slain = Column(Integer, default=0)
    band_idx = Column(Integer, default=0)
    talents = Column(JSON, default={})
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class MeowchaLeaderboard(Base):
    """
    Bảng Phong Thần lưu danh các cao thủ diệt ma thạch trong Meow-Cha.
    """
    __tablename__ = "meowcha_leaderboard"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    player_name = Column(String(100), default="Tiểu Miêu Kiếm Sĩ")
    score = Column(Integer, index=True, default=0)
    words_slain = Column(Integer, default=0)
    realm = Column(String(50), default="Luyện Khí Kỳ")
    accuracy = Column(Float, default=100.0)
    wpm = Column(Integer, default=0)
    avatar_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class MeowchaUserProfile(Base):
    """
    Hồ Sơ Tu Chân Giả gắn liền với từng User đăng nhập.
    Quản lý tổng điểm tu vi tích lũy, cảnh giới cao nhất, số từ vựng đã trảm, linh thạch, danh hiệu và slot lưu trữ.
    """
    __tablename__ = "meowcha_user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False, index=True)
    total_score = Column(Integer, default=0)
    highest_realm = Column(String(50), default="Luyện Khí Kỳ")
    highest_realm_idx = Column(Integer, default=0)
    total_words_slain = Column(Integer, default=0)
    highest_wpm = Column(Integer, default=0)
    games_played = Column(Integer, default=0)
    spirit_stones = Column(Integer, default=0)
    unlocked_titles = Column(JSON, default=list)
    unlocked_talents = Column(JSON, default=dict)
    active_slot_id = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class MeowchaBattleLog(Base):
    """
    Lịch sử Độ Kiếp / Trảm Ma theo từng ván đấu của người chơi.
    """
    __tablename__ = "meowcha_battle_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    guest_token = Column(String(64), nullable=True, index=True)
    score = Column(Integer, default=0)
    words_slain = Column(Integer, default=0)
    realm = Column(String(50), default="Luyện Khí Kỳ")
    accuracy = Column(Float, default=100.0)
    wpm = Column(Integer, default=0)
    band_level = Column(Integer, default=0)
    is_victory = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class GrammarTopic(Base):
    """
    6 Cụm chuyên đề ngữ pháp lớn (Tenses, Modals, Sentence Structures, Clauses, Verb Forms, Modifiers)
    """
    __tablename__ = "grammar_topics"

    id = Column(String(50), primary_key=True)  # e.g. "tenses", "sentence_structures"
    title_vi = Column(String(100), nullable=False)
    title_en = Column(String(100), nullable=False)
    icon_name = Column(String(50), default="BookOpen")
    order_index = Column(Integer, default=1)

    lessons = relationship("GrammarLesson", back_populates="topic", cascade="all, delete-orphan")


class GrammarLesson(Base):
    """
    Bài học lý thuyết cốt lõi kèm công thức, bẫy thi và ví dụ IELTS Academic
    """
    __tablename__ = "grammar_lessons"

    id = Column(String(100), primary_key=True)  # e.g. "past_simple_vs_present_perfect"
    topic_id = Column(String(50), ForeignKey("grammar_topics.id"), nullable=False, index=True)
    title_en = Column(String(150), nullable=False)
    title_vi = Column(String(150), nullable=False)
    cefr_level = Column(String(10), default="B1", index=True)
    ielts_relevance = Column(String(50), default="Writing Task 1 & 2")

    formula = Column(JSON, default=dict)
    rule_summary = Column(Text, nullable=False)
    ielts_application = Column(Text, nullable=False)
    common_pitfalls = Column(JSON, default=list)
    academic_examples = Column(JSON, default=list)

    topic = relationship("GrammarTopic", back_populates="lessons")
    exercises = relationship("GrammarExercise", back_populates="lesson", cascade="all, delete-orphan")


class GrammarExercise(Base):
    """
    Ngân hàng câu hỏi bài tập polymorphic 4 cơ chế:
    - MULTIPLE_CHOICE
    - GAP_FILL
    - SENTENCE_SCRAMBLE
    - ERROR_SPOTTING
    """
    __tablename__ = "grammar_exercises"

    id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(String(100), ForeignKey("grammar_lessons.id"), nullable=True, index=True)
    mechanic = Column(String(30), nullable=False, index=True)
    cefr_level = Column(String(10), default="B2", index=True)
    target_concept = Column(String(150), nullable=False)
    dataset_source = Column(String(50), default="cambridge", index=True)

    prompt = Column(Text, nullable=False)
    content_payload = Column(JSON, nullable=False)
    explanation = Column(Text, nullable=False)
    ielts_tip = Column(Text, nullable=True)
    vault_word_slot = Column(String(100), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    lesson = relationship("GrammarLesson", back_populates="exercises")


class UserGrammarProgress(Base):
    """
    Theo dõi tiến độ Spaced Repetition (SRS) và điểm yếu theo từng bài học ngữ pháp
    """
    __tablename__ = "user_grammar_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    lesson_id = Column(String(100), ForeignKey("grammar_lessons.id"), nullable=False, index=True)

    mastery_score = Column(Float, default=0.0)
    streak = Column(Integer, default=0)
    total_attempts = Column(Integer, default=0)
    correct_attempts = Column(Integer, default=0)
    last_practiced = Column(DateTime, default=datetime.utcnow)
    next_review_due = Column(DateTime, default=datetime.utcnow)
    weak_points = Column(JSON, default=list)





