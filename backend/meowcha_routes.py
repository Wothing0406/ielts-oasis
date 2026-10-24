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
        return db.query(User).filter((User.username == str(uid)) | (User.email == str(uid))).first()


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
@router.get("/leaderboard", response_model=Dict[str, Any], status_code=status.HTTP_200_OK)
def get_leaderboard(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """
    Lấy Top bảng xếp hạng cao thủ Meow-Cha sắp xếp theo Tu Vi (Score) giảm dần.
    Quy tắc: Mỗi user chỉ xuất hiện đúng 1 lần trên Top với điểm cao nhất.
    """
    try:
        raw_entries = db.query(MeowchaLeaderboard)\
            .order_by(MeowchaLeaderboard.score.desc(), MeowchaLeaderboard.created_at.desc())\
            .all()

        seen_players = set()
        unique_entries = []
        for e in raw_entries:
            key = (e.player_name or "").strip().lower()
            if not key:
                key = f"user_{e.id}"
            if key not in seen_players:
                seen_players.add(key)
                unique_entries.append(e)
                if len(unique_entries) >= limit:
                    break

        # Batch load matching users to resolve Discord avatar (Triệt tiêu hoàn toàn lỗi N+1 Query)
        user_ids = [e.user_id for e in unique_entries if e.user_id]
        names = [(e.player_name or "").strip().lower() for e in unique_entries if e.player_name]

        users_by_id = {}
        users_by_name = {}
        if user_ids or names:
            filter_clauses = []
            if user_ids:
                filter_clauses.append(User.id.in_(user_ids))
            if names:
                filter_clauses.append(func.lower(User.username).in_(names))
            matched_users = db.query(User).filter(or_(*filter_clauses)).all()
            for u in matched_users:
                users_by_id[u.id] = u
                if u.username:
                    users_by_name[u.username.strip().lower()] = u

        results = []
        for idx, e in enumerate(unique_entries):
            u_matched = users_by_id.get(e.user_id) or users_by_name.get((e.player_name or "").strip().lower())
            resolved_avatar = ""
            if u_matched and u_matched.avatar_url and u_matched.avatar_url.startswith("http"):
                resolved_avatar = u_matched.avatar_url
            elif e.avatar_url and e.avatar_url.startswith("http"):
                resolved_avatar = e.avatar_url

            results.append({
                "id": e.id,
                "rank": idx + 1,
                "player_name": e.player_name,
                "score": e.score,
                "words_slain": e.words_slain,
                "realm": e.realm,
                "accuracy": round(e.accuracy, 1),
                "wpm": e.wpm,
                "avatar_url": resolved_avatar,
                "created_at": e.created_at.strftime("%d/%m/%Y") if e.created_at else ""
            })

        return api_response(data=results, success=True)
    except Exception as e:
        logger.error(f"Lỗi khi đọc Bảng Phong Thần: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "INTERNAL_SERVER_ERROR", "message": str(e)}
        )


@router.post("/leaderboard", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
def submit_score_to_leaderboard(
    payload: MeowchaLeaderboardCreate,
    db: Session = Depends(get_db)
):
    """
    Ghi danh chiến tích mới vào Bảng Phong Thần.
    Mỗi user chỉ giữ lại 1 bản ghi với số điểm cao nhất.
    """
    try:
        player_clean = payload.player_name.strip() or "Tiểu Miêu Kiếm Sĩ"
        matched_user = db.query(User).filter(func.lower(User.username) == func.lower(player_clean)).first()
        user_avatar = matched_user.avatar_url if (matched_user and matched_user.avatar_url and matched_user.avatar_url.startswith("http")) else None
        final_avatar = (payload.avatar_url.strip() if (payload.avatar_url and payload.avatar_url.startswith("http")) else None) or user_avatar
        user_id_val = matched_user.id if matched_user else None

        # Tìm bản ghi hiện có của người chơi (không phân biệt chữ hoa thường)
        existing = db.query(MeowchaLeaderboard).filter(
            func.lower(MeowchaLeaderboard.player_name) == func.lower(player_clean)
        ).first()

        if existing:
            # Cập nhật liên kết user_id và avatar nếu có
            if user_id_val and not existing.user_id:
                existing.user_id = user_id_val
            if final_avatar:
                existing.avatar_url = final_avatar

            # Nếu điểm mới cao hơn, cập nhật thành tích cao nhất
            if payload.score > existing.score:
                existing.score = payload.score
                existing.words_slain = max(existing.words_slain, payload.words_slain)
                existing.realm = payload.realm or existing.realm
                existing.accuracy = min(100.0, max(0.0, payload.accuracy))
                existing.wpm = max(existing.wpm, payload.wpm)
                existing.created_at = datetime.utcnow()
                db.commit()
                db.refresh(existing)
            else:
                db.commit()
            active_entry = existing
        else:
            new_entry = MeowchaLeaderboard(
                user_id=user_id_val,
                player_name=player_clean,
                score=max(0, payload.score),
                words_slain=max(0, payload.words_slain),
                realm=payload.realm or "Luyện Khí Kỳ",
                accuracy=min(100.0, max(0.0, payload.accuracy)),
                wpm=max(0, payload.wpm),
                avatar_url=final_avatar,
                created_at=datetime.utcnow()
            )
            db.add(new_entry)
            db.commit()
            db.refresh(new_entry)
            active_entry = new_entry

        # Tính toán thứ hạng duy nhất của người chơi
        all_leaders = db.query(MeowchaLeaderboard)\
            .order_by(MeowchaLeaderboard.score.desc())\
            .all()
        
        seen = set()
        current_rank = 1
        for leader in all_leaders:
            pname = (leader.player_name or "").strip().lower()
            if pname not in seen:
                seen.add(pname)
                if pname == player_clean.lower():
                    break
                current_rank += 1

        return api_response(
            data={
                "id": active_entry.id,
                "rank": current_rank,
                "player_name": active_entry.player_name,
                "score": active_entry.score,
                "realm": active_entry.realm,
                "avatar_url": active_entry.avatar_url or ""
            },
            success=True
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Lỗi khi ghi danh Bảng Phong Thần: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "DB_TRANSACTION_FAILED", "message": str(e)}
        )


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

    player_name = user.full_name or user.username or (user.email.split("@")[0] if user.email else "Tiên Hữu")
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


@router.post("/profile/sync", response_model=Dict[str, Any], status_code=status.HTTP_200_OK)
def sync_cultivator_profile(
    payload: MeowchaUserProfileSync,
    user: Optional[User] = Depends(get_meowcha_user_from_token),
    db: Session = Depends(get_db)
):
    """
    Đồng bộ chiến tích tu vi sau ván đấu:
    - Cập nhật MeowchaUserProfile
    - Ghi lại bản ghi MeowchaBattleLog
    - Tự động cập nhật / vinh danh kỷ lục trên MeowchaLeaderboard
    """
    try:
        user_id = user.id if user else None
        player_name = (user.full_name or user.username or "Tiểu Miêu Kiếm Sĩ") if user else "Tiểu Miêu Kiếm Sĩ"
        avatar_url = getattr(user, "avatar_url", None) or getattr(user, "discord_avatar", None) if user else ""

        # 1. Ghi Battle Log
        battle_log = MeowchaBattleLog(
            user_id=user_id,
            guest_token=None if user else "guest_meowcha",
            score=payload.score_earned,
            words_slain=payload.words_slain,
            realm=payload.realm or "Luyện Khí Kỳ",
            accuracy=payload.accuracy or 100.0,
            wpm=payload.wpm or 0,
            band_level=payload.realm_idx or 0,
            is_victory=payload.is_victory or False,
            created_at=datetime.utcnow()
        )
        db.add(battle_log)

        # 2. Cập nhật Profile nếu đã đăng nhập
        if user:
            profile = db.query(MeowchaUserProfile).filter(MeowchaUserProfile.user_id == user.id).first()
            if not profile:
                profile = MeowchaUserProfile(user_id=user.id)
                db.add(profile)
            
            profile.total_score += max(0, payload.score_earned)
            profile.total_words_slain += max(0, payload.words_slain)
            profile.games_played += 1
            if payload.wpm and payload.wpm > profile.highest_wpm:
                profile.highest_wpm = payload.wpm
            if (payload.realm_idx or 0) > profile.highest_realm_idx:
                profile.highest_realm_idx = payload.realm_idx or 0
                profile.highest_realm = payload.realm or profile.highest_realm
            profile.spirit_stones += max(1, payload.words_slain * 2)
            profile.updated_at = datetime.utcnow()

        # 3. Tự động khắc bia trên Leaderboard nếu có điểm
        if payload.score_earned > 0:
            existing_lb = None
            if user_id:
                existing_lb = db.query(MeowchaLeaderboard).filter(MeowchaLeaderboard.user_id == user_id).first()
            
            if existing_lb:
                if payload.score_earned > existing_lb.score:
                    existing_lb.score = payload.score_earned
                    existing_lb.words_slain = payload.words_slain
                    existing_lb.realm = payload.realm or existing_lb.realm
                    existing_lb.wpm = max(existing_lb.wpm, payload.wpm or 0)
                    existing_lb.accuracy = payload.accuracy or existing_lb.accuracy
                    existing_lb.avatar_url = avatar_url or existing_lb.avatar_url
                    existing_lb.created_at = datetime.utcnow()
            else:
                new_lb = MeowchaLeaderboard(
                    user_id=user_id,
                    player_name=player_name,
                    score=payload.score_earned,
                    words_slain=payload.words_slain,
                    realm=payload.realm or "Luyện Khí Kỳ",
                    accuracy=payload.accuracy or 100.0,
                    wpm=payload.wpm or 0,
                    avatar_url=avatar_url,
                    created_at=datetime.utcnow()
                )
                db.add(new_lb)

        db.commit()

        return api_response(
            data={"synced": True, "player_name": player_name, "score": payload.score_earned},
            success=True
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Lỗi khi đồng bộ profile Meowcha: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "SYNC_FAILED", "message": str(e)}
        )


@router.get("/battle-logs", response_model=Dict[str, Any], status_code=status.HTTP_200_OK)
def get_battle_logs(
    limit: int = Query(10, ge=1, le=50),
    user: Optional[User] = Depends(get_meowcha_user_from_token),
    db: Session = Depends(get_db)
):
    """
    Lấy danh sách lịch sử các trận độ kiếp gần nhất của người chơi.
    """
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

