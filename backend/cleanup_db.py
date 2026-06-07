import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine, SessionLocal, Base
from models import Vocabulary

def cleanup():
    # 1. Ensure all tables are created (creates new tables if any are missing)
    print("Checking and creating any missing tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # 2. Find duplicates in the vocabulary table
        print("Finding duplicate vocabularies...")
        vocabularies = db.query(Vocabulary).order_by(Vocabulary.id.asc()).all()
        
        seen = {}
        duplicates_count = 0
        
        for vocab in vocabularies:
            key = (vocab.user_id, vocab.word.strip().lower())
            if key in seen:
                # This is a duplicate! Delete it.
                db.delete(vocab)
                duplicates_count += 1
            else:
                seen[key] = vocab.id
                
        if duplicates_count > 0:
            db.commit()
            print(f"Successfully deleted {duplicates_count} duplicate vocabulary records!")
        else:
            print("No duplicate vocabulary records found.")
            
    except Exception as e:
        db.rollback()
        print(f"Error occurred: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    cleanup()
