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
        await interaction.response.send_message("Cảm ơn bạn đã tiếp tục đồng hành cùng IELTS Oasis! 🍵", ephemeral=True)
        self.stop()

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
    ref_msg = None
    if message.reference and message.reference.message_id:
        try:
            ref_msg = await message.channel.fetch_message(message.reference.message_id)
            if ref_msg.author.id == bot.user.id:
                is_reply_to_bot = True
        except:
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
                    
                    Hãy đóng vai là thầy giáo IELTS Oasis. Đánh giá câu trả lời này đúng hay sai, từ đó xếp loại trình độ.
                    Đề xuất lịch nhắc học mỗi ngày (ví dụ 20:00) dựa trên thông tin thời gian rảnh.
                    Và tạo một lộ trình học chi tiết cụ thể cho cả tuần (Thứ 2 đến Chủ nhật).
                    Chủ đề của từng ngày phải cụ thể và có task list rõ ràng để học viên biết phải làm gì trên website, kèm gợi ý (tip).
                    
                    Trả về định dạng JSON chính xác như sau:
                    {{
                        "evaluation": "nhận xét chi tiết tiếng Việt",
                        "level": "Beginner/Intermediate/Advanced",
                        "time": "HH:MM",
                        "topic": "chủ đề chung",
                        "weekly_plan": {{
                            "Monday": {{"topic": "chủ đề", "tasks": ["nhiệm vụ 1", "nhiệm vụ 2"], "tip": "gợi ý"}},
                            "Tuesday": {{"topic": "chủ đề", "tasks": ["nhiệm vụ 1", "nhiệm vụ 2"], "tip": "gợi ý"}},
                            "Wednesday": {{"topic": "chủ đề", "tasks": ["nhiệm vụ 1", "nhiệm vụ 2"], "tip": "gợi ý"}},
                            "Thursday": {{"topic": "chủ đề", "tasks": ["nhiệm vụ 1", "nhiệm vụ 2"], "tip": "gợi ý"}},
                            "Friday": {{"topic": "chủ đề", "tasks": ["nhiệm vụ 1", "nhiệm vụ 2"], "tip": "gợi ý"}},
                            "Saturday": {{"topic": "chủ đề", "tasks": ["nhiệm vụ 1", "nhiệm vụ 2"], "tip": "gợi ý"}},
                            "Sunday": {{"topic": "chủ đề", "tasks": ["nhiệm vụ 1", "nhiệm vụ 2"], "tip": "gợi ý"}}
                        }}
                    }}
                    """
                    try:
                        data = await ai_service.get_json_advice(e_prompt)
                        if not data or "evaluation" not in data:
                            data = {"evaluation": "Khá tốt!", "level": "Intermediate", "time": "20:00", "topic": "General", "weekly_plan": {}}
                    except:
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
                            sched = DiscordSchedule(user_id=user.id)
                            db.add(sched)
                        sched.study_time = time_str
                        sched.level = str(data.get("level", "Beginner"))[:50]
                        sched.topic = str(data.get("topic", "General"))[:100]
                        sched.weekly_plan = data.get("weekly_plan")
                        db.commit()
                    
                    db.close()
                    user_states.pop(discord_id, None)
                    
                    # Create rich embed
                    embed = discord.Embed(
                        title=f"🍵 LỘ TRÌNH HỌC TẬP IELTS OASIS",
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
                            
                    embed.set_footer(text="Hãy bắt đầu bài học đầu tiên trên trang web IELTS Oasis nhé! 🎉")
                    await message.reply(embed=embed)
                    return
 
        # 2. General reply context or mention context
        async with message.channel.typing():
            if not content:
                content = "Chào bạn"
                
            if is_reply_to_bot and ref_msg:
                # Direct reply to a specific bot message
                replied_cleaned = ref_msg.content.replace(f'<@{bot.user.id}>', '').strip()
                prompt = f"""
                Bạn là một gia sư IELTS tên là IELTS Oasis. Hãy trả lời ngắn gọn, thân thiện, tự nhiên và hữu ích bằng tiếng Việt.
                Quy tắc quan trọng:
                1. Hãy trả lời trực tiếp phản hồi của học viên đối với câu nói trước đó của bạn.
                2. Nếu học viên chào hỏi, hãy chào lại thân thiện.
                3. CHỈ tạo bài tập/quiz trắc nghiệm nếu họ rõ ràng yêu cầu được làm bài tập hay luyện tập.
                
                Ngữ cảnh hội thoại:
                - Bạn (IELTS Oasis) đã nói trước đó: "{replied_cleaned}"
                - Học viên vừa reply/phản hồi lại câu trên của bạn: "{content}"
                
                Hãy đưa ra phản hồi tiếp theo của bạn:
                """
            else:
                # Normal mention or DM chat history
                history_messages = []
                try:
                    async for msg in message.channel.history(limit=6):
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
                2. Nếu học viên hỏi về kiến thức tiếng Anh (ngữ pháp, từ vựng, phát âm, lời khuyên viết bài), hãy giải thích ngắn gọn, dễ hiểu và cho ví dụ rõ ràng.
                3. CHỈ tạo bài tập/quiz trắc nghiệm nếu họ rõ ràng yêu cầu.
                
                Dưới đây là lịch sử hội thoại gần đây giữa bạn (IELTS Oasis) và học viên:
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

@bot.tree.command(name='nghihoc', description="Huỷ bỏ lịch học và xoá sạch dữ liệu của bạn trên hệ thống")
async def nghihoc_cmd(interaction: discord.Interaction):
    discord_id = str(interaction.user.id)
    db = SessionLocal()
    user = db.query(User).filter(User.discord_id == discord_id).first()
    db.close()
    
    if not user:
        await interaction.response.send_message("Bạn chưa đăng ký lộ trình học tập trên IELTS Oasis!", ephemeral=True)
        return

    view = ConfirmQuitView(discord_id)
    await interaction.response.send_message(
        "⚠️ **CẢNH BÁO NGUY HIỂM:** Bạn có chắc chắn muốn **NGHỈ HỌC**? Thao tác này sẽ xóa toàn bộ từ vựng, lịch sử viết bài luận, lịch nhắc học và tài khoản của bạn trên IELTS Oasis. Thao tác này **không thể khôi phục**!",
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
                            
                            tasks_str = "\n".join([f"• {t}" for t in tasks]) if tasks else "• Hoàn thành lộ trình hàng ngày trên website."
                            
                            embed = discord.Embed(
                                title=f"🍵 ĐẾN GIỜ HỌC RỒI CẬU ƠI! ({day_vi})",
                                description=f"Đừng lười biếng nhé! Hôm nay chúng ta sẽ ôn luyện chủ đề **{topic_today}**.",
                                color=discord.Color.from_rgb(167, 208, 140)
                            )
                            embed.add_field(name="📝 Nhiệm vụ hôm nay:", value=tasks_str, inline=False)
                            if tip:
                                embed.add_field(name="💡 Gợi ý học tập:", value=tip, inline=False)
                            embed.set_footer(text="Truy cập IELTS Oasis ngay lập tức nhé! 🎉")
                            
                            await discord_user.send(embed=embed)
                        else:
                            await discord_user.send(f"🔥 ĐẾN GIỜ HỌC RỒI! Đừng lười biếng nữa. Hôm nay bạn phải hoàn thành lộ trình chủ đề **{sched.topic}**. Truy cập IELTS Oasis ngay lập tức!")
                except Exception as e:
                    logger.error(e)
                    
    db.close()

if __name__ == "__main__":
    if DISCORD_BOT_TOKEN:
        bot.run(DISCORD_BOT_TOKEN)
    else:
        logger.warning("CẢNH BÁO: Chưa cấu hình DISCORD_BOT_TOKEN trong file .env")

