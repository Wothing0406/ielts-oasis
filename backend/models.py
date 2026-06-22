from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Boolean, ForeignKey, JSON
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
    level_start_time = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class GameLeaderboard(Base):
    __tablename__ = "game_leaderboard"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    points = Column(Integer, default=0)
    max_level = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

