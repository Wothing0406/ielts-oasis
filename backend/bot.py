import os
import discord
from discord.ext import commands
from discord import app_commands
from dotenv import load_dotenv
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from database import SessionLocal
from models import User, Vocabulary, WritingLog, DiscordSchedule, AbsenceLog, DailyPlan, Like, Comment, WordleGame
from datetime import datetime, timedelta
from services.ai_service import ai_service
import asyncio
from logger import setup_logger
import json

logger = setup_logger("discord_bot")

load_dotenv()

DISCORD_BOT_TOKEN = os.getenv("DISCORD_BOT_TOKEN")

intents = discord.Intents.default()
intents.message_content = True
intents.dm_messages = True

bot = commands.Bot(command_prefix='/', intents=intents)

class ConfirmQuitView(discord.ui.View):
    def __init__(self, author_id):
        super().__init__(timeout=60)
        self.author_id = author_id
        self.value = None

    @discord.ui.button(label="Xác nhận nghỉ học 😢", style=discord.ButtonStyle.danger)
    async def confirm(self, interaction: discord.Interaction, button: discord.ui.Button):
        if str(interaction.user.id) != self.author_id:
            await interaction.response.send_message("Bạn không có quyền thực hiện thao tác này!", ephemeral=True)
            return
        self.value = True
        await interaction.response.defer()
        self.stop()

    @discord.ui.button(label="Hủy", style=discord.ButtonStyle.secondary)
    async def cancel(self, interaction: discord.Interaction, button: discord.ui.Button):
        if str(interaction.user.id) != self.author_id:
            await interaction.response.send_message("Bạn không có quyền thực hiện thao tác này!", ephemeral=True)
            return
        self.value = False
        await interaction.response.send_message("Cảm ơn bạn đã tiếp tục đồng hành cùng Mát Cha AI Eo! 🍵", ephemeral=True)
        self.stop()

# State storage for advisory flow
# user_id -> { "state": "STATE_ASK_INFO", "topic": "...", "test_question": "..." }
user_states = {}

@bot.event
async def on_ready():
    logger.info(f'Logged in as {bot.user} (ID: {bot.user.id})')
    logger.info('------')
    
    # Set rich activity status
    try:
        activity = discord.Activity(
            type=discord.ActivityType.listening,
            name="Mát Cha AI Eo 🍵 | /tuvan /dailyplan /web"
        )
        await bot.change_presence(status=discord.Status.online, activity=activity)
        logger.info("Bot presence updated to Listening activity.")
    except Exception as e:
        logger.error(f"Failed to set presence: {e}")

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
    ref_msg = None
    if message.reference and message.reference.message_id:
        try:
            ref_msg = await message.channel.fetch_message(message.reference.message_id)
            if ref_msg.author.id == bot.user.id:
                is_reply_to_bot = True
        except Exception:
            pass
            
    if isinstance(message.channel, discord.DMChannel) or bot.user in message.mentions or is_reply_to_bot:
        if message.content.startswith('/'):
            return
            
        discord_id = str(message.author.id)
        content = message.content.replace(f'<@{bot.user.id}>', '').strip()
        
        # 1. Check if the user is replying to a /tuvan question
        if is_reply_to_bot and ref_msg:
            # Step 1: User replies to /tuvan introduction
            if "Để thiết lập lộ trình học tốt nhất" in ref_msg.content:
                async with message.channel.typing():
                    try:
                        q_prompt = f"Học viên nói: {content}. Đưa ra 1 câu hỏi bài tập IELTS phù hợp để kiểm tra trình độ. Không giải thích dài dòng."
                        question = await ai_service.get_advice(q_prompt)
                        user_states[discord_id] = {
                            "state": "STATE_TESTING",
                            "info": content
                        }
                        await message.reply(f"Ok! Dựa vào thông tin của bạn, hãy trả lời câu hỏi sau để mình đánh giá nhé:\n\n**{question}**")
                        return
                    except Exception as e:
                        logger.error(e)
            
            # Step 2: User replies to test question
            elif "trả lời câu hỏi sau để mình đánh giá nhé" in ref_msg.content or "Dựa vào thông tin của bạn, hãy trả lời câu hỏi sau" in ref_msg.content:
                async with message.channel.typing():
                    db = SessionLocal()
                    user = db.query(User).filter(User.discord_id == discord_id).first()
                    state_data = user_states.get(discord_id, {})
                    info = state_data.get("info", "Rảnh tối, beginner")
                    
                    e_prompt = f"""
                    Thông tin học viên: {info}.
                    Học viên trả lời câu hỏi kiểm tra: "{content}".
                    
                    Hãy đóng vai là thầy giáo Mát Cha AI Eo. Đánh giá câu trả lời này đúng hay sai, từ đó xếp loại trình độ.
                    Đề xuất lịch nhắc học mỗi ngày (ví dụ 20:00) dựa trên thông tin thời gian rảnh.
                    Và tạo một lộ trình học chi tiết cụ thể cho cả tuần (Thứ 2 đến Chủ nhật).
                    Chủ đề của từng ngày phải cụ thể và có task list rõ ràng để học viên biết phải làm gì trên website, kèm gợi ý (tip).
                    
                    Mỗi ngày trong tuần (từ "Monday" đến "Sunday") phải có:
                    1. "topic": Chủ đề nhỏ chi tiết của ngày đó.
                    2. "focus": Kỹ năng chính của ngày đó ("Từ vựng", "Nói", "Viết", "Nghe", "Đọc").
                    3. "tasks": Danh sách 2-3 nhiệm vụ cụ thể cần hoàn thành.
                    4. "vocabulary": Danh sách 3 từ vựng IELTS tiêu biểu của ngày đó (word, phonetic, meaning, example). Định nghĩa tiếng Việt, câu ví dụ tiếng Anh.
                    5. Tùy thuộc vào "focus" của ngày đó, hãy cung cấp phần luyện tập tương ứng:
                       - Nếu focus là "Nghe": Thêm đối tượng "listening" gồm (title, description, audio_script, questions).
                       - Nếu focus là "Đọc": Thêm đối tượng "reading" gồm (title, text, questions).
                       - Nếu focus là "Viết": Thêm đối tượng "writing" gồm (prompt, key_points).
                       - Nếu focus là "Nói": Thêm đối tượng "speaking" gồm (prompt).

                    Trả về định dạng JSON chính xác như sau (không kèm ký hiệu markdown, không kèm giải thích khác):
                    {{
                        "evaluation": "nhận xét chi tiết tiếng Việt",
                        "level": "Beginner/Intermediate/Advanced",
                        "time": "HH:MM",
                        "topic": "chủ đề chung",
                        "weekly_plan": {{
                            "Monday": {{
                                "topic": "chủ đề",
                                "focus": "Từ vựng / Nói / Viết / Nghe / Đọc",
                                "tasks": ["nhiệm vụ 1", "nhiệm vụ 2"],
                                "tip": "gợi ý",
                                "vocabulary": [
                                    {{"word": "word1", "phonetic": "/.../", "meaning": "nghĩa1", "example": "ví dụ 1"}}
                                ]
                            }},
                            "Tuesday": {{ ... }},
                            ...
                        }}
                    }}
                    """
                    try:
                        data = await ai_service.get_json_advice(e_prompt)
                        if not data or "evaluation" not in data:
                            data = {"evaluation": "Khá tốt!", "level": "Intermediate", "time": "20:00", "topic": "General", "weekly_plan": {}}
                    except Exception:
                        data = {"evaluation": "Mình đã ghi nhận câu trả lời.", "level": "Beginner", "time": "20:00", "topic": "General", "weekly_plan": {}}
                        
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
                            sched = DiscordSchedule(user_id=user.id, study_focus="Toàn diện")
                            db.add(sched)
                        sched.study_time = time_str
                        sched.level = str(data.get("level", "Beginner"))[:50]
                        sched.topic = str(data.get("topic", "General"))[:100]
                        sched.weekly_plan = data.get("weekly_plan")
                        db.commit()
                    
                    user_states.pop(discord_id, None)
                    
                    # Create rich embed
                    embed = discord.Embed(
                        title=f"🍵 LỘ TRÌNH HỌC TẬP MÁT CHA AI EO",
                        description=f"Chúc mừng **{user.username if user else 'bạn'}** đã hoàn thành tư vấn! Dưới đây là lộ trình học tập được thiết kế riêng cho bạn.",
                        color=discord.Color.from_rgb(167, 208, 140)
                    )
                    embed.add_field(name="📊 Đánh giá & Trình độ", value=f"**Trình độ:** {data.get('level', 'Beginner')}\n**Nhận xét:** {data.get('evaluation')}", inline=False)
                    embed.add_field(name="⏰ Lịch nhắc học", value=f"Hàng ngày vào lúc **{time_str}** (Giờ Việt Nam)", inline=False)
                    
                    weekly_plan = data.get("weekly_plan", {})
                    day_translation = {
                        "Monday": "Thứ 2 (Monday)",
                        "Tuesday": "Thứ 3 (Tuesday)",
                        "Wednesday": "Thứ 4 (Wednesday)",
                        "Thursday": "Thứ 5 (Thursday)",
                        "Friday": "Thứ 6 (Friday)",
                        "Saturday": "Thứ 7 (Saturday)",
                        "Sunday": "Chủ nhật (Sunday)"
                    }
                    for day_en, day_vi in day_translation.items():
                        day_data = weekly_plan.get(day_en, weekly_plan.get(day_vi, {}))
                        if day_data:
                            tasks = day_data.get("tasks", [])
                            tasks_str = "\n".join([f"• {t}" for t in tasks]) if tasks else "• Chưa có nhiệm vụ"
                            tip = day_data.get("tip", "")
                            val = f"**Chủ đề:** {day_data.get('topic', 'N/A')}\n**Nhiệm vụ:**\n{tasks_str}"
                            if tip:
                                val += f"\n💡 *Gợi ý:* {tip}"
                            embed.add_field(name=f"📅 {day_vi}", value=val, inline=False)
                            
                    embed.set_footer(text="Hãy bắt đầu bài học đầu tiên trên trang web Mát Cha AI Eo nhé! 🎉")
                    await message.reply(embed=embed)
                    db.close()
                    return
 
        # 2. General reply context or mention context
        async with message.channel.typing():
            if not content:
                content = "Chào bạn"
                
            # Query user stats from the web database
            discord_id = str(message.author.id)
            db = SessionLocal()
            user = db.query(User).filter(User.discord_id == discord_id).first()
            
            stats_str = ""
            if user:
                vocab_count = db.query(Vocabulary).filter(Vocabulary.user_id == user.id).count()
                mastery_count = db.query(Vocabulary).filter(Vocabulary.user_id == user.id, Vocabulary.mastery_level == 5).count()
                recent_writing = db.query(WritingLog).filter(WritingLog.user_id == user.id).order_by(WritingLog.created_at.desc()).first()
                wordle_game = db.query(WordleGame).filter(WordleGame.user_id == user.id).first()
                
                stats_str = f"\nThông tin học viên:\n- Tên trên Web: {user.username}\n- Kho từ vựng: đã lưu {vocab_count} từ (trong đó có {mastery_count} từ đạt Mastery 5)."
                if recent_writing:
                    stats_str += f"\n- Bài viết IELTS gần nhất đạt Band {recent_writing.band_score}."
                if wordle_game:
                    stats_str += f"\n- Điểm trò chơi Wordle Matcha: {wordle_game.points} điểm (Cấp độ {wordle_game.current_level})."
            else:
                stats_str = "\n(Lưu ý: Học viên này chưa liên kết tài khoản Discord với website IELTS Oasis. Hãy khuyên họ đăng nhập website IELTS Oasis bằng tài khoản Discord để đồng bộ lộ trình học tập, thống kê kết quả học tập và tự động hóa kho từ vựng.)"
            db.close()

            system_instruction = f"""
            Bạn là một gia sư IELTS tên là Mát Cha AI Eo, cực kỳ nhiệt tình, thân thiện, gọi học viên bằng tên (nếu biết tên) và luôn xưng hô 'Mát Cha' hoặc 'tớ' và gọi học viên là 'cậu' hoặc 'bạn' cực kỳ ấm áp.
            Bạn am hiểu sâu sắc các tính năng của website IELTS Oasis và hãy hướng dẫn học viên sử dụng chúng khi họ hỏi:
            - **Vocabulary Lab**: Kho lưu trữ từ vựng cá nhân, tích hợp thuật toán lặp lại ngắt quãng (SRS) với 5 cấp độ Mastery để học từ nhớ lâu.
            - **Writing Sanctuary**: Nơi luyện viết các bài luận Task 1, Task 2 và nhận đánh giá Band score, sửa lỗi chi tiết thời gian thực từ AI. Có đồng hồ áp lực thi cử tự động khóa ô viết và nộp bài khi hết giờ.
            - **MatchaSpeak (Speaking Studio)**: Gồm chế độ Shadowing (nhại giọng chuẩn) và Sandbox (luyện nói Cue Card Part 2 trong 2 phút kèm nhận xét phát âm).
            - **MatchaScroll (Đọc báo)**: Đọc báo học thuật tiếng Anh và tự động bôi đen trích xuất từ mới vào kho từ vựng.
            - **Listening Section**: Luyện nghe chép chính tả qua video Youtube học thuật.
            - **Wordle Matcha**: Trò chơi đoán từ vựng giải trí giúp tăng phản xạ từ.

            {stats_str}
            """

            if is_reply_to_bot and ref_msg:
                # Direct reply to a specific bot message
                replied_cleaned = ref_msg.content.replace(f'<@{bot.user.id}>', '').strip()
                prompt = f"""
                {system_instruction}
                
                Quy tắc quan trọng:
                1. Hãy trả lời trực tiếp phản hồi của học viên đối với câu nói trước đó của bạn.
                2. Nếu học viên chào hỏi, hãy chào lại thân thiện.
                3. CHỈ tạo bài tập/quiz trắc nghiệm nếu họ rõ ràng yêu cầu được làm bài tập hay luyện tập.
                
                Ngữ cảnh hội thoại:
                - Bạn (Mát Cha AI Eo) đã nói trước đó: "{replied_cleaned}"
                - Học viên vừa reply/phản hồi lại câu trên của bạn: "{content}"
                
                Hãy đưa ra phản hồi tiếp theo của bạn:
                """
            else:
                # Normal mention or DM chat history
                history_messages = []
                try:
                    async for msg in message.channel.history(limit=6):
                        author_name = "Học viên" if msg.author.id != bot.user.id else "Mát Cha AI Eo"
                        msg_content = msg.content.replace(f'<@{bot.user.id}>', '').strip()
                        if msg_content:
                            history_messages.append(f"{author_name}: {msg_content}")
                except Exception as e:
                    logger.error(f"Failed to fetch history: {e}")
                    
                history_messages.reverse()
                history_str = "\n".join(history_messages)
                
                prompt = f"""
                {system_instruction}
                
                Quy tắc quan trọng:
                1. Nếu học viên chào hỏi (ví dụ: hi, hello, chào thầy...), hãy chào lại một cách thân thiện và hỏi xem bạn có thể giúp gì cho họ, TUYỆT ĐỐI KHÔNG tự tiện đưa ra bài tập hay câu hỏi kiểm tra.
                2. Nếu học viên hỏi về kiến thức tiếng Anh (ngữ pháp, từ vựng, phát âm, lời khuyên viết bài), hãy giải thích ngắn gọn, dễ hiểu và cho ví dụ rõ ràng.
                3. CHỈ tạo bài tập/quiz trắc nghiệm nếu họ rõ ràng yêu cầu.
                
                Dưới đây là lịch sử hội thoại gần đây giữa bạn (Mát Cha AI Eo) và học viên:
                {history_str}
                
                Hãy đưa ra câu trả lời tiếp theo của gia sư Mát Cha AI Eo:
                """
            try:
                response = await ai_service.get_advice(prompt)
                if response:
                    await message.reply(response)
                else:
                    await message.reply("Xin lỗi, tôi đang bận pha trà Matcha. Bạn hỏi lại sau nhé! 🍵")
            except Exception as e:
                logger.error(f"Chatbot error: {e}")


@bot.tree.command(name='web', description="Xem link truy cập web Mát Cha AI Eo")
async def web(interaction: discord.Interaction):
    redirect_uri = os.getenv("DISCORD_REDIRECT_URI", "https://ieltsoasis.site/auth/callback")
    domain = redirect_uri.replace("/auth/callback", "")
    await interaction.response.send_message(f"Truy cập Mát Cha AI Eo tại đây nhé: {domain}")

@bot.tree.command(name='tuvan', description="Tư vấn lộ trình học tập và kiểm tra trình độ")
async def tuvan_cmd(interaction: discord.Interaction):
    discord_id = str(interaction.user.id)
    db = SessionLocal()
    user = db.query(User).filter(User.discord_id == discord_id).first()
    db.close()
    
    if not user:
        await interaction.response.send_message("Bạn chưa đăng nhập trên web Mát Cha AI Eo! Hãy đăng nhập trên web bằng Discord để mình biết bạn là ai nhé.")
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

    await interaction.followup.send(f"Đã ghi nhận đơn xin nghỉ của bạn.\n\n**Lời phê của thầy Mát Cha AI Eo:** {feedback}")

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

@bot.tree.command(name='mylich', description="Xem lịch nhắc học và lộ trình tuần chi tiết của bạn")
async def mylich_cmd(interaction: discord.Interaction):
    discord_id = str(interaction.user.id)
    db = SessionLocal()
    user = db.query(User).filter(User.discord_id == discord_id).first()
    
    if not user:
        await interaction.response.send_message("Vui lòng liên kết tài khoản Discord trên website trước nhé! 🍵", ephemeral=True)
        db.close()
        return
        
    sched = db.query(DiscordSchedule).filter(DiscordSchedule.user_id == user.id).first()
    if not sched or not sched.weekly_plan:
        await interaction.response.send_message(
            f"Chào {user.username}! Bạn chưa có lộ trình học tập nào hoạt động. Hãy thiết lập lộ trình trên Website hoặc dùng lệnh `/tuvan` để kích hoạt nhé! 🍵",
            ephemeral=True
        )
        db.close()
        return
        
    # Create rich embed
    embed = discord.Embed(
        title=f"📅 LỊCH HỌC CỦA {user.username.upper()} 🍵",
        description=f"⏰ **Giờ nhắc học:** Hàng ngày lúc **{sched.study_time}** (Giờ VN)\n📊 **Trình độ:** {sched.level}\n🎯 **Chủ đề:** {sched.topic}",
        color=discord.Color.from_rgb(167, 208, 140)
    )
    
    weekly_plan = {}
    if sched.weekly_plan:
        try:
            if isinstance(sched.weekly_plan, str):
                weekly_plan = json.loads(sched.weekly_plan)
            else:
                weekly_plan = sched.weekly_plan
        except Exception as e:
            logger.error(f"Failed to parse weekly_plan for user {user.id}: {e}")
            
    day_translation = {
        "Monday": "Thứ 2 (Monday)",
        "Tuesday": "Thứ 3 (Tuesday)",
        "Wednesday": "Thứ 4 (Wednesday)",
        "Thursday": "Thứ 5 (Thursday)",
        "Friday": "Thứ 6 (Friday)",
        "Saturday": "Thứ 7 (Saturday)",
        "Sunday": "Chủ nhật (Sunday)"
    }
    
    for day_en, day_vi in day_translation.items():
        day_data = weekly_plan.get(day_en, weekly_plan.get(day_vi, {}))
        if day_data:
            tasks = day_data.get("tasks", [])
            tasks_str = "\n".join([f"• {t}" for t in tasks]) if tasks else "• Chưa có nhiệm vụ"
            tip = day_data.get("tip", "")
            val = f"**Chủ đề:** {day_data.get('topic', 'N/A')}\n**Nhiệm vụ:**\n{tasks_str}"
            if tip:
                val += f"\n💡 *Gợi ý:* {tip}"
            embed.add_field(name=f"📅 {day_vi}", value=val, inline=False)
            
    embed.set_footer(text="Bạn có thể hủy lịch nhắc học bất cứ lúc nào qua lệnh /huylich.")
    await interaction.response.send_message(embed=embed, ephemeral=True)
    db.close()

@bot.tree.command(name='studytime', description="Đổi nhanh giờ nhắc học hàng ngày")
@app_commands.describe(time="Giờ học dạng HH:MM (ví dụ: 20:00)")
async def studytime_cmd(interaction: discord.Interaction, time: str):
    import re
    if not re.match(r'^\d{1,2}:\d{2}$', time):
        await interaction.response.send_message("Vui lòng nhập đúng định dạng HH:MM (ví dụ: 20:00). 🍵", ephemeral=True)
        return
        
    discord_id = str(interaction.user.id)
    db = SessionLocal()
    user = db.query(User).filter(User.discord_id == discord_id).first()
    if not user:
        await interaction.response.send_message("Bạn chưa đăng nhập trên web Mát Cha AI Eo! Vui lòng đăng nhập trên website trước nhé! 🍵", ephemeral=True)
        db.close()
        return
        
    sched = db.query(DiscordSchedule).filter(DiscordSchedule.user_id == user.id).first()
    if not sched:
        sched = DiscordSchedule(user_id=user.id, study_time=time, level="General", topic="General", study_focus="Toàn diện")
        db.add(sched)
    else:
        sched.study_time = time
        
    db.commit()
    db.close()
    await interaction.response.send_message(f"Đã cập nhật giờ nhắc học hàng ngày của bạn thành **{time}**! 🍵", ephemeral=True)

@bot.tree.command(name='studytopic', description="Thay đổi chủ đề học tập và sinh lại lộ trình mới")
@app_commands.describe(topic="Nhập chủ đề học tập mới (ví dụ: Technology, Travel, Education...)")
async def studytopic_cmd(interaction: discord.Interaction, topic: str):
    discord_id = str(interaction.user.id)
    db = SessionLocal()
    user = db.query(User).filter(User.discord_id == discord_id).first()
    if not user:
        await interaction.response.send_message("Bạn chưa liên kết tài khoản Discord trên website! 🍵", ephemeral=True)
        db.close()
        return
        
    sched = db.query(DiscordSchedule).filter(DiscordSchedule.user_id == user.id).first()
    if not sched:
        sched = DiscordSchedule(user_id=user.id, study_time="20:00", level="General", topic=topic, study_focus="Toàn diện")
        db.add(sched)
        db.commit()
        
    await interaction.response.defer(ephemeral=True)
    sched.topic = topic
    db.commit()
    
    try:
        new_plan = await ai_service.generate_weekly_plan(topic, sched.study_focus)
        sched.weekly_plan = new_plan
        db.commit()
        await interaction.followup.send(f"Đã cập nhật chủ đề học tập thành **{topic}** và sinh lại lộ trình học mới thành công! 🍵")
    except Exception as e:
        logger.error(f"Failed to generate plan in /studytopic: {e}")
        await interaction.followup.send("Đã lưu cấu hình nhưng gặp lỗi khi tự động tạo lộ trình mới. Vui lòng thử lại sau!")
    finally:
        db.close()

@bot.tree.command(name='studyfocus', description="Thay đổi trọng tâm học tập và sinh lại lộ trình")
@app_commands.describe(focus="Chọn trọng tâm học tập")
@app_commands.choices(focus=[
    app_commands.Choice(name="Toàn diện (L/R/W/S)", value="Toàn diện"),
    app_commands.Choice(name="Chuyên sâu Từ vựng", value="Từ vựng"),
    app_commands.Choice(name="Chuyên sâu Nói", value="Nói"),
    app_commands.Choice(name="Chuyên sâu Viết", value="Viết")
])
async def studyfocus_cmd(interaction: discord.Interaction, focus: app_commands.Choice[str]):
    discord_id = str(interaction.user.id)
    db = SessionLocal()
    user = db.query(User).filter(User.discord_id == discord_id).first()
    if not user:
        await interaction.response.send_message("Bạn chưa đăng nhập trên web Mát Cha AI Eo! Vui lòng đăng nhập trên website trước nhé! 🍵", ephemeral=True)
        db.close()
        return
        
    sched = db.query(DiscordSchedule).filter(DiscordSchedule.user_id == user.id).first()
    if not sched:
        await interaction.response.send_message("Bạn chưa khởi tạo lộ trình học! Hãy gõ `/tuvan` hoặc thiết lập lộ trình trên Web nhé! 🍵", ephemeral=True)
        db.close()
        return
        
    await interaction.response.defer(ephemeral=True)
    
    # Update database
    sched.study_focus = focus.value
    db.commit()
    
    # Generate new weekly plan using the updated focus and current topic
    try:
        new_plan = await ai_service.generate_weekly_plan(sched.topic, focus.value)
        sched.weekly_plan = new_plan
        db.commit()
        await interaction.followup.send(f"Đã cập nhật trọng tâm học tập thành **{focus.name}** và cập nhật lại lộ trình của bạn thành công! 🍵")
    except Exception as e:
        logger.error(f"Failed to regenerate schedule in /studyfocus: {e}")
        await interaction.followup.send("Đã cập nhật cấu hình nhưng gặp lỗi khi tự động tạo lộ trình mới. Vui lòng thử lại sau!")
    finally:
        db.close()

@bot.tree.command(name='studydays', description="Chọn các ngày trong tuần cậu muốn học (ví dụ: Monday,Wednesday,Friday)")
@app_commands.describe(days="Các ngày cách nhau bởi dấu phẩy (ví dụ: Monday,Wednesday,Friday)")
async def studydays_cmd(interaction: discord.Interaction, days: str):
    discord_id = str(interaction.user.id)
    db = SessionLocal()
    user = db.query(User).filter(User.discord_id == discord_id).first()
    if not user:
        await interaction.response.send_message("Bạn chưa liên kết tài khoản Discord trên website! 🍵", ephemeral=True)
        db.close()
        return
        
    # Basic validation
    valid_days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    input_days = [d.strip() for d in days.split(",") if d.strip()]
    cleaned_days = []
    for d in input_days:
        matching = [vd for vd in valid_days if vd.lower() == d.lower()]
        if matching:
            cleaned_days.append(matching[0])
        else:
            await interaction.response.send_message(f"Ngày '{d}' không hợp lệ. Vui lòng nhập các thứ bằng tiếng Anh (Monday, Tuesday...) cách nhau bởi dấu phẩy. 🍵", ephemeral=True)
            db.close()
            return
            
    if not cleaned_days:
        await interaction.response.send_message("Vui lòng chọn ít nhất 1 ngày học trong tuần! 🍵", ephemeral=True)
        db.close()
        return
        
    sched = db.query(DiscordSchedule).filter(DiscordSchedule.user_id == user.id).first()
    if not sched:
        sched = DiscordSchedule(user_id=user.id, study_time="20:00", level="General", topic="General", study_focus="Toàn diện")
        db.add(sched)
        
    sched.active_days = ",".join(cleaned_days)
    db.commit()
    db.close()
    await interaction.response.send_message(f"Đã cập nhật lịch học các ngày hoạt động trong tuần thành: **{', '.join(cleaned_days)}**! 🍵", ephemeral=True)

@bot.tree.command(name='huylich', description="Hủy lộ trình học tập hiện tại của bạn")
async def huylich_cmd(interaction: discord.Interaction):
    discord_id = str(interaction.user.id)
    db = SessionLocal()
    user = db.query(User).filter(User.discord_id == discord_id).first()
    
    if not user:
        await interaction.response.send_message("Bạn chưa có tài khoản trên Mát Cha AI Eo! 🍵", ephemeral=True)
        db.close()
        return
        
    sched = db.query(DiscordSchedule).filter(DiscordSchedule.user_id == user.id).first()
    if not sched or not sched.weekly_plan:
        await interaction.response.send_message("Bạn không có lộ trình học tập nào hoạt động để hủy. 🍵", ephemeral=True)
        db.close()
        return
        
    try:
        sched.weekly_plan = None
        db.commit()
        await interaction.response.send_message(
            f"Đã hủy lộ trình học tập hiện tại thành công. Tài khoản `{user.username}` và kho từ vựng của bạn trên Mát Cha AI Eo vẫn được giữ nguyên vẹn. Bạn có thể thiết lập lộ trình mới bất cứ lúc nào trên website hoặc qua lệnh `/tuvan`. 🍵",
            ephemeral=True
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Error executing /huylich: {e}")
        await interaction.response.send_message("Có lỗi xảy ra khi hủy lộ trình. Vui lòng thử lại sau.", ephemeral=True)
    finally:
        db.close()

@bot.tree.command(name='nghihoc', description="Huỷ bỏ lịch học và xoá sạch dữ liệu của bạn trên hệ thống")
async def nghihoc_cmd(interaction: discord.Interaction):
    discord_id = str(interaction.user.id)
    db = SessionLocal()
    user = db.query(User).filter(User.discord_id == discord_id).first()
    db.close()
    
    if not user:
        await interaction.response.send_message("Bạn chưa đăng ký lộ trình học tập trên Mát Cha AI Eo!", ephemeral=True)
        return
 
    view = ConfirmQuitView(discord_id)
    await interaction.response.send_message(
        "⚠️ **CẢNH BÁO NGUY HIỂM:** Bạn có chắc chắn muốn **NGHỈ HỌC**? Thao tác này sẽ xóa toàn bộ từ vựng, lịch sử viết bài luận, lịch nhắc học và tài khoản của bạn trên Mát Cha AI Eo. Thao tác này **không thể khôi phục**!",
        view=view,
        ephemeral=True
    )
    await view.wait()
    if view.value is True:
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.discord_id == discord_id).first()
            if user:
                # Delete all associated data manually
                db.query(AbsenceLog).filter(AbsenceLog.user_id == user.id).delete()
                db.query(DiscordSchedule).filter(DiscordSchedule.user_id == user.id).delete()
                db.query(DailyPlan).filter(DailyPlan.user_id == user.id).delete()
                db.query(Like).filter(Like.user_id == user.id).delete()
                db.query(Comment).filter(Comment.user_id == user.id).delete()
                db.query(WritingLog).filter(WritingLog.user_id == user.id).delete()
                db.query(Vocabulary).filter(Vocabulary.user_id == user.id).delete()
                db.query(User).filter(User.id == user.id).delete()
                db.commit()
                await interaction.followup.send("Đã huỷ học và xoá toàn bộ dữ liệu thành công. Hy vọng sẽ được đồng hành cùng bạn trong tương lai! 🍵", ephemeral=True)
            else:
                await interaction.followup.send("Lỗi: Không tìm thấy tài khoản người dùng.", ephemeral=True)
        except Exception as e:
            db.rollback()
            logger.error(f"Error executing /nghihoc: {e}")
            await interaction.followup.send("Có lỗi xảy ra khi thực hiện xoá dữ liệu. Vui lòng thử lại sau.", ephemeral=True)
        finally:
            db.close()
 
async def schedule_checker_job():
    """Chạy mỗi phút để kiểm tra lịch học của user"""
    now = datetime.utcnow()
    local_now = datetime.utcnow() + timedelta(hours=7)
    current_time_str = f"{local_now.hour:02d}:{local_now.minute:02d}"
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
 
    db = SessionLocal()
    schedules = db.query(DiscordSchedule).all()
    
    # Days translation
    weekday_en = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    weekday_vi = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"]
    local_weekday_idx = local_now.weekday() % 7
    day_en = weekday_en[local_weekday_idx]
    day_vi = weekday_vi[local_weekday_idx]
 
    for sched in schedules:
        if sched.study_time == current_time_str:
            # Check absence
            absence = db.query(AbsenceLog).filter(
                AbsenceLog.user_id == sched.user_id,
                AbsenceLog.absent_date == today_str
            ).first()
            
            if absence:
                continue # They took a day off
                
            if not sched.weekly_plan:
                continue # No active study plan exists
                
            user = db.query(User).filter(User.id == sched.user_id).first()
            if user:
                try:
                    discord_user = await bot.fetch_user(int(user.discord_id))
                    if discord_user:
                        weekly_plan = {}
                        if sched.weekly_plan:
                            try:
                                if isinstance(sched.weekly_plan, str):
                                    weekly_plan = json.loads(sched.weekly_plan)
                                else:
                                    weekly_plan = sched.weekly_plan
                            except Exception as e:
                                logger.error(f"Failed to parse weekly_plan for user {sched.user_id}: {e}")
                        
                        day_plan = weekly_plan.get(day_en, weekly_plan.get(day_vi, {}))
                        if day_plan:
                            topic_today = day_plan.get("topic", sched.topic)
                            tasks = day_plan.get("tasks", [])
                            tip = day_plan.get("tip", "")
                            
                            # Check if vocab is already in day plan
                            day_vocab = day_plan.get("vocabulary", [])
                            
                            # Sync vocab to web DB
                            if day_vocab:
                                for v in day_vocab:
                                    word_str = v.get("word", "").strip()
                                    if word_str:
                                        from sqlalchemy import func
                                        dup = db.query(Vocabulary).filter(
                                            Vocabulary.user_id == user.id,
                                            func.lower(Vocabulary.word) == func.lower(word_str)
                                        ).first()
                                        if not dup:
                                            new_v = Vocabulary(
                                                user_id=user.id,
                                                word=word_str,
                                                phonetic=v.get("phonetic", ""),
                                                meaning=v.get("meaning", ""),
                                                example=v.get("example", ""),
                                                topic=topic_today,
                                                audio_url="",
                                                mastery_level=1,
                                                is_learned=False,
                                                source="Discord Reminder"
                                            )
                                            db.add(new_v)
                                db.commit()
                                
                            # Convert day_vocab to words_data structure
                            words_data = None
                            if day_vocab:
                                words_data = {
                                    "words": day_vocab
                                }
                                # Add speaking prompt if focus was Nói and has speaking prompt
                                speak_obj = day_plan.get("speaking")
                                if speak_obj and isinstance(speak_obj, dict) and "prompt" in speak_obj:
                                    words_data["speaking_prompt"] = speak_obj["prompt"]
                                    
                            # Fallback if no vocab in day plan (legacy or fallback)
                            if not words_data:
                                vocab_prompt = f"""
                                Hãy đề xuất 3 từ vựng IELTS nâng cao thuộc chủ đề '{topic_today}'.
                                Với mỗi từ, hãy cung cấp phiên âm IPA, định nghĩa tiếng Việt ngắn gọn, và một câu ví dụ tiếng Anh.
                                
                                Trả về định dạng JSON chính xác như sau:
                                {{
                                    "words": [
                                        {{"word": "từ_vựng_1", "phonetic": "phiên_âm_1", "meaning": "nghĩa_1", "example": "ví_dụ_1"}},
                                        {{"word": "từ_vựng_2", "phonetic": "phiên_âm_2", "meaning": "nghĩa_2", "example": "ví_dụ_2"}},
                                        {{"word": "từ_vựng_3", "phonetic": "phiên_âm_3", "meaning": "nghĩa_3", "example": "ví_dụ_3"}}
                                    ],
                                    "speaking_prompt": "câu hỏi luyện nói tiếng Anh gợi mở về chủ đề '{topic_today}' để người học luyện nói hoặc viết đoạn văn ngắn."
                                }}
                                """
                                try:
                                    words_data = await ai_service.get_json_advice(vocab_prompt)
                                    # Sync generated vocab too
                                    if words_data and "words" in words_data:
                                        for w in words_data["words"]:
                                            word_str = w.get("word", "").strip()
                                            if word_str:
                                                from sqlalchemy import func
                                                dup = db.query(Vocabulary).filter(
                                                    Vocabulary.user_id == user.id,
                                                    func.lower(Vocabulary.word) == func.lower(word_str)
                                                ).first()
                                                if not dup:
                                                    new_v = Vocabulary(
                                                        user_id=user.id,
                                                        word=word_str,
                                                        phonetic=w.get("phonetic", ""),
                                                        meaning=w.get("meaning", ""),
                                                        example=w.get("example", ""),
                                                        topic=topic_today,
                                                        audio_url="",
                                                        mastery_level=1,
                                                        is_learned=False,
                                                        source="Discord Reminder"
                                                    )
                                                    db.add(new_v)
                                        db.commit()
                                except Exception as e:
                                    logger.error(f"Failed to generate study content for reminder DM: {e}")
                                
                            tasks_str = "\n".join([f"• {t}" for t in tasks]) if tasks else "• Hoàn thành lộ trình hàng ngày trên website."
                            
                            embed = discord.Embed(
                                title=f"🍵 ĐẾN GIỜ HỌC RỒI CẬU ƠI! ({day_vi})",
                                description=f"Đừng lười biếng nhé! Hôm nay chúng ta sẽ ôn luyện chủ đề **{topic_today}**.",
                                color=discord.Color.from_rgb(167, 208, 140)
                            )
                            embed.add_field(name="📝 Nhiệm vụ hôm nay:", value=tasks_str, inline=False)
                            
                            # If words_data is generated, add it to embed
                            if words_data and "words" in words_data:
                                vocab_lines = []
                                for w in words_data["words"]:
                                    vocab_lines.append(f"• **{w.get('word')}** ({w.get('phonetic')}) - {w.get('meaning')}\n*Ex:* {w.get('example')}")
                                embed.add_field(name="📚 3 từ vựng IELTS tiêu biểu hôm nay:", value="\n".join(vocab_lines), inline=False)
                                
                                if "speaking_prompt" in words_data:
                                    embed.add_field(
                                        name="💬 Luyện hội thoại (Speaking Prompt):",
                                        value=f"*\"{words_data['speaking_prompt']}\"*\n\n👉 **Hãy reply tin nhắn này** bằng tiếng Anh để tớ chấm điểm phát âm & ngữ pháp giúp cậu nhé! 🍵",
                                        inline=False
                                    )
                                    
                            if tip:
                                embed.add_field(name="💡 Gợi ý học tập:", value=tip, inline=False)
                            
                            # Generate dynamic calendar sync link
                            try:
                                import jwt
                                from auth_routes import JWT_SECRET, JWT_ALGORITHM
                                cal_token = jwt.encode({
                                    "user_id": user.id,
                                    "exp": datetime.utcnow() + timedelta(days=365)
                                }, JWT_SECRET, algorithm=JWT_ALGORITHM)
                                cal_url = f"https://ieltsoasis.site/api/study-plan/calendar.ics?token={cal_token}"
                                embed.add_field(
                                    name="📅 Google Calendar Sync:",
                                    value=f"Đồng bộ lịch học một chạm vào điện thoại/máy tính của cậu:\n👉 [Nhấn vào đây để liên kết Lịch]({cal_url})",
                                    inline=False
                                )
                            except Exception as e:
                                logger.error(f"Failed to generate calendar link in bot: {e}")
                                cal_url = ""

                            embed.set_footer(text="Truy cập Mát Cha AI Eo để luyện tập đầy đủ hơn nhé! 🎉")
                            
                            await discord_user.send(embed=embed)
                        else:
                            try:
                                import jwt
                                from auth_routes import JWT_SECRET, JWT_ALGORITHM
                                cal_token = jwt.encode({
                                    "user_id": user.id,
                                    "exp": datetime.utcnow() + timedelta(days=365)
                                }, JWT_SECRET, algorithm=JWT_ALGORITHM)
                                cal_url = f"https://ieltsoasis.site/api/study-plan/calendar.ics?token={cal_token}"
                                cal_msg = f"\n📅 Đồng bộ Google Calendar: {cal_url}"
                            except Exception:
                                cal_msg = ""
                            await discord_user.send(f"🔥 ĐẾN GIỜ HỌC RỒI! Đừng lười biếng nữa. Hôm nay bạn phải hoàn thành lộ trình chủ đề **{sched.topic}**. Truy cập Mát Cha AI Eo ngay lập tức!{cal_msg}")
                except Exception as e:
                    logger.error(e)
                    
    db.close()

if __name__ == "__main__":
    if DISCORD_BOT_TOKEN:
        bot.run(DISCORD_BOT_TOKEN)
    else:
        logger.warning("CẢNH BÁO: Chưa cấu hình DISCORD_BOT_TOKEN trong file .env")

