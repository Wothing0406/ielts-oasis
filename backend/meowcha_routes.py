from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import Optional, List, Dict, Any
from datetime import datetime
import random
import logging

from database import get_db
from models import MeowchaVocab, MeowchaSave, MeowchaLeaderboard, MeowchaUserProfile, MeowchaBattleLog, User
from schemas import (
    MeowchaVocabResponse,
    MeowchaSaveCreate,
    MeowchaSaveResponse,
    MeowchaLeaderboardCreate,
    MeowchaLeaderboardResponse,
    MeowchaUserProfileResponse,
    MeowchaUserProfileSync,
    MeowchaBattleLogResponse
)
from auth_routes import get_current_user
from meowcha_integrity import (MeowchaRun, MeowchaSaveSnapshot, RunStart, RunComplete,
    SaveSnapshotPayload, start_run, complete_run, require_user)

from services.oxford_dataset_service import OxfordDatasetService

logger = logging.getLogger("meowcha_routes")

router = APIRouter(
    prefix="/api/meowcha",
    tags=["Meow-Cha Cultivation"]
)

def get_meowcha_user_from_token(
    current_user: Optional[dict] = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Trích xuất đối tượng User từ JWT oasis_token để cô lập dữ liệu người chơi"""
    if not current_user:
        return None
    uid = current_user.get("user_id") or current_user.get("id") or current_user.get("sub")
    if not uid:
        return None
    try:
        user_id_int = int(uid)
        return db.query(User).filter(User.id == user_id_int).first()
    except (ValueError, TypeError):
        return db.query(User).filter(User.username == str(uid)).first()


def api_response(data: Any = None, success: bool = True, error: Optional[Dict[str, str]] = None, meta: Optional[Dict[str, Any]] = None):
    """Chuẩn hóa cấu trúc trả về theo quy chuẩn hệ thống"""
    res = {
        "success": success,
        "data": data,
        "error": error
    }
    if meta is not None:
        res["meta"] = meta
    return res


@router.post('/runs')
def create_run(payload: RunStart, user=Depends(get_meowcha_user_from_token), db: Session = Depends(get_db)):
    run = start_run(db, user, payload)
    return api_response({'run_id': run.run_id, 'completed': bool(run.completed_at)})


@router.post('/runs/complete')
def finish_run(payload: RunComplete, user=Depends(get_meowcha_user_from_token), db: Session = Depends(get_db)):
    return api_response(complete_run(db, user, payload))


@router.get('/save-snapshots')
def get_save_snapshots(user=Depends(get_meowcha_user_from_token), db: Session = Depends(get_db)):
    require_user(user)
    rows = db.query(MeowchaSaveSnapshot).filter(MeowchaSaveSnapshot.user_id == user.id).all()
    result = {str(row.slot_id): {'snapshot': row.snapshot} for row in rows}
    # Non-destructive migration: old cloud slots remain readable until first v2 save.
    legacy = db.query(MeowchaSave).filter(MeowchaSave.user_id == user.id, MeowchaSave.is_occupied == True).all()
    for row in legacy:
        result.setdefault(str(row.slot_id), {'is_occupied': True, 'slot_name': row.slot_name,
            'realm': row.realm, 'realm_idx': row.realm_idx, 'title': row.title,
            'hp': row.hp, 'max_hp': row.max_hp, 'score': row.score,
            'words_slain': row.words_slain, 'band_idx': row.band_idx, 'talents': row.talents})
    return api_response(result)


@router.post('/save-snapshots/{slot_id}')
def put_save_snapshot(slot_id: int, payload: SaveSnapshotPayload,
    user=Depends(get_meowcha_user_from_token), db: Session = Depends(get_db)):
    require_user(user)
    if slot_id not in (1, 2, 3):
        raise HTTPException(400, 'Invalid slot')
    db.query(User).filter(User.id == user.id).with_for_update().one()
    row = db.query(MeowchaSaveSnapshot).filter(MeowchaSaveSnapshot.user_id == user.id,
        MeowchaSaveSnapshot.slot_id == slot_id).with_for_update().first()
    if row and payload.snapshot.get('updatedAt', 0) < row.snapshot.get('updatedAt', 0):
        raise HTTPException(409, 'A newer cloud save exists; local progress has been preserved')
    if not row:
        row = MeowchaSaveSnapshot(user_id=user.id, slot_id=slot_id)
        db.add(row)
    row.snapshot, row.updated_at = payload.snapshot, datetime.utcnow()
    db.commit()
    return api_response({'saved': True, 'slot_id': slot_id})


# =========================================================================
# 1. TỪ VỰNG IELTS THEO BẬC MA THẠCH (/api/meowcha/vocab) TỪ KHO SQL DATABASE (meowcha_vocab)
# =========================================================================
@router.get("/vocab", response_model=Dict[str, Any], status_code=status.HTTP_200_OK)
def get_vocab_deck(
    band: Optional[int] = Query(None, description="Cấp độ IELTS: 0 (A1-A2), 1 (B1), 2 (B2), 3 (C1)"),
    search: Optional[str] = Query(None, description="Tìm kiếm từ tiếng Anh hoặc nghĩa tiếng Việt trong kho Oxford 5000"),
    page: int = Query(1, ge=1, description="Trang kết quả"),
    page_size: int = Query(60, ge=1, le=5000, description="Số lượng từ mỗi trang"),
    limit: Optional[int] = Query(None, ge=1, le=5000, description="Giới hạn số lượng trả về (dùng cho preload toàn bộ deck)"),
    db: Session = Depends(get_db)
):
    """
    Lấy danh sách từ vựng IELTS trực tiếp từ cơ sở dữ liệu MySQL (bảng meowcha_vocab).
    Hỗ trợ tìm kiếm thời gian thực, lọc theo Band/Ma Thạch, phân trang mượt mà,
    và kèm theo audio_url phát âm bản xứ chuẩn Oxford Learner's Dictionaries.
    """
    try:
        query = db.query(MeowchaVocab).filter(MeowchaVocab.is_active == True)

        if band is not None:
            clamped_band = min(3, max(0, band))
            query = query.filter(MeowchaVocab.band_level == clamped_band)

        if search and search.strip():
            kw = f"%{search.strip()}%"
            query = query.filter(or_(MeowchaVocab.word.ilike(kw), MeowchaVocab.meaning.ilike(kw)))

        total_count = query.count()

        if limit is not None:
            effective_page_size = limit
            records = query.order_by(MeowchaVocab.id.asc()).limit(limit).all()
        else:
            effective_page_size = page_size
            records = query.order_by(MeowchaVocab.id.asc()).offset((page - 1) * page_size).limit(page_size).all()

        result_data = [
            {
                "id": v.id,
                "word": (v.word or "").upper(),
                "ipa": v.ipa or "/.../",
                "type": v.part_of_speech or "vocab",
                "meaning": v.meaning or "",
                "audio_url": v.audio_url or "",
                "cefr": None,
                "difficulty_source": "legacy_band",
                "band_level": v.band_level if v.band_level is not None else (band if band is not None else 0),
                "asteroid_type": v.asteroid_type or ("FROST" if v.band_level == 0 else "INFERNO" if v.band_level == 1 else "VOID" if v.band_level == 2 else "BLOOD_THUNDER"),
                "difficulty_score": v.difficulty_score or (len(v.word or "") * 5)
            }
            for v in records
        ]

        return api_response(
            data=result_data,
            meta={
                "total": total_count,
                "page": page,
                "page_size": effective_page_size,
                "band": band,
                "has_more": (page * effective_page_size) < total_count,
                "source": "mysql_database"
            },
            success=True
        )
    except Exception as e:
        logger.error(f"[MeowchaVocab] MySQL query error: {e}, falling back to Oxford dataset service")
        try:
            oxford = OxfordDatasetService.get_instance()
            level_map = {0: ["A1", "A2"], 1: ["B1"], 2: ["B2"], 3: ["C1"]}
            target_levels = level_map.get(band, ["A1", "A2", "B1", "B2", "C1"]) if band is not None else ["A1", "A2", "B1", "B2", "C1"]
            candidates = []
            for lvl in target_levels:
                candidates.extend(oxford.by_level.get(lvl, []))

            valid_words_raw = [
                e for e in candidates
                if 3 <= len(e.get("word", "")) <= 16 and e.get("word", "").isalpha()
            ] or [
                e for e in oxford.words
                if 3 <= len(e.get("word", "")) <= 16 and e.get("word", "").isalpha()
            ]

            seen_dict = {}
            for e in valid_words_raw:
                w_clean = e.get("word", "").strip().upper()
                if w_clean and w_clean not in seen_dict:
                    seen_dict[w_clean] = e

            valid_words = list(seen_dict.values())

            if search and search.strip():
                query_clean = search.strip().lower()
                valid_words = [
                    e for e in valid_words
                    if query_clean in e.get("word", "").lower() or query_clean in e.get("meaning", "").lower()
                ]

            total_matches = len(valid_words)
            effective_limit = limit if limit is not None else page_size

            if search or (limit is None and page > 1):
                start_idx = (page - 1) * effective_limit
                sampled = valid_words[start_idx : start_idx + effective_limit]
            elif limit is not None:
                sampled = valid_words[:effective_limit]
            else:
                start_idx = (page - 1) * effective_limit
                sampled = valid_words[start_idx : start_idx + effective_limit]

            def to_ast_type(lvl: str) -> str:
                if lvl in ("A1", "A2"): return "FROST"
                if lvl == "B1": return "INFERNO"
                if lvl == "B2": return "VOID"
                return "BLOOD_THUNDER"

            def to_band_level(lvl: str) -> int:
                if lvl in ("A1", "A2"): return 0
                if lvl == "B1": return 1
                if lvl == "B2": return 2
                return 3

            result_data = [
                {
                    "id": idx + 1,
                    "word": v.get("word", "").upper(),
                    "ipa": v.get("phonetic", ""),
                    "type": v.get("type", "noun"),
                    "meaning": v.get("meaning", ""),
                    "audio_url": v.get("audio_url", ""),
                    "cefr": v.get("level"),
                    "example": v.get("example", ""),
                    "band_level": to_band_level(v.get("level", "B1")),
                    "asteroid_type": to_ast_type(v.get("level", "B1")),
                    "difficulty_score": len(v.get("word", "")) * 5
                }
                for idx, v in enumerate(sampled)
            ]

            return api_response(
                data=result_data,
                meta={
                    "total": total_matches,
                    "page": page,
                    "page_size": effective_limit,
                    "oxford_total": len(oxford.words),
                    "source": "oxford_json_fallback"
                },
                success=True
            )
        except Exception as fallback_e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={"code": "INTERNAL_SERVER_ERROR", "message": f"Database error: {str(e)}; Fallback error: {str(fallback_e)}"}
            )


# =========================================================================
# 2. HỆ THỐNG LƯU TRỮ ĐẠO QUẢ 3 SLOTS (/api/meowcha/saves) - PHÂN LẬP USER
# =========================================================================
@router.get("/saves", response_model=Dict[str, Any], status_code=status.HTTP_200_OK)
def get_all_save_slots(
    guest_token: Optional[str] = Query(None, description="Token định danh cho người chơi vãng lai"),
    user: Optional[User] = Depends(get_meowcha_user_from_token),
    db: Session = Depends(get_db)
):
    """
    Lấy danh sách tóm tắt 3 Slots lưu trữ của người chơi.
    Tự động phân lập dữ liệu theo tài khoản User hoặc guest_token.
    """
    require_user(user)
    try:
        slots_data = {}
        for s_id in (1, 2, 3):
            query = db.query(MeowchaSave).filter(MeowchaSave.slot_id == s_id)
            if user:
                query = query.filter(MeowchaSave.user_id == user.id)
            else:
                effective_guest = guest_token or "guest_meowcha"
                query = query.filter(MeowchaSave.user_id == None, MeowchaSave.guest_token == effective_guest)
            
            save_item = query.order_by(MeowchaSave.updated_at.desc()).first()
            if save_item and save_item.is_occupied:
                slots_data[s_id] = {
                    "slot_id": save_item.slot_id,
                    "slot_name": save_item.slot_name,
                    "is_occupied": True,
                    "realm": save_item.realm,
                    "realm_idx": save_item.realm_idx,
                    "title": save_item.title,
                    "hp": save_item.hp,
                    "max_hp": save_item.max_hp,
                    "score": save_item.score,
                    "words_slain": save_item.words_slain,
                    "band_idx": save_item.band_idx,
                    "talents": save_item.talents or {},
                    "updated_at": save_item.updated_at.strftime("%d/%m/%Y %H:%M") if save_item.updated_at else "Vừa xong"
                }
            else:
                slots_data[s_id] = {
                    "slot_id": s_id,
                    "slot_name": f"FILE {s_id}" + (" - Chính" if s_id == 1 else (" - Dự Phòng" if s_id == 2 else " - Thử Nghiệm")),
                    "is_occupied": False,
                    "realm": "Chưa ghi chép",
                    "realm_idx": 0,
                    "title": "Chưa tu tập",
                    "hp": 50,
                    "max_hp": 50,
                    "score": 0,
                    "words_slain": 0,
                    "band_idx": 0,
                    "talents": {},
                    "updated_at": "Trống"
                }

        return api_response(data=slots_data, success=True)
    except Exception as e:
        logger.error(f"Lỗi khi tải danh sách save slots: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "INTERNAL_SERVER_ERROR", "message": str(e)}
        )


@router.get("/saves/{slot_id}", response_model=Dict[str, Any], status_code=status.HTTP_200_OK)
def get_save_slot(
    slot_id: int,
    guest_token: Optional[str] = Query(None),
    user: Optional[User] = Depends(get_meowcha_user_from_token),
    db: Session = Depends(get_db)
):
    """
    Tải chi tiết dữ liệu lưu trữ của một Slot cụ thể.
    """
    if slot_id not in (1, 2, 3):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_SLOT", "message": "Slot ID chỉ nhận giá trị 1, 2 hoặc 3."}
        )

    require_user(user)
    try:
        query = db.query(MeowchaSave).filter(MeowchaSave.slot_id == slot_id)
        if user:
            query = query.filter(MeowchaSave.user_id == user.id)
        else:
            effective_guest = guest_token or "guest_meowcha"
            query = query.filter(MeowchaSave.user_id == None, MeowchaSave.guest_token == effective_guest)
            
        save_item = query.order_by(MeowchaSave.updated_at.desc()).first()

        if not save_item or not save_item.is_occupied:
            return api_response(
                data=None,
                success=False,
                error={"code": "SLOT_EMPTY", "message": f"File {slot_id} hiện đang trống."}
            )

        return api_response(
            data={
                "slot_id": save_item.slot_id,
                "slot_name": save_item.slot_name,
                "is_occupied": True,
                "realm": save_item.realm,
                "realm_idx": save_item.realm_idx,
                "title": save_item.title,
                "hp": save_item.hp,
                "max_hp": save_item.max_hp,
                "score": save_item.score,
                "words_slain": save_item.words_slain,
                "band_idx": save_item.band_idx,
                "talents": save_item.talents or {},
                "updated_at": save_item.updated_at.strftime("%d/%m/%Y %H:%M") if save_item.updated_at else "Vừa xong"
            },
            success=True
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Lỗi khi đọc file save slot {slot_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "INTERNAL_SERVER_ERROR", "message": str(e)}
        )


@router.post("/saves/{slot_id}", response_model=Dict[str, Any], status_code=status.HTTP_200_OK)
def save_progress_to_slot(
    slot_id: int,
    payload: MeowchaSaveCreate,
    user: Optional[User] = Depends(get_meowcha_user_from_token),
    db: Session = Depends(get_db)
):
    """
    Lưu tiến trình tu vi vào SQL Database (Bảo đảm tính toàn vẹn ACID Transaction).
    """
    if slot_id not in (1, 2, 3):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_SLOT", "message": "Slot ID chỉ nhận giá trị 1, 2 hoặc 3."}
        )

    require_user(user)
    try:
        query = db.query(MeowchaSave).filter(MeowchaSave.slot_id == slot_id)
        if user:
            query = query.filter(MeowchaSave.user_id == user.id)
        else:
            effective_guest = payload.guest_token or "guest_meowcha"
            query = query.filter(MeowchaSave.user_id == None, MeowchaSave.guest_token == effective_guest)
            
        save_item = query.first()

        default_name = f"FILE {slot_id}" + (" - Chính" if slot_id == 1 else (" - Dự Phòng" if slot_id == 2 else " - Thử Nghiệm"))
        slot_name = payload.slot_name or default_name

        if not save_item:
            save_item = MeowchaSave(
                slot_id=slot_id,
                user_id=user.id if user else None,
                guest_token=None if user else (payload.guest_token or "guest_meowcha"),
                slot_name=slot_name,
                is_occupied=True,
                realm=payload.realm or "Luyện Khí Kỳ",
                realm_idx=payload.realm_idx or 0,
                title=payload.title or "Kiếm Đồng",
                hp=payload.hp or 50,
                max_hp=payload.max_hp or 50,
                score=payload.score or 0,
                words_slain=payload.words_slain or 0,
                band_idx=payload.band_idx or 0,
                talents=payload.talents or {},
                updated_at=datetime.utcnow()
            )
            db.add(save_item)
        else:
            if user:
                save_item.user_id = user.id
                save_item.guest_token = None
            save_item.slot_name = slot_name
            save_item.is_occupied = True
            save_item.realm = payload.realm or "Luyện Khí Kỳ"
            save_item.realm_idx = payload.realm_idx or 0
            save_item.title = payload.title or "Kiếm Đồng"
            save_item.hp = payload.hp if payload.hp is not None else 50
            save_item.max_hp = payload.max_hp if payload.max_hp is not None else 50
            save_item.score = payload.score or 0
            save_item.words_slain = payload.words_slain or 0
            save_item.band_idx = payload.band_idx or 0
            save_item.talents = payload.talents or {}
            save_item.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(save_item)

        return api_response(
            data={
                "slot_id": save_item.slot_id,
                "slot_name": save_item.slot_name,
                "is_occupied": True,
                "realm": save_item.realm,
                "hp": save_item.hp,
                "score": save_item.score,
                "words_slain": save_item.words_slain,
                "updated_at": save_item.updated_at.strftime("%d/%m/%Y %H:%M")
            },
            success=True
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Lỗi khi ghi save slot {slot_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "DB_TRANSACTION_FAILED", "message": str(e)}
        )


@router.post("/saves", response_model=Dict[str, Any], status_code=status.HTTP_200_OK)
def save_progress_generic(
    payload: MeowchaSaveCreate,
    user: Optional[User] = Depends(get_meowcha_user_from_token),
    db: Session = Depends(get_db)
):
    """Alias lưu tiến trình không cần chỉ định slot_id trên URL path"""
    target_slot = payload.slot_id if payload.slot_id in (1, 2, 3) else 1
    return save_progress_to_slot(slot_id=target_slot, payload=payload, user=user, db=db)


@router.delete("/saves/{slot_id}", response_model=Dict[str, Any], status_code=status.HTTP_200_OK)
def delete_save_slot(
    slot_id: int,
    guest_token: Optional[str] = Query(None),
    user: Optional[User] = Depends(get_meowcha_user_from_token),
    db: Session = Depends(get_db)
):
    """
    Xóa hoặc hoàn nguyên một cuộn trục lưu file (Save Slot) về trạng thái trống.
    """
    if slot_id not in (1, 2, 3):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_SLOT", "message": "Slot ID chỉ nhận giá trị 1, 2 hoặc 3."}
        )

    require_user(user)
    try:
        query = db.query(MeowchaSave).filter(MeowchaSave.slot_id == slot_id)
        if user:
            query = query.filter(MeowchaSave.user_id == user.id)
        else:
            effective_guest = guest_token or "guest_meowcha"
            query = query.filter(MeowchaSave.user_id == None, MeowchaSave.guest_token == effective_guest)
        save_item = query.first()

        if save_item:
            save_item.is_occupied = False
            save_item.realm = "Chưa ghi chép"
            save_item.realm_idx = 0
            save_item.title = "Chưa tu tập"
            save_item.hp = 50
            save_item.max_hp = 50
            save_item.score = 0
            save_item.words_slain = 0
            save_item.band_idx = 0
            save_item.talents = {}
            save_item.updated_at = datetime.utcnow()
            db.commit()

        return api_response(
            data={"slot_id": slot_id, "deleted": True, "message": f"Đã xóa thành công File {slot_id}."},
            success=True
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Lỗi khi xóa save slot {slot_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "DB_DELETE_FAILED", "message": str(e)}
        )


# =========================================================================
# 3. BẢNG PHONG THẦN / LEADERBOARD (/api/meowcha/leaderboard)
# =========================================================================
@router.get("/leaderboard", response_model=Dict[str, Any])
def get_leaderboard(
    limit: int = Query(10, ge=1, le=50),
    game_mode: str = Query("DIRECT", pattern="^(DIRECT|CLOZE|AUDIO|LEGACY)$"),
    assisted: bool = Query(False),
    deck_id: str = Query("oxford_5000", max_length=40),
    db: Session = Depends(get_db)
):
    """Practice boards separate modes/decks/assistance; retain a legacy archive."""
    if game_mode == "LEGACY":
        entries = db.query(MeowchaLeaderboard).order_by(MeowchaLeaderboard.score.desc()).all()
        seen, result = set(), []
        for entry in entries:
            identity = ("user", entry.user_id) if entry.user_id else ("legacy", entry.id)
            if identity in seen:
                continue
            seen.add(identity)
            result.append({"id": entry.id, "user_id": entry.user_id, "rank": len(result) + 1,
                "player_name": entry.player_name, "score": entry.score, "realm": entry.realm,
                "words_slain": entry.words_slain, "accuracy": entry.accuracy, "wpm": entry.wpm,
                "avatar_url": "", "game_mode": "LEGACY", "verification": "legacy_unverified"})
            if len(result) >= limit:
                break
        return api_response(result, meta={"verification": "legacy_unverified"})
    from sqlalchemy import select
    ranked = select(MeowchaRun.run_id, func.row_number().over(
        partition_by=MeowchaRun.user_id,
        order_by=[MeowchaRun.score.desc(), MeowchaRun.completed_at.desc()]
    ).label("position")).where(
        MeowchaRun.completed_at.isnot(None), MeowchaRun.game_mode == game_mode,
        MeowchaRun.assisted == assisted, MeowchaRun.deck_id == deck_id
    ).subquery()
    runs = db.query(MeowchaRun).join(ranked, ranked.c.run_id == MeowchaRun.run_id).filter(
        ranked.c.position == 1).order_by(MeowchaRun.score.desc(), MeowchaRun.completed_at.desc()).limit(limit).all()
    
    results = [{**run.result, "rank": i + 1} for i, run in enumerate(runs)]
    
    # SEAMLESS BACKFILL FROM meowcha_leaderboard:
    if len(results) < limit:
        legacy_entries = db.query(MeowchaLeaderboard).order_by(MeowchaLeaderboard.score.desc()).all()
        existing_names = {r.get("player_name") for r in results}
        for entry in legacy_entries:
            if entry.player_name in existing_names:
                continue
            avatar_url = ""
            if entry.user_id:
                u = db.query(User).filter(User.id == entry.user_id).first()
                if u and u.avatar_url:
                    avatar_url = u.avatar_url
            results.append({
                "id": entry.id,
                "user_id": entry.user_id,
                "rank": len(results) + 1,
                "player_name": entry.player_name,
                "score": entry.score,
                "realm": entry.realm or "Luyện Khí Kỳ",
                "words_slain": entry.words_slain,
                "accuracy": entry.accuracy or 100,
                "wpm": entry.wpm or 0,
                "avatar_url": avatar_url,
                "game_mode": game_mode,
                "verification": "plausibility_checked"
            })
            existing_names.add(entry.player_name)
            if len(results) >= limit:
                break
                
    return api_response(results,
        meta={"game_mode": game_mode, "assisted": assisted, "deck_id": deck_id,
              "verification": "plausibility_checked", "competitive": False})


@router.post("/leaderboard", response_model=Dict[str, Any])
def submit_score_to_leaderboard(
    payload: RunComplete,
    user: Optional[User] = Depends(get_meowcha_user_from_token),
    db: Session = Depends(get_db)
):
    return api_response(complete_run(db, user, payload))


# =========================================================================
# 4. HỒ SƠ TU CHÂN GIẢ & LỊCH SỬ ĐỘ KIẾP (/api/meowcha/profile & /battle-logs)
# =========================================================================
@router.get("/profile", response_model=Dict[str, Any], status_code=status.HTTP_200_OK)
def get_cultivator_profile(
    user: Optional[User] = Depends(get_meowcha_user_from_token),
    db: Session = Depends(get_db)
):
    """
    Lấy thông tin Hồ Sơ Tu Chân Giả của người chơi đăng nhập.
    Nếu là khách vãng lai, trả về dữ liệu tu luyện mặc định.
    """
    if not user:
        return api_response(
            data={
                "is_logged_in": False,
                "player_name": "Tiểu Miêu Kiếm Sĩ",
                "avatar_url": "",
                "total_score": 0,
                "highest_realm": "Luyện Khí Kỳ",
                "highest_realm_idx": 0,
                "total_words_slain": 0,
                "highest_wpm": 0,
                "games_played": 0,
                "spirit_stones": 0,
                "unlocked_titles": ["Kiếm Đồng"],
                "unlocked_talents": {},
                "active_slot_id": 1
            },
            success=True
        )

    profile = db.query(MeowchaUserProfile).filter(MeowchaUserProfile.user_id == user.id).first()
    if not profile:
        profile = MeowchaUserProfile(
            user_id=user.id,
            total_score=0,
            highest_realm="Luyện Khí Kỳ",
            highest_realm_idx=0,
            total_words_slain=0,
            highest_wpm=0,
            games_played=0,
            spirit_stones=100,
            unlocked_titles=["Kiếm Đồng"],
            unlocked_talents={},
            active_slot_id=1
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

    player_name = getattr(user, 'full_name', None) or user.username or 'Tiên Hữu'
    avatar_url = getattr(user, "avatar_url", None) or getattr(user, "discord_avatar", None) or ""

    return api_response(
        data={
            "is_logged_in": True,
            "user_id": user.id,
            "player_name": player_name,
            "avatar_url": avatar_url,
            "total_score": profile.total_score,
            "highest_realm": profile.highest_realm,
            "highest_realm_idx": profile.highest_realm_idx,
            "total_words_slain": profile.total_words_slain,
            "highest_wpm": profile.highest_wpm,
            "games_played": profile.games_played,
            "spirit_stones": profile.spirit_stones,
            "unlocked_titles": profile.unlocked_titles or ["Kiếm Đồng"],
            "unlocked_talents": profile.unlocked_talents or {},
            "active_slot_id": profile.active_slot_id,
            "updated_at": profile.updated_at.strftime("%d/%m/%Y %H:%M") if profile.updated_at else ""
        },
        success=True
    )


@router.post("/profile/sync", response_model=Dict[str, Any])
def sync_cultivator_profile(
    payload: RunComplete,
    user: Optional[User] = Depends(get_meowcha_user_from_token),
    db: Session = Depends(get_db)
):
    # Shared transaction and run idempotency key for every completion endpoint.
    return api_response(complete_run(db, user, payload))


@router.get("/battle-logs", response_model=Dict[str, Any], status_code=status.HTTP_200_OK)
def get_battle_logs(
    limit: int = Query(10, ge=1, le=50),
    user: Optional[User] = Depends(get_meowcha_user_from_token),
    db: Session = Depends(get_db)
):
    """
    Lấy danh sách lịch sử các trận độ kiếp gần nhất của người chơi.
    """
    require_user(user)
    try:
        query = db.query(MeowchaBattleLog)
        if user:
            query = query.filter(MeowchaBattleLog.user_id == user.id)
        else:
            query = query.filter(MeowchaBattleLog.guest_token == "guest_meowcha")

        logs = query.order_by(MeowchaBattleLog.created_at.desc()).limit(limit).all()
        results = [
            {
                "id": l.id,
                "score": l.score,
                "words_slain": l.words_slain,
                "realm": l.realm,
                "accuracy": round(l.accuracy, 1),
                "wpm": l.wpm,
                "band_level": l.band_level,
                "is_victory": l.is_victory,
                "created_at": l.created_at.strftime("%d/%m/%Y %H:%M") if l.created_at else ""
            }
            for l in logs
        ]
        return api_response(data=results, success=True)
    except Exception as e:
        logger.error(f"Lỗi khi tải battle logs Meowcha: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "INTERNAL_SERVER_ERROR", "message": str(e)}
        )

