"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ArrowRight, 
  Lightbulb, 
  Volume2, 
  BookmarkCheck,
  GraduationCap
} from 'lucide-react';

interface VocabItem {
  id?: number;
  word: string;
  meaning: string;
  phonetic?: string;
  example?: string;
  memory_hook?: string;
  topic?: string;
}

interface SentenceOption {
  id: string;
  sentence_en: string;
  sentence_vi: string;
  is_correct: boolean;
  trap_reason?: string;
  collocation_highlight?: string;
}

interface Props {
  currentWord: VocabItem;
  vocabPool: VocabItem[];
  onAnswer: (isCorrect: boolean) => void;
  onNext: () => void;
  onPlayAudio?: (word: string) => void;
}

export default function TextbookSentenceMatching({
  currentWord,
  vocabPool,
  onAnswer,
  onNext,
  onPlayAudio
}: Props) {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  // Generate 3 textbook-style context sentences: 1 Correct + 2 Traps
  const sentenceOptions: SentenceOption[] = useMemo(() => {
    const word = currentWord.word.trim();
    const meaning = currentWord.meaning.trim();
    const example = currentWord.example && currentWord.example.length > 15
      ? currentWord.example
      : `The research highlighted the urgent need to ${word.toLowerCase()} potential ecological hazards in urban zones.`;

    // 1. Correct sentence with authentic academic translation
    const correctOption: SentenceOption = {
      id: 'opt_correct',
      sentence_en: example,
      sentence_vi: `Nghiên cứu nhấn mạnh nhu cầu cấp thiết nhằm ${meaning.toLowerCase()} các hiểm họa sinh thái tiềm tàng tại các khu đô thị.`,
      is_correct: true,
      collocation_highlight: `${word.toLowerCase()} potential hazards`,
      trap_reason: 'Câu dịch chuẩn xác theo ngữ cảnh học thuật Cambridge IELTS.'
    };

    // 2. Distractor 1: Opposite / Inverted meaning trap
    const trap1: SentenceOption = {
      id: 'opt_trap1',
      sentence_en: `Government subsidies inadvertently caused industries to ${word.toLowerCase()} hazardous waste production.`,
      sentence_vi: `Các khoản trợ cấp của chính phủ đã vô tình khiến các ngành công nghiệp làm gia tăng/trầm trọng thêm lượng chất thải độc hại.`,
      is_correct: false,
      trap_reason: `Bẫy ngược nghĩa: Từ "${word}" mang nghĩa "${meaning}", trong khi câu này đang diễn đạt hành động làm trầm trọng thêm (tương đương "exacerbate").`
    };

    // 3. Distractor 2: Meaning borrowed from another word in vault or standard pool
    const otherWord = vocabPool.find(v => v.word.toLowerCase() !== word.toLowerCase()) || {
      word: 'neglect',
      meaning: 'thờ ơ, bỏ bê'
    };

    const trap2: SentenceOption = {
      id: 'opt_trap2',
      sentence_en: `The committee decided to completely ${word.toLowerCase()} the newly submitted infrastructure proposals.`,
      sentence_vi: `Ủy ban đã quyết định hoàn toàn ${otherWord.meaning.toLowerCase()} các đề xuất cơ sở hạ tầng mới được đệ trình.`,
      is_correct: false,
      trap_reason: `Bẫy nhầm lẫn nghĩa: Câu này gán nghĩa "${otherWord.meaning}" vào từ "${word}". Nghĩa đúng thực tế của "${word}" phải là "${meaning}".`
    };

    // Xáo trộn 3 lựa chọn ngẫu nhiên
    return [correctOption, trap1, trap2].sort(() => 0.5 - Math.random());
  }, [currentWord, vocabPool]);

  // Reset khi đổi câu hỏi
  useEffect(() => {
    setSelectedOptionId(null);
    setFeedback(null);
  }, [currentWord]);

  const handleSelect = (option: SentenceOption) => {
    if (feedback !== null) return;
    setSelectedOptionId(option.id);
    const isCorrect = option.is_correct;
    setFeedback(isCorrect ? 'correct' : 'wrong');
    onAnswer(isCorrect);
  };

  return (
    <div className="flex flex-col w-full space-y-5">
      {/* Target Word Header Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/50 dark:bg-neutral-800/60 border-2 border-primary/20 text-center relative overflow-hidden shadow-sm">
        <div className="flex items-center justify-center gap-2 mb-1">
          <BookOpen className="w-4 h-4 text-primary shrink-0" />
          <span className="text-[11px] font-black uppercase tracking-wider text-primary">
            Sách Giáo Khoa • Ngữ Cảnh & Dịch Nghĩa Chuẩn
          </span>
        </div>

        <div className="flex items-center justify-center gap-3">
          <h2 className="text-2xl sm:text-3xl font-display font-black text-accent dark:text-amber-100 tracking-tight">
            {currentWord.word}
          </h2>
          {onPlayAudio && (
            <button
              type="button"
              onClick={() => onPlayAudio(currentWord.word)}
              className="p-1.5 rounded-full hover:bg-primary/10 text-primary hover:scale-110 active:scale-95 transition-all cursor-pointer"
              title="Nghe phát âm"
            >
              <Volume2 className="w-5 h-5 shrink-0" />
            </button>
          )}
        </div>

        {currentWord.phonetic && (
          <p className="text-xs font-mono text-accent/60 dark:text-neutral-400 mt-0.5">
            {currentWord.phonetic}
          </p>
        )}

        <p className="text-xs font-semibold text-accent/70 dark:text-neutral-300 mt-2 max-w-md mx-auto">
          Chọn câu dịch nghĩa tiếng Việt chuẩn xác nhất cho từ vựng <strong className="text-primary font-bold">"{currentWord.word}"</strong> trong 3 câu ngữ cảnh dưới đây:
        </p>
      </div>

      {/* 3 Textbook Sentence Options */}
      <div className="space-y-3">
        {sentenceOptions.map((opt, idx) => {
          const isSelected = selectedOptionId === opt.id;
          let containerStyle = "bg-white dark:bg-neutral-800 border-primary/15 hover:border-primary/40 hover:bg-primary/5 text-accent dark:text-neutral-100 shadow-sm";

          if (feedback) {
            if (opt.is_correct) {
              containerStyle = "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-950 dark:text-emerald-100 shadow-md ring-2 ring-emerald-400/40";
            } else if (isSelected && !opt.is_correct) {
              containerStyle = "bg-rose-50 dark:bg-rose-950/40 border-rose-400 text-rose-950 dark:text-rose-100 opacity-70";
            } else {
              containerStyle = "bg-neutral-50 dark:bg-neutral-800/40 border-black/5 opacity-40";
            }
          }

          return (
            <motion.button
              key={opt.id}
              type="button"
              disabled={feedback !== null}
              onClick={() => handleSelect(opt)}
              whileHover={feedback === null ? { scale: 1.01 } : {}}
              whileTap={feedback === null ? { scale: 0.99 } : {}}
              className={`w-full p-4 rounded-2xl border-2 text-left transition-all relative flex flex-col gap-2 cursor-pointer touch-manipulation ${containerStyle}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                    feedback && opt.is_correct 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-primary/10 text-primary'
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-[10px] font-bold text-accent/50 uppercase tracking-widest">
                    Cambridge Context {idx + 1}
                  </span>
                </div>

                {feedback && opt.is_correct && (
                  <span className="flex items-center gap-1 text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Đáp án chuẩn</span>
                  </span>
                )}
                {feedback && isSelected && !opt.is_correct && (
                  <span className="flex items-center gap-1 text-xs font-black text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Bẫy ngữ nghĩa</span>
                  </span>
                )}
              </div>

              {/* English Sentence */}
              <p className="text-sm font-semibold font-serif leading-relaxed text-accent dark:text-neutral-200">
                "{opt.sentence_en}"
              </p>

              {/* Vietnamese Translation */}
              <div className="pt-1.5 border-t border-black/5 dark:border-white/5 flex items-start gap-1.5 text-xs font-medium text-accent/80 dark:text-neutral-300">
                <span className="text-primary font-bold shrink-0">👉 Dịch:</span>
                <span className="leading-normal">{opt.sentence_vi}</span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Pedagogical Explanation & Next Action */}
      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-amber-50/80 dark:bg-neutral-800/80 border border-primary/20 space-y-3"
        >
          <div className="flex items-center gap-2 font-bold text-xs text-accent">
            <GraduationCap className="w-4 h-4 text-primary shrink-0" />
            <span>Phân tích Sư phạm & Bẫy Đề Thi:</span>
          </div>

          <div className="text-xs text-accent/80 space-y-1.5 leading-relaxed">
            {sentenceOptions.map((opt, i) => (
              <div key={i} className="flex items-start gap-2 text-[11px]">
                <span className="font-bold text-primary shrink-0">[{String.fromCharCode(65 + i)}]:</span>
                <span>{opt.trap_reason}</span>
              </div>
            ))}
          </div>

          {currentWord.memory_hook && (
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-xs text-primary flex items-start gap-2 font-medium">
              <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" />
              <span><strong>Mẹo nhớ:</strong> {currentWord.memory_hook}</span>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={onNext}
              className="min-h-[44px] bg-primary text-white px-7 py-2.5 rounded-full font-bold shadow-md hover:bg-primary-dark transition-all flex items-center gap-2 cursor-pointer touch-manipulation active:scale-95 text-xs sm:text-sm"
            >
              <span>Câu tiếp theo</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
