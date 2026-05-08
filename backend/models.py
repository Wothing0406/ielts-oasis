from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Boolean
from datetime import datetime
from database import Base

class Vocabulary(Base):
    __tablename__ = "vocabulary"

    id = Column(Integer, primary_key=True, index=True)
    word = Column(String(255), unique=True, index=True)
    phonetic = Column(String(255))
    meaning = Column(Text)
    example = Column(Text)
    topic = Column(String(100), default="General")
    audio_url = Column(String(255))
    
    # Spaced Repetition (SRS) Fields
    mastery_level = Column(Integer, default=1) # 1 to 5
    last_reviewed = Column(DateTime, default=datetime.utcnow)
    next_review = Column(DateTime, default=datetime.utcnow)
    is_learned = Column(Boolean, default=False)
    
    is_global = Column(Boolean, default=False)
    popularity = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

class ImageStore(Base):
    __tablename__ = "image_store"
    id = Column(Integer, primary_key=True, index=True)
    word_id = Column(Integer)
    image_path = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)

class WritingLog(Base):
    __tablename__ = "writing_logs"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text)
    feedback = Column(Text)
    band_score = Column(String(10))
    word_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
