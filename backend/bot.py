import os
import discord
from discord.ext import commands
from discord import app_commands
from dotenv import load_dotenv
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from database import SessionLocal
from models import User, Vocabulary, WritingLog, DiscordSchedule, AbsenceLog
from datetime import datetime
from services.ai_service import ai_service
import asyncio
from logger import setup_logger
import json

logger = setup_logger("discord_bot")

load_dotenv()

DISCORD_BOT_TOKEN = os.getenv("DISCORD_BOT_TOKEN")

intents = discord.Intents.default()
intents.message_content = True

bot = commands.Bot(command_prefix='/', intents=intents)

# State storage for advisory flow
# user_id -> { "state": "STATE_ASK_INFO", "topic": "...", "test_question": "..." }
user_states = {}

@bot.event
async def on_ready():
    logger.info(f'Logged in as {bot.user} (ID: {bot.user.id})')
    logger.info('------')
    
    # Sync slash commands
    try:
        synced = await bot.tree.sync()
        logger.info(f"Synced {len(synced)} command(s)")
    except Exception as e:
        logger.error(f"Failed to sync commands: {e}")

    # Setup apscheduler for dynamic reminders
    scheduler = AsyncIOScheduler()
    # Runs every minute to check schedule matches
    scheduler.add_job(schedule_checker_job, IntervalTrigger(minutes=1))
    scheduler.start()
    logger.info("APScheduler started: Checking schedules every minute.")

@bot.event
async def on_message(message):
    if message.author.bot:
        return
        
    await bot.process_commands(message)
    
    is_reply_to_bot = False
    if message.reference and message.reference.message_id:
        try:
            ref_msg = await message.channel.fetch_message(message.reference.message_id)
            if ref_msg.author.id == bot.user.id:
                is_reply_to_bot = True
        except:
            pass
            
    discord_id = str(message.author.id)
    in_conversation = False
    if discord_id in user_states:
        state_channel = user_states[discord_id].get("channel_id")
        if not state_channel or state_channel == message.channel.id or isinstance(message.channel, discord.DMChannel):
            in_conversation = True
            
    if isinstance(message.channel, discord.DMChannel) or bot.user in message.mentions or is_reply_to_bot or in_conversation:
        if message.content.startswith('/'):
            return
            
        content = message.content.replace(f'<@{bot.user.id}>', '').strip()
        
        # Handle Conversation States
        if discord_id in user_states:
            state_data = user_states[discord_id]
            state = state_data.get("state")
            
            if state == "STATE_ASK_INFO":
                async with message.channel.typing():
                    try:
                        q_prompt = f"Học viên nói: {content}. Đưa ra 1 câu hỏi bài tập IELTS phù hợp để kiểm tra trình độ. Không giải thích dài dòng."
                        question = await ai_service.get_advice(q_prompt)
                        user_states[discord_id]["state"] = "STATE_TESTING"
                        user_states[discord_id]["info"] = content
                        await message.reply(f"Ok! Dựa vào thông tin của bạn, hãy trả lời câu hỏi sau để mình đánh giá nhé:\n\n**{question}**")
                        return
                    except Exception as e:
                        logger.error(e)
            
            elif state == "STATE_TESTING":
                async with message.channel.typing():
                    db = SessionLocal()
                    user = db.query(User).filter(User.discord_id == discord_id).first()
                    info = state_data.get("info", "")
                    
                    e_prompt = f"Thông tin học viên: {info}. Họ trả lời câu hỏi test là: {content}. Đánh giá câu trả lời này đúng hay sai, từ đó xếp loại trình độ. Sau đó đề xuất lịch học mỗi ngày (ví dụ 20:00). Trả về JSON: {{\"evaluation\": \"...\", \"level\": \"...\", \"time\": \"HH:MM\", \"topic\": \"...\"}}"
                    try:
                        data = await ai_service.get_json_advice(e_prompt)
                        if not data or "evaluation" not in data:
                            data = {"evaluation": "Khá tốt!", "level": "Intermediate", "time": "20:00", "topic": "General"}
                    except:
                        data = {"evaluation": "Mình đã ghi nhận câu trả lời.", "level": "Beginner", "time": "20:00", "topic": "General"}
                        
                    # Extract just the HH:MM from whatever the AI returned
                    time_str = data.get("time", "20:00")
                    import re
                    match = re.search(r'\d{1,2}:\d{2}', str(time_str))
                    if match:
                        time_str = match.group(0)
                    else:
                        time_str = "20:00"
                        
                    # Save to DB
                    if user:
                        sched = db.query(DiscordSchedule).filter(DiscordSchedule.user_id == user.id).first()
                        if not sched:
                            sched = DiscordSchedule(user_id=user.id)
                            db.add(sched)
                        sched.study_time = time_str
                        sched.level = str(data.get("level", "Beginner"))[:50]
                        sched.topic = str(data.get("topic", "General"))[:100]
                        db.commit()
                    
                    db.close()
                    del user_states[discord_id]
                    
                    await message.reply(f"Đánh giá của mình: {data.get('evaluation')}\n\nTrình độ của bạn: **{data.get('level')}**.\nMình đã đặt lịch học cho bạn vào **{data.get('time')}** mỗi ngày với chủ đề **{data.get('topic')}**. Đến giờ mình sẽ nhắc thật gắt gao nhé! 🍵")
                    return
 
        # Default Chat
        async with message.channel.typing():
            if not content:
                content = "Chào bạn"
                
            # Fetch last 8 messages to build conversation history context
            history_messages = []
            try:
                async for msg in message.channel.history(limit=8):
                    author_name = "Học viên" if msg.author.id != bot.user.id else "IELTS Oasis"
                    msg_content = msg.content.replace(f'<@{bot.user.id}>', '').strip()
                    if msg_content:
                        history_messages.append(f"{author_name}: {msg_content}")
            except Exception as e:
                logger.error(f"Failed to fetch history: {e}")
                
            history_messages.reverse()
            history_str = "\n".join(history_messages)
            
            prompt = f"""
            Bạn là một gia sư IELTS tên là IELTS Oasis. Hãy trả lời ngắn gọn, thân thiện, tự nhiên và hữu ích bằng tiếng Việt.
            Quy tắc quan trọng:
            1. Nếu học viên chào hỏi (ví dụ: hi, hello, chào thầy...), hãy chào lại một cách thân thiện và hỏi xem bạn có thể giúp gì cho họ, TUYỆT ĐỐI KHÔNG tự tiện đưa ra bài tập hay câu hỏi kiểm tra.
            2. Nếu học viên hỏi về kiến thức tiếng Anh (ngữ pháp, từ vựng, phát âm, lời khuyên viết bài), hãy giải thích ngắn gọn, dễ hiểu và cho ví dụ rõ ràng. Chỉ trả lời câu hỏi của họ, không tự động đố bài tập trừ khi họ yêu cầu.
            3. CHỈ khi học viên nói muốn luyện tập, yêu cầu làm bài tập, hoặc muốn thử sức, lúc đó bạn mới tạo 1-2 câu hỏi trắc nghiệm hoặc điền từ ngắn gọn kèm đáp án ẩn dưới dạng spoiler (ví dụ ||đáp án||) để họ tự thử sức.
            
            Dưới đây là lịch sử hội thoại gần đây giữa bạn (IELTS Oasis) và học viên (hãy dựa vào đây để trả lời câu reply của họ một cách liền mạch, đúng ngữ cảnh):
            {history_str}
            
            Hãy đưa ra câu trả lời tiếp theo của gia sư IELTS Oasis:
            """
            try:
                response = await ai_service.get_advice(prompt)
                if response:
                    await message.reply(response)
                else:
                    await message.reply("Xin lỗi, tôi đang bận pha trà Matcha. Bạn hỏi lại sau nhé! 🍵")
            except Exception as e:
                logger.error(f"Chatbot error: {e}")


@bot.tree.command(name='web', description="Xem link truy cập web IELTS Oasis")
async def web(interaction: discord.Interaction):
    domain = "https://drudge-amount-charting.ngrok-free.dev"
    await interaction.response.send_message(f"Truy cập IELTS Oasis tại đây nhé: {domain}")

@bot.tree.command(name='tuvan', description="Tư vấn lộ trình học tập và kiểm tra trình độ")
async def tuvan_cmd(interaction: discord.Interaction):
    discord_id = str(interaction.user.id)
    db = SessionLocal()
    user = db.query(User).filter(User.discord_id == discord_id).first()
    db.close()
    
    if not user:
        await interaction.response.send_message("Bạn chưa đăng nhập trên web IELTS Oasis! Hãy đăng nhập trên web bằng Discord để mình biết bạn là ai nhé.")
        return

    user_states[discord_id] = {"state": "STATE_ASK_INFO", "channel_id": interaction.channel_id}
    await interaction.response.send_message(f"Chào {user.username}! Để thiết lập lộ trình học tốt nhất, bạn cho mình biết bạn **thường rảnh học lúc mấy giờ** và **trình độ từ vựng/IELTS hiện tại** của bạn đang ở mức nào nhé?")

@bot.tree.command(name='xinnghi', description="Xin nghỉ học hôm nay với lý do")
@app_commands.describe(lydo="Lý do bạn xin nghỉ hôm nay")
async def xinnghi_cmd(interaction: discord.Interaction, lydo: str):
    discord_id = str(interaction.user.id)
    db = SessionLocal()
    user = db.query(User).filter(User.discord_id == discord_id).first()
    
    if not user:
        await interaction.response.send_message("Bạn chưa kết nối tài khoản web!")
        db.close()
        return

    await interaction.response.defer()
    
    prompt = f"Học viên xin nghỉ học hôm nay với lý do: '{lydo}'. Đánh giá lý do này có chính đáng không. Trả lời ngắn gọn dưới 50 chữ, nghiêm khắc nhưng công bằng."
    feedback = await ai_service.get_advice(prompt)
    
    # Save absence
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    log = AbsenceLog(user_id=user.id, absent_date=today_str, reason=lydo)
    db.add(log)
    db.commit()
    db.close()

    await interaction.followup.send(f"Đã ghi nhận đơn xin nghỉ của bạn.\n\n**Lời phê của thầy Oasis:** {feedback}")

@bot.tree.command(name='dailyplan', description="Tạo lộ trình học tiếng Anh hỏa tốc")
@app_commands.describe(topic="Chủ đề bạn muốn học")
async def dailyplan_cmd(interaction: discord.Interaction, topic: str = "General"):
    await interaction.response.defer()
    try:
        plan = await ai_service.generate_daily_plan(topic)
        if "error" in plan:
            await interaction.followup.send(f"Đã có lỗi: {plan['error']}")
            return
            
        embed = discord.Embed(
            title=f"🍵 Lộ Trình: {plan.get('topic', topic)}",
            color=discord.Color.green()
        )
        
        vocab_list = plan.get('vocabulary', [])
        vocab_text = "\n".join([f"**{v['word']}** ({v.get('phonetic', '')}) - {v.get('meaning', '')}" for v in vocab_list[:5]])
        embed.add_field(name="📚 Từ Vựng (Top 5)", value=vocab_text if vocab_text else "Không có", inline=False)
        
        listening = plan.get('listening', {})
        embed.add_field(name="🎧 Nghe", value=f"**{listening.get('title', 'N/A')}**", inline=False)
        
        await interaction.followup.send("Đã xong! Chúc bạn học tốt 🎉", embed=embed)
    except Exception as e:
        await interaction.followup.send("Đã có lỗi xảy ra khi tạo lộ trình.")

@bot.tree.command(name='myprogress', description="Xem tiến độ học tập")
async def myprogress_cmd(interaction: discord.Interaction):
    discord_id = str(interaction.user.id)
    db = SessionLocal()
    user = db.query(User).filter(User.discord_id == discord_id).first()
    
    if not user:
        await interaction.response.send_message("Vui lòng liên kết tài khoản Discord trên website!")
        db.close()
        return

    now = datetime.utcnow()
    total_vocab = db.query(Vocabulary).filter(Vocabulary.user_id == user.id).count()
    due_vocab = db.query(Vocabulary).filter(Vocabulary.user_id == user.id, Vocabulary.next_review <= now).count()
    
    embed = discord.Embed(title=f"📊 Tiến độ của {user.username}", color=discord.Color.blue())
    embed.add_field(name="📚 Tổng từ vựng", value=str(total_vocab), inline=True)
    embed.add_field(name="⏰ Cần ôn tập", value=f"**{due_vocab}** từ", inline=True)
        
    await interaction.response.send_message(embed=embed)
    db.close()

async def schedule_checker_job():
    """Chạy mỗi phút để kiểm tra lịch học của user"""
    now = datetime.utcnow()
    # Format current time HH:MM (UTC+7 for local if needed, assuming user enters UTC+7, but server runs UTC)
    # Simple workaround: Just match the exact string if they entered HH:MM in their local time.
    # We should get current hour/minute in local time (Vietnam is UTC+7)
    local_now = datetime.utcnow()
    current_time_str = f"{(local_now.hour + 7) % 24:02d}:{local_now.minute:02d}"
    today_str = datetime.utcnow().strftime("%Y-%m-%d")

    db = SessionLocal()
    schedules = db.query(DiscordSchedule).all()
    for sched in schedules:
        if sched.study_time == current_time_str:
            # Check absence
            absence = db.query(AbsenceLog).filter(
                AbsenceLog.user_id == sched.user_id,
                AbsenceLog.absent_date == today_str
            ).first()
            
            if absence:
                continue # They took a day off
                
            user = db.query(User).filter(User.id == sched.user_id).first()
            if user:
                try:
                    discord_user = await bot.fetch_user(int(user.discord_id))
                    if discord_user:
                        await discord_user.send(f"🔥 ĐẾN GIỜ HỌC RỒI! Đừng lười biếng nữa. Hôm nay bạn phải hoàn thành lộ trình chủ đề **{sched.topic}**. Truy cập IELTS Oasis ngay lập tức!")
                except Exception as e:
                    logger.error(e)
                    
    db.close()

if __name__ == "__main__":
    if DISCORD_BOT_TOKEN:
        bot.run(DISCORD_BOT_TOKEN)
    else:
        logger.warning("CẢNH BÁO: Chưa cấu hình DISCORD_BOT_TOKEN trong file .env")
