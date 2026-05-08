from sqlalchemy import create_engine, text
from database import engine

def nuke_db():
    print("Nuking database...")
    with engine.connect() as conn:
        try:
            conn.execute(text("DROP TABLE IF EXISTS vocabulary"))
            conn.execute(text("DROP TABLE IF EXISTS writing_logs"))
            conn.execute(text("DROP TABLE IF EXISTS image_store"))
            conn.commit()
            print("Tables dropped successfully!")
        except Exception as e:
            print(f"Drop failed: {e}")

if __name__ == "__main__":
    nuke_db()
