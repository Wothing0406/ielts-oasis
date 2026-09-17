"""
Seed Oxford 5000 CEFR Vocabulary into Meowcha SQL Database (meowcha_vocab).
Nạp toàn bộ kho từ vựng Oxford 5000 (~5.000 từ vựng chuẩn CEFR A1-C1) 
phân bổ theo 4 cấp độ Ma Thạch / Band IELTS cho game Meow-Cha:
- Band 0 (FROST - Huyền Băng Cực Phách): A1, A2
- Band 1 (INFERNO - Cửu U Hỏa Diễm): B1
- Band 2 (VOID - Hắc Diệu Hư Không): B2
- Band 3 (BLOOD_THUNDER - Vạn Kiếp Huyết Lôi): C1
"""
import os
import sys
import json
import logging
from collections import defaultdict
from typing import Dict, Any, List

from database import engine, SessionLocal, Base
from models import MeowchaVocab

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("seed_oxford_5000")

def get_band_level_and_asteroid(level: str):
    lvl = (level or "B1").upper().strip()
    if lvl in ("A1", "A2"):
        return 0, "FROST"
    elif lvl == "B1":
        return 1, "INFERNO"
    elif lvl == "B2":
        return 2, "VOID"
    else: # C1, C2
        return 3, "BLOOD_THUNDER"

def load_dataset(json_path: str) -> List[Dict[str, Any]]:
    if not os.path.exists(json_path):
        raise FileNotFoundError(f"Không tìm thấy file dataset Oxford tại: {json_path}")
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    logger.info(f"Đã đọc {len(data)} mục từ từ file {json_path}")
    return data

def consolidate_words(raw_entries: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    """
    Gộp các mục từ có cùng từ vựng (ví dụ cùng từ nhưng khác loại từ noun/verb)
    thành mục từ duy nhất với định nghĩa và phiên âm đầy đủ nhất.
    """
    consolidated = {}
    for entry in raw_entries:
        raw_word = entry.get("word", "").strip()
        if not raw_word or not raw_word.replace(" ", "").isalpha():
            continue
        
        word_key = raw_word.upper()
        phonetic = entry.get("phonetic", "").strip()
        pos = entry.get("type", "vocab").strip()
        meaning = entry.get("meaning", "").strip()
        level = entry.get("level", "B1").strip().upper()
        band, asteroid = get_band_level_and_asteroid(level)

        if word_key not in consolidated:
            consolidated[word_key] = {
                "word": word_key,
                "ipa": phonetic or "/.../",
                "part_of_speech": pos,
                "meaning": meaning,
                "band_level": band,
                "asteroid_type": asteroid,
                "level": level,
                "difficulty_score": (band + 1) * 10 + len(word_key)
            }
        else:
            cur = consolidated[word_key]
            # Cập nhật IPA nếu hiện tại chưa có
            if (not cur["ipa"] or cur["ipa"] == "/.../") and phonetic:
                cur["ipa"] = phonetic
            # Ghép loại từ
            if pos and pos not in cur["part_of_speech"]:
                cur["part_of_speech"] = f"{cur['part_of_speech']}, {pos}"
            # Ghép nghĩa nếu khác nhau
            if meaning and meaning not in cur["meaning"]:
                cur["meaning"] = f"{cur['meaning']} | {meaning}"
            # Lấy band level cao nhất nếu từ này có nhiều nghĩa ở cấp cao hơn
            if band > cur["band_level"]:
                cur["band_level"] = band
                cur["asteroid_type"] = asteroid
                cur["level"] = level
                cur["difficulty_score"] = (band + 1) * 10 + len(word_key)

    logger.info(f"Đã chuẩn hóa thành {len(consolidated)} từ vựng độc nhất (unique words).")
    return consolidated

def seed_database():
    logger.info("Khởi tạo cấu trúc bảng Meowcha trong CSDL nếu chưa có...")
    Base.metadata.create_all(bind=engine)

    base_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(base_dir, "services", "oxford_5000_cefr.json")
    
    entries = load_dataset(json_path)
    words_map = consolidate_words(entries)

    db = SessionLocal()
    try:
        logger.info("Đang kiểm tra từ vựng hiện có trong bảng meowcha_vocab...")
        existing_records = {v.word: v for v in db.query(MeowchaVocab).all()}
        logger.info(f"Hiện có {len(existing_records)} từ trong cơ sở dữ liệu.")

        inserted_count = 0
        updated_count = 0
        batch_to_add = []

        for word_key, item in words_map.items():
            if word_key in existing_records:
                rec = existing_records[word_key]
                # Cập nhật nếu thiếu thông tin
                if not rec.ipa or rec.ipa == "/.../":
                    rec.ipa = item["ipa"]
                if not rec.meaning:
                    rec.meaning = item["meaning"]
                rec.band_level = item["band_level"]
                rec.asteroid_type = item["asteroid_type"]
                rec.difficulty_score = item["difficulty_score"]
                rec.is_active = True
                updated_count += 1
            else:
                new_vocab = MeowchaVocab(
                    word=item["word"],
                    ipa=item["ipa"],
                    part_of_speech=item["part_of_speech"],
                    meaning=item["meaning"],
                    band_level=item["band_level"],
                    asteroid_type=item["asteroid_type"],
                    difficulty_score=item["difficulty_score"],
                    is_active=True
                )
                batch_to_add.append(new_vocab)
                inserted_count += 1

            if len(batch_to_add) >= 500:
                db.bulk_save_objects(batch_to_add)
                db.commit()
                batch_to_add.clear()
                logger.info(f"  -> Đã nạp batch: tổng mới {inserted_count} từ...")

        if batch_to_add:
            db.bulk_save_objects(batch_to_add)
            db.commit()
            batch_to_add.clear()

        # Commit toàn bộ thay đổi cập nhật
        db.commit()

        # Thống kê phân bố theo Band
        total_in_db = db.query(MeowchaVocab).count()
        frost_cnt = db.query(MeowchaVocab).filter(MeowchaVocab.band_level == 0).count()
        inferno_cnt = db.query(MeowchaVocab).filter(MeowchaVocab.band_level == 1).count()
        void_cnt = db.query(MeowchaVocab).filter(MeowchaVocab.band_level == 2).count()
        thunder_cnt = db.query(MeowchaVocab).filter(MeowchaVocab.band_level == 3).count()

        logger.info("=========================================================")
        logger.info(f"  HOÀN THÀNH SEED OXFORD 5000 VÀO MEOWCHA_VOCAB!")
        logger.info(f"  - Số từ mới thêm vào: {inserted_count}")
        logger.info(f"  - Số từ đã cập nhật: {updated_count}")
        logger.info(f"  - Tổng số từ trong database hiện tại: {total_in_db}")
        logger.info(f"  - Band 0 (Frost / A1-A2): {frost_cnt} từ")
        logger.info(f"  - Band 1 (Inferno / B1): {inferno_cnt} từ")
        logger.info(f"  - Band 2 (Void / B2): {void_cnt} từ")
        logger.info(f"  - Band 3 (Blood Thunder / C1): {thunder_cnt} từ")
        logger.info("=========================================================")

    except Exception as e:
        db.rollback()
        logger.error(f"Lỗi trong quá trình seed dữ liệu: {e}", exc_info=True)
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
