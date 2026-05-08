from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Boolean, desc
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from pydantic import BaseModel
import os
import uuid
import json
from datetime import datetime
from PIL import Image
from io import BytesIO
from ultralytics import YOLO
from services.ai_service import ai_service
from services.tts_service import tts_service

# Configuration
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "password")
DB_HOST = os.getenv("DB_HOST", "db")
DB_NAME = os.getenv("DB_NAME", "ielts_oasis")
DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Models
class Vocabulary(Base):
    __tablename__ = "vocabulary"
    id = Column(Integer, primary_key=True, index=True)
    word = Column(String(255), unique=True, index=True)
    meaning = Column(Text)
    phonetic = Column(String(255))
    example = Column(Text)
    audio_url = Column(String(255))
    next_review = Column(DateTime, default=datetime.utcnow)
    is_learned = Column(Boolean, default=False)

Base.metadata.create_all(bind=engine)

def seed_db():
    db = SessionLocal()
    if db.query(Vocabulary).count() == 0:
        starter_words = [
            ("Academic", "Học thuật", "/ˌæk.əˈdem.ɪk/"),
            ("Innovative", "Sáng tạo", "/ˈɪn.ə.veɪ.tɪv/"),
            ("Sustainable", "Bền vững", "/səˈsteɪ.nə.bəl/"),
            ("Evaluate", "Đánh giá", "/ɪˈvæl.ju.eɪt/"),
            ("Significant", "Quan trọng", "/sɪɡˈnɪf.ɪ.kənt/")
        ]
        for word, meaning, phonetic in starter_words:
            v = Vocabulary(word=word, meaning=meaning, phonetic=phonetic)
            db.add(v)
        db.commit()
    db.close()

seed_db()

class VocabIn(BaseModel):
    word: str
    meaning: str = None
    phonetic: str = None

app = FastAPI(title="IELTS Oasis API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

static_dir = "static"
if not os.path.exists(static_dir):
    os.makedirs(static_dir)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

yolo_model = YOLO("yolov8n.pt")

YOLO_TRANSLATIONS = {
    'person': ('Con người', '/ˈpɜː.sən/'), 'bicycle': ('Xe đạp', '/ˈbaɪ.sɪ.kəl/'),
    'car': ('Xe ô tô', '/kɑːr/'), 'motorcycle': ('Xe máy', '/ˈməʊ.tə.saɪ.kəl/'),
    'laptop': ('Máy tính xách tay', '/ˈlæp.tɒp/'), 'mouse': ('Chuột máy tính', '/maʊs/'),
    'cell phone': ('Điện thoại di động', '/ˈsel ˌfəʊn/'), 'tv': ('Tivi', '/ˌtiːˈviː/'),
    'keyboard': ('Bàn phím', '/ˈkiː.bɔːd/'), 'bottle': ('Chai lọ', '/ˈbɒt.əl/'),
    'cup': ('Cái cốc', '/kʌp/'), 'chair': ('Cái ghế', '/tʃeər/'),
    'book': ('Quyển sách', '/bʊk/'), 'clock': ('Đồng hồ', '/klɒk/'),
    'vase': ('Bình hoa', '/vɑːz/'), 'potted plant': ('Chậu cây', '/ˌpɒt.ɪd ˈplɑːnt/')
}

@app.get("/vocabulary")
async def get_vocabulary():
    db = SessionLocal()
    vocabs = db.query(Vocabulary).order_by(desc(Vocabulary.id)).all()
    db.close()
    return vocabs

@app.post("/vocabulary")
async def add_vocabulary(vocab_in: VocabIn):
    db = SessionLocal()
    existing = db.query(Vocabulary).filter(Vocabulary.word == vocab_in.word).first()
    if existing:
        db.close()
        return existing
    
    vocab = Vocabulary(word=vocab_in.word, meaning=vocab_in.meaning, phonetic=vocab_in.phonetic)
    
    # Force AI Refinement if fields are missing
    if not vocab.meaning or not vocab.phonetic or vocab.phonetic == "/.../":
        try:
            data = await ai_service.refine_vocabulary(vocab_in.word)
            vocab.phonetic = data.get("phonetic", vocab.phonetic)
            vocab.meaning = data.get("meaning", vocab.meaning)
            vocab.example = data.get("example", "")
        except: pass

    try:
        audio_file = await tts_service.generate_speech(vocab.word)
        vocab.audio_url = f"/static/{audio_file}"
    except: pass

    db.add(vocab)
    db.commit()
    db.refresh(vocab)
    db.close()
    return vocab

@app.post("/vocabulary/detect")
async def detect_vocabulary(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        img = Image.open(BytesIO(contents)).convert("RGB")
        img_filename = f"{uuid.uuid4()}.jpg"
        img.save(os.path.join(static_dir, img_filename))
        
        results = yolo_model(img)
        detected_items = []
        
        for r in results:
            for box in r.boxes:
                label = yolo_model.names[int(box.cls[0])].lower()
                meaning, phonetic = YOLO_TRANSLATIONS.get(label, (label.capitalize(), "/.../"))
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                w, h = img.size
                detected_items.append({
                    "word": label.capitalize(),
                    "meaning": meaning,
                    "phonetic": phonetic,
                    "box": [x1/w, y1/h, x2/w, y2/h],
                    "confidence": float(box.conf[0])
                })

        if len(detected_items) < 2:
            ai_items = await ai_service.detect_all_objects(img)
            for item in ai_items:
                box = item.get("box", [0.1, 0.1, 0.3, 0.3])
                detected_items.append({
                    "word": item.get("word", "Unknown"),
                    "meaning": item.get("meaning", "Nghĩa"),
                    "phonetic": item.get("phonetic", "/.../"),
                    "box": [box[1], box[0], box[3], box[2]],
                    "confidence": 0.9
                })

        return {"items": detected_items, "image_url": f"/static/{img_filename}"}
    except Exception as e:
        print(f"Detect Error: {e}")
        return {"items": [], "image_url": ""}

@app.post("/tts")
async def text_to_speech(data: dict):
    word = data.get("word")
    if not word: raise HTTPException(status_code=400)
    audio_file = await tts_service.generate_speech(word)
    return {"audio_url": f"/static/{audio_file}"}

@app.post("/writing/analyze")
async def analyze_writing(text: str = Form(...)):
    return await ai_service.analyze_writing(text)

@app.get("/encouragement")
async def get_encouragement():
    msg = await ai_service.get_encouragement()
    return {"message": msg}

@app.delete("/vocabulary/{id}")
async def delete_vocab(id: int):
    db = SessionLocal()
    db.query(Vocabulary).filter(Vocabulary.id == id).delete()
    db.commit()
    db.close()
    return {"ok": True}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
