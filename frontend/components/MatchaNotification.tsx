"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, AlertTriangle, HelpCircle, Info, X, Leaf, Sparkles } from 'lucide-react';

export interface ToastData {
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface ModalData {
  title: string;
  message: string;
  type?: 'warning' | 'success' | 'error' | 'confirm';
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface MatchaNotificationProps {
  toast: ToastData | null;
  onCloseToast: () => void;
  modal: ModalData | null;
  onCloseModal: () => void;
}

export default function MatchaNotification({ toast, onCloseToast, modal, onCloseModal }: MatchaNotificationProps) {
  return (
    <>
      {/* Toast Notification */}
      <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[10000] pointer-events-none w-full max-w-sm px-4">
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className="pointer-events-auto bg-[#FAF8F5] border-4 border-primary/30 shadow-2xl rounded-3xl p-4 flex items-start gap-3 w-full"
            >
              <div className={`p-2.5 rounded-2xl shrink-0 ${
                toast.type === 'success' 
                  ? 'bg-primary/10 text-primary' 
                  : toast.type === 'error'
                  ? 'bg-red-50 text-red-500'
                  : 'bg-blue-50 text-blue-500'
              }`}>
                {toast.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                ) : toast.type === 'error' ? (
                  <AlertCircle className="w-5 h-5 shrink-0" />
                ) : (
                  <Info className="w-5 h-5 shrink-0" />
                )}
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-sm font-bold text-[#4E342E] leading-snug break-words">
                  {toast.message}
                </p>
              </div>
              <button 
                type="button" 
                onClick={onCloseToast}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center text-[#4E342E]/40 hover:text-[#4E342E] rounded-full hover:bg-black/5 active:scale-95 transition-all p-1"
                aria-label="Đóng thông báo"
              >
                <X className="w-4 h-4 shrink-0" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Custom Modal */}
      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseModal}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#FAF8F5] w-full max-w-md p-6 sm:p-8 rounded-[2.5rem] border-4 border-primary/30 relative z-10 shadow-2xl flex flex-col items-center text-center gap-5"
            >
              {/* Mascot / Icon Container */}
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary animate-bounce shrink-0">
                {modal.type === 'success' ? (
                  <Sparkles className="w-10 h-10 shrink-0 text-primary" />
                ) : modal.type === 'error' ? (
                  <AlertCircle className="w-10 h-10 shrink-0 text-red-500" />
                ) : modal.type === 'confirm' ? (
                  <HelpCircle className="w-10 h-10 shrink-0 text-primary" />
                ) : modal.type === 'warning' ? (
                  <AlertTriangle className="w-10 h-10 shrink-0 text-amber-500" />
                ) : (
                  <Leaf className="w-10 h-10 shrink-0 text-primary" />
                )}
              </div>

              {/* Title & Description */}
              <div className="flex flex-col gap-2 w-full">
                <h3 className="font-display font-black text-xl text-[#4E342E]">
                  {modal.title}
                </h3>
                <p className="text-sm text-[#4E342E]/80 leading-relaxed font-medium break-words">
                  {modal.message}
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 w-full justify-center mt-2">
                {modal.onCancel && (
                  <button
                    type="button"
                    onClick={() => {
                      modal.onCancel?.();
                      onCloseModal();
                    }}
                    className="min-h-[44px] bg-white border-2 border-primary/20 hover:bg-secondary/20 text-[#4E342E] font-bold px-6 py-2.5 rounded-full text-sm active:scale-95 transition-all flex items-center justify-center"
                  >
                    {modal.cancelText || 'Hủy'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    modal.onConfirm?.();
                    onCloseModal();
                  }}
                  className="min-h-[44px] bg-primary hover:bg-primary/90 text-white font-bold px-8 py-2.5 rounded-full text-sm shadow-lg shadow-primary/10 hover:shadow-primary/20 active:scale-95 transition-all flex items-center justify-center"
                >
                  {modal.confirmText || 'Đồng ý'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
