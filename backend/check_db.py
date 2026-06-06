from database import engine, Base
from models import Vocabulary
print("Creating Vocabulary table...")
Vocabulary.__table__.create(engine, checkfirst=True)
print("Created.")
