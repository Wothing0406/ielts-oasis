from database import engine
from sqlalchemy import text

def alter_table():
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE writing_logs ADD COLUMN user_id INT;"))
            conn.commit()
            print("Successfully added user_id column to writing_logs!")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    alter_table()
