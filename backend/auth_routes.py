import os
import httpx
import jwt
import uuid
import re
import random
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
import asyncio
from database import SessionLocal, get_db
from sqlalchemy.orm import Session
from models import User, Vocabulary
from fastapi.security import OAuth2PasswordBearer

router = APIRouter(prefix="/auth", tags=["auth"])

class GuestLogin(BaseModel):
    username: str
    guest_id: str = None

def clean_and_validate_username(username: str) -> str:
    cleaned = username.strip().lower()
    # Allow only lowercase letters, numbers, underscores, and dots (like Instagram)
    if not re.match(r"^[a-z0-9_\.]+$", cleaned):
        raise HTTPException(
            status_code=400, 
            detail="Tên người dùng chỉ được chứa chữ cái thường không dấu, số, dấu gạch dưới (_) và dấu chấm (.)."
        )
    if len(cleaned) < 3 or len(cleaned) > 20:
        raise HTTPException(
            status_code=400, 
            detail="Tên người dùng phải từ 3 đến 20 ký tự."
        )
    return cleaned

def generate_unique_guest_username(base_name: str, db: Session) -> str:
    # If the username is not taken, use it
    existing = db.query(User).filter(User.username == base_name).first()
    if not existing:
        return base_name
        
    # If taken, generate a random 4-digit tag
    for _ in range(50):
        tag = random.randint(1000, 9999)
        candidate = f"{base_name}#{tag}"
        existing_candidate = db.query(User).filter(User.username == candidate).first()
        if not existing_candidate:
            return candidate
            
    return f"{base_name}#{random.randint(10000, 99999)}"

@router.post("/guest")
async def guest_login(payload: GuestLogin, request: Request, db: Session = Depends(get_db)):
    guest_id = payload.guest_id
    raw_username = payload.username.strip()
    
    if not raw_username:
        raise HTTPException(status_code=400, detail="Tên người dùng không được để trống")
        
    username = clean_and_validate_username(raw_username)
    is_new_user = False
    
    user = None
    # If they have a guest_id, try to find them
    if guest_id:
        user = db.query(User).filter(User.discord_id == guest_id).first()
        if user:
            # Update username if they changed it (ignoring the tag suffix comparison)
            current_base = user.username.split("#")[0] if "#" in user.username else user.username
            if current_base != username:
                user.username = generate_unique_guest_username(username, db)
            user.last_login = datetime.utcnow()
            user.last_ip = request.client.host if request.client else None

    # If guest_id not found or not provided, check if the exact username already exists
    if not user:
        user = db.query(User).filter(User.username == username).first()
        if user:
            # Found existing user with this exact username, reuse it!
            guest_id = user.discord_id
            user.last_login = datetime.utcnow()
            user.last_ip = request.client.host if request.client else None

    if not user:
        # Create a brand new guest user
        if not guest_id:
            guest_id = f"guest-{uuid.uuid4()}"
        unique_username = generate_unique_guest_username(username, db)
        user = User(
            discord_id=guest_id, 
            username=unique_username,
            last_ip=request.client.host if request.client else None
        )
        db.add(user)
        is_new_user = True
        
    db.commit()
    db.refresh(user)
    
    # Copy starter words for new guests
    if is_new_user:
        try:
            starter_vocabs = db.query(Vocabulary).filter(Vocabulary.is_global == True).all()
            for sv in starter_vocabs:
                user_v = Vocabulary(
                    user_id=user.id,
                    word=sv.word,
                    meaning=sv.meaning,
                    phonetic=sv.phonetic,
                    example=sv.example,
                    topic=sv.topic,
                    audio_url=sv.audio_url,
                    image_url=sv.image_url,
                    synonyms=sv.synonyms,
                    memory_hook=sv.memory_hook,
                    is_global=False,
                    source=sv.source,
                    creator_username=sv.creator_username
                )
                db.add(user_v)
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"Failed to copy starter vocabs for guest: {e}")
            
    # Generate JWT
    jwt_payload = {
        "user_id": user.id,
        "discord_id": user.discord_id,  # Will be "guest-..."
        "username": user.username,
        "avatar_url": None,
        "exp": datetime.utcnow() + timedelta(days=7)
    }
    token = jwt.encode(jwt_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    
    return {
        "token": token,
        "user": jwt_payload,
        "guest_id": guest_id
    }

DISCORD_CLIENT_ID = os.getenv("DISCORD_CLIENT_ID")
DISCORD_CLIENT_SECRET = os.getenv("DISCORD_CLIENT_SECRET")
# Lấy url từ frontend để chuyển hướng về
DISCORD_REDIRECT_URI = os.getenv("DISCORD_REDIRECT_URI", "http://localhost:3000/auth/callback")

# Secure JWT secret loading
JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    import logging
    logging.getLogger("uvicorn").warning("JWT_SECRET environment variable is not set. Using a fallback secret key, please set JWT_SECRET in production!")
    JWT_SECRET = "super-secret-key-change-me-safely"

JWT_ALGORITHM = "HS256"

import urllib.parse
import hmac
import hashlib
import time

def generate_state():
    timestamp = str(int(time.time()))
    signature = hmac.new(JWT_SECRET.encode(), timestamp.encode(), hashlib.sha256).hexdigest()
    return f"{timestamp}.{signature}"

def verify_state(state: str):
    if not state or "." not in state:
        return False
    try:
        timestamp, signature = state.split(".", 1)
        if int(time.time()) - int(timestamp) > 600:  # 10 minutes expiry
            return False
        expected_sig = hmac.new(JWT_SECRET.encode(), timestamp.encode(), hashlib.sha256).hexdigest()
        return hmac.compare_digest(signature, expected_sig)
    except:
        return False

@router.get("/discord/login")
def discord_login(redirect_uri: str = None):
    uri = redirect_uri if redirect_uri else DISCORD_REDIRECT_URI
    encoded_uri = urllib.parse.quote(uri, safe='')
    state = generate_state()
    url = f"https://discord.com/oauth2/authorize?client_id={DISCORD_CLIENT_ID}&redirect_uri={encoded_uri}&response_type=code&scope=identify%20email&state={state}"
    return {"url": url, "state": state}

class AuthCode(BaseModel):
    code: str
    redirect_uri: str = None
    state: str = None

@router.post("/discord/callback")
async def discord_callback(payload: AuthCode, db: Session = Depends(get_db)):
    if not verify_state(payload.state):
        raise HTTPException(status_code=400, detail="Invalid or expired OAuth2 state parameter")
    if not DISCORD_CLIENT_ID or not DISCORD_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="Discord OAuth2 not configured in .env")
        
    data = {
        'client_id': DISCORD_CLIENT_ID,
        'client_secret': DISCORD_CLIENT_SECRET,
        'grant_type': 'authorization_code',
        'code': payload.code,
        'redirect_uri': payload.redirect_uri if payload.redirect_uri else DISCORD_REDIRECT_URI
    }
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    
    # Store access_token for optional use (we no longer force joining guild)
    access_token = None
    async with httpx.AsyncClient() as client:
        r = await client.post('https://discord.com/api/oauth2/token', data=data, headers=headers)
        if r.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get Discord access token")
            
        token_info = r.json()
        access_token = token_info.get("access_token")
        
        headers = {"Authorization": f"Bearer {access_token}"}
        r_user = await client.get("https://discord.com/api/users/@me", headers=headers)
        if r_user.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get user info")
            
        user_info = r_user.json()
        
    # DB Operations (db is injected)
    discord_id = user_info.get("id")
    username = user_info.get("username")
    avatar_hash = user_info.get("avatar")
    avatar_url = f"https://cdn.discordapp.com/avatars/{discord_id}/{avatar_hash}.png" if avatar_hash else None
    
    user = db.query(User).filter(User.discord_id == discord_id).first()
    is_new_user = False
    if not user:
        user = User(discord_id=discord_id, username=username, avatar_url=avatar_url)
        db.add(user)
        is_new_user = True
    else:
        user.username = username
        user.avatar_url = avatar_url
        user.last_login = datetime.utcnow()
        
    db.commit()
    db.refresh(user)

    if is_new_user:
        try:
            starter_vocabs = db.query(Vocabulary).filter(Vocabulary.is_global == True).all()
            for sv in starter_vocabs:
                user_v = Vocabulary(
                    user_id=user.id,
                    word=sv.word,
                    meaning=sv.meaning,
                    phonetic=sv.phonetic,
                    example=sv.example,
                    topic=sv.topic,
                    audio_url=sv.audio_url,
                    image_url=sv.image_url,
                    synonyms=sv.synonyms,
                    memory_hook=sv.memory_hook,
                    is_global=False,
                    source=sv.source,
                    creator_username=sv.creator_username
                )
                db.add(user_v)
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"Failed to copy starter vocabs: {e}")
    
    discord_bot_token = os.getenv("DISCORD_BOT_TOKEN")
    
    if discord_bot_token:
        async def send_welcome_and_join_guild():
            try:
                async with httpx.AsyncClient() as client:
                    headers = {
                        "Authorization": f"Bot {discord_bot_token}",
                        "Content-Type": "application/json"
                    }
                    
                    # 1. Send Welcome DM
                    dm_res = await client.post(
                        "https://discord.com/api/v10/users/@me/channels",
                        headers=headers,
                        json={"recipient_id": discord_id}
                    )
                    if dm_res.status_code == 200:
                        channel_id = dm_res.json().get("id")
                        msg = "Chào mừng bạn đến với IELTS Oasis! Tài khoản của bạn đã được đăng ký thành công. 🍵" if is_new_user else "Bạn đã đăng nhập thành công vào hệ thống IELTS Oasis! Chúc bạn học tốt nhé! 🍵"
                        await client.post(
                            f"https://discord.com/api/v10/channels/{channel_id}/messages",
                            headers=headers,
                            json={"content": msg}
                        )
                    else:
                        print(f"Failed to create DM channel: {dm_res.status_code} {dm_res.text}")
            except Exception as e:
                print(f"Failed to process welcome flow: {e}")
        
        asyncio.create_task(send_welcome_and_join_guild())
    
    # Generate JWT
    jwt_payload = {
        "user_id": user.id,
        "discord_id": user.discord_id,
        "username": user.username,
        "avatar_url": user.avatar_url,
        "exp": datetime.utcnow() + timedelta(days=7)
    }
    token = jwt.encode(jwt_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    
    return {"token": token, "user": jwt_payload}

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token", auto_error=False)

def get_current_user(token: str = Depends(oauth2_scheme)):
    if not token:
        return None
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token không hợp lệ. Vui lòng đăng nhập lại.")
    except Exception:
        raise HTTPException(status_code=401, detail="Không thể xác thực người dùng.")
