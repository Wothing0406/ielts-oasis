from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class VocabIn(BaseModel):
    word: str
    phonetic: Optional[str] = None
    meaning: Optional[str] = None
    example: Optional[str] = None
    topic: Optional[str] = "General"
    audio_url: Optional[str] = None

class VocabularyCreate(VocabIn):
    pass

class Vocabulary(VocabIn):
    id: int
    mastery_level: int
    last_reviewed: datetime
    next_review: datetime
    created_at: datetime

    class Config:
        from_attributes = True

class WritingLogBase(BaseModel):
    content: str
    mood: Optional[str] = None

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
