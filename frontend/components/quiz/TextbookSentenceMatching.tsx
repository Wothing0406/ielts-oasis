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
  GraduationCap,
  Languages,
  SkipForward
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
  onSkip?: () => void;
  onPlayAudio?: (word: string) => void;
}

export default function TextbookSentenceMatching({
  currentWord,
  vocabPool,
  onAnswer,
  onNext,
  onSkip,
  onPlayAudio
}: Props) {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  // Generate 4 textbook-style context sentences: 1 Correct + 3 Traps (A, B, C, D)
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

    // 3. Distractor 2: Meaning borrowed from another word in vault
    const otherWords = vocabPool.filter(v => v.word.toLowerCase() !== word.toLowerCase());
    const otherWord1 = otherWords[0] || { word: 'neglect', meaning: 'thờ ơ, bỏ bê' };
    const otherWord2 = otherWords[1] || { word: 'differentiate', meaning: 'phân biệt, phân loại' };

    const trap2: SentenceOption = {
      id: 'opt_trap2',
      sentence_en: `The committee decided to completely ${word.toLowerCase()} the newly submitted infrastructure proposals.`,
      sentence_vi: `Ủy ban đã quyết định hoàn toàn ${otherWord1.meaning.toLowerCase()} các đề xuất cơ sở hạ tầng mới được đệ trình.`,
      is_correct: false,
      trap_reason: `Bẫy nhầm lẫn nghĩa: Câu này gán nghĩa "${otherWord1.meaning}" vào từ "${word}". Nghĩa đúng thực tế của "${word}" phải là "${meaning}".`
    };

    // 4. Distractor 3: Collocation mismatch / semantic trap (Option D)
    const trap3: SentenceOption = {
      id: 'opt_trap3',
      sentence_en: `The experimental results made it impossible to ${word.toLowerCase()} the primary variables from the secondary control group.`,
      sentence_vi: `Kết quả thực nghiệm đã khiến việc ${otherWord2.meaning.toLowerCase()} các biến số chính với nhóm đối chứng phụ trở nên bất khả thi.`,
      is_correct: false,
      trap_reason: `Bẫy sai collocation: Cấu trúc "... variables from control group" đòi hỏi động từ chỉ sự phân tách/phân biệt, không tương thích với "${word}".`
    };

    // Xáo trộn 4 lựa chọn ngẫu nhiên (A, B, C, D)
    return [correctOption, trap1, trap2, trap3].sort(() => 0.5 - Math.random());
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
    <div className="flex flex-col w-full space-y-4 pb-10">
      {/* Target Word Header Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border-2 border-[#A7D08C]/40 text-center relative overflow-hidden shadow-xs">
        <div className="flex items-center justify-center gap-2 mb-1.5">
          <BookOpen className="w-4 h-4 text-[#4A7C39] shrink-0" />
          <span className="text-[11px] font-black uppercase tracking-wider text-[#4A7C39]">
            Sách Giáo Khoa • Ngữ Cảnh & Dịch Nghĩa Chuẩn
          </span>
        </div>

        <div className="flex items-center justify-center gap-3">
          <h2 className="text-2xl sm:text-3xl font-display font-black text-[#2E3E2B] tracking-tight">
            {currentWord.word}
          </h2>
          {onPlayAudio && (
            <button
              type="button"
              onClick={() => onPlayAudio(currentWord.word)}
              className="p-1.5 rounded-full hover:bg-[#EAF2E3] text-[#4A7C39] hover:scale-110 active:scale-95 transition-all cursor-pointer"
              title="Nghe phát âm"
            >
              <Volume2 className="w-5 h-5 shrink-0" />
            </button>
          )}
        </div>

        {currentWord.phonetic && (
          <p className="text-xs font-mono text-stone-500 mt-0.5">
            {currentWord.phonetic}
          </p>
        )}

        <p className="text-xs font-semibold text-stone-600 mt-2 max-w-md mx-auto">
          Chọn câu ngữ cảnh Cambridge IELTS sử dụng chuẩn xác nhất về ngữ nghĩa và collocation của từ vựng: <strong className="text-[#4A7C39] font-bold">"{currentWord.word}"</strong>
        </p>
      </div>

      {/* 3 Textbook Sentence Options */}
      <div className="space-y-3">
        {sentenceOptions.map((opt, idx) => {
          const isSelected = selectedOptionId === opt.id;
          let containerStyle = "bg-white border-2 border-[#A7D08C]/30 hover:border-[#4A7C39] hover:bg-[#F0FDF4] text-[#2E3E2B] shadow-xs";

          if (feedback) {
            if (opt.is_correct) {
              containerStyle = "bg-[#DCFCE7] border-[#22C55E] text-[#14532D] shadow-md ring-2 ring-[#22C55E]/40 font-semibold";
            } else if (isSelected && !opt.is_correct) {
              containerStyle = "bg-[#FEE2E2] border-[#EF4444] text-[#991B1B] opacity-85";
            } else {
              containerStyle = "bg-stone-50 border-stone-200 text-stone-400 opacity-50";
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
                      ? 'bg-[#22C55E] text-white' 
                      : 'bg-[#EAF2E3] text-[#4A7C39]'
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                    Cambridge Context {idx + 1}
                  </span>
                </div>

                {feedback && opt.is_correct && (
                  <span className="flex items-center gap-1 text-xs font-black text-[#14532D] bg-[#DCFCE7] px-2.5 py-0.5 rounded-full border border-[#22C55E]/40">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[#16A34A]" />
                    <span>Đáp án chuẩn</span>
                  </span>
                )}
                {feedback && isSelected && !opt.is_correct && (
                  <span className="flex items-center gap-1 text-xs font-black text-[#991B1B] bg-[#FEE2E2] px-2.5 py-0.5 rounded-full border border-[#EF4444]/40">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-[#DC2626]" />
                    <span>Bẫy ngữ nghĩa</span>
                  </span>
                )}
              </div>

              {/* English Sentence */}
              <p className="text-sm font-semibold font-serif leading-relaxed text-[#2E3E2B]">
                "{opt.sentence_en}"
              </p>

              {/* Vietnamese Translation (Hidden before answering so user cannot cheat) */}
              {feedback && (
                <div className="pt-2 border-t border-stone-200 flex items-start gap-1.5 text-xs font-medium text-stone-800 bg-[#FAF7F2] p-2.5 rounded-xl border border-[#A7D08C]/20">
                  <span className="text-[#4A7C39] font-bold shrink-0 flex items-center gap-1">
                    <Languages className="w-3.5 h-3.5 shrink-0" />
                    <span>Dịch nghĩa:</span>
                  </span>
                  <span className="leading-normal">{opt.sentence_vi}</span>
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Skip question button */}
      {!feedback && (
        <div className="flex items-center justify-between pt-2 border-t border-stone-200">
          <button
            type="button"
            onClick={onSkip || onNext}
            className="min-h-[42px] px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:text-[#2E3E2B] hover:bg-stone-200/50 transition-all flex items-center gap-2 cursor-pointer touch-manipulation active:scale-95"
            title="Bỏ qua câu này để chuyển sang từ tiếp theo"
          >
            <SkipForward className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Bỏ qua câu này (Chuyển sang từ khác)</span>
          </button>
        </div>
      )}

      {/* Pedagogical Explanation & Next Action */}
      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-white border-2 border-[#A7D08C]/40 space-y-3 shadow-xs"
        >
          <div className="flex items-center gap-2 font-bold text-xs text-[#2E3E2B]">
            <GraduationCap className="w-4 h-4 text-[#4A7C39] shrink-0" />
            <span>Phân tích Sư phạm & Bẫy Đề Thi:</span>
          </div>

          <div className="text-xs text-stone-700 space-y-1.5 leading-relaxed">
            {sentenceOptions.map((opt, i) => (
              <div key={i} className="flex items-start gap-2 text-[11px]">
                <span className="font-bold text-[#4A7C39] shrink-0">[{String.fromCharCode(65 + i)}]:</span>
                <span>{opt.trap_reason}</span>
              </div>
            ))}
          </div>

          {currentWord.memory_hook && (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2 font-medium">
              <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span><strong>Mẹo nhớ:</strong> {currentWord.memory_hook}</span>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={onNext}
              className="min-h-[44px] bg-[#4A7C39] text-white px-7 py-2.5 rounded-full font-bold shadow-md hover:bg-[#3B642D] transition-all flex items-center gap-2 cursor-pointer touch-manipulation active:scale-95 text-xs sm:text-sm"
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
