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
    is_global: Optional[bool] = False

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


# ==========================================
# MEOW-CHA SCHEMAS (VẠN KIẾM QUY TÔNG)
# ==========================================
from typing import Any, Dict

class MeowchaVocabResponse(BaseModel):
    id: int
    word: str
    ipa: str
    part_of_speech: str
    meaning: str
    band_level: int
    asteroid_type: str
    difficulty_score: int

    class Config:
        from_attributes = True


class MeowchaSaveCreate(BaseModel):
    slot_id: int
    guest_token: Optional[str] = None
    slot_name: Optional[str] = None
    realm: Optional[str] = "Luyện Khí Kỳ"
    realm_idx: Optional[int] = 0
    title: Optional[str] = "Kiếm Đồng"
    hp: Optional[int] = 50
    max_hp: Optional[int] = 50
    score: Optional[int] = 0
    words_slain: Optional[int] = 0
    band_idx: Optional[int] = 0
    talents: Optional[Dict[str, Any]] = {}


class MeowchaSaveResponse(BaseModel):
    id: int
    slot_id: int
    slot_name: str
    is_occupied: bool
    realm: str
    realm_idx: int
    title: str
    hp: int
    max_hp: int
    score: int
    words_slain: int
    band_idx: int
    talents: Dict[str, Any]
    updated_at: datetime

    class Config:
        from_attributes = True


class MeowchaLeaderboardCreate(BaseModel):
    player_name: str
    score: int
    words_slain: int
    realm: str
    accuracy: float
    wpm: int
    avatar_url: Optional[str] = None


class MeowchaLeaderboardResponse(BaseModel):
    id: int
    player_name: str
    score: int
    words_slain: int
    realm: str
    accuracy: float
    wpm: int
    avatar_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class MeowchaUserProfileResponse(BaseModel):
    user_id: int
    player_name: str
    avatar_url: Optional[str] = None
    total_score: int
    highest_realm: str
    highest_realm_idx: int
    total_words_slain: int
    highest_wpm: int
    games_played: int
    spirit_stones: int
    unlocked_titles: List[str] = []
    unlocked_talents: Dict[str, Any] = {}
    active_slot_id: int
    updated_at: datetime

    class Config:
        from_attributes = True


class MeowchaUserProfileSync(BaseModel):
    score_earned: int = 0
    words_slain: int = 0
    realm: Optional[str] = "Luyện Khí Kỳ"
    realm_idx: Optional[int] = 0
    wpm: Optional[int] = 0
    accuracy: Optional[float] = 100.0
    is_victory: Optional[bool] = False
    talents: Optional[Dict[str, Any]] = None
    slot_id: Optional[int] = 1


class MeowchaBattleLogResponse(BaseModel):
    id: int
    score: int
    words_slain: int
    realm: str
    accuracy: float
    wpm: int
    band_level: int
    is_victory: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ==========================================
# GRAMMAR & ADAPTIVE EXAM SCHEMAS
# ==========================================

class GrammarExerciseResponse(BaseModel):
    id: int
    lesson_id: Optional[str] = None
    mechanic: str
    cefr_level: str
    target_concept: str
    dataset_source: str
    prompt: str
    content_payload: Dict[str, Any]
    explanation: str
    ielts_tip: Optional[str] = None
    vault_word_slot: Optional[str] = None

    class Config:
        from_attributes = True


class GrammarLessonResponse(BaseModel):
    id: str
    topic_id: str
    title_en: str
    title_vi: str
    cefr_level: str
    ielts_relevance: str
    formula: Dict[str, Any]
    rule_summary: str
    ielts_application: str
    common_pitfalls: List[str]
    academic_examples: List[Dict[str, Any]]
    exercises: Optional[List[GrammarExerciseResponse]] = None

    class Config:
        from_attributes = True


class GrammarTopicResponse(BaseModel):
    id: str
    title_vi: str
    title_en: str
    icon_name: str
    order_index: int
    lessons: Optional[List[GrammarLessonResponse]] = None

    class Config:
        from_attributes = True


class ExerciseSubmitPayload(BaseModel):
    exercise_id: int
    user_answer: Any
    lesson_id: Optional[str] = None
    time_spent_seconds: Optional[int] = 0


class CustomExamGenRequest(BaseModel):
    custom_text: Optional[str] = None
    mechanics: Optional[List[str]] = None
    infused_words: Optional[List[str]] = None
    topic_id: Optional[str] = "tenses"
    cefr_level: Optional[str] = "B2"
    count: Optional[int] = 5


class MirrorErrorRequest(BaseModel):
    limit_writings: Optional[int] = 5
    target_band: Optional[float] = 7.5



