"use client";

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Lightbulb, 
  Sparkles, 
  RotateCcw, 
  Check, 
  AlertTriangle,
  MoveHorizontal,
  PenTool,
  HelpCircle
} from 'lucide-react';

export type MechanicType = 'MULTIPLE_CHOICE' | 'GAP_FILL' | 'SENTENCE_SCRAMBLE' | 'ERROR_SPOTTING';

export interface ExerciseItem {
  id?: number | string;
  mechanic: MechanicType;
  prompt: string;
  target_concept: string;
  cefr_level?: string;
  ielts_tip?: string;
  explanation: string;
  vault_word_slot?: string;
  content_payload: {
    // MULTIPLE_CHOICE
    sentence_with_blank?: string;
    options?: string[];
    correct_answer?: string;
    // GAP_FILL
    base_word?: string;
    acceptable_answers?: string[];
    // SENTENCE_SCRAMBLE
    scrambled_tokens?: string[];
    ordered_tokens?: string[];
    // ERROR_SPOTTING
    segments?: Array<{ id: string; text: string }>;
    error_segment_id?: string;
    correction?: string;
  };
}

interface Props {
  exercise: ExerciseItem;
  onNext?: () => void;
  onAnswerSubmit?: (isCorrect: boolean) => void;
}

export default function InteractiveGrammarCard({ exercise, onNext, onAnswerSubmit }: Props) {
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Mechanic 1: MCQ State
  const [selectedMcq, setSelectedMcq] = useState<string | null>(null);

  // Mechanic 2: Gap Fill State
  const [gapInput, setGapInput] = useState("");

  // Mechanic 3: Sentence Scramble State
  const [selectedTokens, setSelectedTokens] = useState<string[]>([]);
  const [availableTokens, setAvailableTokens] = useState<string[]>([]);

  // Mechanic 4: Error Spotting State
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);

  // Reset state when exercise changes
  useEffect(() => {
    setAnswered(false);
    setIsCorrect(false);
    setSelectedMcq(null);
    setGapInput("");
    setSelectedSegmentId(null);
    if (exercise.mechanic === 'SENTENCE_SCRAMBLE') {
      const raw = exercise.content_payload?.scrambled_tokens || [];
      // Shuffle scrambled tokens lightly if needed
      setAvailableTokens([...raw]);
      setSelectedTokens([]);
    }
  }, [exercise]);

  // Handle MCQ
  const handleMcqSelect = (opt: string) => {
    if (answered) return;
    setSelectedMcq(opt);
    const target = (exercise.content_payload?.correct_answer || "").trim().toLowerCase();
    const correct = opt.trim().toLowerCase() === target;
    setIsCorrect(correct);
    setAnswered(true);
    if (onAnswerSubmit) onAnswerSubmit(correct);
  };

  // Handle Gap Fill
  const handleGapSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (answered || !gapInput.trim()) return;
    const cleanUser = gapInput.trim().toLowerCase();
    const acceptable = (exercise.content_payload?.acceptable_answers || [exercise.content_payload?.correct_answer || ""]).map(a => a.toLowerCase().trim());
    const correct = acceptable.includes(cleanUser);
    setIsCorrect(correct);
    setAnswered(true);
    if (onAnswerSubmit) onAnswerSubmit(correct);
  };

  // Handle Scramble: Pick / Unpick
  const handlePickToken = (token: string, idx: number) => {
    if (answered) return;
    setSelectedTokens(prev => [...prev, token]);
    setAvailableTokens(prev => prev.filter((_, i) => i !== idx));
  };

  const handleUnpickToken = (token: string, idx: number) => {
    if (answered) return;
    setAvailableTokens(prev => [...prev, token]);
    setSelectedTokens(prev => prev.filter((_, i) => i !== idx));
  };

  const handleCheckScramble = () => {
    if (answered) return;
    const userSentence = selectedTokens.join(" ").trim().toLowerCase();
    const targetSentence = (exercise.content_payload?.ordered_tokens || []).join(" ").trim().toLowerCase();
    const correct = userSentence === targetSentence;
    setIsCorrect(correct);
    setAnswered(true);
    if (onAnswerSubmit) onAnswerSubmit(correct);
  };

  // Handle Error Spotting
  const handleErrorSegmentSelect = (segId: string) => {
    if (answered) return;
    setSelectedSegmentId(segId);
    const targetError = exercise.content_payload?.error_segment_id || "";
    const correct = segId === targetError;
    setIsCorrect(correct);
    setAnswered(true);
    if (onAnswerSubmit) onAnswerSubmit(correct);
  };

  const payload = exercise.content_payload || {};

  return (
    <div className="w-full bg-[#FAF9F5] border border-primary/20 rounded-3xl p-4 sm:p-6 shadow-xs flex flex-col gap-5">
      {/* Exercise Badge & Concept */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-primary/10 pb-3">
        <div className="flex items-center gap-2">
          <span className="bg-primary/10 text-primary text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5">
            {exercise.mechanic === 'MULTIPLE_CHOICE' && <Check className="w-3.5 h-3.5 shrink-0" />}
            {exercise.mechanic === 'GAP_FILL' && <PenTool className="w-3.5 h-3.5 shrink-0" />}
            {exercise.mechanic === 'SENTENCE_SCRAMBLE' && <MoveHorizontal className="w-3.5 h-3.5 shrink-0" />}
            {exercise.mechanic === 'ERROR_SPOTTING' && <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
            {exercise.mechanic.replace('_', ' ')}
          </span>
          <span className="text-xs font-bold text-accent/75">{exercise.target_concept}</span>
        </div>
        {exercise.vault_word_slot && (
          <span className="bg-amber-100/90 text-amber-900 border border-amber-300 text-[11px] font-extrabold px-2.5 py-0.5 rounded-xl inline-flex items-center gap-1">
            <Sparkles className="w-3 h-3 shrink-0 text-amber-700" /> Tủ từ vựng: {exercise.vault_word_slot}
          </span>
        )}
      </div>

      {/* Prompt */}
      <p className="text-sm sm:text-base font-bold text-accent leading-relaxed">
        {exercise.prompt}
      </p>

      {/* ================= MECHANIC 1: MULTIPLE CHOICE ================= */}
      {exercise.mechanic === 'MULTIPLE_CHOICE' && (
        <div className="flex flex-col gap-3">
          {payload.sentence_with_blank && (
            <div className="bg-white p-4 rounded-2xl border border-primary/15 font-serif text-base sm:text-lg text-center leading-relaxed text-accent">
              {payload.sentence_with_blank}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2">
            {(payload.options || []).map((opt: string, i: number) => {
              const isSelected = selectedMcq === opt;
              const isTargetCorrect = opt.trim().toLowerCase() === (payload.correct_answer || "").trim().toLowerCase();
              let btnStyle = "bg-white border-primary/20 hover:border-primary/40 text-accent";

              if (answered) {
                if (isTargetCorrect) {
                  btnStyle = "bg-emerald-50 border-emerald-500 text-emerald-950 font-bold ring-1 ring-emerald-500";
                } else if (isSelected) {
                  btnStyle = "bg-rose-50 border-rose-500 text-rose-950 font-bold ring-1 ring-rose-500";
                } else {
                  btnStyle = "bg-white/40 border-primary/10 opacity-50 text-accent/50";
                }
              }

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleMcqSelect(opt)}
                  disabled={answered}
                  className={`min-h-[44px] p-3.5 rounded-2xl border text-left text-xs sm:text-sm font-semibold transition-all active:scale-95 touch-manipulation flex items-center justify-between ${btnStyle}`}
                >
                  <span className="flex-1 mr-2">{opt}</span>
                  {answered && isTargetCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                  {answered && isSelected && !isTargetCorrect && <XCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= MECHANIC 2: GAP FILL ================= */}
      {exercise.mechanic === 'GAP_FILL' && (
        <form onSubmit={handleGapSubmit} className="flex flex-col gap-4">
          <div className="bg-white p-4 rounded-2xl border border-primary/15 font-serif text-base sm:text-lg text-center leading-relaxed text-accent">
            {payload.sentence_with_blank ? (
              payload.sentence_with_blank.replace(
                /(\[ _{3,} \]|\[ _____ \])/g, 
                payload.base_word ? `( ${payload.base_word} )` : '_______'
              )
            ) : (
              `Điền dạng đúng của từ: ${payload.base_word || '...'}`
            )}
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <input
              type="text"
              value={gapInput}
              onChange={(e) => setGapInput(e.target.value)}
              disabled={answered}
              placeholder={payload.base_word ? `Nhập dạng đúng của từ "${payload.base_word}"...` : "Nhập đáp án của bạn..."}
              className="w-full sm:flex-1 min-h-[44px] px-4 rounded-2xl border border-primary/25 bg-white text-sm font-bold text-accent focus:outline-none focus:ring-2 focus:ring-primary/25"
            />
            {!answered && (
              <button
                type="submit"
                disabled={!gapInput.trim()}
                className="w-full sm:w-auto min-h-[44px] px-6 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm rounded-2xl transition-all active:scale-95 touch-manipulation inline-flex items-center justify-center gap-2 shrink-0"
              >
                Kiểm Tra Đáp Án
              </button>
            )}
          </div>
        </form>
      )}

      {/* ================= MECHANIC 3: SENTENCE SCRAMBLE ================= */}
      {exercise.mechanic === 'SENTENCE_SCRAMBLE' && (
        <div className="flex flex-col gap-4">
          {/* Construction Drop Zone */}
          <div className="min-h-[64px] p-3.5 bg-white rounded-2xl border-2 border-dashed border-primary/30 flex flex-wrap items-center gap-2">
            {selectedTokens.length === 0 ? (
              <span className="text-xs text-accent/40 italic font-semibold">
                Bấm các thẻ từ bên dưới theo thứ tự để sắp xếp thành câu hoàn chỉnh...
              </span>
            ) : (
              selectedTokens.map((tok, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleUnpickToken(tok, i)}
                  disabled={answered}
                  className="min-h-[38px] px-3 py-1.5 bg-primary/15 hover:bg-rose-100 text-primary hover:text-rose-700 font-bold text-xs rounded-xl border border-primary/30 transition-all active:scale-95 touch-manipulation"
                >
                  {tok}
                </button>
              ))
            )}
          </div>

          {/* Available Word Blocks */}
          <div className="flex flex-wrap gap-2 pt-1">
            {availableTokens.map((tok, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handlePickToken(tok, i)}
                disabled={answered}
                className="min-h-[40px] px-3.5 py-1.5 bg-white hover:bg-primary/10 text-accent font-bold text-xs rounded-xl border border-primary/20 shadow-2xs transition-all active:scale-95 touch-manipulation"
              >
                {tok}
              </button>
            ))}
          </div>

          {!answered && selectedTokens.length > 0 && availableTokens.length === 0 && (
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleCheckScramble}
                className="min-h-[44px] px-6 bg-primary hover:bg-primary/90 text-white font-extrabold text-xs sm:text-sm rounded-2xl transition-all active:scale-95 touch-manipulation"
              >
                Kiểm Tra Thứ Tự Câu
              </button>
            </div>
          )}
        </div>
      )}

      {/* ================= MECHANIC 4: ERROR SPOTTING ================= */}
      {exercise.mechanic === 'ERROR_SPOTTING' && (
        <div className="flex flex-col gap-3">
          <div className="bg-white p-5 rounded-2xl border border-primary/15 leading-loose text-base font-serif text-accent flex flex-wrap gap-1.5 items-center">
            {(payload.segments || []).map((seg: any) => {
              const isSelected = selectedSegmentId === seg.id;
              const isError = seg.id === payload.error_segment_id;
              let segStyle = "border-b-2 border-primary/50 hover:bg-primary/10 text-accent";

              if (answered) {
                if (isError) {
                  segStyle = "bg-rose-100 border-b-2 border-rose-600 text-rose-900 font-bold";
                } else if (isSelected) {
                  segStyle = "bg-amber-100 border-b-2 border-amber-600 text-amber-900";
                } else {
                  segStyle = "opacity-50 border-b-0";
                }
              }

              return (
                <button
                  key={seg.id}
                  type="button"
                  onClick={() => handleErrorSegmentSelect(seg.id)}
                  disabled={answered}
                  className={`px-2 py-0.5 rounded-lg font-sans font-bold text-sm inline-flex items-center gap-1 transition-all active:scale-95 touch-manipulation ${segStyle}`}
                >
                  <span className="text-[10px] bg-accent/10 px-1.5 py-0.2 rounded-md font-mono">[{seg.id}]</span>
                  <span>{seg.text}</span>
                </button>
              );
            })}
          </div>
          <span className="text-xs text-accent/60 italic font-semibold">
            Bấm chọn cụm từ gạch chân mà bạn cho là dùng sai ngữ pháp trong câu.
          </span>
        </div>
      )}

      {/* ================= EXPLANATION & IELTS TIP ================= */}
      {answered && (
        <div className={`p-4 rounded-2xl border flex flex-col gap-2.5 animate-fade-in ${
          isCorrect ? 'bg-emerald-50/80 border-emerald-200' : 'bg-rose-50/80 border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {isCorrect ? (
              <span className="text-emerald-800 text-xs font-black inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> Chính xác! Bạn đã nắm vững cấu trúc.
              </span>
            ) : (
              <span className="text-rose-800 text-xs font-black inline-flex items-center gap-1.5">
                <XCircle className="w-4 h-4 shrink-0 text-rose-600" /> Chưa chính xác. Hãy xem kỹ giải thích bên dưới:
              </span>
            )}
          </div>

          {payload.correction && (
            <div className="bg-white/90 p-2.5 rounded-xl border border-primary/10 text-xs font-bold text-accent">
              <span className="text-primary font-black uppercase tracking-wider mr-1.5">Sửa đúng chuẩn:</span>
              <span className="text-emerald-800 underline decoration-emerald-500 font-mono">{payload.correction}</span>
            </div>
          )}

          <p className="text-xs leading-relaxed text-accent/90 font-medium">
            {exercise.explanation}
          </p>

          {exercise.ielts_tip && (
            <div className="bg-white/80 p-3 rounded-xl border border-primary/10 text-xs text-primary font-bold inline-flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>{exercise.ielts_tip}</span>
            </div>
          )}

          {onNext && (
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={onNext}
                className="min-h-[44px] px-6 py-2.5 bg-primary hover:bg-primary/90 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-sm transition-all active:scale-95 touch-manipulation inline-flex items-center gap-2"
              >
                Tiếp Tục <ArrowRight className="w-4 h-4 shrink-0" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
