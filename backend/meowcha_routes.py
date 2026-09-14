from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from datetime import datetime
import random
import logging

from database import get_db
from models import MeowchaVocab, MeowchaSave, MeowchaLeaderboard, User
from schemas import (
    MeowchaVocabResponse,
    MeowchaSaveCreate,
    MeowchaSaveResponse,
    MeowchaLeaderboardCreate,
    MeowchaLeaderboardResponse
)

logger = logging.getLogger("meowcha_routes")

router = APIRouter(
    prefix="/api/meowcha",
    tags=["Meow-Cha Cultivation"]
)

def api_response(data: Any = None, success: bool = True, error: Optional[Dict[str, str]] = None):
    """Chuẩn hóa cấu trúc trả về theo quy chuẩn hệ thống"""
    return {
        "success": success,
        "data": data,
        "error": error
    }


# =========================================================================
# 1. TỪ VỰNG IELTS THEO BẬC MA THẠCH (/api/meowcha/vocab)
# =========================================================================
@router.get("/vocab", response_model=Dict[str, Any], status_code=status.HTTP_200_OK)
def get_vocab_deck(
    band: Optional[int] = Query(None, description="Cấp độ IELTS: 0 (4.0-5.0), 1 (6.0-6.5), 2 (7.0-7.5), 3 (8.0+)"),
    limit: int = Query(30, ge=5, le=100, description="Số lượng từ vựng cần lấy"),
    db: Session = Depends(get_db)
):
    """
    Lấy danh sách từ vựng IELTS phân tầng từ SQL Database.
    Hỗ trợ shuffle ngẫu nhiên và lọc theo cấp độ ma thạch đã chọn.
    """
    try:
        query = db.query(MeowchaVocab).filter(MeowchaVocab.is_active == True)
        if band is not None:
            query = query.filter(MeowchaVocab.band_level == band)

        all_records = query.all()
        if not all_records:
            # Fallback nếu band chưa có từ
            all_records = db.query(MeowchaVocab).filter(MeowchaVocab.is_active == True).all()

        # Xáo trộn ngẫu nhiên và lấy số lượng theo limit
        sampled = random.sample(all_records, min(len(all_records), limit))
        
        result_data = [
            {
                "id": v.id,
                "word": v.word,
                "ipa": v.ipa,
                "type": v.part_of_speech,
                "meaning": v.meaning,
                "band_level": v.band_level,
                "asteroid_type": v.asteroid_type,
                "difficulty_score": v.difficulty_score
            }
            for v in sampled
        ]

        return api_response(data=result_data, success=True)
    except Exception as e:
        logger.error(f"Lỗi khi lấy từ vựng Meow-Cha: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "INTERNAL_SERVER_ERROR", "message": str(e)}
        )


# =========================================================================
# 2. HỆ THỐNG LƯU TRỮ ĐẠO QUẢ 3 SLOTS (/api/meowcha/saves)
# =========================================================================
@router.get("/saves", response_model=Dict[str, Any], status_code=status.HTTP_200_OK)
def get_all_save_slots(
    guest_token: Optional[str] = Query(None, description="Token định danh cho người chơi vãng lai"),
    db: Session = Depends(get_db)
):
    """
    Lấy danh sách tóm tắt 3 Slots lưu trữ của người chơi.
    """
    try:
        slots_data = {}
        for s_id in (1, 2, 3):
            # Tìm bản ghi save theo slot_id
            query = db.query(MeowchaSave).filter(MeowchaSave.slot_id == s_id)
            if guest_token:
                query = query.filter(MeowchaSave.guest_token == guest_token)
            
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
        if guest_token:
            query = query.filter(MeowchaSave.guest_token == guest_token)
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
        if payload.guest_token:
            query = query.filter(MeowchaSave.guest_token == payload.guest_token)
        save_item = query.first()

        default_name = f"FILE {slot_id}" + (" - Chính" if slot_id == 1 else (" - Dự Phòng" if slot_id == 2 else " - Thử Nghiệm"))
        slot_name = payload.slot_name or default_name

        if not save_item:
            save_item = MeowchaSave(
                slot_id=slot_id,
                guest_token=payload.guest_token,
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
    """
    try:
        entries = db.query(MeowchaLeaderboard)\
            .order_by(MeowchaLeaderboard.score.desc())\
            .limit(limit)\
            .all()

        results = [
            {
                "id": e.id,
                "rank": idx + 1,
                "player_name": e.player_name,
                "score": e.score,
                "words_slain": e.words_slain,
                "realm": e.realm,
                "accuracy": round(e.accuracy, 1),
                "wpm": e.wpm,
                "created_at": e.created_at.strftime("%d/%m/%Y") if e.created_at else ""
            }
            for idx, e in enumerate(entries)
        ]

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
    """
    try:
        new_entry = MeowchaLeaderboard(
            player_name=payload.player_name.strip() or "Tiểu Miêu Kiếm Sĩ",
            score=max(0, payload.score),
            words_slain=max(0, payload.words_slain),
            realm=payload.realm or "Luyện Khí Kỳ",
            accuracy=min(100.0, max(0.0, payload.accuracy)),
            wpm=max(0, payload.wpm),
            created_at=datetime.utcnow()
        )
        db.add(new_entry)
        db.commit()
        db.refresh(new_entry)

        # Tính toán thứ hạng hiện tại của người chơi
        better_count = db.query(MeowchaLeaderboard).filter(MeowchaLeaderboard.score > new_entry.score).count()
        current_rank = better_count + 1

        return api_response(
            data={
                "id": new_entry.id,
                "rank": current_rank,
                "player_name": new_entry.player_name,
                "score": new_entry.score,
                "realm": new_entry.realm
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
