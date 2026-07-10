from database import SessionLocal
from sqlalchemy import text

def alter():
    db = SessionLocal()
    try:
        db.execute(text("ALTER TABLE wordle_games ADD COLUMN hint_used BOOLEAN DEFAULT FALSE"))
        db.commit()
        print("Added hint_used column to wordle_games table.")
    except Exception as e:
        print(f"Column may already exist or error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    alter()
