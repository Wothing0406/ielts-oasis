from database import SessionLocal
from models import Vocabulary
db = SessionLocal()
results = db.query(Vocabulary).filter(Vocabulary.word.like('innovative%')).all()
print("QUERY RESULTS:")
for v in results:
    print(f"ID: {v.id} | Word: {v.word} | UserID: {v.user_id} | Meaning: {v.meaning} | Global: {v.is_global}")
