import React from 'react';
import { motion } from 'framer-motion';

interface HistoryModalProps {
  history: any[];
  onClose: () => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ history, onClose }) => {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-accent/20 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col border border-primary/20 z-10"
      >
        <div className="p-6 border-b border-primary/10 flex justify-between items-center bg-secondary/30 dark:bg-neutral-800/50">
          <h2 className="text-2xl font-display font-bold text-accent dark:text-primary flex items-center gap-2">
            <span className="material-symbols-rounded text-primary">history</span> Review History
          </h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            <span className="material-symbols-rounded text-sm">close</span>
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {history.length === 0 ? (
            <div className="text-center py-10 opacity-50">
              <span className="material-symbols-rounded text-4xl mb-2">inbox</span>
              <p>No review history available yet.</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {history.map((item, idx) => (
                <li key={idx} className="p-4 bg-secondary/20 dark:bg-neutral-800/40 rounded-xl border border-primary/5 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-lg text-accent dark:text-white">{item.word}</h4>
                    <p className="text-sm opacity-70 text-accent dark:text-secondary">{item.meaning}</p>
                  </div>
                  <div className="text-xs font-bold px-3 py-1 bg-primary/10 text-primary rounded-full">
                    {new Date(item.last_reviewed).toLocaleDateString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default HistoryModal;
