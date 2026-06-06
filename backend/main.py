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
from models import Vocabulary, WritingLog, User
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

from auth_routes import router as auth_router
from auth_routes import get_current_user
from fastapi import Depends

app = FastAPI(title="IELTS Oasis API")
app.include_router(auth_router)

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
async def get_vocabulary(user: dict = Depends(get_current_user)):
    db = SessionLocal()
    query = db.query(Vocabulary)
    if user:
        query = query.filter(Vocabulary.user_id == user["user_id"])
    vocabs = query.order_by(desc(Vocabulary.id)).all()
    db.close()
    return vocabs

@app.post("/vocabulary")
async def add_vocabulary(vocab_in: VocabIn, user: dict = Depends(get_current_user)):
    db = SessionLocal()
    user_id = user["user_id"] if user else None
    existing = db.query(Vocabulary).filter(
        Vocabulary.word == vocab_in.word,
        Vocabulary.user_id == user_id
    ).first()
    if existing:
        db.close()
        return existing
    
    vocab = Vocabulary(
        user_id=user_id,
        word=vocab_in.word, 
        meaning=vocab_in.meaning, 
        phonetic=vocab_in.phonetic,
        example=vocab_in.example,
        topic=vocab_in.topic or "General",
        synonyms=vocab_in.synonyms or [],
        memory_hook=vocab_in.memory_hook,
        image_url=vocab_in.image_url
    )
    
    # Handle crop if from Matcha Lens (box is present and image_url is a static path)
    if vocab_in.image_url and vocab_in.box and vocab_in.image_url.startswith("/static/"):
        try:
            parent_filename = vocab_in.image_url.replace("/static/", "")
            parent_path = os.path.join(static_dir, parent_filename)
            if os.path.exists(parent_path):
                with Image.open(parent_path) as img:
                    w, h = img.size
                    box = vocab_in.box
                    # box is [xmin, ymin, xmax, ymax]
                    left = int(box[0] * w)
                    top = int(box[1] * h)
                    right = int(box[2] * w)
                    bottom = int(box[3] * h)
                    
                    # Ensure bounds are within image size
                    left = max(0, min(w - 1, left))
                    top = max(0, min(h - 1, top))
                    right = max(left + 1, min(w, right))
                    bottom = max(top + 1, min(h, bottom))
                    
                    cropped = img.crop((left, top, right, bottom))
                    cropped_filename = f"crop-{uuid.uuid4()}.jpg"
                    cropped.save(os.path.join(static_dir, cropped_filename))
                    vocab.image_url = f"/static/{cropped_filename}"
        except Exception as e:
            print(f"Matcha Lens crop failed: {e}")
    
    # Force AI Refinement if fields are missing
    if not vocab.meaning or not vocab.phonetic or vocab.phonetic == "/.../":
        try:
            data = await ai_service.refine_vocabulary(vocab_in.word)
            vocab.word = data.get("word", vocab.word)
            vocab.phonetic = data.get("phonetic", vocab.phonetic)
            vocab.meaning = data.get("meaning", vocab.meaning)
            vocab.example = data.get("example", vocab.example)
            vocab.synonyms = data.get("synonyms", vocab.synonyms)
            vocab.topic = data.get("topic", vocab.topic)
            vocab.memory_hook = data.get("memory_hook", vocab.memory_hook)
        except: pass

    # Fetch image from Unsplash if still empty
    if not vocab.image_url:
        try:
            img_url = await ai_service.search_unsplash_image(vocab.word)
            if img_url:
                vocab.image_url = img_url
        except Exception as e:
            print(f"Unsplash image search failed: {e}")

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

async def process_analysis(task_id: str, content: str, user_id: int = None):
    try:
        result = await ai_service.analyze_writing(content)
        analysis_jobs[task_id] = {"status": "completed", "result": result}
        
        if user_id:
            db = SessionLocal()
            log = WritingLog(
                user_id=user_id,
                content=content,
                feedback=json.dumps(result),
                band_score=str(result.get("band_score", "N/A")),
                word_count=len(content.split())
            )
            db.add(log)
            db.commit()
            db.close()
            
    except Exception as e:
        analysis_jobs[task_id] = {"status": "failed", "error": str(e)}

@app.post("/writing/analyze/start")
async def start_writing_analysis(writing: WritingIn, user: dict = Depends(get_current_user)):
    task_id = str(uuid.uuid4())
    analysis_jobs[task_id] = {"status": "processing"}
    user_id = user["user_id"] if user else None
    asyncio.create_task(process_analysis(task_id, writing.content, user_id))
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
async def delete_vocab(id: int, user: dict = Depends(get_current_user)):
    db = SessionLocal()
    query = db.query(Vocabulary).filter(Vocabulary.id == id)
    if user:
        query = query.filter(Vocabulary.user_id == user["user_id"])
    query.delete()
    db.commit()
    db.close()
    return {"ok": True}

@app.get("/stats")
async def get_stats(user: dict = Depends(get_current_user)):
    db = SessionLocal()
    now = datetime.utcnow()
    
    user_id = user["user_id"] if user else None
    
    query = db.query(Vocabulary)
    if user_id:
        query = query.filter(Vocabulary.user_id == user_id)
        
    # History: last 15 words
    recent_words = query.order_by(desc(Vocabulary.last_reviewed)).limit(15).all()
    history = [{"word": w.word, "meaning": w.meaning, "last_reviewed": w.last_reviewed} for w in recent_words]
    
    # Mastered this week
    one_week_ago = now.timestamp() - (7 * 24 * 60 * 60)
    
    mastered_query = db.query(Vocabulary).filter(
        Vocabulary.mastery_level > 1,
        Vocabulary.last_reviewed >= datetime.fromtimestamp(one_week_ago)
    )
    if user_id:
        mastered_query = mastered_query.filter(Vocabulary.user_id == user_id)
    mastered = mastered_query.count()
    
    # Basic streak calculation based on unique dates of activity
    all_dates_query = db.query(Vocabulary.last_reviewed)
    if user_id:
        all_dates_query = all_dates_query.filter(Vocabulary.user_id == user_id)
    all_dates = all_dates_query.all()
    
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

class RephraseIn(BaseModel):
    content: str
    selected_phrase: str

@app.post("/writing/rephrase")
async def writing_rephrase(payload: RephraseIn):
    try:
        suggestions = await ai_service.get_rephrase_suggestions(payload.content, payload.selected_phrase)
        return {"suggestions": suggestions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/quiz/grammar")
async def quiz_grammar():
    try:
        questions = await ai_service.generate_grammar_questions()
        return {"questions": questions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class YoutubeIn(BaseModel):
    url: str

@app.post("/listening/youtube")
async def listening_youtube(payload: YoutubeIn):
    result = await ai_service.generate_youtube_listening(payload.url)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

class DailyPlanIn(BaseModel):
    topic: str

@app.post("/study-plan/generate")
async def generate_daily_plan(payload: DailyPlanIn):
    result = await ai_service.generate_daily_plan(payload.topic)
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    return result

@app.get("/community/feed")
async def get_community_feed():
    db = SessionLocal()
    
    # Get top 10 vocabularies (most recently added overall or could be by popularity, let's use recently added global for now)
    vocabs = db.query(Vocabulary).order_by(desc(Vocabulary.id)).limit(20).all()
    vocab_list = []
    for v in vocabs:
        user = db.query(User).filter(User.id == v.user_id).first() if v.user_id else None
        vocab_list.append({
            "id": v.id,
            "word": v.word,
            "meaning": v.meaning,
            "phonetic": v.phonetic,
            "username": user.username if user else "Anonymous",
            "avatar_url": user.avatar_url if user else None,
            "image_url": v.image_url
        })
        
    # Get top 10 writings
    writings = db.query(WritingLog).order_by(desc(WritingLog.id)).limit(10).all()
    writing_list = []
    for w in writings:
        user = db.query(User).filter(User.id == w.user_id).first() if w.user_id else None
        writing_list.append({
            "id": w.id,
            "content": w.content[:200] + "..." if len(w.content) > 200 else w.content,
            "full_content": w.content,
            "band_score": w.band_score,
            "username": user.username if user else "Anonymous",
            "avatar_url": user.avatar_url if user else None
        })
        
    db.close()
    return {"vocabularies": vocab_list, "writings": writing_list}

@app.post("/community/convert/{writing_id}")
async def convert_writing_to_lesson(writing_id: int):
    db = SessionLocal()
    writing = db.query(WritingLog).filter(WritingLog.id == writing_id).first()
    db.close()
    if not writing:
        raise HTTPException(status_code=404, detail="Writing not found")
        
    result = await ai_service.generate_lesson_from_writing(writing.content)
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
        
    # Generate TTS for the writing content so they can practice listening
    audio_file = await tts_service.generate_speech(writing.content)
    result["audio_url"] = f"/static/{audio_file}"
    
    return result

@app.get("/listening/mock-test")
async def get_listening_mock_test():
    # Simulate an IELTS listening test payload
    context_text = "Hello, this is Peter. I am calling to apply for the Receptionist job. I will make sure to bring my passport to the interview tomorrow."
    audio_file = "matcha-default.jpg"
    try:
        audio_file = await tts_service.generate_speech(context_text)
    except:
        pass
    
    return {
        "title": "Cambridge IELTS 16 - Test 1 - Part 1",
        "context": "A phone conversation between a man and a woman about a part-time job.",
        "audio_url": f"/static/{audio_file}", 
        "questions": [
            {
                "id": 1,
                "type": "fill_in_the_blank",
                "text": "The man's first name is _______.",
                "answer": "Peter"
            },
            {
                "id": 2,
                "type": "multiple_choice",
                "text": "What type of job is he applying for?",
                "options": ["Waiter", "Receptionist", "Cleaner"],
                "answer": "Receptionist"
            },
            {
                "id": 3,
                "type": "fill_in_the_blank",
                "text": "He needs to bring his _______ to the interview.",
                "answer": "passport"
            }
        ]
    }

@app.get("/reading/mock-test")
async def get_reading_mock_test():
    # Simulate an IELTS reading test payload
    return {
        "title": "The History of Matcha",
        "content": "Matcha is a finely ground powder of specially grown and processed green tea leaves, traditionally consumed in East Asia.\n\nThe green tea plants used for matcha are shade-grown for three to four weeks before harvest; the stems and veins are removed in processing.\n\nDuring shaded growth, the plant Camellia sinensis produces more theanine and caffeine. This combination of chemicals is considered to account for the calm energy people might feel from drinking matcha.\n\nMatcha has seen a huge surge in popularity worldwide in recent years, often used in lattes, desserts, and health drinks.",
        "questions": [
            {
                "id": 1,
                "type": "multiple_choice",
                "text": "How long are the tea plants shade-grown before harvest?",
                "options": ["1-2 weeks", "3-4 weeks", "5-6 weeks", "They are not shade-grown"],
                "answer": "3-4 weeks"
            },
            {
                "id": 2,
                "type": "fill_in_the_blank",
                "text": "The combination of theanine and _______ creates a calm energy.",
                "answer": "caffeine"
            },
            {
                "id": 3,
                "type": "multiple_choice",
                "text": "Matcha is NOT commonly used in:",
                "options": ["Lattes", "Desserts", "Health drinks", "Fried chicken"],
                "answer": "Fried chicken"
            }
        ]
    }

class ReadingGenIn(BaseModel):
    text: str

class ListeningGenIn(BaseModel):
    text: str

@app.post("/listening/generate-from-text")
async def generate_listening_from_text_endpoint(payload: ListeningGenIn):
    result = await ai_service.generate_listening_from_text(payload.text)
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
        
    try:
        audio_file = await tts_service.generate_speech(payload.text)
        result["audio_url"] = f"/static/{audio_file}"
    except Exception as e:
        print(f"TTS failed for listening generation: {e}")
        
    return result

@app.post("/reading/generate")
async def generate_reading_test(payload: ReadingGenIn):
    result = await ai_service.generate_reading_questions(payload.text)
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
