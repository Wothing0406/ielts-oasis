"use client";

import { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("Đang kết nối với Discord...");
  const hasFetched = useRef(false);

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    let timerId: NodeJS.Timeout;
    
    if (code && !hasFetched.current) {
      hasFetched.current = true;
      setStatus("Đang xác thực thông tin...");
      fetch('/api/auth/discord/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code,
          redirect_uri: window.location.origin + '/auth/callback',
          state
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.token) {
          localStorage.setItem('oasis_token', data.token);
          localStorage.setItem('oasis_user', JSON.stringify(data.user));
          setStatus("Đăng nhập thành công! Đang chuyển hướng...");
          timerId = setTimeout(() => {
            router.push('/');
          }, 1000);
        } else {
          setStatus("Đăng nhập thất bại: " + (data.detail || 'Unknown error'));
        }
      })
      .catch(err => {
        console.error(err);
        setStatus("Lỗi kết nối máy chủ.");
      });
    } else if (!code) {
      setStatus("Không tìm thấy mã xác thực. Vui lòng thử lại.");
    }
    
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [router, searchParams]);

  return (
    <div className="flex h-screen items-center justify-center bg-[#FFFDF5]">
      <div className="bg-white p-8 rounded-3xl shadow-xl flex flex-col items-center gap-4 text-center border-2 border-primary/20">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
          <span className="material-symbols-rounded text-primary text-3xl">sync</span>
        </div>
        <h2 className="text-2xl font-black text-accent">{status}</h2>
        <p className="text-accent/60 text-sm">Xin vui lòng không đóng cửa sổ này...</p>
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-[#FFFDF5]">
        <div className="bg-white p-8 rounded-3xl shadow-xl flex flex-col items-center gap-4 text-center border-2 border-primary/20">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
            <span className="material-symbols-rounded text-primary text-3xl">sync</span>
          </div>
          <h2 className="text-2xl font-black text-accent">Đang tải...</h2>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
