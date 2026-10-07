"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Users, Sparkles, BookOpen, User, LogIn } from "lucide-react";
import CommunityFeed from "@/components/CommunityFeed";
import MatchaNotification, { ToastData } from "@/components/MatchaNotification";

const API_URL = "/api";

export default function CommunityPage() {
  const [user, setUser] = useState<any>(null);
  const [vocabList, setVocabList] = useState<any[]>([]);
  const [toast, setToast] = useState<ToastData | null>(null);

  useEffect(() => {
    (window as any).showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
      setToast({ message, type });
    };

    const savedUser = localStorage.getItem("oasis_user");
    const token = localStorage.getItem("oasis_token");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {}
    }

    if (token) {
      fetchVocabs(token);
    }
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchVocabs = async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/vocabularies`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setVocabList(data);
      }
    } catch (e) {
      console.error("Error fetching vocabs in community:", e);
    }
  };

  const handleAddVocab = async (vocabData: any) => {
    const token = localStorage.getItem("oasis_token");
    if (!token) {
      (window as any).showToast?.("Vui lòng đăng nhập để lưu từ vựng!", "info");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/vocabularies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(vocabData)
      });
      if (res.ok) {
        const newWord = await res.json();
        setVocabList((prev) => [newWord, ...prev]);
        (window as any).showToast?.(`Đã lưu "${vocabData.word}" vào sổ tay!`, "success");
        return newWord;
      }
    } catch (e) {
      console.error("Failed to add vocab:", e);
      (window as any).showToast?.("Không thể lưu từ vựng.", "error");
    }
  };

  const handleDeleteVocab = async (id: number) => {
    const token = localStorage.getItem("oasis_token");
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/vocabularies/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setVocabList((prev) => prev.filter((v) => v.id !== id));
        (window as any).showToast?.("Đã xoá từ khỏi sổ tay", "success");
      }
    } catch (e) {
      console.error("Failed to delete vocab:", e);
    }
  };

  const handleSelectListening = (text: string) => {
    sessionStorage.setItem("oasis_active_listening", text);
    window.location.href = "/#matcha-radio";
  };

  const handleSelectReading = (text: string) => {
    sessionStorage.setItem("oasis_active_reading", text);
    window.location.href = "/#matcha-book";
  };

  const handleSelectSpeaking = (prompt: string) => {
    sessionStorage.setItem("oasis_active_speaking", prompt);
    window.location.href = "/#matcha-speak";
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#121312] text-[#2E3E2B] dark:text-[#E2E8F0] font-sans transition-colors">
      {/* Toast Notification */}
      {toast && (
        <MatchaNotification
          toast={toast}
          onCloseToast={() => setToast(null)}
          modal={null}
          onCloseModal={() => {}}
        />
      )}

      {/* Community Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#FAF7F2]/90 dark:bg-[#121312]/90 backdrop-blur-md border-b border-[#7A9A6A]/15 px-4 md:px-8 py-3.5 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs md:text-sm font-semibold bg-white dark:bg-neutral-800 border border-[#7A9A6A]/20 hover:border-[#7A9A6A]/50 text-[#3C4A39] dark:text-neutral-200 shadow-sm transition-all active:scale-95 min-h-[44px]"
            >
              <ArrowLeft className="w-4 h-4 text-[#7A9A6A]" />
              <span>Về Trang Chủ</span>
            </Link>

            <div className="h-5 w-px bg-neutral-300 dark:bg-neutral-700 hidden sm:block"></div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#7A9A6A]/15 text-[#5A7A4A] dark:text-[#88B878] flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-sm md:text-base font-bold text-[#2E3E2B] dark:text-white leading-tight flex items-center gap-1.5">
                  <span>Oasis Community</span>
                  <span className="hidden sm:inline-block text-[10px] font-semibold bg-[#7A9A6A]/15 text-[#5A7A4A] dark:text-[#88B878] px-2 py-0.5 rounded-full">
                    Bảng Tin Mở
                  </span>
                </h1>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 hidden md:block">
                  Chia sẻ bài viết, khám phá kho Oxford 5000 và kết nối học viên IELTS
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {user ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-800 border border-[#7A9A6A]/20 shadow-sm">
                <div className="w-6 h-6 rounded-full bg-[#7A9A6A] text-white flex items-center justify-center text-xs font-bold uppercase">
                  {user.username?.[0] || "U"}
                </div>
                <span className="text-xs font-medium text-neutral-700 dark:text-neutral-200 hidden sm:inline">
                  {user.username}
                </span>
              </div>
            ) : (
              <Link
                href="/?login=true"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#7A9A6A] hover:bg-[#688659] text-white shadow-sm transition-all active:scale-95 min-h-[44px]"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Đăng nhập</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8">
        <CommunityFeed
          onAddVocab={handleAddVocab}
          vocabList={vocabList}
          onListenPost={handleSelectListening}
          onReadPost={handleSelectReading}
          onSpeakPost={handleSelectSpeaking}
          onDeleteVocab={handleDeleteVocab}
        />
      </main>
    </div>
  );
}
