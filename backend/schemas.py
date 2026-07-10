from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class UserBase(BaseModel):
    discord_id: str
    username: str
    avatar_url: Optional[str] = None

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: int
    created_at: datetime
    last_login: datetime

    class Config:
        from_attributes = True

class VocabIn(BaseModel):
    word: str
    phonetic: Optional[str] = None
    meaning: Optional[str] = None
    example: Optional[str] = None
    topic: Optional[str] = "General"
    audio_url: Optional[str] = None
    image_url: Optional[str] = None
    box: Optional[List[float]] = None
    synonyms: Optional[List[str]] = []
    memory_hook: Optional[str] = None
    source: Optional[str] = "Tự thêm"
    creator_username: Optional[str] = None
    is_global: Optional[bool] = True

class VocabularyCreate(VocabIn):
    user_id: Optional[int] = None

class Vocabulary(VocabIn):
    id: int
    user_id: Optional[int] = None
    mastery_level: int
    last_reviewed: datetime
    next_review: datetime
    created_at: datetime

    class Config:
        from_attributes = True

class WritingLogBase(BaseModel):
    content: str
    mood: Optional[str] = None
    user_id: Optional[int] = None

class WritingLog(WritingLogBase):
    id: int
    feedback: Optional[str] = None
    band_score: Optional[str] = None
    word_count: Optional[int] = 0
    created_at: datetime

    class Config:
        from_attributes = True

class ReviewUpdate(BaseModel):
    is_correct: bool
