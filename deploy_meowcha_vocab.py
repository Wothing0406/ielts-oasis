import paramiko
import os
import sys
import time

sys.stdout.reconfigure(encoding='utf-8')

base_local = os.path.dirname(os.path.abspath(__file__))

# Danh sách toàn bộ các file code trọng yếu của game Meowcha & backend
files_to_sync = [
    # 1. Backend API & Dataset
    ("backend/models.py", "/home/quang/Downloads/ielts-oasis/backend/models.py"),
    ("backend/schemas.py", "/home/quang/Downloads/ielts-oasis/backend/schemas.py"),
    ("backend/meowcha_routes.py", "/home/quang/Downloads/ielts-oasis/backend/meowcha_routes.py"),
    ("backend/services/oxford_dataset_service.py", "/home/quang/Downloads/ielts-oasis/backend/services/oxford_dataset_service.py"),
    ("backend/seed_oxford_5000.py", "/home/quang/Downloads/ielts-oasis/backend/seed_oxford_5000.py"),
    
    # 2. Next.js wrapper page
    ("frontend/app/games/meowcha/page.tsx", "/home/quang/Downloads/ielts-oasis/frontend/app/games/meowcha/page.tsx"),
    
    # 3. Game HTML & CSS
    ("frontend/public/meowcha/index.html", "/home/quang/Downloads/ielts-oasis/frontend/public/meowcha/index.html"),
    ("frontend/public/meowcha/css/meowcha-theme.css", "/home/quang/Downloads/ielts-oasis/frontend/public/meowcha/css/meowcha-theme.css"),
    ("frontend/public/meowcha/css/meowcha-layout.css", "/home/quang/Downloads/ielts-oasis/frontend/public/meowcha/css/meowcha-layout.css"),
    ("frontend/public/meowcha/css/meowcha-ui.css", "/home/quang/Downloads/ielts-oasis/frontend/public/meowcha/css/meowcha-ui.css"),
    
    # 4. Core JS
    ("frontend/public/meowcha/js/core/VocabLoader.js", "/home/quang/Downloads/ielts-oasis/frontend/public/meowcha/js/core/VocabLoader.js"),
    ("frontend/public/meowcha/js/core/AudioManager.js", "/home/quang/Downloads/ielts-oasis/frontend/public/meowcha/js/core/AudioManager.js"),
    ("frontend/public/meowcha/js/core/GameState.js", "/home/quang/Downloads/ielts-oasis/frontend/public/meowcha/js/core/GameState.js"),
    ("frontend/public/meowcha/js/core/SaveSystem.js", "/home/quang/Downloads/ielts-oasis/frontend/public/meowcha/js/core/SaveSystem.js"),
    
    # 5. Data JS
    ("frontend/public/meowcha/js/data/RealmsData.js", "/home/quang/Downloads/ielts-oasis/frontend/public/meowcha/js/data/RealmsData.js"),
    ("frontend/public/meowcha/js/data/WordDecks.js", "/home/quang/Downloads/ielts-oasis/frontend/public/meowcha/js/data/WordDecks.js"),
    ("frontend/public/meowcha/js/data/TalentsData.js", "/home/quang/Downloads/ielts-oasis/frontend/public/meowcha/js/data/TalentsData.js"),
    ("frontend/public/meowcha/js/data/SpeechesData.js", "/home/quang/Downloads/ielts-oasis/frontend/public/meowcha/js/data/SpeechesData.js"),
    
    # 6. Entities & Combat JS
    ("frontend/public/meowcha/js/entities/CatCultivator.js", "/home/quang/Downloads/ielts-oasis/frontend/public/meowcha/js/entities/CatCultivator.js"),
    ("frontend/public/meowcha/js/entities/AsteroidManager.js", "/home/quang/Downloads/ielts-oasis/frontend/public/meowcha/js/entities/AsteroidManager.js"),
    ("frontend/public/meowcha/js/entities/ProjectileSystem.js", "/home/quang/Downloads/ielts-oasis/frontend/public/meowcha/js/entities/ProjectileSystem.js"),
    ("frontend/public/meowcha/js/combat/TypingEngine.js", "/home/quang/Downloads/ielts-oasis/frontend/public/meowcha/js/combat/TypingEngine.js"),
    ("frontend/public/meowcha/js/combat/BreakthroughFlow.js", "/home/quang/Downloads/ielts-oasis/frontend/public/meowcha/js/combat/BreakthroughFlow.js"),
    
    # 7. Effects JS
    ("frontend/public/meowcha/js/effects/ParticleEngine.js", "/home/quang/Downloads/ielts-oasis/frontend/public/meowcha/js/effects/ParticleEngine.js"),
    ("frontend/public/meowcha/js/effects/RealmVFX.js", "/home/quang/Downloads/ielts-oasis/frontend/public/meowcha/js/effects/RealmVFX.js"),
    ("frontend/public/meowcha/js/effects/FloatingText.js", "/home/quang/Downloads/ielts-oasis/frontend/public/meowcha/js/effects/FloatingText.js"),
    
    # 8. UI & Main Bootstrap
    ("frontend/public/meowcha/js/ui/IPAToast.js", "/home/quang/Downloads/ielts-oasis/frontend/public/meowcha/js/ui/IPAToast.js"),
    ("frontend/public/meowcha/js/ui/VirtualKeyboard.js", "/home/quang/Downloads/ielts-oasis/frontend/public/meowcha/js/ui/VirtualKeyboard.js"),
    ("frontend/public/meowcha/js/ui/UnityBridge.js", "/home/quang/Downloads/ielts-oasis/frontend/public/meowcha/js/ui/UnityBridge.js"),
    ("frontend/public/meowcha/js/ui/UIManager.js", "/home/quang/Downloads/ielts-oasis/frontend/public/meowcha/js/ui/UIManager.js"),
    ("frontend/public/meowcha/js/main.js", "/home/quang/Downloads/ielts-oasis/frontend/public/meowcha/js/main.js"),
]

print("================================================================")
print("  🚀 TRIỂN KHAI TRỰC TIẾP QUA SFTP LÊN MÁY CHỦ 100.127.204.9...")
print("================================================================")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('100.127.204.9', username='quang', password='123', timeout=15)
print("[1/4] Kết nối SSH thành công!")

# Đảm bảo tất cả các thư mục đích đều tồn tại trước khi upload
dirs_to_ensure = set(os.path.dirname(r_path) for _, r_path in files_to_sync)
for d in sorted(dirs_to_ensure):
    ssh.exec_command(f'mkdir -p "{d}"')

sftp = ssh.open_sftp()
print("[2/4] Đang upload các file mã nguồn mới nhất...")

for rel_local, remote_path in files_to_sync:
    local_path = os.path.join(base_local, rel_local)
    if os.path.exists(local_path):
        size = os.path.getsize(local_path)
        print(f"  -> Uploading {rel_local} ({size} bytes) ...")
        sftp.put(local_path, remote_path)
    else:
        print(f"  [CẢNH BÁO] Không tìm thấy file local: {local_path}")

sftp.close()
print("[3/4] Upload SFTP hoàn tất 100%!")

print("[4/4] Khởi động lại dịch vụ và kiểm tra kết quả...")
remote_cmds = """
cd /home/quang/Downloads/ielts-oasis
docker compose restart backend web
sleep 2
echo "--- DB MIGRATION: THÊM CỘT avatar_url VÀO meowcha_leaderboard ---"
docker compose exec -T db mysql -u root -ppassword ielts_oasis -e "ALTER TABLE meowcha_leaderboard ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500) NULL;" || true
docker compose exec -T db mysql -u root -p123456 ielts_oasis_db -e "ALTER TABLE meowcha_leaderboard ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500) NULL;" || true
echo "--- KIỂM TRA LEADERBOARD COUNT ---"
docker compose exec -T db mysql -u root -ppassword ielts_oasis -e "SELECT count(*) as total_records FROM meowcha_leaderboard;" || true
"""

stdin, stdout, stderr = ssh.exec_command(remote_cmds)
output = stdout.read().decode('utf-8', errors='ignore')
print(output)

ssh.close()
print("================================================================")
print("  ✅ HOÀN TẤT TRIỂN KHAI VÀ NẠP TỪ VỰNG OXFORD 5000 CHO MEOWCHA!")
print("================================================================")
