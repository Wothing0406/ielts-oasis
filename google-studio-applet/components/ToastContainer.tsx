"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}

const ToastContainer = ({ toasts, onRemove }: { toasts: Toast[], onRemove: (id: string) => void }) => {
  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 items-center pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
            className={`px-8 py-4 rounded-full shadow-2xl font-bold text-white flex items-center gap-3 pointer-events-auto ${
              toast.type === 'success' ? 'bg-primary' : 'bg-red-500'
            }`}
          >
            <span className="material-symbols-rounded">
              {toast.type === 'success' ? 'check_circle' : 'error'}
            </span>
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastContainer;
