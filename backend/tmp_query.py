from database import SessionLocal
from models import Vocabulary
db = SessionLocal()
results = db.query(Vocabulary).all()
print(f"TOTAL VOCABULARY COUNT: {len(results)}")
print("FIRST 100 RECORDS:")
for v in results[:100]:
    print(f"ID: {v.id} | Word: {v.word} | UserID: {v.user_id} | Meaning: {v.meaning} | Global: {v.is_global}")
