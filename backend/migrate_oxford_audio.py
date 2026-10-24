"""
Script backfill audio_url chuẩn Oxford 5000 vào bảng vocabulary trong database
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models import Vocabulary
from services.oxford_dataset_service import OxfordDatasetService

def backfill_oxford_audio():
    print("=== BAT DAU NAP AUDIO OXFORD 5000 CHO DATABASE VOCABULARY ===")
    oxford = OxfordDatasetService.get_instance()
    db = SessionLocal()
    try:
        vocabs = db.query(Vocabulary).all()
        updated_count = 0
        for v in vocabs:
            if not v.audio_url or not v.audio_url.strip():
                w = (v.word or "").strip().lower()
                details = oxford.get_word_details(w)
                if details and details.get("audio_url"):
                    v.audio_url = details["audio_url"]
                    updated_count += 1
        
        db.commit()
        print(f"-> Hoan tat! Da cap nhat audio_url Oxford cho {updated_count} / {len(vocabs)} tu vung trong Database.")
    except Exception as e:
        db.rollback()
        print(f"[LOI]: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    backfill_oxford_audio()
