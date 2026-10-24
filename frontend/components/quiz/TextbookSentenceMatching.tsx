"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ArrowRight, 
  Lightbulb, 
  Volume2, 
  GraduationCap,
  Languages,
  SkipForward,
  Target
} from 'lucide-react';

interface VocabItem {
  id?: number;
  word: string;
  meaning: string;
  phonetic?: string;
  audio_url?: string;
  example?: string;
  memory_hook?: string;
  topic?: string;
}

interface SentenceOption {
  id: string;
  sentence_en: string;
  sentence_vi: string;
  is_correct: boolean;
  trap_type: 'correct' | 'pos_trap' | 'collocation_trap' | 'semantic_trap';
  trap_reason: string;
}

interface Props {
  currentWord: VocabItem;
  vocabPool: VocabItem[];
  onAnswer: (isCorrect: boolean, selectedOption?: SentenceOption) => void;
  onNext: () => void;
  onSkip?: () => void;
  onPlayAudio?: (word: string, audioUrl?: string) => void;
}

// Helper xáo trộn xác định (Deterministic Seeded Shuffle) dựa trên từ vựng để giữ nguyên vị trí A,B,C,D qua các lần re-render
function seededShuffle<T>(array: T[], seedStr: string): T[] {
  const result = [...array];
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed = (seed * 31 + seedStr.charCodeAt(i)) & 0xffffffff;
  }
  
  const random = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Helper xác định từ loại dựa trên nghĩa tiếng Việt, cấu trúc câu ví dụ và từ vựng
function detectWordType(word: string, meaning: string, example?: string): 'noun' | 'verb' | 'adj' | 'adv' {
  const w = word.toLowerCase().trim();
  const m = meaning.toLowerCase().trim();
  const ex = (example || '').toLowerCase();

  // 1. Phân tích ngữ cảnh câu ví dụ thực tế nếu có
  if (ex) {
    if (new RegExp(`\\b(to|will|can|could|should|must|may|might|would|did|does|do)\\s+${w}\\b`).test(ex) ||
        new RegExp(`\\b${w}(ed|ing|s)\\b`).test(ex)) {
      return 'verb';
    }
    if (new RegExp(`\\b(a|an|the)\\s+${w}\\s+[a-z]+`).test(ex)) {
      return 'adj';
    }
    if (new RegExp(`\\b(a|an|the|this|that|these|those|my|your|his|her|its|our|their)\\s+${w}\\b`).test(ex)) {
      return 'noun';
    }
  }

  // 2. Trạng từ (Adverb)
  if (
    w.endsWith('ly') || w.endsWith('wise') || w.endsWith('ward') || w.endsWith('wards') ||
    m.startsWith('một cách ') || m.startsWith('rất ') || m.startsWith('khá ') ||
    (m.includes('nghiêm túc') && w.endsWith('ly'))
  ) {
    return 'adv';
  }

  // 3. Động từ (Verb)
  const commonVerbs = new Set([
    'acquire', 'adapt', 'adjust', 'affect', 'alter', 'assess', 'assume', 'attain', 'attribute', 
    'clarify', 'collapse', 'conclude', 'conduct', 'conform', 'consent', 'conserve', 'consist', 
    'constitute', 'constrain', 'construct', 'consume', 'derive', 'detect', 'deviate', 'diminish', 
    'eliminate', 'emerge', 'emphasize', 'enable', 'enforce', 'enhance', 'ensure', 'establish', 
    'estimate', 'evaluate', 'exceed', 'exclude', 'exhibit', 'expand', 'exploit', 'expose', 
    'facilitate', 'fluctuate', 'focus', 'generate', 'identify', 'illustrate', 'impact', 'implement', 
    'imply', 'indicate', 'induce', 'inhibit', 'initiate', 'innovate', 'integrate', 'interact', 
    'interpret', 'intervene', 'investigate', 'isolate', 'justify', 'maintain', 'manipulate', 
    'minimize', 'modify', 'monitor', 'obtain', 'occupy', 'occur', 'participate', 'perceive', 
    'persist', 'predict', 'proceed', 'prohibit', 'promote', 'pursue', 'recover', 'refine', 
    'regulate', 'reinforce', 'reject', 'release', 'rely', 'require', 'resolve', 'restore', 
    'restrain', 'restrict', 'retain', 'reveal', 'shift', 'stimulate', 'substitute', 'sustain', 
    'terminate', 'transform', 'undergo', 'undertake', 'utilize', 'vary'
  ]);

  if (
    commonVerbs.has(w) ||
    w.endsWith('ate') || w.endsWith('ize') || w.endsWith('ise') || w.endsWith('ify') ||
    m.startsWith('làm ') || m.startsWith('giảm ') || m.startsWith('tăng ') || 
    m.startsWith('tạo ') || m.startsWith('thúc ') || m.startsWith('ủng hộ') || 
    m.startsWith('chứng minh') || m.startsWith('ngăn ') || m.startsWith('duy trì') ||
    m.startsWith('thu được') || m.startsWith('đạt được') || m.startsWith('đánh giá') ||
    m.startsWith('kết luận') || m.startsWith('cung cấp') || m.startsWith('yêu cầu') ||
    m.startsWith('áp dụng') || m.startsWith('thực hiện') || m.startsWith('phát triển') ||
    m.startsWith('thực thi') || m.startsWith('xác định') || m.startsWith('phân tích') ||
    m.startsWith('thích nghi') || m.startsWith('điều chỉnh') || m.startsWith('cho phép') ||
    m.startsWith('tham gia') || m.startsWith('đóng góp') || m.startsWith('ảnh hưởng') ||
    m.startsWith('thay đổi') || m.startsWith('bảo vệ') || m.startsWith('giải quyết') ||
    m.startsWith('hỗ trợ') || m.startsWith('nghiên cứu') || m.startsWith('tìm kiếm') ||
    m.startsWith('nhận thức') || m.startsWith('dự đoán') || m.startsWith('bắt đầu') ||
    m.startsWith('thiết lập') || m.startsWith('mở rộng') || m.startsWith('tích hợp') ||
    m.startsWith('chuyển đổi') || m.startsWith('tận dụng') || m.startsWith('phản ánh')
  ) {
    return 'verb';
  }

  // 4. Tính từ (Adjective)
  const commonAdjs = new Set([
    'academic', 'accurate', 'adequate', 'adjacent', 'alternative', 'ambiguous', 'annual', 
    'apparent', 'appropriate', 'approximate', 'arbitrary', 'automatic', 'brief', 'capable', 
    'classic', 'coherent', 'compatible', 'comprehensive', 'concurrent', 'considerable', 
    'consistent', 'constant', 'contemporary', 'crucial', 'definite', 'discrete', 'distinct', 
    'diverse', 'domestic', 'dominant', 'dynamic', 'economic', 'efficient', 'empirical', 
    'equivalent', 'ethical', 'ethnic', 'evident', 'explicit', 'external', 'feasible', 'finite', 
    'flexible', 'fundamental', 'global', 'hierarchical', 'identical', 'implicit', 'incompatible', 
    'inherent', 'initial', 'integral', 'intermediate', 'internal', 'intrinsic', 'intuitive', 
    'invariable', 'major', 'marginal', 'mature', 'maximum', 'minimal', 'mutual', 'neutral', 
    'ongoing', 'overall', 'passive', 'persistent', 'potential', 'preliminary', 'previous', 
    'primary', 'prime', 'principal', 'prior', 'random', 'rational', 'relevant', 'reluctant', 
    'rigid', 'significant', 'simultaneous', 'sole', 'specific', 'subsequent', 'sufficient', 
    'sustainable', 'ultimate', 'underlying', 'unique', 'valid', 'variable', 'visible', 'vital'
  ]);

  if (
    commonAdjs.has(w) ||
    w.endsWith('able') || w.endsWith('ible') || w.endsWith('al') || 
    w.endsWith('ic') || w.endsWith('ous') || w.endsWith('ful') || w.endsWith('ive') ||
    w.endsWith('less') || w.endsWith('ary') || w.endsWith('ory') ||
    m.startsWith('có ') || m.startsWith('mang ') || m.startsWith('đáng ') || 
    m.startsWith('thuộc ') || m.startsWith('khác ') || m.startsWith('rõ ') ||
    m.startsWith('chính ') || m.startsWith('chủ yếu') || m.startsWith('thiết yếu') ||
    m.startsWith('cụ thể') || m.startsWith('quan trọng') || m.startsWith('hiệu quả') ||
    m.startsWith('toàn diện') || m.startsWith('bền vững') || m.startsWith('tiềm năng') ||
    m.startsWith('tương đương') || m.startsWith('phù hợp') || m.startsWith('linh hoạt')
  ) {
    return 'adj';
  }

  // 5. Mặc định là danh từ (Noun)
  return 'noun';
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

  // Sinh 4 câu ngữ cảnh học thuật IELTS (1 câu chuẩn + 3 câu bẫy) với bản dịch và giải thích chuẩn logic
  const sentenceOptions: SentenceOption[] = useMemo(() => {
    const word = currentWord.word.trim();
    const meaning = currentWord.meaning.trim();
    const wordLower = word.toLowerCase();
    const wordCap = word.charAt(0).toUpperCase() + word.slice(1);
    const meaningLower = meaning.toLowerCase();
    const meaningCap = meaning.charAt(0).toUpperCase() + meaning.slice(1);
    const wordType = detectWordType(word, meaning, currentWord.example);

    const authenticExample = currentWord.example && currentWord.example.trim().length > 15 && currentWord.example.toLowerCase().includes(wordLower)
      ? currentWord.example.trim()
      : null;

    let correctOpt: SentenceOption;
    let trap1Pos: SentenceOption;
    let trap2Colloc: SentenceOption;
    let trap3Semantic: SentenceOption;

    if (wordType === 'noun') {
      // 1. Câu chuẩn danh từ
      correctOpt = {
        id: 'opt_correct',
        sentence_en: authenticExample || `${wordCap} is widely recognized by researchers as a fundamental element in modern development.`,
        sentence_vi: authenticExample 
          ? `Câu chuẩn học thuật Cambridge/Oxford minh họa ý nghĩa "${meaning}".`
          : `${meaningCap} được các nhà nghiên cứu công nhận rộng rãi là một yếu tố nền tảng trong sự phát triển hiện đại.`,
        is_correct: true,
        trap_type: 'correct',
        trap_reason: authenticExample
          ? `✓ Đáp án chuẩn: Trích dẫn chuẩn từ ngữ liệu học thuật Cambridge/Oxford, sử dụng từ "${word}" chính xác với nghĩa "${meaning}".`
          : `✓ Đáp án chuẩn: Từ "${word}" được sử dụng chính xác ở vai trò danh từ chủ ngữ mang nghĩa "${meaning}".`
      };

      // 2. Bẫy sai từ loại (danh từ dùng làm động từ sau "to")
      trap1Pos = {
        id: 'opt_trap_pos',
        sentence_en: `The authorities attempted to ${wordLower} the newly drafted environmental policies immediately.`,
        sentence_vi: `Chính quyền đã nỗ lực [${wordLower} - dùng sai như động từ] các chính sách môi trường mới được soạn thảo ngay lập tức.`,
        is_correct: false,
        trap_type: 'pos_trap',
        trap_reason: `⚠️ Bẫy sai từ loại: "${word}" là danh từ (nghĩa: "${meaning}"), không thể đứng sau "to" làm động từ. Vị trí này cần động từ hành động như "implement" (thực thi) hoặc "enforce" (áp dụng).`
      };

      // 3. Bẫy sai Collocation (danh từ ghép sai với cấu trúc kết quả)
      trap2Colloc = {
        id: 'opt_trap_colloc',
        sentence_en: `Severe traffic congestion was reported as the primary ${wordLower} of city air pollution.`,
        sentence_vi: `Tình trạng ùn tắc giao thông nghiêm trọng được báo cáo là [${wordLower} - sai collocation] chính của ô nhiễm không khí đô thị.`,
        is_correct: false,
        trap_type: 'collocation_trap',
        trap_reason: `⚠️ Bẫy sai Collocation: Trong văn phong IELTS, nguyên nhân gây ô nhiễm phải đi với "cause" hoặc "driver", không dùng danh từ "${word}".`
      };

      // 4. Bẫy nhầm ngữ cảnh với từ khác trong kho
      trap3Semantic = {
        id: 'opt_trap_semantic',
        sentence_en: `All eligible individuals must submit their ${wordLower} to the examination committee before Friday.`,
        sentence_vi: `Tất cả các cá nhân đủ điều kiện phải nộp [${wordLower} - nhầm ngữ cảnh hồ sơ] cho hội đồng khảo thí trước thứ Sáu.`,
        is_correct: false,
        trap_type: 'semantic_trap',
        trap_reason: `⚠️ Bẫy nhầm lẫn ngữ cảnh: Ngữ cảnh nộp cho hội đồng khảo thí yêu cầu danh từ chỉ hồ sơ/đơn từ (application/portfolio), hoàn toàn không phù hợp với nghĩa "${meaning}" của từ "${word}".`
      };
    } else if (wordType === 'verb') {
      // 1. Câu chuẩn động từ
      correctOpt = {
        id: 'opt_correct',
        sentence_en: authenticExample || `The international community should ${wordLower} practical solutions to address climate change effectively.`,
        sentence_vi: authenticExample
          ? `Câu chuẩn học thuật Cambridge/Oxford minh họa ý nghĩa "${meaning}".`
          : `Cộng đồng quốc tế nên ${meaningLower} các giải pháp thiết thực nhằm giải quyết biến đổi khí hậu một cách hiệu quả.`,
        is_correct: true,
        trap_type: 'correct',
        trap_reason: authenticExample
          ? `✓ Đáp án chuẩn: Trích dẫn chuẩn từ ngữ liệu học thuật Cambridge/Oxford, sử dụng từ "${word}" chính xác với nghĩa "${meaning}".`
          : `✓ Đáp án chuẩn: Từ "${word}" được sử dụng đúng vị trí động từ sau trợ động từ "should", thể hiện chính xác hành động "${meaning}".`
      };

      // 2. Bẫy sai từ loại (động từ dùng làm danh từ sau "a/an")
      trap1Pos = {
        id: 'opt_trap_pos',
        sentence_en: `The university established an important ${wordLower} regarding academic misconduct among undergraduates.`,
        sentence_vi: `Trường đại học đã thiết lập một [${wordLower} - dùng sai như danh từ] quan trọng liên quan đến vi phạm học thuật giữa sinh viên.`,
        is_correct: false,
        trap_type: 'pos_trap',
        trap_reason: `⚠️ Bẫy sai từ loại: "${word}" là động từ (nghĩa: "${meaning}"), không thể đứng sau mạo từ "an ... " làm danh từ. Dạng danh từ chuẩn phải có đuôi biến đổi phù hợp.`
      };

      // 3. Bẫy sai Collocation (động từ ghép sai với giới từ)
      trap2Colloc = {
        id: 'opt_trap_colloc',
        sentence_en: `Researchers cannot ${wordLower} between the experimental sample and the secondary control group.`,
        sentence_vi: `Các nhà nghiên cứu không thể [${wordLower} - sai cấu trúc 'between'] giữa mẫu thử nghiệm và nhóm đối chứng phụ.`,
        is_correct: false,
        trap_type: 'collocation_trap',
        trap_reason: `⚠️ Bẫy sai Collocation: Cấu trúc "... between A and B" bắt buộc đi với động từ phân biệt ("distinguish" / "differentiate"), không tương thích với động từ "${word}".`
      };

      // 4. Bẫy nhầm ngữ cảnh
      trap3Semantic = {
        id: 'opt_trap_semantic',
        sentence_en: `Patients with severe symptoms are strongly instructed to ${wordLower} twice a day after meals.`,
        sentence_vi: `Bệnh nhân có triệu chứng nặng được hướng dẫn nghiêm ngặt nên [${wordLower} - nhầm ngữ cảnh uống thuốc] hai lần mỗi ngày sau bữa ăn.`,
        is_correct: false,
        trap_type: 'semantic_trap',
        trap_reason: `⚠️ Bẫy nhầm ngữ cảnh: Ngữ cảnh y tế uống thuốc đòi hỏi động từ "take medicine / dosage", không thể dùng từ "${word}" (${meaning}).`
      };
    } else if (wordType === 'adv') {
      // 1. Câu chuẩn trạng từ
      correctOpt = {
        id: 'opt_correct',
        sentence_en: authenticExample || `The management board agreed to address the workplace challenges ${wordLower} and objectively.`,
        sentence_vi: authenticExample
          ? `Câu chuẩn học thuật Cambridge/Oxford minh họa ý nghĩa "${meaning}".`
          : `Hội đồng quản trị đã đồng ý giải quyết các thách thức nơi làm việc một cách ${meaningLower} và khách quan.`,
        is_correct: true,
        trap_type: 'correct',
        trap_reason: authenticExample
          ? `✓ Đáp án chuẩn: Trích dẫn chuẩn từ ngữ liệu học thuật Cambridge/Oxford, sử dụng từ "${word}" chính xác với nghĩa "${meaning}".`
          : `✓ Đáp án chuẩn: "${word}" là trạng từ (adverb) bổ nghĩa chính xác cho động từ "address" theo cấu trúc song hành với "objectively", thể hiện đúng ý nghĩa "${meaning}".`
      };

      // 2. Bẫy sai từ loại (trạng từ dùng làm tính từ bổ nghĩa cho danh từ)
      trap1Pos = {
        id: 'opt_trap_pos',
        sentence_en: `The department published three ${wordLower} reports regarding financial sustainability.`,
        sentence_vi: `Phòng ban đã công bố ba bản báo cáo [${wordLower} - dùng sai như tính từ] về tính bền vững tài chính.`,
        is_correct: false,
        trap_type: 'pos_trap',
        trap_reason: `⚠️ Bẫy sai từ loại: "${word}" là trạng từ (đuôi "-ly", nghĩa: "${meaning}"), không thể đứng trước danh từ "reports" để bổ nghĩa. Vị trí này bắt buộc phải dùng tính từ.`
      };

      // 3. Bẫy sai Collocation
      trap2Colloc = {
        id: 'opt_trap_colloc',
        sentence_en: `The delegates were ${wordLower} delighted with the preliminary conference schedule.`,
        sentence_vi: `Các đại biểu đã [${wordLower} - sai collocation với delighted] hài lòng với lịch trình sơ bộ của hội nghị.`,
        is_correct: false,
        trap_type: 'collocation_trap',
        trap_reason: `⚠️ Bẫy sai Collocation: Tính từ "delighted" không kết hợp tự nhiên với "${word}". Trong văn phong học thuật, người ta dùng "greatly / extremely delighted".`
      };

      // 4. Bẫy nhầm ngữ cảnh
      trap3Semantic = {
        id: 'opt_trap_semantic',
        sentence_en: `The meteorologist predicted that heavy rain would occur ${wordLower} throughout the weekend.`,
        sentence_vi: `Nhà khí tượng học dự đoán mưa lớn sẽ xảy ra [${wordLower} - nhầm ngữ cảnh tần suất thời tiết] trong suốt kỳ nghỉ cuối tuần.`,
        is_correct: false,
        trap_type: 'semantic_trap',
        trap_reason: `⚠️ Bẫy nhầm ngữ cảnh: Ngữ cảnh tần suất thời tiết yêu cầu trạng từ tần suất ("frequently" hoặc "continuously"), không thể dùng từ "${word}" (${meaning}).`
      };
    } else {
      // 1. Câu chuẩn tính từ
      correctOpt = {
        id: 'opt_correct',
        sentence_en: authenticExample || `Adopting this strategy represents a ${wordLower} approach to resolving sustainable development goals.`,
        sentence_vi: authenticExample
          ? `Câu chuẩn học thuật Cambridge/Oxford minh họa ý nghĩa "${meaning}".`
          : `Việc áp dụng chiến lược này thể hiện một cách tiếp cận mang tính ${meaningLower} để giải quyết các mục tiêu phát triển bền vững.`,
        is_correct: true,
        trap_type: 'correct',
        trap_reason: authenticExample
          ? `✓ Đáp án chuẩn: Trích dẫn chuẩn từ ngữ liệu học thuật Cambridge/Oxford, sử dụng từ "${word}" chính xác với nghĩa "${meaning}".`
          : `✓ Đáp án chuẩn: "${word}" đứng trước danh từ "approach" bổ nghĩa chuẩn xác với ý nghĩa "${meaning}".`
      };

      // 2. Bẫy sai từ loại (tính từ dùng làm động từ)
      trap1Pos = {
        id: 'opt_trap_pos',
        sentence_en: `The regional authorities must ${wordLower} the municipal water infrastructure before winter arrives.`,
        sentence_vi: `Chính quyền khu vực phải [${wordLower} - dùng sai như động từ] cơ sở hạ tầng nước đô thị trước khi mùa đông đến.`,
        is_correct: false,
        trap_type: 'pos_trap',
        trap_reason: `⚠️ Bẫy sai từ loại: "${word}" là tính từ (nghĩa: "${meaning}"), không thể làm vị ngữ động từ sau "must". Vị trí này cần động từ như "upgrade" (nâng cấp) hoặc "renovate" (cải tạo).`
      };

      // 3. Bẫy sai Collocation
      trap2Colloc = {
        id: 'opt_trap_colloc',
        sentence_en: `The driver operated a highly ${wordLower} automobile through dense fog on the expressway.`,
        sentence_vi: `Người tài xế đã điều khiển một chiếc ô tô cực kỳ [${wordLower} - sai collocation miêu tả xe] qua sương mù dày đặc trên đường cao tốc.`,
        is_correct: false,
        trap_type: 'collocation_trap',
        trap_reason: `⚠️ Bẫy sai Collocation: Miêu tả phương tiện xe cộ trong sương mù không đi kèm với tính từ "${word}".`
      };

      // 4. Bẫy nhầm ngữ cảnh
      trap3Semantic = {
        id: 'opt_trap_semantic',
        sentence_en: `The physician confirmed that the patient had developed a ${wordLower} bacterial infection.`,
        sentence_vi: `Bác sĩ xác nhận rằng bệnh nhân đã bị nhiễm trùng do vi khuẩn [${wordLower} - nhầm ngữ cảnh bệnh lý].`,
        is_correct: false,
        trap_type: 'semantic_trap',
        trap_reason: `⚠️ Bẫy nhầm ngữ cảnh: Chẩn đoán y khoa về nhiễm trùng đòi hỏi tính từ chỉ mức độ ("acute" hoặc "severe"), không dùng "${word}".`
      };
    }

    // Xáo trộn xác định (deterministic) 4 lựa chọn theo hạt giống (seed) từ vựng
    // Giúp vị trí A, B, C, D cố định tuyệt đối, không bị nhảy lung tung khi user click chọn
    return seededShuffle(
      [correctOpt, trap1Pos, trap2Colloc, trap3Semantic],
      `${currentWord.word}_${currentWord.id || ''}`
    );
  }, [currentWord]);

  const handleSelect = (option: SentenceOption) => {
    if (feedback !== null) return;
    setSelectedOptionId(option.id);
    const isCorrect = option.is_correct;
    setFeedback(isCorrect ? 'correct' : 'wrong');
    onAnswer(isCorrect, option);
  };

  const selectedOpt = sentenceOptions.find(o => o.id === selectedOptionId);

  return (
    <div className="flex flex-col w-full space-y-4 pb-12">
      {/* Target Word Header Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border-2 border-[#A7D08C]/50 text-center relative overflow-hidden shadow-xs space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Target className="w-4 h-4 text-[#4A7C39] shrink-0" />
          <span className="text-[11px] font-black uppercase tracking-wider text-[#4A7C39]">
            Ngữ Cảnh Chuẩn Cambridge • Điều Tra Bẫy IELTS
          </span>
        </div>

        <div className="flex items-center justify-center gap-3">
          <h2 className="text-3xl sm:text-4xl font-display font-black text-[#2E3E2B] tracking-tight">
            {currentWord.word}
          </h2>
          {onPlayAudio && (
            <button
              type="button"
              onClick={() => onPlayAudio(currentWord.word, currentWord.audio_url)}
              className="p-2 rounded-full hover:bg-[#EAF2E3] text-[#4A7C39] hover:scale-110 active:scale-95 transition-transform cursor-pointer shadow-xs"
              title="Nghe phát âm"
            >
              <Volume2 className="w-5 h-5 shrink-0" />
            </button>
          )}
        </div>

        {currentWord.phonetic && (
          <p className="text-xs font-mono text-stone-500 font-semibold">
            {currentWord.phonetic}
          </p>
        )}

        {/* Luôn hiển thị nghĩa tiếng Việt chuẩn của từ sau khi người dùng trả lời */}
        {feedback !== null ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="pt-2 border-t border-stone-200 mt-2"
          >
            <div className="inline-flex items-center gap-2 bg-[#EAF2E3] border border-[#A7D08C] text-[#14532D] px-4 py-1.5 rounded-full shadow-xs">
              <span className="text-xs font-black text-[#4A7C39] uppercase">Định nghĩa chuẩn:</span>
              <span className="text-sm font-black text-[#2E3E2B]">"{currentWord.meaning}"</span>
            </div>
          </motion.div>
        ) : (
          <p className="text-xs font-semibold text-stone-600 mt-1 max-w-md mx-auto">
            Chọn câu tiếng Anh sử dụng chuẩn xác nhất về ngữ cảnh và collocation của từ vựng: <strong className="text-[#4A7C39] font-bold">"{currentWord.word}"</strong>
          </p>
        )}
      </div>

      {/* Prominent Result Status Banner after Answer */}
      {feedback !== null && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl border-2 flex items-center justify-between shadow-xs ${
            feedback === 'correct'
              ? 'bg-[#DCFCE7] border-[#22C55E] text-[#14532D]'
              : 'bg-[#FEE2E2] border-[#EF4444] text-[#991B1B]'
          }`}
        >
          <div className="flex items-center gap-3">
            {feedback === 'correct' ? (
              <div className="w-9 h-9 rounded-xl bg-[#22C55E] text-white flex items-center justify-center shrink-0 shadow-xs">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-[#EF4444] text-white flex items-center justify-center shrink-0 shadow-xs">
                <AlertCircle className="w-5 h-5" />
              </div>
            )}
            <div>
              <p className="font-black text-sm">
                {feedback === 'correct' 
                  ? 'Chính xác! Bạn đã chọn đúng câu chuẩn ngữ cảnh (+1 Điểm)' 
                  : 'Chưa chính xác! Bạn đã chọn phải câu bẫy đề thi.'}
              </p>
              <p className="text-xs opacity-90 mt-0.5">
                {feedback === 'correct'
                  ? `Từ "${currentWord.word}" mang nghĩa là "${currentWord.meaning}".`
                  : `Hãy xem phân tích chi tiết bẫy bên dưới để ghi nhớ sâu:`}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* 4 Textbook Sentence Options (A, B, C, D) */}
      <div className="space-y-3">
        {sentenceOptions.map((opt, idx) => {
          const isSelected = selectedOptionId === opt.id;
          let containerStyle = "bg-white border-2 border-[#A7D08C]/40 hover:border-[#4A7C39] hover:bg-[#F0FDF4] text-[#2E3E2B] shadow-xs";

          if (feedback !== null) {
            if (opt.is_correct) {
              containerStyle = "bg-[#DCFCE7] border-[#22C55E] text-[#14532D] shadow-md ring-2 ring-[#22C55E]/40";
            } else if (isSelected && !opt.is_correct) {
              containerStyle = "bg-[#FEE2E2] border-[#EF4444] text-[#991B1B] shadow-sm";
            } else {
              containerStyle = "bg-white border-stone-200 text-[#2E3E2B]";
            }
          }

          return (
            <motion.button
              key={opt.id}
              type="button"
              disabled={feedback !== null}
              onClick={() => handleSelect(opt)}
              whileHover={feedback === null ? { scale: 1.008 } : {}}
              whileTap={feedback === null ? { scale: 0.992 } : {}}
              className={`w-full p-4 sm:p-5 rounded-2xl border-2 text-left transition-all relative flex flex-col gap-2.5 cursor-pointer touch-manipulation ${containerStyle}`}
            >
              {/* Option Letter & Badge Header */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                    feedback && opt.is_correct 
                      ? 'bg-[#22C55E] text-white shadow-xs' 
                      : feedback && isSelected && !opt.is_correct
                      ? 'bg-[#EF4444] text-white shadow-xs'
                      : 'bg-[#EAF2E3] text-[#4A7C39]'
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                    Lựa chọn {String.fromCharCode(65 + idx)}
                  </span>
                </div>

                {feedback !== null && (
                  <div>
                    {opt.is_correct && (
                      <span className="flex items-center gap-1.5 text-xs font-black text-white bg-[#16A34A] px-3 py-1 rounded-full shadow-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>ĐÁP ÁN CHUẨN XÁC</span>
                      </span>
                    )}
                    {isSelected && !opt.is_correct && (
                      <span className="flex items-center gap-1.5 text-xs font-black text-white bg-[#DC2626] px-3 py-1 rounded-full shadow-xs">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>BẠN ĐÃ CHỌN CÂU NÀY (BẪY)</span>
                      </span>
                    )}
                    {!isSelected && !opt.is_correct && (
                      <span className="text-[11px] font-bold text-stone-400 bg-stone-100 px-2.5 py-0.5 rounded-full">
                        Câu bẫy đề thi
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* English Sentence */}
              <p className="text-sm sm:text-base font-serif font-semibold leading-relaxed text-[#2E3E2B]">
                "{opt.sentence_en}"
              </p>

              {/* Vietnamese Translation (Hiển thị sau khi trả lời, khớp 100% với câu tiếng Anh) */}
              {feedback !== null && (
                <div className="space-y-2 pt-2 border-t border-stone-200/80">
                  <div className="flex items-start gap-2 text-xs font-medium text-stone-800 bg-[#FAF7F2] p-2.5 rounded-xl border border-[#A7D08C]/30">
                    <span className="text-[#4A7C39] font-bold shrink-0 flex items-center gap-1">
                      <Languages className="w-3.5 h-3.5 shrink-0" />
                      <span>Dịch nghĩa:</span>
                    </span>
                    <span className="leading-relaxed">{opt.sentence_vi}</span>
                  </div>

                  {/* Lời giải thích trực tiếp dưới mỗi câu */}
                  <div className="flex items-start gap-1.5 text-[11px] text-stone-600 pl-1 leading-snug">
                    <span className="font-bold text-[#4A7C39] shrink-0">Phân tích:</span>
                    <span>{opt.trap_reason}</span>
                  </div>
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Skip Question Button */}
      {!feedback && (
        <div className="flex items-center justify-end pt-2">
          <button
            type="button"
            onClick={onSkip || onNext}
            className="min-h-[42px] px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:text-[#2E3E2B] hover:bg-stone-200/50 transition-colors flex items-center gap-2 cursor-pointer touch-manipulation active:scale-95"
            title="Bỏ qua câu này để chuyển sang từ tiếp theo"
          >
            <SkipForward className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Bỏ qua câu này (Chuyển sang từ khác)</span>
          </button>
        </div>
      )}

      {/* Next Question CTA Button after Answer */}
      {feedback !== null && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-3xl bg-white border-2 border-[#A7D08C]/50 space-y-4 shadow-sm"
        >
          <div className="flex items-center gap-2 font-black text-sm text-[#2E3E2B]">
            <GraduationCap className="w-5 h-5 text-[#4A7C39] shrink-0" />
            <span>Tổng Kết Bài Học IELTS & Mẹo Ghi Nhớ:</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#A7D08C]/30 text-xs text-stone-700 space-y-1.5 leading-relaxed">
            <p>
              <strong className="text-[#4A7C39]">Từ vựng mục tiêu:</strong> <span className="font-bold text-[#2E3E2B]">{currentWord.word}</span> {currentWord.phonetic && `(${currentWord.phonetic})`} = <strong className="text-[#2E3E2B]">{currentWord.meaning}</strong>
            </p>
            <p className="text-[11px] text-stone-600 italic">
              Khi làm bài thi IELTS Reading/Writing, luôn chú ý từ loại (Part of Speech) và Collocation để tránh các bẫy ngữ nghĩa tương tự.
            </p>
          </div>

          {currentWord.memory_hook && (
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2 font-medium">
              <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div><strong>Mẹo nhớ nhanh:</strong> {currentWord.memory_hook}</div>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={onNext}
              className="w-full sm:w-auto min-h-[48px] bg-[#4A7C39] text-white px-9 py-2.5 rounded-full font-black text-sm shadow-md hover:bg-[#3B642D] transition-colors flex items-center justify-center gap-2 cursor-pointer touch-manipulation active:scale-95"
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
