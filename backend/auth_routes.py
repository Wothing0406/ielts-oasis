import os
import httpx
import jwt
import uuid
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import asyncio
from database import SessionLocal
from models import User, Vocabulary
from fastapi.security import OAuth2PasswordBearer

router = APIRouter(prefix="/auth", tags=["auth"])

class GuestLogin(BaseModel):
    username: str
    guest_id: str = None

@router.post("/guest")
async def guest_login(payload: GuestLogin):
    db = SessionLocal()
    guest_id = payload.guest_id
    username = payload.username.strip()
    
    if not username:
        raise HTTPException(status_code=400, detail="Tên người dùng không được để trống")
        
    is_new_user = False
    
    # If they have a guest_id, try to find them
    if guest_id:
        user = db.query(User).filter(User.discord_id == guest_id).first()
        if not user:
            # If guest_id not found, create one
            user = User(discord_id=guest_id, username=username)
            db.add(user)
            is_new_user = True
        else:
            # Update username if they changed it
            user.username = username
            user.last_login = datetime.utcnow()
    else:
        # Create a brand new guest user
        guest_id = f"guest-{uuid.uuid4()}"
        user = User(discord_id=guest_id, username=username)
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
    
    db.close()
    
    return {
        "token": token,
        "user": jwt_payload,
        "guest_id": guest_id
    }

DISCORD_CLIENT_ID = os.getenv("DISCORD_CLIENT_ID")
DISCORD_CLIENT_SECRET = os.getenv("DISCORD_CLIENT_SECRET")
# Lấy url từ frontend để chuyển hướng về
DISCORD_REDIRECT_URI = os.getenv("DISCORD_REDIRECT_URI", "http://localhost:3000/auth/callback")
JWT_SECRET = os.getenv("JWT_SECRET", "super-secret-key-change-me")
JWT_ALGORITHM = "HS256"

import urllib.parse

@router.get("/discord/login")
def discord_login(redirect_uri: str = None):
    uri = redirect_uri if redirect_uri else DISCORD_REDIRECT_URI
    encoded_uri = urllib.parse.quote(uri, safe='')
    url = f"https://discord.com/oauth2/authorize?client_id={DISCORD_CLIENT_ID}&redirect_uri={encoded_uri}&response_type=code&scope=identify%20email%20guilds.join"
    return {"url": url}

class AuthCode(BaseModel):
    code: str
    redirect_uri: str = None

@router.post("/discord/callback")
async def discord_callback(payload: AuthCode):
    if not DISCORD_CLIENT_ID or not DISCORD_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="Discord OAuth2 not configured in .env")
        
    data = {
        'client_id': DISCORD_CLIENT_ID,
        'client_secret': DISCORD_CLIENT_SECRET,
        'grant_type': 'authorization_code',
        'code': payload.code,
        'redirect_uri': payload.redirect_uri if payload.redirect_uri else DISCORD_REDIRECT_URI
    }
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    
    async with httpx.AsyncClient() as client:
        # Get Token
        r = await client.post('https://discord.com/api/oauth2/token', data=data, headers=headers)
        if r.status_code != 200:
            print("Token error:", r.text)
            raise HTTPException(status_code=400, detail="Invalid code")
        
        token_info = r.json()
        access_token = token_info.get("access_token")
        
        # Get User Info
        headers = {"Authorization": f"Bearer {access_token}"}
        r_user = await client.get("https://discord.com/api/users/@me", headers=headers)
        if r_user.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get user info")
            
        user_info = r_user.json()
        
    # DB Operations
    db = SessionLocal()
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
    discord_guild_id = os.getenv("DISCORD_GUILD_ID")
    
    if discord_bot_token:
        async def send_welcome_and_join_guild():
            try:
                async with httpx.AsyncClient() as client:
                    headers = {
                        "Authorization": f"Bot {discord_bot_token}",
                        "Content-Type": "application/json"
                    }
                    
                    # 1. Add user to Guild (Auto join server)
                    if discord_guild_id and access_token:
                        payload = {"access_token": access_token}
                        res = await client.put(
                            f"https://discord.com/api/v10/guilds/{discord_guild_id}/members/{discord_id}",
                            headers=headers,
                            json=payload
                        )
                        if res.status_code in (201, 204):
                            print("User added to guild successfully.")
                        else:
                            print(f"Failed to add user to guild: {res.status_code} {res.text}")
                    
                    # Wait a bit for Discord to process the guild join before DMing
                    await asyncio.sleep(2)
                    
                    # 2. Send Welcome DM
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
    
    db.close()
    
    return {"token": token, "user": jwt_payload}

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token", auto_error=False)

def get_current_user(token: str = Depends(oauth2_scheme)):
    if not token:
        return None
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except:
        return None
