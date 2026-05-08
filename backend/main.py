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
from datetime import datetime, timedelta
from PIL import Image
from io import BytesIO
from ultralytics import YOLO
from services.ai_service import ai_service
from services.tts_service import tts_service

from database import SessionLocal, engine, Base
from models import Vocabulary
from schemas import VocabIn

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

# VocabIn is imported from schemas

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

import asyncio

analysis_jobs = {}

class WritingIn(BaseModel):
    content: str

async def process_analysis(task_id: str, content: str):
    try:
        result = await ai_service.analyze_writing(content)
        analysis_jobs[task_id] = {"status": "completed", "result": result}
    except Exception as e:
        analysis_jobs[task_id] = {"status": "failed", "error": str(e)}

@app.post("/writing/analyze/start")
async def start_writing_analysis(writing: WritingIn):
    task_id = str(uuid.uuid4())
    analysis_jobs[task_id] = {"status": "processing"}
    asyncio.create_task(process_analysis(task_id, writing.content))
    return {"task_id": task_id}

@app.get("/writing/analyze/status/{task_id}")
async def get_analysis_status(task_id: str):
    job = analysis_jobs.get(task_id)
    if not job:
        raise HTTPException(status_code=404, detail="Task not found")
    return job

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

@app.get("/stats")
async def get_stats():
    db = SessionLocal()
    now = datetime.utcnow()
    
    # History: last 15 words
    recent_words = db.query(Vocabulary).order_by(desc(Vocabulary.last_reviewed)).limit(15).all()
    history = [{"word": w.word, "meaning": w.meaning, "last_reviewed": w.last_reviewed} for w in recent_words]
    
    # Mastered this week
    one_week_ago = now.timestamp() - (7 * 24 * 60 * 60)
    mastered = db.query(Vocabulary).filter(
        Vocabulary.mastery_level > 1,
        Vocabulary.last_reviewed >= datetime.fromtimestamp(one_week_ago)
    ).count()
    
    # Basic streak calculation based on unique dates of activity
    all_dates = db.query(Vocabulary.last_reviewed).all()
    unique_dates = sorted(list(set([d[0].date() for d in all_dates if d[0]])), reverse=True)
    
    streak = 0
    current_date = now.date()
    for d in unique_dates:
        if d == current_date or (streak == 0 and (current_date - d).days == 1):
            streak += 1
            current_date = d - timedelta(days=1)
        elif (current_date - d).days > 1:
            break
            
    if streak == 0 and len(unique_dates) > 0 and (now.date() - unique_dates[0]).days == 1:
        streak = 1 # Played yesterday, streak is alive
        
    db.close()
    
    return {
        "streak": max(1, streak) if len(unique_dates) > 0 else 0,
        "mastered_this_week": mastered,
        "history": history
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
