"use client";

import Link from "next/link";
import { Lock, BarChart3, Target, ShieldAlert, Trash2, ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#FFFDF5] text-[#5D4037] font-sans py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white border-4 border-[#A7D08C]/30 rounded-[2.5rem] p-8 md:p-12 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#A7D08C]/20 pb-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#A7D08C]/20 flex items-center justify-center text-[#2E3E2B] shrink-0">
              <Shield className="w-6 h-6 shrink-0" />
            </div>
            <div>
              <h1 className="text-2xl font-black font-display text-[#5D4037]">Chính Sách Bảo Mật (Privacy Policy)</h1>
              <p className="text-xs text-[#5D4037]/60">IELTS Oasis • Cập nhật lần cuối: 24/07/2026</p>
            </div>
          </div>
          <Link
            href="/"
            className="min-h-[44px] bg-[#A7D08C] text-white px-4 py-2 rounded-full text-xs font-bold shadow-sm hover:bg-[#8FBE72] transition-all flex items-center gap-1.5 cursor-pointer touch-manipulation active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span>Trang chủ</span>
          </Link>
        </div>

        <div className="space-y-6 text-sm leading-relaxed text-[#5D4037]/90">
          <section>
            <h2 className="text-base font-bold text-[#2E3E2B] mb-2 flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#A7D08C] shrink-0" />
              <span>1. Cam kết bảo mật dữ liệu</span>
            </h2>
            <p>
              IELTS Oasis coi trọng sự riêng tư của bạn. Chính sách này giải thích cách chúng tôi thu thập, sử dụng và bảo vệ thông tin cá nhân của bạn khi bạn tham gia vào không gian học tập IELTS Oasis.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#2E3E2B] mb-2 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#A7D08C] shrink-0" />
              <span>2. Dữ liệu chúng tôi thu thập</span>
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><b>Thông tin tài khoản:</b> Tên người dùng, mật khẩu đã mã hóa (hashing bcrypt), hoặc ID tài khoản Discord khi liên kết qua OAuth.</li>
              <li><b>Dữ liệu học tập:</b> Danh sách từ vựng cá nhân, lịch sử bài làm Writing/Reading, kết quả ôn tập Spaced Repetition.</li>
              <li><b>Nhật ký kết nối:</b> Địa chỉ IP duy nhất (đã qua lớp bảo vệ Cloudflare) được lưu tạm thời để phòng chống hành vi rác/DDoS.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#2E3E2B] mb-2 flex items-center gap-2">
              <Target className="w-4 h-4 text-[#A7D08C] shrink-0" />
              <span>3. Mục đích sử dụng thông tin</span>
            </h2>
            <p>
              Dữ liệu thu thập chỉ được dùng vào các mục đích chính đáng sau:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-1">
              <li>Cung cấp lộ trình và bài tập IELTS phù hợp với cá nhân bạn.</li>
              <li>Đồng bộ hóa dữ liệu giữa nền tảng Website và Discord Bot để giúp bạn học ở mọi nơi.</li>
              <li>Bảo vệ tài khoản của bạn trước các nguy cơ tấn công brute force và lừa đảo.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#2E3E2B] mb-2 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#A7D08C] shrink-0" />
              <span>4. Không chia sẻ với bên thứ ba</span>
            </h2>
            <p>
              Chúng tôi <b>tuyệt đối không kinh doanh, bán hoặc chia sẻ</b> thông tin cá nhân của người dùng cho bất kỳ tổ chức quảng cáo bên thứ ba nào.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#2E3E2B] mb-2 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-[#A7D08C] shrink-0" />
              <span>5. Quyền kiểm soát & Xóa dữ liệu</span>
            </h2>
            <p>
              Bạn có toàn quyền kiểm soát thông tin học tập của mình. Bạn có thể xóa bài viết, từ vựng hoặc yêu cầu hủy liên kết tài khoản Discord bất kỳ lúc nào thông qua giao diện cá nhân hoặc liên hệ với đội ngũ kỹ thuật.
            </p>
          </section>
        </div>

        <div className="mt-10 border-t border-[#A7D08C]/20 pt-6 text-center text-xs text-[#5D4037]/60">
          © 2026 IELTS Oasis. Privacy Protection Guaranteed.
        </div>
      </div>
    </div>
  );
}
