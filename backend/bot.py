import os
import discord
from discord.ext import commands, tasks
from dotenv import load_dotenv
from database import SessionLocal
from models import User, Vocabulary, WritingLog
from datetime import datetime
from services.ai_service import ai_service
import asyncio

load_dotenv()

DISCORD_BOT_TOKEN = os.getenv("DISCORD_BOT_TOKEN")

intents = discord.Intents.default()
intents.message_content = True
# intents.members = True (Removed to prevent PrivilegedIntentsRequired error)

bot = commands.Bot(command_prefix='/', intents=intents)

@bot.event
async def on_ready():
    print(f'Logged in as {bot.user} (ID: {bot.user.id})')
    print('------')
    daily_reminder.start()

@bot.command(name='tuvan')
async def tuvan(ctx):
    """Tư vấn lộ trình học tập dựa trên dữ liệu web"""
    discord_id = str(ctx.author.id)
    db = SessionLocal()
    user = db.query(User).filter(User.discord_id == discord_id).first()
    
    if not user:
        await ctx.send("Bạn chưa đăng nhập trên web IELTS Oasis! Hãy đăng nhập trên web bằng Discord để tôi có thể tư vấn nhé.")
        db.close()
        return

    # Lấy dữ liệu học tập
    vocab_count = db.query(Vocabulary).filter(Vocabulary.user_id == user.id).count()
    writing_count = db.query(WritingLog).filter(WritingLog.user_id == user.id).count()
    
    prompt = f"Học sinh {user.username} đã học được {vocab_count} từ vựng và viết {writing_count} bài luận trên hệ thống. Hãy đưa ra 1 lời khuyên ngắn gọn (dưới 100 chữ) bằng tiếng Việt để khích lệ và gợi ý lộ trình tiếp theo."
    
    msg = await ctx.send("Đang phân tích dữ liệu học tập của bạn... 🍵")
    
    # Dùng AI để tư vấn
    try:
        # Gọi thẳng ai_service (cần cẩn thận async context)
        response = await ai_service.get_advice(prompt) 
        if response:
            await msg.edit(content=f"**Tư vấn cho {user.username}:**\n{response.strip()}")
        else:
            await msg.edit(content="Xin lỗi, AI hiện đang bận. Bạn hãy học thêm từ vựng nhé!")
    except Exception as e:
        await msg.edit(content="Đã có lỗi xảy ra khi tư vấn.")
        
    db.close()

@bot.command(name='huongdan')
async def huongdan(ctx):
    """Hướng dẫn sử dụng web"""
    embed = discord.Embed(
        title="📚 Hướng dẫn sử dụng IELTS Oasis",
        description="Chào mừng bạn đến với hệ thống học IELTS thông minh!",
        color=discord.Color.green()
    )
    embed.add_field(name="🍵 Matcha Lens", value="Chụp ảnh đồ vật để AI quét và tạo từ vựng IELTS lập tức.", inline=False)
    embed.add_field(name="✍️ Writing Sanctuary", value="Viết bài và để AI chấm điểm khắt khe, chỉ ra ưu/nhược điểm rõ ràng.", inline=False)
    embed.add_field(name="🔄 Tự động nhắc nhở", value="Bot sẽ tự động nhắn tin nhắc bạn ôn tập từ vựng mỗi ngày.", inline=False)
    await ctx.send(embed=embed)

@bot.command(name='dailyplan')
async def dailyplan(ctx, *, topic: str = "General"):
    """Tạo lộ trình học tiếng Anh hỏa tốc dựa trên chủ đề bạn chọn"""
    msg = await ctx.send(f"Đang tạo lộ trình học IELTS chủ đề **{topic}** cho bạn... 🍵")
    try:
        plan = await ai_service.generate_daily_plan(topic)
        if "error" in plan:
            await msg.edit(content=f"Đã có lỗi: {plan['error']}")
            return
            
        embed = discord.Embed(
            title=f"🍵 Lộ Trình Học Siêu Tốc: {plan.get('topic', topic)}",
            description="Dưới đây là danh sách học tập hàng ngày do AI gợi ý cho bạn!",
            color=discord.Color.green()
        )
        
        # Vocab
        vocab_list = plan.get('vocabulary', [])
        vocab_text = "\n".join([f"**{v['word']}** ({v.get('phonetic', '')}) - {v.get('meaning', '')}" for v in vocab_list[:5]])
        if len(vocab_list) > 5:
            vocab_text += f"\n*...và {len(vocab_list) - 5} từ nữa*"
        embed.add_field(name="📚 Từ Vựng (Top 5)", value=vocab_text if vocab_text else "Không có", inline=False)
        
        # Listening
        listening = plan.get('listening', {})
        embed.add_field(name="🎧 Nghe", value=f"**{listening.get('title', 'N/A')}**\n{listening.get('description', 'N/A')}", inline=False)
        
        # Reading
        reading = plan.get('reading', {})
        embed.add_field(name="📖 Đọc", value=f"{reading.get('text', 'N/A')}", inline=False)
        
        # Writing
        writing = plan.get('writing', {})
        embed.add_field(name="✍️ Viết", value=f"{writing.get('prompt', 'N/A')}", inline=False)
        
        await msg.edit(content="Đã xong! Chúc bạn học tốt 🎉", embed=embed)
    except Exception as e:
        await msg.edit(content="Đã có lỗi xảy ra khi tạo lộ trình.")

@tasks.loop(hours=24)
async def daily_reminder():
    """Chạy ngầm nhắc nhở học tập mỗi ngày"""
    db = SessionLocal()
    now = datetime.utcnow()
    
    users = db.query(User).all()
    for user in users:
        # Đếm số từ vựng cần ôn tập
        due_vocab = db.query(Vocabulary).filter(
            Vocabulary.user_id == user.id,
            Vocabulary.next_review <= now
        ).count()
        
        if due_vocab > 0:
            # Gửi DM
            try:
                discord_user = await bot.fetch_user(int(user.discord_id))
                if discord_user:
                    await discord_user.send(f"🔔 Ê lười biếng! Hôm nay bạn có **{due_vocab}** từ vựng đến hạn ôn tập trên IELTS Oasis. Hãy vào học ngay để không bị rơi rụng kiến thức nhé!")
            except Exception as e:
                print(f"Không thể gửi tin nhắn cho {user.username}: {e}")
                
    db.close()

@daily_reminder.before_loop
async def before_daily_reminder():
    await bot.wait_until_ready()

if __name__ == "__main__":
    if DISCORD_BOT_TOKEN:
        bot.run(DISCORD_BOT_TOKEN)
    else:
        print("CẢNH BÁO: Chưa cấu hình DISCORD_BOT_TOKEN trong file .env")
