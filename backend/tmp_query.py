from database import SessionLocal
from models import Vocabulary, User
db = SessionLocal()
print("USERS:")
for u in db.query(User).all():
    print(f"ID: {u.id} | Username: {u.username}")

print("\nVOCABULARY FOR OTHER USERS:")
for v in db.query(Vocabulary).filter(Vocabulary.user_id != 1).all():
    print(f"ID: {v.id} | Word: {v.word} | UserID: {v.user_id} | Meaning: {v.meaning} | Global: {v.is_global} | Topic: {v.topic}")
