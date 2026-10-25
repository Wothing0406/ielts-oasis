"""Local-only visual test fixture. Uses an in-memory database; never imports main.

Run from repo root:
python -m uvicorn meowcha_preview:app --app-dir backend/tests --host 127.0.0.1 --port 8124
The fixture reproduces the game's iframe/sandbox. It is not the Next.js app or its
Cloudflare verification flow, which must be validated separately on a valid host.
"""
import os
import sys
from pathlib import Path

os.environ['DATABASE_URL'] = 'sqlite://'
root = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(root / 'backend'))

from fastapi import FastAPI
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from database import Base, get_db
from meowcha_routes import router
from models import User, MeowchaLeaderboard

engine = create_engine('sqlite://', connect_args={'check_same_thread': False}, poolclass=StaticPool)
Base.metadata.create_all(engine)
Session = sessionmaker(bind=engine)
with Session() as qa_db:
    qa_user = User(id=7001, username='Tiên Hữu QA', discord_id='local-qa-only',
        avatar_url='https://cdn.discordapp.com/embed/avatars/0.png')
    qa_db.add(qa_user)
    qa_db.flush()
    qa_db.add(MeowchaLeaderboard(user_id=qa_user.id, player_name=qa_user.username,
        score=12345, words_slain=80, wpm=30, realm='Kim Đan Kỳ'))
    qa_db.commit()


def isolated_db():
    with Session() as db:
        yield db


app = FastAPI()
app.dependency_overrides[get_db] = isolated_db
app.include_router(router)


@app.get('/preview/meowcha', response_class=HTMLResponse)
def preview():
    return '''<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;background:#100d12"><main style="position:fixed;inset:0;height:100dvh;overflow:hidden">
    <iframe src="/meowcha/index.html?v=14.1" title="Meowcha IELTS Game"
    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
    allow="autoplay; fullscreen; clipboard-write" style="border:0;width:100%;height:100%;display:block"></iframe>
    <script>addEventListener('message', event => {
      const frame = document.querySelector('iframe');
      if (event.origin === location.origin && event.source === frame.contentWindow &&
          event.data?.type === 'MEOWCHA_NAVIGATE' && event.data.path === '/games') location.assign('/games');
    });</script>
    </main></body></html>'''


@app.get('/preview/meowcha-qa', response_class=HTMLResponse)
def qa_preview():
    return (Path(__file__).with_name('meowcha_qa.html')).read_text(encoding='utf-8')


@app.post('/api/tts')
async def fixture_pronunciation(data: dict):
    # Fixture adapter only; production already owns /tts. No production DB call.
    # Optional QA artifact obtained from the real website TTS (never committed).
    # Without it this route intentionally returns 404 and exercises failure UI.
    return {'audio_url': '/preview/qa-jade.mp3'}


@app.get('/preview/qa-jade.mp3')
def fixture_generated_voice():
    return FileResponse(root / 'artifacts/meowcha-qa/jade-tts.mp3', media_type='audio/mpeg')


@app.get('/games', response_class=HTMLResponse)
def preview_games_hub():
    return '<h1>Sảnh trò chơi — trang đích kiểm thử điều hướng iframe</h1>'


app.mount('/', StaticFiles(directory=root / 'frontend/public', html=True), name='public')
