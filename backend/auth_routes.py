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

# Secure JWT secret loading
JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    import logging
    logging.getLogger("uvicorn").warning("JWT_SECRET environment variable is not set. Using a fallback secret key, please set JWT_SECRET in production!")
    JWT_SECRET = "super-secret-key-change-me-safely"

JWT_ALGORITHM = "HS256"

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

class RegisterPayload(BaseModel):
    username: str
    password: str
    captcha_token: str

class LoginPayload(BaseModel):
    username: str
    password: str
    captcha_token: str

import hashlib
import collections
import time

def hash_password(password: str) -> str:
    salt = os.urandom(16)
    db_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
    return salt.hex() + ":" + db_hash.hex()

def verify_password(password: str, hashed: str) -> bool:
    if not hashed:
        return False
    try:
        salt_hex, hash_hex = hashed.split(":")
        salt = bytes.fromhex(salt_hex)
        db_hash = bytes.fromhex(hash_hex)
        new_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
        return new_hash == db_hash
    except Exception:
        return False

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

def get_client_ip(request: Request) -> str:
    # CF-Connecting-IP
    cf_ip = request.headers.get("cf-connecting-ip")
    if cf_ip:
        return cf_ip
    # X-Forwarded-For
    x_forwarded = request.headers.get("x-forwarded-for")
    if x_forwarded:
        return x_forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"

async def verify_turnstile_captcha(token: str, remote_ip: str = None) -> bool:
    secret_key = os.getenv("TURNSTILE_SECRET_KEY", "1x000000000000000000000000000000000")
    url = "https://challenges.cloudflare.com/turnstile/v0/siteverify"
    data = {
        "secret": secret_key,
        "response": token
    }
    if remote_ip:
        data["remoteip"] = remote_ip
    try:
        async with httpx.AsyncClient() as client:
            res = await client.post(url, data=data)
            if res.status_code == 200:
                result = res.json()
                return result.get("success", False)
    except Exception as e:
        print(f"Turnstile verification failed: {e}")
    return False

# In-memory IP rate limiter cache
rate_limit_cache = {
    "register": collections.defaultdict(list),
    "login": collections.defaultdict(list)
}

def check_rate_limit(ip: str, action: str, limit: int, window_seconds: int):
    now = time.time()
    history = rate_limit_cache[action][ip]
    history = [ts for ts in history if now - ts < window_seconds]
    rate_limit_cache[action][ip] = history
    if len(history) >= limit:
        return False
    rate_limit_cache[action][ip].append(now)
    return True

@router.get("/register")
def get_register_guideline():
    return {"message": "Endpoint này yêu cầu phương thức POST chứa payload đăng ký (username, password, captcha_token)."}

@router.post("/register")
async def register_user(payload: RegisterPayload, request: Request, db: Session = Depends(get_db)):
    ip = get_client_ip(request)
    
    # 1. IP rate limiting (max 5 registrations per hour)
    if not check_rate_limit(ip, "register", limit=5, window_seconds=3600):
        raise HTTPException(
            status_code=429,
            detail="Bạn đã đăng ký quá nhiều lần từ IP này. Vui lòng thử lại sau 1 giờ!"
        )

    # 2. Cloudflare Turnstile verification
    if not await verify_turnstile_captcha(payload.captcha_token, remote_ip=ip):
        raise HTTPException(
            status_code=400,
            detail="Xác thực Captcha Turnstile không thành công. Hãy thử lại."
        )

    raw_username = payload.username.strip()
    raw_password = payload.password.strip()
    
    if not raw_username or not raw_password:
        raise HTTPException(status_code=400, detail="Tên đăng nhập và mật khẩu không được để trống")
        
    username = clean_and_validate_username(raw_username)
    if len(raw_password) < 6:
        raise HTTPException(status_code=400, detail="Mật khẩu phải có ít nhất 6 ký tự.")
        
    # Check if user already exists
    existing = db.query(User).filter(User.username == username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Tên đăng nhập đã tồn tại. Vui lòng chọn tên khác.")
        
    guest_id = f"guest-{uuid.uuid4()}"
    hashed_pwd = hash_password(raw_password)
    
    user = User(
        discord_id=guest_id,
        username=username,
        password_hash=hashed_pwd,
        last_ip=ip
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Copy starter words
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
        
    return {"message": "Đăng ký tài khoản thành công!", "username": username}

@router.get("/login")
def get_login_guideline():
    return {"message": "Endpoint này yêu cầu phương thức POST chứa payload đăng nhập (username, password, captcha_token)."}

@router.post("/login")
async def login_user(payload: LoginPayload, request: Request, db: Session = Depends(get_db)):
    ip = get_client_ip(request)
    
    # 1. IP rate limiting (max 10 logins per 5 minutes)
    if not check_rate_limit(ip, "login", limit=10, window_seconds=300):
        raise HTTPException(
            status_code=429,
            detail="Bạn đã thử đăng nhập quá nhiều lần. Vui lòng thử lại sau 5 phút!"
        )

    # 2. Cloudflare Turnstile verification
    if not await verify_turnstile_captcha(payload.captcha_token, remote_ip=ip):
        raise HTTPException(
            status_code=400,
            detail="Xác thực Captcha Turnstile không thành công. Hãy thử lại."
        )

    raw_username = payload.username.strip()
    raw_password = payload.password.strip()
    
    if not raw_username or not raw_password:
        raise HTTPException(status_code=400, detail="Tên đăng nhập và mật khẩu không được để trống")
        
    username = raw_username.lower()
    user = db.query(User).filter(User.username == username).first()
    
    if not user or not user.password_hash or not verify_password(raw_password, user.password_hash):
        raise HTTPException(status_code=401, detail="Tên đăng nhập hoặc mật khẩu không chính xác.")
        
    user.last_login = datetime.utcnow()
    user.last_ip = ip
    db.commit()
    
    # Generate JWT
    jwt_payload = {
        "user_id": user.id,
        "discord_id": user.discord_id,
        "username": user.username,
        "avatar_url": user.avatar_url,
        "exp": datetime.utcnow() + timedelta(days=7)
    }
    token = jwt.encode(jwt_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    
    return {
        "token": token,
        "user": jwt_payload,
        "guest_id": user.discord_id
    }

@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Phiên đăng nhập đã hết hạn hoặc không hợp lệ.")
    return current_user

DISCORD_CLIENT_ID = os.getenv("DISCORD_CLIENT_ID")
DISCORD_CLIENT_SECRET = os.getenv("DISCORD_CLIENT_SECRET")
# Lấy url từ frontend để chuyển hướng về
DISCORD_REDIRECT_URI = os.getenv("DISCORD_REDIRECT_URI", "http://localhost:3000/auth/callback")

# JWT settings defined at the top

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

# End of auth routes
