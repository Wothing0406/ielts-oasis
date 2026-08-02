"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
              <div className={`p-2 rounded-2xl flex-shrink-0 ${
                toast.type === 'success' 
                  ? 'bg-primary/10 text-primary' 
                  : toast.type === 'error'
                  ? 'bg-red-50 text-red-500'
                  : 'bg-blue-50 text-blue-500'
              }`}>
                <span className="material-symbols-rounded text-2xl">
                  {toast.type === 'success' ? 'local_cafe' : toast.type === 'error' ? 'sentiment_very_dissatisfied' : 'info'}
                </span>
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-sm font-bold text-[#4E342E] leading-snug break-words">
                  {toast.message}
                </p>
              </div>
              <button 
                type="button" 
                onClick={onCloseToast}
                className="text-[#4E342E]/40 hover:text-[#4E342E] transition-colors p-0.5"
              >
                <span className="material-symbols-rounded text-lg">close</span>
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
              className="bg-[#FAF8F5] w-full max-w-md p-6 md:p-8 rounded-[2.5rem] border-4 border-primary/30 relative z-10 shadow-2xl flex flex-col items-center text-center gap-5"
            >
              {/* Mascot / Icon Container */}
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary animate-bounce">
                <span className="material-symbols-rounded text-5xl">
                  {modal.type === 'success' 
                    ? 'local_cafe' 
                    : modal.type === 'error'
                    ? 'sentiment_very_dissatisfied'
                    : modal.type === 'confirm'
                    ? 'help_outline'
                    : 'eco'}
                </span>
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
              <div className="flex gap-3 w-full justify-center mt-2">
                {modal.onCancel && (
                  <button
                    type="button"
                    onClick={() => {
                      modal.onCancel?.();
                      onCloseModal();
                    }}
                    className="bg-white border-2 border-primary/20 hover:bg-secondary/20 text-[#4E342E] font-bold px-6 py-2.5 rounded-full text-sm transition-all"
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
                  className="bg-primary hover:bg-primary/90 text-white font-bold px-8 py-2.5 rounded-full text-sm shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all"
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
