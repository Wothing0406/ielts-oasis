@echo off
chcp 65001 > nul
echo ========================================================
echo   IELTS OASIS - PUSH & DEPLOY SYSTEM
echo ========================================================
echo.
echo [1/3] Đang thêm file và commit vào git...
cd /d "c:\Users\QuangDev\Downloads\Projects\web\ielts-oasis"
git add .
git commit -m "feat: add interactive zoom resize gestures and scale bar to pet overlay"
echo.
echo [2/3] Đang đẩy code lên GitHub (branch production)...
git push origin production
echo.
echo [3/3] Đang tải code lên máy chủ Linux và restart/rebuild Docker...
python "C:\Users\QuangDev\.gemini\antigravity-ide\brain\29bd7d17-3e70-4c39-ae06-bc5f641adf5f\scratch\deploy_remote.py"
echo.
echo ========================================================
echo   HOÀN TẤT TRIỂN KHAI THÀNH CÔNG!
echo ========================================================
pause
