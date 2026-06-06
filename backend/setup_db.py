from database import engine, Base
from models import *
from main import seed_db

print("Creating tables...")
Base.metadata.create_all(bind=engine)
print("Tables created.")
try:
    seed_db()
    print("Database seeded.")
except Exception as e:
    print("Seed failed:", e)
