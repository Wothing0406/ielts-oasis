"""Authenticated, idempotent Meowcha runs. Existing leaderboard/save rows are retained.

Results are plausibility-checked practice results, not server-replayed competitive
scores. Client simulations can be forged; an authoritative event replay is needed
before these results may be labelled cheat-proof or used for prizes.
"""
import json
from datetime import datetime, timezone
from typing import Literal
from uuid import UUID

from fastapi import HTTPException
from pydantic import BaseModel, Field, model_validator
from sqlalchemy import Column, Integer, String, DateTime, Boolean, JSON, ForeignKey, UniqueConstraint
from sqlalchemy.exc import IntegrityError

from database import Base
from models import User, MeowchaUserProfile, MeowchaBattleLog

REALMS = ['Luyện Khí Kỳ', 'Trúc Cơ Kỳ', 'Kim Đan Kỳ', 'Nguyên Anh Kỳ', 'Độ Kiếp Kỳ']
THRESHOLDS = [(0, 0), (2000, 15), (6000, 40), (14000, 85), (30000, 150)]


class MeowchaRun(Base):
    __tablename__ = 'meowcha_runs'
    run_id = Column(String(36), primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    game_mode = Column(String(12), nullable=False, index=True)
    deck_id = Column(String(40), nullable=False)
    assisted = Column(Boolean, nullable=False, default=False)
    resumed = Column(Boolean, nullable=False, default=False)
    started_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True, index=True)
    result = Column(JSON, nullable=True)
    score = Column(Integer, nullable=False, default=0, index=True)


class MeowchaSaveSnapshot(Base):
    __tablename__ = 'meowcha_save_snapshots'
    __table_args__ = (UniqueConstraint('user_id', 'slot_id', name='uq_meowcha_snapshot_owner_slot'),)
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    slot_id = Column(Integer, nullable=False)
    snapshot = Column(JSON, nullable=False)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow)


class RunStart(BaseModel):
    run_id: UUID
    game_mode: Literal['DIRECT', 'CLOZE', 'AUDIO']
    deck_id: Literal['oxford_5000', 'listening_1200', 'reading_academic', 'flashcard_srs'] = 'oxford_5000'
    resumed: bool = False


class RunComplete(BaseModel):
    run_id: UUID
    score: int = Field(ge=0, le=100_000_000)
    words_slain: int = Field(ge=0, le=100_000)
    realm_idx: int = Field(ge=0, le=4)
    active_ms: int = Field(ge=1000, le=604_800_000)
    correct_keystrokes: int = Field(ge=0, le=10_000_000)
    total_keystrokes: int = Field(ge=0, le=10_000_000)
    assisted_keystrokes: int = Field(0, ge=0, le=10_000_000)
    assisted_words: int = Field(0, ge=0, le=100_000)
    assisted: bool = False
    is_victory: bool = False

    @model_validator(mode='after')
    def check_counts(self):
        if self.correct_keystrokes > self.total_keystrokes or self.assisted_words > self.words_slain:
            raise ValueError('Inconsistent typing counters')
        if self.correct_keystrokes * 12000 / self.active_ms > 300:
            raise ValueError('Typing speed exceeds the practice limit (300 WPM)')
        if self.words_slain > self.correct_keystrokes + self.assisted_keystrokes:
            raise ValueError('Words require human or assisted characters')
        # 32 letters, score-only criticals, capped 20% combo and x3 focus.
        # This remains a plausibility ceiling, not authoritative replay validation.
        maximum_score = self.words_slain * 1100 * (1 + self.words_slain * .20) * 3 + self.correct_keystrokes * 30
        if self.score > maximum_score:
            raise ValueError('Score is inconsistent with word/typing counts')
        return self


class SaveSnapshotPayload(BaseModel):
    snapshot: dict

    @model_validator(mode='after')
    def check_snapshot(self):
        if len(json.dumps(self.snapshot, ensure_ascii=False)) > 100_000:
            raise ValueError('Save snapshot is too large')
        timestamp = self.snapshot.get('updatedAt', 0)
        if not isinstance(timestamp, (int, float)) or not 0 <= timestamp <= datetime.now(timezone.utc).timestamp() * 1000 + 60_000:
            raise ValueError('Invalid save timestamp')
        modes = self.snapshot.get('modes', {})
        if not isinstance(modes, dict) or any(m not in ('DIRECT', 'CLOZE', 'AUDIO') for m in modes):
            raise ValueError('Invalid save modes')
        limits = {'score': (0, 100_000_000), 'words': (0, 100_000), 'realmIdx': (0, 4),
            'hp': (0, 250), 'maxHp': (1, 250), 'shieldCharges': (0, 20),
            'correctKeystrokes': (0, 10_000_000), 'totalKeystrokes': (0, 10_000_000),
            'activeElapsedMs': (0, 604_800_000)}
        for mode in modes.values():
            if not isinstance(mode, dict):
                raise ValueError('Invalid mode snapshot')
            for key, (lower, upper) in limits.items():
                if key in mode and (not isinstance(mode[key], (int, float)) or not lower <= mode[key] <= upper):
                    raise ValueError('Invalid saved ' + key)
            if mode.get('correctKeystrokes', 0) > mode.get('totalKeystrokes', 0):
                raise ValueError('Invalid saved typing counters')
            if mode.get('hp', 0) > mode.get('maxHp', 250):
                raise ValueError('Invalid saved health')
        return self


def require_user(user):
    if user is None:
        raise HTTPException(401, 'Đăng nhập để đồng bộ thành tích; khách vẫn có thể luyện tập cục bộ.')
    return user


def start_run(db, user, payload):
    require_user(user)
    run_id = str(payload.run_id)
    run = db.get(MeowchaRun, run_id)
    if run:
        if run.user_id != user.id:
            raise HTTPException(403, 'Run belongs to another player')
        if run.game_mode != payload.game_mode or run.deck_id != payload.deck_id:
            raise HTTPException(409, 'A run cannot change its mode or deck')
        return run
    run = MeowchaRun(run_id=run_id, user_id=user.id, game_mode=payload.game_mode,
                     deck_id=payload.deck_id, resumed=payload.resumed)
    db.add(run)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return start_run(db, user, payload)
    return run


def complete_run(db, user, payload):
    require_user(user)
    # Lock the owner first: also serializes profile creation and concurrent runs.
    db.query(User).filter(User.id == user.id).with_for_update().one()
    run = db.query(MeowchaRun).filter(MeowchaRun.run_id == str(payload.run_id)).with_for_update().first()
    if not run or run.user_id != user.id:
        raise HTTPException(404, 'Unknown run for this player')
    if run.completed_at:
        return {**run.result, 'duplicate': True}
    now = datetime.utcnow()
    if not run.resumed and payload.active_ms > (now - run.started_at).total_seconds() * 1000 + 2000:
        raise HTTPException(422, 'Active play time exceeds server session duration')
    # A conditional database write is the idempotency gate even on SQLite, where
    # SELECT FOR UPDATE is ignored. Rollback also rolls back this claim.
    claimed = db.query(MeowchaRun).filter(MeowchaRun.run_id == run.run_id,
        MeowchaRun.completed_at.is_(None)).update({MeowchaRun.completed_at: now}, synchronize_session=False)
    if not claimed:
        db.refresh(run)
        return {**run.result, 'duplicate': True}
    max_realm = max(i for i, (score, words) in enumerate(THRESHOLDS)
                    if payload.score >= score and payload.words_slain >= words)
    realm_idx = min(payload.realm_idx, max_realm)
    assisted = bool(run.resumed or payload.assisted or payload.assisted_keystrokes or payload.assisted_words)
    result = {
        'run_id': run.run_id, 'user_id': user.id,
        'player_name': getattr(user, 'full_name', None) or user.username or 'Tiên Hữu',
        'score': payload.score, 'words_slain': payload.words_slain,
        'realm': REALMS[realm_idx], 'realm_idx': realm_idx,
        'accuracy': round(payload.correct_keystrokes * 100 / payload.total_keystrokes, 1) if payload.total_keystrokes else 100.0,
        'wpm': round(payload.correct_keystrokes * 12000 / payload.active_ms),
        'game_mode': run.game_mode, 'deck_id': run.deck_id, 'assisted': assisted,
        'verification': 'plausibility_checked', 'duplicate': False,
        'avatar_url': user.avatar_url if (user.avatar_url or '').startswith('https://') else '',
    }
    profile = db.query(MeowchaUserProfile).filter(MeowchaUserProfile.user_id == user.id).first()
    if not profile:
        profile = MeowchaUserProfile(user_id=user.id, total_score=0, total_words_slain=0,
            games_played=0, highest_wpm=0, highest_realm_idx=0, spirit_stones=0)
        db.add(profile)
    profile.total_score = (profile.total_score or 0) + payload.score
    profile.total_words_slain = (profile.total_words_slain or 0) + payload.words_slain
    profile.games_played = (profile.games_played or 0) + 1
    profile.spirit_stones = (profile.spirit_stones or 0) + payload.words_slain * 2
    profile.highest_wpm = max(profile.highest_wpm or 0, result['wpm'])
    if realm_idx > (profile.highest_realm_idx or 0):
        profile.highest_realm_idx = realm_idx
        profile.highest_realm = REALMS[realm_idx]
    profile.updated_at = now
    db.add(MeowchaBattleLog(user_id=user.id, score=payload.score, words_slain=payload.words_slain,
        realm=REALMS[realm_idx], accuracy=result['accuracy'], wpm=result['wpm'],
        band_level=min(3, realm_idx), is_victory=payload.is_victory))
    run.completed_at, run.score, run.assisted, run.result = now, payload.score, assisted, result
    db.commit()
    return result
