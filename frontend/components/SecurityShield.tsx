"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ShieldCheck, RefreshCw, AlertCircle } from "lucide-react";

export function SecurityShield({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [deviceError, setDeviceError] = useState<boolean>(false);
  const [isSlow, setIsSlow] = useState<boolean>(false);
  const [rayId, setRayId] = useState<string>("");
  const [retryNonce, setRetryNonce] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
    // Generate rayId once on client mount to completely prevent SSR hydration mismatch
    setRayId(Math.random().toString(16).substring(2, 10).toUpperCase());

    // Auto-bypass only in local development environment
    if (process.env.NODE_ENV !== "production") {
      setIsVerified(true);
      return;
    }

    const verified = sessionStorage.getItem("turnstile_verified") === "true";
    if (verified) {
      setIsVerified(true);
    }
  }, [pathname]);

  const handleRetry = () => {
    setDeviceError(false);
    setIsSlow(false);
    setRetryNonce((prev) => prev + 1);
  };

  useEffect(() => {
    if (isVerified || !isMounted) return;

    let active = true;
    let retryTimer: NodeJS.Timeout | null = null;
    let verifyTimer: NodeJS.Timeout | null = null;

    // Timeout safety fallback: alert user if network or extension is slow/blocking Turnstile
    const timeoutTimer = setTimeout(() => {
      if (active && !isVerified) {
        setIsSlow(true);
      }
    }, 6000);

    const renderCaptcha = () => {
      if (!active) return;
      const container = containerRef.current;
      if (container && (window as any).turnstile) {
        try {
          if (widgetIdRef.current !== null) {
            try {
              (window as any).turnstile.remove(widgetIdRef.current);
            } catch (e) {}
          }
          container.innerHTML = "";

          const turnstileDiv = document.createElement("div");
          container.appendChild(turnstileDiv);

          widgetIdRef.current = (window as any).turnstile.render(turnstileDiv, {
            sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "0x4AAAAAAD5-TV0_dcBjBpVd",
            theme: "dark",
            action: "security-shield",
            retry: "auto",
            "retry-interval": 8000, // Standard 8s interval prevents spamming Cloudflare on challenge failures
            "refresh-expired": "auto",
            callback: (token: string) => {
              if (token) {
                sessionStorage.setItem("turnstile_verified", "true");
                verifyTimer = setTimeout(() => {
                  if (active) {
                    setIsVerified(true);
                  }
                }, 500);
              }
            },
            "expired-callback": () => {
              sessionStorage.removeItem("turnstile_verified");
            },
            "error-callback": (errorCode: any) => {
              console.warn("Turnstile device verification error:", errorCode);
              sessionStorage.removeItem("turnstile_verified");
              setDeviceError(true);
            }
          });
        } catch (e) {
          console.error("Turnstile render error:", e);
          setDeviceError(true);
        }
      } else {
        retryTimer = setTimeout(renderCaptcha, 250);
      }
    };

    renderCaptcha();

    return () => {
      active = false;
      clearTimeout(timeoutTimer);
      if (retryTimer) clearTimeout(retryTimer);
      if (verifyTimer) clearTimeout(verifyTimer);
      if (widgetIdRef.current !== null && (window as any).turnstile) {
        try {
          (window as any).turnstile.remove(widgetIdRef.current);
        } catch (e) {}
      }
    };
  }, [isVerified, isMounted, retryNonce]);

  // Prevent rendering anything on server side to ensure zero hydration mismatch
  if (!isMounted) {
    return null;
  }

  return (
    <>
      <AnimatePresence>
        {!isVerified && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="fixed inset-0 w-screen h-screen bg-[#0d0d0f] z-[99999999] flex flex-col justify-between items-center p-6 md:p-12 text-[#f3f4f6] select-none font-sans overflow-y-auto"
          >
            {/* Top Empty Space */}
            <div className="h-4"></div>

            {/* Verification Content Box */}
            <div className="w-full max-w-xl flex flex-col items-start gap-4 my-auto">
              <div className="flex items-center gap-2 text-[#10b981] font-bold text-lg">
                <ShieldCheck className="w-5 h-5 text-[#10b981]" />
                <span>ieltsoasis.site</span>
              </div>
              
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#f3f4f6] mt-1">
                Thực hiện xác minh bảo mật
              </h2>

              <p className="text-sm md:text-base text-[#9ca3af] leading-relaxed max-w-lg font-medium">
                Hệ thống xác minh bạn không phải là bot độc hại để đảm bảo trải nghiệm an toàn và ổn định cho nền tảng IELTS Oasis.
              </p>

              {/* Turnstile Container Box */}
              <div 
                className="mt-4 p-4 rounded-xl border border-[#1f2937] bg-[#111827] min-h-[75px] w-full max-w-[350px] flex items-center justify-center shadow-lg"
              >
                <div ref={containerRef} id="global-turnstile-container"></div>
              </div>

              {/* Retry Section when Cloudflare verification needs user interaction, encounters error 600010, or is blocked by extension/adblock */}
              {(deviceError || isSlow) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 w-full max-w-md p-4 rounded-xl border border-amber-500/20 bg-amber-500/10 backdrop-blur-sm"
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-3">
                      <p className="text-xs md:text-sm text-neutral-200 leading-relaxed font-medium">
                        {deviceError 
                          ? "Trình duyệt hoặc tiện ích mở rộng (AdBlock / Extension) có thể đang chặn dịch vụ xác minh Cloudflare (Mã lỗi 600010). Vui lòng tạm tắt trình chặn quảng cáo và bấm 'Thử lại' để tải lại widget xác minh."
                          : "Đang kết nối đến máy chủ bảo mật Cloudflare. Nếu quá trình tải lâu, bạn có thể bấm 'Thử lại' bên dưới để tải lại thử thách."
                        }
                      </p>

                      <div className="pt-1 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={handleRetry}
                          className="min-h-[44px] px-5 py-2.5 text-xs md:text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
                        >
                          <RefreshCw className="w-4 h-4" />
                          <span>Thử lại xác minh Cloudflare</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Bottom Footer Details */}
            <div className="text-[11px] text-[#6b7280] flex flex-col items-center gap-1 font-mono text-center mt-6">
              <span>Ray ID: {rayId || "8C90A1DF"} • Dịch vụ bảo vệ bởi Cloudflare & IELTS Oasis</span>
              <span>An toàn • Không lưu cookie theo dõi cá nhân</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Show actual app pages when verified */}
      {isVerified && children}
    </>
  );
}
