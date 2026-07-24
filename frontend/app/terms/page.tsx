"use client";

import Link from "next/link";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#FFFDF5] text-[#5D4037] font-sans py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white border-4 border-[#A7D08C]/30 rounded-[2.5rem] p-8 md:p-12 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#A7D08C]/20 pb-6 mb-8">
          <div className="flex items-center gap-3">
            <span className="material-symbols-rounded text-4xl text-[#A7D08C]">gavel</span>
            <div>
              <h1 className="text-2xl font-black font-display text-[#5D4037]">Điều Khoản Dịch Vụ (Terms of Service)</h1>
              <p className="text-xs text-[#5D4037]/60">IELTS Oasis • Cập nhật lần cuối: 24/07/2026</p>
            </div>
          </div>
          <Link
            href="/"
            className="bg-[#A7D08C] text-white px-4 py-2 rounded-full text-xs font-bold shadow-sm hover:bg-[#8FBE72] transition-all flex items-center gap-1"
          >
            <span className="material-symbols-rounded text-sm">arrow_back</span>
            Trang chủ
          </Link>
        </div>

        <div className="space-y-6 text-sm leading-relaxed text-[#5D4037]/90">
          <section>
            <h2 className="text-base font-bold text-[#2E3E2B] mb-2 flex items-center gap-2">
              <span>🍵</span> 1. Giới thiệu chung
            </h2>
            <p>
              Chào mừng bạn đến với <b>IELTS Oasis</b>. Khi bạn truy cập website hoặc sử dụng ứng dụng Discord Bot của chúng tôi, bạn đồng ý tuân thủ các Điều khoản dịch vụ này. Vui lòng đọc kỹ các quy định trước khi tiếp tục sử dụng.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#2E3E2B] mb-2 flex items-center gap-2">
              <span>👤</span> 2. Tài khoản & Đăng nhập
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Bạn có thể tạo tài khoản thông qua tên người dùng/mật khẩu hoặc đăng nhập nhanh bằng Discord OAuth.</li>
              <li>Bạn có trách nhiệm bảo mật thông tin đăng nhập cá nhân và mọi hoạt động diễn ra dưới tài khoản của mình.</li>
              <li>Mỗi người dùng chỉ nên đăng ký 1 tài khoản để đảm bảo tính chính xác cho dữ liệu học tập cá nhân.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#2E3E2B] mb-2 flex items-center gap-2">
              <span>🛡️</span> 3. Quy định sử dụng & Bảo mật
            </h2>
            <p>
              Để duy trì môi trường học tập Zen tích cực cho cộng đồng, nghiêm cấm các hành vi:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-1">
              <li>Spam tài khoản rác, gửi liên tục dữ liệu độc hại hoặc cố tình gây quá tải hệ thống (DDoS).</li>
              <li>Sử dụng các công cụ can thiệp bất hợp pháp vào API hoặc dữ liệu bài học.</li>
              <li>Chia sẻ các nội dung vi phạm pháp luật, ngôn từ thù hận hoặc đe dọa các thành viên khác trên Oasis Community.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#2E3E2B] mb-2 flex items-center gap-2">
              <span>🤖</span> 4. Tích hợp Discord Bot
            </h2>
            <p>
              Robot hỗ trợ học tập IELTS Oasis trên Discord tuân thủ nghiêm ngặt Chính sách dành cho nhà phát triển của Discord. Bot cung cấp các lệnh tra cứu từ vựng (`/lookup`), tạo lịch học (`/dailyplan`), nhắc nhở ôn tập và tư vấn lộ trình học tập IELTS cá nhân hóa.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#2E3E2B] mb-2 flex items-center gap-2">
              <span>✉️</span> 5. Liên hệ & Hỗ trợ
            </h2>
            <p>
              Nếu có bất kỳ thắc mắc nào về Điều khoản dịch vụ hoặc đóng góp ý kiến xây dựng sản phẩm, vui lòng liên hệ đội ngũ quản trị qua Discord Server chính thức hoặc gửi yêu cầu hỗ trợ trực tiếp trên website.
            </p>
          </section>
        </div>

        <div className="mt-10 border-t border-[#A7D08C]/20 pt-6 text-center text-xs text-[#5D4037]/60">
          © 2026 IELTS Oasis. Zen Learning Space for IELTS Learners. All rights reserved.
        </div>
      </div>
    </div>
  );
}
