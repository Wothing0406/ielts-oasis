"""
Backfill audio_url from services/oxford_5000_cefr.json into meowcha_vocab MySQL table.
"""
import os
import sys
import json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models import MeowchaVocab

def main():
    json_path = os.path.join(os.path.dirname(__file__), "services", "oxford_5000_cefr.json")
    if not os.path.exists(json_path):
        print(f"[ERROR] Oxford JSON not found at {json_path}")
        return

    with open(json_path, "r", encoding="utf-8") as f:
        oxford = json.load(f)

    word_map = {}
    for item in oxford:
        w = (item.get("word") or "").strip().upper()
        if w and item.get("audio_url"):
            word_map[w] = item["audio_url"]

    print(f"Loaded {len(word_map)} audio URLs from Oxford JSON.")

    db = SessionLocal()
    try:
        records = db.query(MeowchaVocab).all()
        print(f"Total MeowchaVocab records in DB: {len(records)}")

        updated = 0
        for r in records:
            w = (r.word or "").strip().upper()
            if w in word_map and (not r.audio_url or not r.audio_url.strip()):
                r.audio_url = word_map[w]
                updated += 1

        db.commit()
        print(f"Successfully updated audio_url for {updated} MeowchaVocab records!")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Database error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
