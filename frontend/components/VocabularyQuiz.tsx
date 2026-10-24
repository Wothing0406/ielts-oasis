"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HelpCircle, 
  Layers, 
  Brain, 
  Languages, 
  X, 
  SkipForward, 
  CheckCircle2, 
  AlertCircle, 
  GraduationCap, 
  Target, 
  Lightbulb, 
  Sparkles, 
  ArrowRight, 
  Loader2,
  BookOpen,
  Mic,
  FolderOpen,
  RotateCcw,
  Volume2,
  PenTool,
  Trophy
} from 'lucide-react';

import TextbookSentenceMatching from './quiz/TextbookSentenceMatching';
import SpeechPronunciationDrill from './quiz/SpeechPronunciationDrill';
import GrammarMasteryLab from './grammar/GrammarMasteryLab';
import { playWordAudio } from '../utils/audio';

const API_URL = '/api';

interface QuizQuestionReview {
  id?: number;
  word: string;
  meaning: string;
  phonetic?: string;
  audio_url?: string;
  example?: string;
  topic?: string;
  mode: QuizType;
  quizSubType: 'ABCD' | 'FILL_IN' | 'SPEECH' | 'CONTEXT' | 'SRS';
  isCorrect: boolean;
  isSkipped?: boolean;
  score?: number;
  userAnswer?: string;
  correctAnswer: string;
  errorType?: string;
  errorDetail?: string;
}

interface VocabItem {
  id?: number;
  word: string;
  meaning: string;
  phonetic?: string;
  image_url?: string;
  audio_url?: string;
  example?: string;
  memory_hook?: string;
  topic?: string;
  mastery_level?: number;
}

type QuizType = 'textbook' | 'speech' | 'fill_in' | 'grammar_sanctuary' | 'vocab_meaning' | 'srs' | 'classic_vocab';
type ClassicMode = 'ABCD' | 'FILL_IN';
type ClassicFilterMode = 'ALTERNATE' | 'ABCD_ONLY' | 'FILL_IN_ONLY';

const playAudio = (word: string, audioUrl?: string) => {
  playWordAudio(word, audioUrl);
};

const STATIC_SENTENCE_TRANSLATIONS: Record<string, string> = {
  "He took his job seriously.": "Anh ấy đã làm việc một cách nghiêm túc và có trách nhiệm.",
  "Her father is seriously ill in St Luke's hospital.": "Bố của cô ấy đang ốm rất nặng trong bệnh viện St Luke.",
  "IELTS is an academic English test.": "IELTS là một bài thi tiếng Anh mang tính học thuật.",
  "The school curriculum is being updated.": "Chương trình giảng dạy của nhà trường đang được cập nhật.",
  "Modern pedagogy focuses on student engagement.": "Phương pháp sư phạm hiện đại tập trung vào sự chủ động tham gia của học sinh.",
  "Technological innovation drives the economy.": "Đổi mới công nghệ là động lực thúc đẩy nền kinh tế phát triển.",
  "Automation is replacing many manual jobs.": "Tự động hóa đang dần thay thế nhiều công việc thủ công.",
  "Artificial intelligence is a hot topic.": "Trí tuệ nhân tạo là một chủ đề đang rất được quan tâm.",
  "We need sustainable energy sources.": "Chúng ta cần các nguồn năng lượng bền vững.",
  "The rainforest has high biodiversity.": "Rừng mưa nhiệt đới sở hữu độ đa dạng sinh học phong phú.",
  "Pollution can destroy the local ecosystem.": "Ô nhiễm có thể tàn phá hệ sinh thái địa phương.",
  "Exercise is vital for your well-being.": "Tập thể dục là điều tối quan trọng cho sức khỏe và thể trạng của bạn.",
  "Music has therapeutic benefits.": "Âm nhạc mang lại những lợi ích trị liệu quý giá.",
  "Always try to eat a nutritious breakfast.": "Hãy luôn cố gắng ăn một bữa sáng giàu chất dinh dưỡng.",
  "A strong grasp of English is advantageous in the global job market.": "Nắm vững tiếng Anh là một lợi thế lớn trên thị trường việc làm toàn cầu.",
  "Our confidence in the team has been seriously undermined by their recent defeats.": "Niềm tin của chúng tôi vào đội bóng đã bị suy giảm nghiêm trọng sau những thất bại gần đây.",
};

interface GrammarReasonInfo {
  posBadge: string;
  posColor: string;
  roleAnalysis: string;
  collocation: string;
  selectionReason: string;
}

const getGrammarAndSelectionReason = (
  wordRaw: string, 
  meaningRaw: string, 
  sentence: string
): GrammarReasonInfo => {
  const word = wordRaw.trim();
  const meaning = meaningRaw.trim();
  const w = word.toLowerCase();
  const m = meaning.toLowerCase();
  const s = sentence.toLowerCase();

  // 1. Phân loại từ loại
  const isAdv = (
    (w.endsWith('ly') && !['family', 'friendly', 'lovely', 'ugly', 'lonely', 'silly', 'early'].includes(w)) ||
    w.endsWith('wise') || w.endsWith('ward') || w.endsWith('wards') ||
    m.startsWith('một cách ') || m.startsWith('rất ') || m.startsWith('khá ') ||
    (m.includes('nghiêm túc') && w.endsWith('ly')) ||
    w === 'fast' || w === 'well' || w === 'hard'
  );

  const isVerb = (
    w.endsWith('ate') || w.endsWith('ize') || w.endsWith('ise') || w.endsWith('ify') || w.endsWith('en') ||
    m.startsWith('làm ') || m.startsWith('giảm ') || m.startsWith('tăng ') || 
    m.startsWith('tạo ') || m.startsWith('thúc ') || m.startsWith('ủng hộ') || 
    m.startsWith('chứng minh') || m.startsWith('ngăn ') || m.startsWith('duy trì') ||
    m.startsWith('áp dụng') || m.startsWith('thực hiện')
  );

  const isAdj = (
    w.endsWith('able') || w.endsWith('ible') || w.endsWith('al') || 
    w.endsWith('ic') || w.endsWith('ous') || w.endsWith('ful') || w.endsWith('ive') ||
    w.endsWith('less') || w.endsWith('ish') ||
    m.startsWith('có ') || m.startsWith('mang ') || m.startsWith('đáng ') || 
    m.includes('bền vững') || m.includes('chủ yếu') || m.includes('thiết yếu')
  );

  // Trường hợp đặc biệt: 'seriously' trong cụm 'took his job seriously'
  if (w === 'seriously' || (s.includes('took') && s.includes('seriously')) || (s.includes('take') && s.includes('seriously'))) {
    return {
      posBadge: 'Trạng từ (Adverb)',
      posColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      roleAnalysis: `Trong câu "${sentence}", từ "${word}" đóng vai trò là trạng từ cách thức (adverb of manner) đứng sau tân ngữ ("job" / "his job") để bổ nghĩa cho động từ "took" (quá khứ của "take"), diễn tả thái độ làm việc hết sức nghiêm túc và có trách nhiệm.`,
      collocation: `take [something] seriously (Cụm cố định: coi trọng điều gì / làm việc gì một cách nghiêm túc).`,
      selectionReason: `Điền trạng từ "${word}" (nghĩa: "${meaning}") là chính xác tuyệt đối vì: (1) Cần một trạng từ bổ nghĩa cho hành động của động từ "took" (không thể dùng tính từ "serious"); (2) Tạo thành collocation kinh điển chuẩn văn phong học thuật IELTS.`
    };
  }

  // Từ điển Collocation tiêu biểu
  const COLLOCATION_MAP: Record<string, string> = {
    academic: 'academic performance / achievement / journal (thành tích / tạp chí học thuật)',
    curriculum: 'school / core curriculum (chương trình giảng dạy cốt lõi)',
    pedagogy: 'modern / innovative pedagogy (phương pháp sư phạm hiện đại)',
    innovation: 'technological innovation / drive innovation (đổi mới công nghệ)',
    automation: 'workplace automation / process automation (tự động hóa quy trình)',
    artificial: 'artificial intelligence (AI) (trí tuệ nhân tạo)',
    sustainable: 'sustainable development / sustainable growth (phát triển bền vững)',
    biodiversity: 'biodiversity conservation / loss of biodiversity (bảo tồn đa dạng sinh học)',
    ecosystem: 'marine / fragile ecosystem (hệ sinh thái biển / mong manh)',
    'well-being': 'mental / physical well-being (sức khỏe thể chất và tinh thần)',
    therapeutic: 'therapeutic effect / therapeutic benefit (tác dụng trị liệu y khoa)',
    nutritious: 'nutritious diet / meal (bữa ăn giàu dinh dưỡng)',
    advantageous: 'be highly advantageous to/for (rất có lợi cho)',
    facilitate: 'facilitate communication / learning (tạo điều kiện thuận lợi)',
    implement: 'implement policies / measures (thực thi chính sách, biện pháp)',
    mitigate: 'mitigate the impact / risk (giảm thiểu tác động tiêu cực, rủi ro)',
    advocate: 'advocate for reforms / sustainable practices (ủng hộ cải cách)',
    substantiate: 'substantiate a claim / hypothesis (chứng minh luận điểm)',
  };

  const detectedCollocation = COLLOCATION_MAP[w] || `${word} + [ngữ cảnh học thuật] (kết hợp tự nhiên trong bài thi IELTS)`;

  if (isAdv) {
    return {
      posBadge: 'Trạng từ (Adverb)',
      posColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      roleAnalysis: `Từ "${word}" (đuôi "-ly") đóng vai trò là trạng từ trong câu, bổ nghĩa cho động từ hành động hoặc tính từ lân cận, diễn đạt cách thức hoặc mức độ: "${meaning}".`,
      collocation: detectedCollocation,
      selectionReason: `Vị trí này đòi hỏi một trạng từ bổ nghĩa cho hành động/tính chất, không thể dùng danh từ hay tính từ. Điền "${word}" giúp câu chuẩn ngữ pháp và truyền tải trọn vẹn nghĩa "${meaning}".`
    };
  }

  if (isVerb) {
    return {
      posBadge: 'Động từ (Verb)',
      posColor: 'bg-blue-100 text-blue-800 border-blue-300',
      roleAnalysis: `Từ "${word}" là động từ (verb), làm vị ngữ chính diễn tả hành động/quá trình "${meaning}". Đứng sau chủ ngữ hoặc sau trợ động từ khuyết thiếu (modal verbs: should, can, must) hoặc dạng to-infinitive.`,
      collocation: detectedCollocation,
      selectionReason: `Chỗ trống nằm ở vị trí vị ngữ yêu cầu động từ diễn đạt hành động "${meaning}". Điền "${word}" đáp ứng hoàn hảo cấu trúc ngữ pháp và ý nghĩa văn cảnh.`
    };
  }

  if (isAdj) {
    return {
      posBadge: 'Tính từ (Adjective)',
      posColor: 'bg-amber-100 text-amber-800 border-amber-300',
      roleAnalysis: `Từ "${word}" là tính từ (adjective), đứng trước danh từ để bổ nghĩa trực tiếp cho danh từ đó trong cụm danh từ (Noun Phrase), hoặc đứng sau liên động từ (linking verb: to be, seem, become) làm vị ngữ bổ ngữ mang nghĩa "${meaning}".`,
      collocation: detectedCollocation,
      selectionReason: `Chỗ trống cần một tính từ miêu tả đặc tính mang nghĩa "${meaning}" cho danh từ. Điền "${word}" đảm bảo tính chuẩn xác về ngữ pháp và ghi điểm tiêu chí Lexical Resource.`
    };
  }

  // Mặc định: Danh từ
  return {
    posBadge: 'Danh từ (Noun)',
    posColor: 'bg-purple-100 text-purple-800 border-purple-300',
    roleAnalysis: `Từ "${word}" là danh từ (noun), đóng vai trò làm chủ ngữ hoặc tân ngữ trong câu, đứng sau mạo từ (a/an/the) hoặc tính từ sở hữu để thể hiện khái niệm/đối tượng: "${meaning}".`,
    collocation: detectedCollocation,
    selectionReason: `Cấu trúc câu yêu cầu một danh từ chỉ khái niệm hoặc thực thể mang nghĩa "${meaning}". Điền "${word}" giúp hoàn thiện cấu trúc cú pháp của câu một cách chuẩn xác.`
  };
};

interface Props {
  vocabList: VocabItem[];
  initialTopic?: string | null;
  initialWordList?: VocabItem[] | null;
  onClose: () => void;
  onReview: (id: number, isCorrect: boolean) => Promise<void>;
}

export default function VocabularyQuiz({ 
  vocabList, 
  initialTopic = null,
  initialWordList = null,
  onClose, 
  onReview 
}: Props) {
  // Topic Filter State in Quiz
  const [selectedTopic, setSelectedTopic] = useState<string | null>(initialTopic);
  
  // Available topics derived from vocabList
  const availableTopics = useMemo(() => {
    const topicsMap = new Map<string, number>();
    for (const v of vocabList) {
      const t = (v.topic || 'General').trim();
      topicsMap.set(t, (topicsMap.get(t) || 0) + 1);
    }
    return Array.from(topicsMap.entries());
  }, [vocabList]);

  // Current active word list for the quiz
  const activeVocabList = useMemo(() => {
    if (!selectedTopic || selectedTopic === 'All') {
      return vocabList;
    }
    const tLower = selectedTopic.toLowerCase();
    return vocabList.filter(v => {
      const vTopic = (v.topic || '').toLowerCase();
      const vMeaning = (v.meaning || '').toLowerCase();
      if (tLower === 'awl') return vTopic.includes('awl') || vTopic.includes('academic');
      if (tLower === 'tech') return vTopic.includes('tech') || vMeaning.includes('công nghệ');
      if (tLower === 'health') return vTopic.includes('health') || vMeaning.includes('sức khỏe');
      if (tLower === 'economy') return vTopic.includes('econom') || vMeaning.includes('kinh tế');
      if (tLower === 'environment') return vTopic.includes('environ') || vMeaning.includes('môi trường');
      if (tLower === 'education') return vTopic.includes('educat') || vMeaning.includes('giáo dục');
      if (tLower === 'society') return vTopic.includes('societ') || vMeaning.includes('xã hội');
      return vTopic.includes(tLower);
    });
  }, [vocabList, selectedTopic]);

  const [quizType, setQuizType] = useState<QuizType | null>(null);
  const [srsQuestions, setSrsQuestions] = useState<any[]>([]);
  const [isLoadingSRS, setIsLoadingSRS] = useState(false);
  
  // Question tracking & Shuffled list
  const [shuffledQuestions, setShuffledQuestions] = useState<VocabItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [quizReviews, setQuizReviews] = useState<QuizQuestionReview[]>([]);
  const [reviewFilterTab, setReviewFilterTab] = useState<'ALL' | 'WRONG' | 'CORRECT'>('WRONG');

  const recordReview = (review: QuizQuestionReview) => {
    setQuizReviews(prev => {
      const filtered = prev.filter(r => r.word.toLowerCase() !== review.word.toLowerCase());
      return [...filtered, review];
    });
  };
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  // Retry Queue for skipped words in Speech drill
  const [retryQueue, setRetryQueue] = useState<VocabItem[]>([]);
  const [isDoingRetryRound, setIsDoingRetryRound] = useState(false);

  // Classic Vocab Options & User input state
  const [meaningOptions, setMeaningOptions] = useState<string[]>([]);
  const [userInput, setUserInput] = useState('');
  const [userSelectedOption, setUserSelectedOption] = useState<string | null>(null);
  const [showMeaningHint, setShowMeaningHint] = useState<boolean>(false);
  const [sentenceTranslations, setSentenceTranslations] = useState<Record<string, string>>({});

  // Initialize questions when quiz starts
  const startQuizWithQuestions = (type: QuizType) => {
    if (type === 'grammar_sanctuary') {
      setQuizType('grammar_sanctuary');
      return;
    }

    if (type === 'srs') {
      setQuizType('srs');
      fetchSRSQuestions();
      return;
    }

    if (activeVocabList.length < 3) {
      alert(`Chủ đề này chỉ có ${activeVocabList.length} từ. Vui lòng chọn "Tất cả từ" hoặc thêm từ vựng để ôn tập!`);
      return;
    }

    const shuffled = [...activeVocabList].sort(() => Math.random() - 0.5);
    setShuffledQuestions(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setIsFinished(false);
    setFeedback(null);
    setUserSelectedOption(null);
    setShowMeaningHint(false);
    setUserInput('');
    setRetryQueue([]);
    setIsDoingRetryRound(false);
    setClassicFilterMode('ALTERNATE');
    setQuizReviews([]);
    setReviewFilterTab('WRONG');
    setQuizType(type);
  };

  const activeQuestions = quizType === 'srs' ? srsQuestions : shuffledQuestions;

  const [classicFilterMode, setClassicFilterMode] = useState<ClassicFilterMode>('ALTERNATE');

  // Mode determination: vocab_meaning & classic_vocab alternates ABCD & FILL_IN by default
  const activeClassicMode: ClassicMode = useMemo(() => {
    if (quizType === 'fill_in') return 'FILL_IN';
    if (quizType === 'vocab_meaning' || quizType === 'classic_vocab') {
      if (classicFilterMode === 'ABCD_ONLY') return 'ABCD';
      if (classicFilterMode === 'FILL_IN_ONLY') return 'FILL_IN';
      return currentIndex % 2 === 0 ? 'ABCD' : 'FILL_IN';
    }
    return currentIndex % 2 === 0 ? 'ABCD' : 'FILL_IN';
  }, [quizType, classicFilterMode, currentIndex]);

  const current = activeQuestions[currentIndex];

  // Helper cloze sentence computed for current word with intelligent bilingual extraction (declared unconditionally at top level)
  const currentCloze = useMemo(() => {
    if (!current) return { sentenceWithBlank: '', fullSentence: '', rawTranslation: '' };
    const word = current.word.trim();
    const meaning = current.meaning.trim();
    
    // Check if current.example contains inline Vietnamese translation e.g. "(Dịch: ...)" or " - ..."
    if (current.example && current.example.trim().length > 10) {
      const rawEx = current.example.trim();
      
      // Check if example has parentheses with Vietnamese text
      const parenMatch = rawEx.match(/^(.*?)\s*[\(\[]([^\)\]]*[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ][^\)\]]*)[\)\]]\.?$/i);
      let enSentence = rawEx;
      let viTrans = '';

      if (parenMatch) {
        enSentence = parenMatch[1].trim();
        viTrans = parenMatch[2].replace(/^(?:dịch|nghĩa|tương ứng ngữ cảnh)\s*[:.\-]\s*/i, '').trim();
      } else if (rawEx.includes(' - ') && /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(rawEx)) {
        const parts = rawEx.split(' - ');
        enSentence = parts[0].trim();
        viTrans = parts.slice(1).join(' - ').trim();
      }

      const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
      if (regex.test(enSentence)) {
        return {
          sentenceWithBlank: enSentence.replace(regex, '_______'),
          fullSentence: enSentence,
          rawTranslation: viTrans
        };
      }
      
      const stem = word.length > 4 ? word.slice(0, word.length - 2) : word;
      const stemEscaped = stem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const stemRegex = new RegExp(`\\b${stemEscaped}\\w*\\b`, 'gi');
      if (stemRegex.test(enSentence)) {
        return {
          sentenceWithBlank: enSentence.replace(stemRegex, '_______'),
          fullSentence: enSentence,
          rawTranslation: viTrans
        };
      }

      // If word is not found inside raw example, construct high-quality IELTS sentence
      return {
        sentenceWithBlank: `The lecturer emphasized that students should _______ this concept in their essays.`,
        fullSentence: `The lecturer emphasized that students should ${word} this concept in their essays.`,
        rawTranslation: `Giảng viên nhấn mạnh rằng sinh viên nên ${meaning} khái niệm này trong bài luận.`
      };
    }
    
    return {
      sentenceWithBlank: `The policy was formulated to _______ long-term sustainable growth.`,
      fullSentence: `The policy was formulated to ${word} long-term sustainable growth.`,
      rawTranslation: `Chính sách được đề ra nhằm ${meaning} tăng trưởng bền vững lâu dài.`
    };
  }, [current]);

  // Dynamic background sentence translator with in-memory caching via /api/translate
  useEffect(() => {
    if (!currentCloze?.fullSentence) return;
    const sentence = currentCloze.fullSentence.trim();
    if (!sentence || sentenceTranslations[sentence]) return;
    if (STATIC_SENTENCE_TRANSLATIONS[sentence]) return;

    let isCancelled = false;
    const fetchTrans = async () => {
      try {
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: sentence })
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.meaning && !isCancelled) {
            setSentenceTranslations(prev => ({
              ...prev,
              [sentence]: data.meaning
            }));
          }
        }
      } catch (err) {
        // Silently use contextual fallback
      }
    };

    fetchTrans();
    return () => { isCancelled = true; };
  }, [currentCloze?.fullSentence, sentenceTranslations]);

  // Active Vietnamese translation for the example sentence (declared unconditionally at top level)
  const displaySentenceTranslation = useMemo(() => {
    if (!currentCloze?.fullSentence) return '';
    if (currentCloze.rawTranslation) return currentCloze.rawTranslation;
    if (STATIC_SENTENCE_TRANSLATIONS[currentCloze.fullSentence]) {
      return STATIC_SENTENCE_TRANSLATIONS[currentCloze.fullSentence];
    }
    if (sentenceTranslations[currentCloze.fullSentence]) {
      return sentenceTranslations[currentCloze.fullSentence];
    }
    return current?.meaning ? `Trong câu ví dụ trên, từ "${current.word}" được sử dụng với ý nghĩa: "${current.meaning}".` : '';
  }, [currentCloze, sentenceTranslations, current]);

  // Setup Classic ABCD options: 1 correct Vietnamese meaning + 3 Vietnamese distractors
  useEffect(() => {
    if ((quizType === 'vocab_meaning' || quizType === 'classic_vocab') && activeQuestions.length > 0 && !isFinished && feedback === null) {
      const current = activeQuestions[currentIndex];
      if (current) {
        // Collect distinct Vietnamese meanings from other words in the vault
        const otherMeanings = Array.from(new Set(
          activeVocabList
            .filter(v => v.word.toLowerCase() !== current.word.toLowerCase() && v.meaning.trim().toLowerCase() !== current.meaning.trim().toLowerCase())
            .map(v => v.meaning.trim())
        ));

        const fallbackMeanings = [
          "tạo điều kiện thuận lợi, hỗ trợ thúc đẩy",
          "giảm thiểu tác động tiêu cực, làm dịu bớt",
          "ủng hộ công khai, đề xuất chủ trương",
          "chứng minh, đưa ra luận cứ xác thực",
          "thấu hiểu trọn vẹn, bao hàm toàn diện",
          "kích thích, tạo động lực phát triển",
          "bền vững, thân thiện với môi trường",
          "kiên cường, có khả năng phục hồi nhanh"
        ];

        const shuffledDistractors = [...otherMeanings].sort(() => 0.5 - Math.random()).slice(0, 3);
        while (shuffledDistractors.length < 3) {
          const candidate = fallbackMeanings.find(f => 
            f.toLowerCase() !== current.meaning.toLowerCase() &&
            !shuffledDistractors.some(d => d.toLowerCase() === f.toLowerCase())
          );
          if (candidate) shuffledDistractors.push(candidate);
          else break;
        }

        const opts = [
          current.meaning.trim(),
          ...shuffledDistractors
        ].sort(() => 0.5 - Math.random());

        setMeaningOptions(opts);
      }
      setUserInput('');
      setUserSelectedOption(null);
      setShowMeaningHint(false);
    }
  }, [currentIndex, activeQuestions, isFinished, quizType, feedback, activeVocabList]);

  const fetchSRSQuestions = async () => {
    setIsLoadingSRS(true);
    try {
      const sortedByWeakness = [...vocabList].sort((a: any, b: any) => {
        const levelA = a.mastery_level !== undefined ? a.mastery_level : 0;
        const levelB = b.mastery_level !== undefined ? b.mastery_level : 0;
        return levelA - levelB;
      });

      const topWeak = sortedByWeakness.slice(0, 15).sort(() => Math.random() - 0.5).slice(0, 8);
      const words = topWeak.map(v => v.word);

      let userBand = 6.5;
      try {
        const savedUser = localStorage.getItem("oasis_user");
        if (savedUser) {
          const u = JSON.parse(savedUser);
          if (u.target_band) userBand = parseFloat(u.target_band) || 6.5;
        }
      } catch (e) {}

      const grammarPool = [
        "Past Simple vs Past Perfect in Task 1",
        "Definite article 'the' with proportions",
        "Zero article with abstract nouns in Task 2",
        "Future projections (is projected to reach)",
        "Subject-verb agreement in complex sentences"
      ];
      const shuffledGrammar = [...grammarPool].sort(() => Math.random() - 0.5).slice(0, 3);

      const res = await fetch(`${API_URL}/skills/spaced-repetition-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weak_words: words.length > 0 ? words : ["mitigate", "profound", "facilitate", "resilient", "sustainable"],
          weak_grammar_points: shuffledGrammar,
          target_band: userBand,
          count: 5
        })
      });

      if (res.ok) {
        const data = await res.json();
        const items = data.quiz_items || data.items || [];
        setSrsQuestions(items);
        setCurrentIndex(0);
      } else {
        alert("Không thể tạo bài tập ôn tập SRS.");
        setQuizType(null);
      }
    } catch (e) {
      console.error(e);
      alert("Lỗi kết nối máy chủ.");
      setQuizType(null);
    } finally {
      setIsLoadingSRS(false);
    }
  };

  const normalizeWord = (str: string) => {
    if (!str) return '';
    return str
      .toLowerCase()
      .replace(/\s*\((n|v|adj|adv|prep|conj|pron|phr|idiom|slang|phrase)\b[^)]*\)/gi, '')
      .replace(/[\/\\()]/g, ' ')
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const cleanOptionText = (text: string) => {
    if (!text) return '';
    return text
      .replace(/^\[[a-d]\]\s*/i, '')
      .replace(/^[a-d][.)]\s*/i, '')
      .trim();
  };

  const getWordHint = (word: string) => {
    if (!word) return '';
    const clean = word.trim();
    if (clean.length <= 2) return `${clean[0].toUpperCase()} _ (${clean.length} chữ cái)`;
    const first = clean[0];
    const last = clean[clean.length - 1];
    const blanks = '_ '.repeat(clean.length - 2).trim();
    return `${first.toUpperCase()} ${blanks} ${last.toLowerCase()} (${clean.length} chữ cái)`;
  };

  const handleNextQuestion = () => {
    setFeedback(null);
    setUserSelectedOption(null);
    setShowMeaningHint(false);
    setUserInput('');
    if (currentIndex < activeQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Check if there are skipped words in retryQueue
      if (retryQueue.length > 0 && !isDoingRetryRound) {
        setIsDoingRetryRound(true);
        setShuffledQuestions([...retryQueue]);
        setRetryQueue([]);
        setCurrentIndex(0);
      } else {
        setIsFinished(true);
      }
    }
  };

  const handleRetryWeakWords = () => {
    const weakItems = quizReviews
      .filter(r => !r.isCorrect || (r.score !== undefined && r.score < 70))
      .map(r => {
        const found = vocabList.find(v => v.word.toLowerCase() === r.word.toLowerCase());
        return found || {
          word: r.word,
          meaning: r.meaning,
          phonetic: r.phonetic,
          audio_url: r.audio_url,
          example: r.example,
          topic: r.topic
        };
      });

    if (weakItems.length === 0) return;

    setShuffledQuestions([...weakItems]);
    setCurrentIndex(0);
    setScore(0);
    setIsFinished(false);
    setFeedback(null);
    setUserSelectedOption(null);
    setShowMeaningHint(false);
    setUserInput('');
    setRetryQueue([]);
    setIsDoingRetryRound(true);
    setQuizReviews([]);
  };

  const handleSkipQuestion = () => {
    const cur = activeQuestions[currentIndex];
    if (cur) {
      recordReview({
        id: cur.id,
        word: cur.word,
        meaning: cur.meaning,
        phonetic: cur.phonetic,
        audio_url: cur.audio_url,
        example: cur.example,
        topic: cur.topic,
        mode: quizType || 'classic_vocab',
        quizSubType: activeClassicMode === 'ABCD' ? 'ABCD' : 'FILL_IN',
        isCorrect: false,
        isSkipped: true,
        correctAnswer: activeClassicMode === 'ABCD' ? cur.meaning : cur.word,
        userAnswer: '(Bỏ qua câu hỏi)',
        errorType: activeClassicMode === 'ABCD' ? 'Chưa rõ nghĩa từ vựng' : 'Chưa nhớ từ tiếng Anh (Active Recall)',
        errorDetail: `Từ vựng "${cur.word}" mang nghĩa là "${cur.meaning}".`
      });
    }
    handleNextQuestion();
  };

  // Skip in Speech Mode
  const handleSkipWord = (word: VocabItem) => {
    setRetryQueue(prev => [...prev, word]);
    recordReview({
      id: word.id,
      word: word.word,
      meaning: word.meaning,
      phonetic: word.phonetic,
      audio_url: word.audio_url,
      example: word.example,
      topic: word.topic,
      mode: 'speech',
      quizSubType: 'SPEECH',
      isCorrect: false,
      isSkipped: true,
      score: 0,
      correctAnswer: word.word,
      userAnswer: '(Đã bấm bỏ qua)',
      errorType: 'Bỏ qua từ phát âm (Chưa tự tin phát âm)',
      errorDetail: `Cần nghe lại mẫu phát âm chuẩn ${word.phonetic ? `[${word.phonetic}]` : ''} và luyện phát âm khẩu hình rõ ràng.`
    });
    handleNextQuestion();
  };

  // Answer handler for Classic Vocab & SRS
  const handleAnswerClassic = async (answer: string) => {
    if (feedback !== null) return;
    const current = activeQuestions[currentIndex];
    if (!current) return;
    
    setUserSelectedOption(answer);
    let isCorrect = false;
    
    if (quizType === 'vocab_meaning' || quizType === 'classic_vocab') {
      if (activeClassicMode === 'ABCD') {
        isCorrect = answer.trim().toLowerCase() === current.meaning.trim().toLowerCase();
      } else {
        const cleanUser = normalizeWord(answer);
        const cleanCorrect = normalizeWord(current.word);
        isCorrect = cleanUser === cleanCorrect ||
          answer.toLowerCase().trim() === current.word.toLowerCase().trim() ||
          (cleanCorrect.length > 2 && cleanUser === cleanCorrect.split(' ')[0]);
      }
    } else if (quizType === 'fill_in') {
      const cleanUser = normalizeWord(answer);
      const cleanCorrect = normalizeWord(current.word);
      isCorrect = cleanUser === cleanCorrect ||
        answer.toLowerCase().trim() === current.word.toLowerCase().trim() ||
        (cleanCorrect.length > 2 && cleanUser === cleanCorrect.split(' ')[0]);
    } else {
      const cleanAnswer = cleanOptionText(answer).toLowerCase();
      const cleanCorrect = cleanOptionText(current.correct_answer || '').toLowerCase();
      isCorrect = cleanAnswer === cleanCorrect ||
        (cleanCorrect.length > 2 && (cleanAnswer.includes(cleanCorrect) || cleanCorrect.includes(cleanAnswer)));
    }

    if (isCorrect) {
      setFeedback('correct');
      setScore(score + 1);
    } else {
      setFeedback('wrong');
    }

    if (quizType === 'vocab_meaning' || quizType === 'classic_vocab') {
      if (activeClassicMode === 'ABCD') {
        recordReview({
          id: current.id,
          word: current.word,
          meaning: current.meaning,
          phonetic: current.phonetic,
          audio_url: current.audio_url,
          example: current.example,
          topic: current.topic,
          mode: quizType,
          quizSubType: 'ABCD',
          isCorrect,
          correctAnswer: current.meaning,
          userAnswer: answer,
          errorType: isCorrect ? 'Hiểu đúng nghĩa tiếng Việt' : 'Nhầm định nghĩa tiếng Việt',
          errorDetail: isCorrect ? undefined : `Bạn chọn "${answer}". Nghĩa chuẩn xác là: "${current.meaning}".`
        });
      } else {
        const cleanUser = normalizeWord(answer);
        const cleanCorrect = normalizeWord(current.word);
        recordReview({
          id: current.id,
          word: current.word,
          meaning: current.meaning,
          phonetic: current.phonetic,
          audio_url: current.audio_url,
          example: current.example,
          topic: current.topic,
          mode: quizType,
          quizSubType: 'FILL_IN',
          isCorrect,
          correctAnswer: current.word,
          userAnswer: answer.trim() || '(Bỏ trống)',
          errorType: isCorrect ? 'Gõ đúng chính tả chuẩn' : 'Chưa nhớ mặt chữ tiếng Anh (Active Recall)',
          errorDetail: isCorrect ? undefined : `Bạn đã gõ: "${answer.trim() || '(Bỏ trống)'}". Từ vựng chuẩn: "${current.word}" (${current.phonetic || ''}).`
        });
      }
    } else if (quizType === 'fill_in') {
      recordReview({
        id: current.id,
        word: current.word,
        meaning: current.meaning,
        phonetic: current.phonetic,
        audio_url: current.audio_url,
        example: current.example,
        topic: current.topic,
        mode: quizType,
        quizSubType: 'FILL_IN',
        isCorrect,
        correctAnswer: current.word,
        userAnswer: answer.trim() || '(Bỏ trống)',
        errorType: isCorrect ? 'Gõ đúng chính tả chuẩn' : 'Chưa nhớ mặt chữ tiếng Anh',
        errorDetail: isCorrect ? undefined : `Bạn đã gõ: "${answer.trim() || '(Bỏ trống)'}". Từ vựng chuẩn: "${current.word}".`
      });
    } else if (quizType === 'srs') {
      recordReview({
        id: current.id,
        word: current.word || 'SRS Drill',
        meaning: current.meaning || current.question,
        phonetic: current.phonetic,
        audio_url: current.audio_url,
        example: current.example,
        topic: current.topic,
        mode: quizType,
        quizSubType: 'SRS',
        isCorrect,
        correctAnswer: cleanOptionText(current.correct_answer || ''),
        userAnswer: cleanOptionText(answer),
        errorType: isCorrect ? 'Trả lời đúng câu hỏi SRS' : 'Sai câu hỏi ngữ cảnh / Collocation SRS',
        errorDetail: isCorrect ? undefined : `Đáp án đúng là: "${cleanOptionText(current.correct_answer || '')}".`
      });
    }

    if (current.id) {
      onReview(current.id, isCorrect);
    }
  };

  // 1. SELECTION SCREEN (QUIZ SETUP BENTO MODAL)
  if (quizType === null) {
    return (
      <div className="fixed inset-0 bg-stone-900/60 z-[100] flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm">
        <div className="bg-[#FAF7F2] p-6 sm:p-8 rounded-3xl shadow-2xl max-w-xl w-full relative overflow-hidden border-2 border-[#A7D08C] text-center flex flex-col items-center max-h-[90vh] overflow-y-auto custom-scrollbar text-[#2E3E2B]">
          
          <button 
            type="button" 
            onClick={onClose} 
            className="absolute top-5 right-5 text-stone-400 hover:text-[#2E3E2B] p-2 rounded-full hover:bg-stone-200/50 transition-all cursor-pointer touch-manipulation active:scale-95" 
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 bg-[#EAF2E3] rounded-2xl flex items-center justify-center mb-4 text-[#4A7C39] border border-[#A7D08C]/40">
            <GraduationCap className="w-8 h-8" />
          </div>

          <h3 className="text-2xl font-display font-black text-[#2E3E2B] mb-1">
            Matcha Quiz & Sanctuary
          </h3>
          <p className="text-xs text-stone-600 mb-5 max-w-sm">
            Nâng tầm từ vựng và ngữ pháp IELTS với 3 chế độ kiểm tra chuyên sâu cùng Mascot Mát Cha!
          </p>

          {/* Topic Scope Selector */}
          <div className="w-full bg-white p-3.5 rounded-2xl border border-[#A7D08C]/30 mb-6 text-left shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold text-stone-700 mb-2">
              <span className="flex items-center gap-1.5">
                <FolderOpen className="w-4 h-4 text-[#4A7C39]" />
                <span>Chọn phạm vi từ vựng ôn tập:</span>
              </span>
              <span className="text-[#4A7C39] font-black text-[11px]">
                {activeVocabList.length} từ khả dụng
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1 custom-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedTopic(null)}
                className={`min-h-[36px] px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer touch-manipulation active:scale-95 flex items-center gap-1.5 ${
                  !selectedTopic || selectedTopic === 'All'
                    ? 'bg-[#4A7C39] text-white border-[#4A7C39] shadow-xs'
                    : 'bg-[#FAF7F2] hover:bg-[#EAF2E3] text-[#2E3E2B] border-[#A7D08C]/30'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>Tất cả ({vocabList.length} từ)</span>
              </button>

              {availableTopics.map(([t, count]) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedTopic(t)}
                  className={`min-h-[36px] px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer touch-manipulation active:scale-95 ${
                    selectedTopic?.toLowerCase() === t.toLowerCase()
                      ? 'bg-[#4A7C39] text-white border-[#4A7C39] shadow-xs'
                      : 'bg-[#FAF7F2] hover:bg-[#EAF2E3] text-[#2E3E2B] border-[#A7D08C]/30'
                  }`}
                >
                  {t} ({count})
                </button>
              ))}
            </div>
          </div>

          {/* 5 Distinct Mode Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
            
            {/* Mode 1: Cambridge Context Mastery */}
            <button
              type="button"
              onClick={() => startQuizWithQuestions('textbook')}
              className="p-4 rounded-2xl bg-white hover:bg-[#FDFBF7] border-2 border-[#A7D08C]/40 hover:border-[#4A7C39] text-left transition-all hover:scale-[1.01] active:scale-95 shadow-xs cursor-pointer group flex flex-col justify-between min-h-[110px]"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-8 h-8 rounded-xl bg-[#EAF2E3] text-[#4A7C39] flex items-center justify-center group-hover:bg-[#4A7C39] group-hover:text-white transition-colors">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#2E3E2B] uppercase tracking-wider">
                    1. Ngữ Cảnh Chuẩn Cambridge
                  </h4>
                  <span className="text-[10px] font-bold text-[#4A7C39]">Context Detective • Bẫy Đề Thi</span>
                </div>
              </div>
              <p className="text-[11px] text-stone-600 leading-snug">
                Đọc 4 câu ngữ cảnh học thuật và phát hiện câu dùng từ chuẩn xác, bóc tách các bẫy từ loại & collocation.
              </p>
            </button>

            {/* Mode 2: Speech Pronunciation Drill */}
            <button
              type="button"
              onClick={() => startQuizWithQuestions('speech')}
              className="p-4 rounded-2xl bg-white hover:bg-[#F0FDF4] border-2 border-emerald-300 hover:border-emerald-600 text-left transition-all hover:scale-[1.01] active:scale-95 shadow-xs cursor-pointer group flex flex-col justify-between min-h-[110px]"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#2E3E2B] uppercase tracking-wider">
                    2. Luyện Phát Âm & Phản Xạ Mic
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-700">Speaking Reflex 0-100%</span>
                </div>
              </div>
              <p className="text-[11px] text-stone-600 leading-snug">
                Đọc to từ vựng qua Micro, AI phân tích âm tiết và chấm điểm độ chính xác phát âm tức thì.
              </p>
            </button>

            {/* Mode 3: Fill-in Blank Active Recall */}
            <button
              type="button"
              onClick={() => startQuizWithQuestions('fill_in')}
              className="p-4 rounded-2xl bg-white hover:bg-[#FAF7F2] border-2 border-[#A7D08C]/40 hover:border-[#4A7C39] text-left transition-all hover:scale-[1.01] active:scale-95 shadow-xs cursor-pointer group flex flex-col justify-between min-h-[110px]"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-8 h-8 rounded-xl bg-[#EAF2E3] text-[#4A7C39] flex items-center justify-center group-hover:bg-[#4A7C39] group-hover:text-white transition-colors">
                  <PenTool className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#2E3E2B] uppercase tracking-wider">
                    3. Thử Thách Điền Từ & Chính Tả
                  </h4>
                  <span className="text-[10px] font-bold text-[#4A7C39]">Active Recall • Gõ Từ Tiếng Anh</span>
                </div>
              </div>
              <p className="text-[11px] text-stone-600 leading-snug">
                Cho nghĩa tiếng Việt và câu khuyết từ, gõ chuẩn xác từ vựng tiếng Anh kèm gợi ý ký tự và độ dài từ.
              </p>
            </button>

            {/* Mode 4: IELTS Grammar Sanctuary (GIỮ NGUYÊN NÂNG CẤP) */}
            <button
              type="button"
              onClick={() => startQuizWithQuestions('grammar_sanctuary')}
              className="p-4 rounded-2xl bg-white hover:bg-[#FEFCE8] border-2 border-amber-300 hover:border-amber-500 text-left transition-all hover:scale-[1.01] active:scale-95 shadow-xs cursor-pointer group flex flex-col justify-between min-h-[110px]"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-xs">
                  <Languages className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#2E3E2B] uppercase tracking-wider">
                    4. Đấu Trường Ngữ Pháp
                  </h4>
                  <span className="text-[10px] font-bold text-amber-700">Grammar Sanctuary (Đã Nâng Cấp)</span>
                </div>
              </div>
              <p className="text-[11px] text-stone-600 leading-snug">
                Dòng thời gian 12 Thì, cây quyết định mạo từ A/An/The và luyện đề bắt lỗi sai từ kho cá nhân.
              </p>
            </button>

            {/* Mode 5: Classic Vocab Meaning & Fill-in (TÍNH NĂNG MỞ RỘNG XEN KẼ) */}
            <button
              type="button"
              onClick={() => startQuizWithQuestions('vocab_meaning')}
              className="p-4 rounded-2xl bg-white hover:bg-[#F0FDF4] border-2 border-[#4A7C39] text-left transition-all hover:scale-[1.01] active:scale-95 shadow-sm cursor-pointer group flex flex-col justify-between min-h-[110px] sm:col-span-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="w-9 h-9 rounded-xl bg-[#EAF2E3] text-[#4A7C39] flex items-center justify-center group-hover:bg-[#4A7C39] group-hover:text-white transition-colors shadow-xs">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-black text-[#2E3E2B] uppercase tracking-wider">
                        5. Trắc Nghiệm & Điền Từ Dịch Nghĩa
                      </h4>
                      <span className="text-[9px] font-black bg-[#4A7C39] text-white px-2 py-0.5 rounded-full uppercase">
                        Xen Kẽ Thông Minh
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-[#4A7C39]">Classic Vocab Quiz • Xen Kẽ Trắc Nghiệm ABCD & Điền Từ Tiếng Anh</span>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-[#4A7C39] group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-[11px] text-stone-600 leading-snug">
                Dạng làm quiz truyền thống nâng cấp: Đọc từ tiếng Anh chọn nghĩa tiếng Việt (A, B, C, D) xen kẽ nhịp nhàng với thử thách nhìn nghĩa tiếng Việt và gõ chuẩn xác từ vựng tiếng Anh (Active Recall).
              </p>
            </button>
          </div>

          {/* Mode 6: Spaced Repetition Review (Full Width) */}
          <button
            type="button"
            onClick={() => startQuizWithQuestions('srs')}
            className="w-full mt-3 p-3.5 rounded-2xl bg-gradient-to-r from-[#2E5E26] to-[#1E4318] text-white font-bold text-left transition-all hover:scale-[1.01] active:scale-95 shadow-md cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <Brain className="w-5 h-5 shrink-0 text-emerald-300" />
              <div>
                <p className="text-xs font-black uppercase tracking-wider">6. Ôn Tập SRS Cá Nhân Hóa</p>
                <p className="text-[10px] font-medium opacity-90">Collocations C1 và thuật toán đường cong quên lãng SuperMemo</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 shrink-0 text-emerald-300" />
          </button>
        </div>
      </div>
    );
  }

  // 2. GRAMMAR MASTERY LAB SCREEN
  if (quizType === 'grammar_sanctuary') {
    return (
      <div className="fixed inset-0 bg-stone-900/60 z-[100] flex items-center justify-center p-3 sm:p-5 backdrop-blur-sm">
        <div className="bg-[#FAF7F2] rounded-3xl shadow-2xl max-w-5xl w-full p-4 sm:p-7 relative max-h-[92vh] overflow-y-auto custom-scrollbar border-2 border-[#A7D08C] text-[#2E3E2B]">
          <button
            type="button"
            onClick={() => setQuizType(null)}
            className="absolute top-5 right-5 text-stone-400 hover:text-[#2E3E2B] p-2 rounded-full hover:bg-stone-200/50 transition-all cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
          <GrammarMasteryLab vocabList={activeVocabList} onClose={() => setQuizType(null)} />
        </div>
      </div>
    );
  }

  // 3. LOADING SCREEN (SRS MODE)
  if (isLoadingSRS) {
    return (
      <div className="fixed inset-0 bg-stone-900/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-[#FAF7F2] p-8 rounded-3xl shadow-2xl text-center border-2 border-[#A7D08C] max-w-sm w-full flex flex-col items-center text-[#2E3E2B]">
          <Loader2 className="w-10 h-10 text-[#4A7C39] animate-spin mb-3" />
          <p className="text-sm font-bold text-[#2E3E2B] animate-pulse">
            AI đang pha chế bài tập SRS từ kho từ vựng của bạn...
          </p>
        </div>
      </div>
    );
  }

  // 4. QUESTIONS CONTAINER SCREEN
  // (current, currentCloze, and displaySentenceTranslation are already safely declared at component top level)

  return (
    <div className="fixed inset-0 bg-stone-900/60 z-[100] flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm">
      <div className="bg-[#FAF7F2] rounded-3xl shadow-2xl max-w-2xl sm:max-w-3xl w-full relative flex flex-col max-h-[92vh] border-2 border-[#A7D08C] overflow-hidden text-[#2E3E2B]">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#A7D08C]/30 shrink-0 bg-[#F4EFE6]">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-[#4A7C39] uppercase tracking-widest bg-[#EAF2E3] px-3 py-1 rounded-full border border-[#A7D08C]/40">
              {quizType === 'textbook' ? '1. Ngữ Cảnh Cambridge' :
               quizType === 'speech' ? '2. Luyện Phát Âm Mic' :
               quizType === 'fill_in' ? '3. Điền Từ Tiếng Anh' :
               quizType === 'vocab_meaning' ? '5. Trắc Nghiệm Dịch Nghĩa' :
               quizType === 'classic_vocab' ? (activeClassicMode === 'ABCD' ? 'Trắc Nghiệm Nghĩa' : 'Điền Từ Tiếng Anh') :
               '6. Ôn Tập SRS AI'}
            </span>
            <span className="text-xs font-bold text-stone-500">
              {currentIndex + 1} / {activeQuestions.length}
            </span>
            {isDoingRetryRound && (
              <span className="text-[9px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full uppercase border border-amber-200">
                Vòng ôn từ đã bỏ qua
              </span>
            )}
          </div>

          <button 
            type="button" 
            onClick={onClose} 
            className="text-stone-400 hover:text-[#2E3E2B] p-1.5 rounded-full hover:bg-stone-200/50 transition-all cursor-pointer" 
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div 
          className="p-5 sm:p-7 overflow-y-auto custom-scrollbar flex-1 bg-[#FAF7F2] pb-10"
          style={{ overscrollBehavior: 'contain' }}
        >
          <AnimatePresence mode="wait">
            {!isFinished ? (
              <motion.div
                key={`${quizType}-${currentIndex}-${isDoingRetryRound}-${activeClassicMode}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="w-full space-y-4"
              >
                {/* 1. TEXTBOOK CONTEXT MATCHING MODE */}
                {quizType === 'textbook' && current && (
                  <TextbookSentenceMatching
                    key={current.id || current.word}
                    currentWord={current}
                    vocabPool={activeVocabList}
                    onAnswer={(isCorrect, selectedOption) => {
                      if (isCorrect) setScore(prev => prev + 1);
                      if (current.id) onReview(current.id, isCorrect);
                      recordReview({
                        id: current.id,
                        word: current.word,
                        meaning: current.meaning,
                        phonetic: current.phonetic,
                        audio_url: current.audio_url,
                        example: current.example,
                        topic: current.topic,
                        mode: 'textbook',
                        quizSubType: 'CONTEXT',
                        isCorrect,
                        correctAnswer: current.word,
                        userAnswer: selectedOption?.sentence_en,
                        errorType: isCorrect ? 'Phát hiện câu chuẩn xác' : (
                          selectedOption?.trap_type === 'pos_trap' ? 'Bẫy sai từ loại (Part of Speech Trap)' :
                          selectedOption?.trap_type === 'collocation_trap' ? 'Bẫy sai Collocation (Cụm kết hợp từ)' :
                          selectedOption?.trap_type === 'semantic_trap' ? 'Bẫy nhầm lẫn ngữ cảnh (Semantic Context)' :
                          'Lựa chọn câu chưa chuẩn'
                        ),
                        errorDetail: selectedOption?.trap_reason || `Câu dùng từ chuẩn: "${currentCloze.fullSentence}".`
                      });
                    }}
                    onNext={handleNextQuestion}
                    onSkip={handleSkipQuestion}
                    onPlayAudio={playAudio}
                  />
                )}

                {/* 2. SPEECH PRONUNCIATION DRILL MODE */}
                {quizType === 'speech' && current && (
                  <SpeechPronunciationDrill
                    key={current.id || current.word}
                    currentWord={current}
                    onAnswer={(isCorrect, speechScore, transcript) => {
                      if (isCorrect) setScore(prev => prev + 1);
                      if (current.id) onReview(current.id, isCorrect);
                      recordReview({
                        id: current.id,
                        word: current.word,
                        meaning: current.meaning,
                        phonetic: current.phonetic,
                        audio_url: current.audio_url,
                        example: current.example,
                        topic: current.topic,
                        mode: 'speech',
                        quizSubType: 'SPEECH',
                        isCorrect,
                        score: speechScore,
                        userAnswer: transcript || '(Không nhận diện được)',
                        correctAnswer: current.word,
                        errorType: speechScore >= 85 ? 'Phát âm xuất sắc (≥85%)' :
                                   speechScore >= 70 ? 'Phát âm tốt (70-84%)' :
                                   speechScore >= 50 ? 'Lỗi phát âm: Âm chưa rõ / Thiếu ending sound' :
                                   'Lỗi phát âm: Lệch âm / Sai trọng âm',
                        errorDetail: speechScore < 70
                          ? `Hệ thống nhận diện được âm: "${transcript}". Khuyên luyện: Chú ý phiên âm ${current.phonetic || ''}, mở rộng khẩu hình và bật rõ âm cuối.`
                          : `Phát âm đạt ${speechScore}% độ chuẩn xác âm học IELTS.`
                      });
                    }}
                    onSkipWord={handleSkipWord}
                    onNext={handleNextQuestion}
                    onPlayAudio={playAudio}
                  />
                )}

                {/* 3. VOCAB MODES (ABCD MEANING & FILL-IN) */}
                {(quizType === 'classic_vocab' || quizType === 'vocab_meaning' || quizType === 'fill_in') && current && (
                  <div className="space-y-4">
                    {/* Question Type Indicator Badge & Filter Switcher */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-black text-[#4A7C39] bg-[#EAF2E3] px-3.5 py-1.5 rounded-full flex items-center gap-1.5 border border-[#A7D08C]/40">
                          {activeClassicMode === 'ABCD' ? (
                            <>
                              <Sparkles className="w-3.5 h-3.5 shrink-0" />
                              <span>Trắc nghiệm 4 lựa chọn: Chọn nghĩa tiếng Việt đúng</span>
                            </>
                          ) : (
                            <>
                              <PenTool className="w-3.5 h-3.5 shrink-0" />
                              <span>Điền từ tiếng Anh: Gõ từ theo nghĩa tiếng Việt (Active Recall)</span>
                            </>
                          )}
                        </span>

                        {(quizType === 'vocab_meaning' || quizType === 'classic_vocab') && !feedback && (
                          <div className="inline-flex items-center bg-stone-200/60 p-0.5 rounded-full text-[10px] font-bold border border-stone-300/60">
                            <button
                              type="button"
                              onClick={() => setClassicFilterMode('ALTERNATE')}
                              className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                                classicFilterMode === 'ALTERNATE'
                                  ? 'bg-[#4A7C39] text-white shadow-xs'
                                  : 'text-stone-600 hover:text-stone-900'
                              }`}
                              title="Xen kẽ Trắc nghiệm ABCD và Điền từ"
                            >
                              Xen kẽ (Khuyên dùng)
                            </button>
                            <button
                              type="button"
                              onClick={() => setClassicFilterMode('ABCD_ONLY')}
                              className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                                classicFilterMode === 'ABCD_ONLY'
                                  ? 'bg-[#4A7C39] text-white shadow-xs'
                                  : 'text-stone-600 hover:text-stone-900'
                              }`}
                              title="Chỉ làm dạng trắc nghiệm 4 lựa chọn"
                            >
                              Chỉ ABCD
                            </button>
                            <button
                              type="button"
                              onClick={() => setClassicFilterMode('FILL_IN_ONLY')}
                              className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                                classicFilterMode === 'FILL_IN_ONLY'
                                  ? 'bg-[#4A7C39] text-white shadow-xs'
                                  : 'text-stone-600 hover:text-stone-900'
                              }`}
                              title="Chỉ làm dạng điền từ tiếng Anh"
                            >
                              Chỉ Điền từ
                            </button>
                          </div>
                        )}
                      </div>

                      {current.topic && (
                        <span className="text-[11px] font-bold text-stone-500 bg-stone-100 px-2.5 py-1 rounded-full self-start sm:self-auto">
                          {current.topic}
                        </span>
                      )}
                    </div>

                    {/* DẠNG 1: TRẮC NGHIỆM ABCD (HỎI NGHĨA TIẾNG VIỆT CỦA TỪ TIẾNG ANH) */}
                    {activeClassicMode === 'ABCD' ? (
                      <div className="space-y-4">
                        {/* Target English Word Card */}
                        <div className="bg-white p-5 sm:p-6 rounded-2xl border-2 border-[#A7D08C]/40 shadow-xs text-center space-y-2">
                          <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                            Nghĩa tiếng Việt chuẩn xác nhất của từ vựng này là gì?
                          </p>

                          <div className="flex items-center justify-center gap-3">
                            <h3 className="text-2xl sm:text-3xl font-display font-black text-[#2E3E2B]">
                              {current.word}
                            </h3>
                            <button
                              type="button"
                              onClick={() => playAudio(current.word, current.audio_url)}
                              className="p-1.5 rounded-full hover:bg-[#EAF2E3] text-[#4A7C39] hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                              title="Nghe phát âm"
                            >
                              <Volume2 className="w-5 h-5 shrink-0" />
                            </button>
                          </div>

                          {current.phonetic && (
                            <p className="text-xs font-mono text-stone-500">{current.phonetic}</p>
                          )}

                          {feedback !== null && (
                            <div className="pt-2 border-t border-stone-100 mt-2">
                              <span className="inline-flex items-center gap-1.5 bg-[#EAF2E3] border border-[#A7D08C] text-[#14532D] px-3.5 py-1.5 rounded-full text-xs font-bold shadow-xs">
                                <span className="font-black text-[#4A7C39]">Định nghĩa chuẩn:</span>
                                <span className="font-bold text-[#2E3E2B]">"{current.meaning}"</span>
                              </span>
                            </div>
                          )}
                        </div>

                        {/* 4 Vietnamese Meaning Options (A, B, C, D) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {meaningOptions.map((optMeaning, i) => {
                            const isCorrect = optMeaning.trim().toLowerCase() === current.meaning.trim().toLowerCase();
                            const isSelected = userSelectedOption?.trim().toLowerCase() === optMeaning.trim().toLowerCase();

                            let btnStyle = "bg-white hover:bg-[#F0FDF4] hover:border-[#4A7C39] border-2 border-[#A7D08C]/40 text-[#2E3E2B]";
                            if (feedback) {
                              if (isCorrect) {
                                btnStyle = "bg-[#DCFCE7] border-[#22C55E] text-[#14532D] font-black ring-2 ring-[#22C55E]/40 shadow-sm";
                              } else if (isSelected && !isCorrect) {
                                btnStyle = "bg-[#FEE2E2] border-[#EF4444] text-[#991B1B] font-bold shadow-sm";
                              } else {
                                btnStyle = "bg-white border-stone-200 text-[#2E3E2B]";
                              }
                            }

                            return (
                              <button
                                key={`${current.word}-${optMeaning}-${i}`}
                                type="button"
                                disabled={feedback !== null}
                                onClick={() => handleAnswerClassic(optMeaning)}
                                className={`p-3.5 rounded-2xl border-2 font-bold text-left transition-all flex items-center justify-between cursor-pointer min-h-[58px] shadow-xs ${btnStyle}`}
                              >
                                <span className="text-sm flex items-center gap-2.5">
                                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                                    feedback && isCorrect 
                                      ? 'bg-[#22C55E] text-white' 
                                      : feedback && isSelected && !isCorrect
                                      ? 'bg-[#EF4444] text-white'
                                      : 'bg-[#EAF2E3] text-[#4A7C39]'
                                  }`}>
                                    {String.fromCharCode(65 + i)}
                                  </span>
                                  <span className="font-sans leading-snug">{optMeaning}</span>
                                </span>
                                {feedback && isCorrect && (
                                  <div className="flex items-center gap-1 shrink-0">
                                    <span className="text-[10px] font-black bg-[#16A34A] text-white px-2 py-0.5 rounded-full hidden sm:inline-block">ĐÚNG</span>
                                    <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0" />
                                  </div>
                                )}
                                {feedback && isSelected && !isCorrect && (
                                  <div className="flex items-center gap-1 shrink-0">
                                    <span className="text-[10px] font-black bg-[#DC2626] text-white px-2 py-0.5 rounded-full hidden sm:inline-block">BẠN CHỌN</span>
                                    <AlertCircle className="w-5 h-5 text-[#DC2626] shrink-0" />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Skip Question Button */}
                        {!feedback && (
                          <div className="flex justify-end pt-1">
                            <button
                              type="button"
                              onClick={handleSkipQuestion}
                              className="min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold text-stone-500 hover:text-[#2E3E2B] hover:bg-stone-200/50 transition-all flex items-center gap-1.5 cursor-pointer touch-manipulation active:scale-95"
                            >
                              <SkipForward className="w-4 h-4 text-amber-700 shrink-0" />
                              <span>Bỏ qua câu này (Chuyển sang từ khác)</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* DẠNG 2: ĐIỀN TỪ (GÕ TỪ TIẾNG ANH KHI BIẾT NGHĨA TIẾNG VIỆT) */
                      <div className="space-y-4">
                        <div className="bg-white p-5 sm:p-6 rounded-2xl border-2 border-[#A7D08C]/40 shadow-xs space-y-3">
                          <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                            Từ tiếng Anh nào mang ý nghĩa sau đây?
                          </p>

                          {/* Prominent Vietnamese Meaning */}
                          <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#A7D08C]/30 text-center">
                            <h3 className="text-xl sm:text-2xl font-bold text-[#4A7C39]">
                              "{current.meaning}"
                            </h3>
                          </div>

                          {/* Cloze Academic Context Sentence if available */}
                          <div className="space-y-1 pt-1">
                            <span className="text-[11px] font-bold text-stone-500 flex items-center gap-1">
                              <BookOpen className="w-3.5 h-3.5 text-[#4A7C39]" />
                              <span>Ngữ cảnh học thuật (câu khuyết từ):</span>
                            </span>
                            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-[#2E3E2B] font-serif text-sm leading-relaxed font-semibold">
                              "{currentCloze.sentenceWithBlank}"
                            </div>
                          </div>

                          {/* Word Hint (Letters count & First/Last characters) */}
                          <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
                            <span className="text-stone-600 font-medium flex items-center gap-1.5">
                              <span className="text-[#4A7C39] font-black">Gợi ý ký tự:</span>
                              <span className="font-mono bg-stone-100 px-2.5 py-1 rounded-md font-bold text-[#2E3E2B] tracking-widest">
                                {getWordHint(current.word)}
                              </span>
                            </span>
                          </div>
                        </div>

                        {/* Input Field & Submit Button */}
                        <div className="space-y-3">
                          <input
                            type="text"
                            autoFocus
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && userInput.trim() && handleAnswerClassic(userInput)}
                            placeholder="Gõ từ tiếng Anh cần điền..."
                            disabled={feedback !== null}
                            className="w-full min-h-[50px] px-4 py-3 rounded-2xl border-2 border-[#A7D08C] text-center font-bold text-lg outline-none focus:border-[#4A7C39] bg-white text-[#2E3E2B] shadow-inner placeholder:text-stone-400 placeholder:font-normal placeholder:text-sm"
                          />

                          {!feedback && (
                            <div className="flex flex-col sm:flex-row items-center gap-2">
                              <button
                                type="button"
                                disabled={!userInput.trim()}
                                onClick={() => handleAnswerClassic(userInput)}
                                className="w-full min-h-[46px] bg-[#4A7C39] disabled:bg-stone-300 text-white rounded-full font-black text-sm shadow-md hover:bg-[#3B642D] transition-all cursor-pointer flex items-center justify-center gap-2"
                              >
                                <span>Xác nhận đáp án</span>
                                <ArrowRight className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={handleSkipQuestion}
                                className="w-full sm:w-auto min-h-[44px] px-4 rounded-full text-xs font-bold text-stone-500 hover:text-[#2E3E2B] hover:bg-stone-200/50 transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                              >
                                <SkipForward className="w-4 h-4 text-amber-700 shrink-0" />
                                <span>Bỏ qua</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* BẢNG GIẢI THÍCH CHI TIẾT & ĐÁP ÁN ĐÚNG/SAI */}
                    {feedback && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3 pt-2"
                      >
                        {/* 1. Status Banner */}
                        {feedback === 'correct' ? (
                          <div className="bg-[#DCFCE7] border-2 border-[#22C55E] text-[#14532D] p-3.5 sm:p-4 rounded-2xl flex items-center justify-between shadow-xs">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-xl bg-[#22C55E] text-white flex items-center justify-center shrink-0 shadow-xs">
                                <CheckCircle2 className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="font-black text-sm text-[#14532D]">Chính xác! Xuất sắc!</p>
                                <p className="text-xs text-[#166534]">
                                  {activeClassicMode === 'ABCD'
                                    ? `"${current.word}" mang nghĩa là "${current.meaning}".`
                                    : `Bạn đã nhớ chính xác từ vựng "${current.word}".`}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs font-black bg-[#16A34A] text-white px-3 py-1 rounded-full shadow-xs">+1 Điểm</span>
                          </div>
                        ) : (
                          <div className="bg-[#FEE2E2] border-2 border-[#EF4444] text-[#991B1B] p-3.5 sm:p-4 rounded-2xl flex items-start gap-2.5 shadow-xs">
                            <div className="w-9 h-9 rounded-xl bg-[#EF4444] text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                              <AlertCircle className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <p className="font-black text-sm text-[#991B1B]">Chưa chính xác!</p>
                              <div className="text-xs text-[#7F1D1D] mt-1 space-y-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span>Từ vựng:</span>
                                  <span className="font-black text-sm text-[#15803D] bg-white px-2.5 py-0.5 rounded-lg border border-[#A7D08C] shadow-xs">
                                    {current.word}
                                  </span>
                                  <span>- Định nghĩa:</span>
                                  <span className="font-bold text-[#15803D]">"{current.meaning}"</span>
                                </div>
                                {activeClassicMode === 'ABCD' && userSelectedOption && (
                                  <p className="text-stone-500 text-[11px]">
                                    (Bạn đã chọn: <span className="line-through text-[#DC2626] font-medium">{userSelectedOption}</span>)
                                  </p>
                                )}
                                {activeClassicMode === 'FILL_IN' && userInput && (
                                  <p className="text-stone-500 text-[11px]">
                                    (Bạn đã nhập: <span className="line-through text-[#DC2626] font-medium">{userInput}</span>)
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 2. Bento Box Giải thích học thuật chuyên sâu */}
                        <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-[#A7D08C]/40 shadow-xs space-y-3.5">
                          {/* Pronunciation & Audio */}
                          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-xl font-display font-black text-[#2E3E2B]">
                                  {current.word}
                                </h4>
                                {current.phonetic && (
                                  <span className="text-xs font-mono text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                                    {current.phonetic}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs font-bold text-[#4A7C39] mt-0.5">
                                Định nghĩa: <span className="font-normal text-stone-800">{current.meaning}</span>
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => playAudio(current.word, current.audio_url)}
                              className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#EAF2E3] hover:bg-[#A7D08C] text-[#2E3E2B] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-95"
                            >
                              <Volume2 className="w-4 h-4 text-[#4A7C39]" />
                              <span>Phát âm</span>
                            </button>
                          </div>

                          {/* IELTS Academic Sentence Analysis */}
                          <div className="space-y-1.5 text-xs">
                            <span className="font-black text-[#2E3E2B] flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-stone-500">
                              <BookOpen className="w-3.5 h-3.5 text-[#4A7C39]" />
                              <span>Ngữ cảnh học thuật & Câu ví dụ:</span>
                            </span>
                            <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#A7D08C]/20 text-stone-800 font-serif leading-relaxed text-sm font-medium">
                              {currentCloze.fullSentence}
                            </div>
                            <div className="flex items-start gap-1.5 text-stone-600 text-xs pl-1">
                              <span className="font-bold text-[#4A7C39] shrink-0">Dịch nghĩa:</span>
                              <span className="italic leading-relaxed">{displaySentenceTranslation}</span>
                            </div>
                          </div>

                          {/* 🎯 Giải thích lý do chọn & điền từ */}
                          {(() => {
                            const grammarInfo = getGrammarAndSelectionReason(
                              current.word,
                              current.meaning,
                              currentCloze.fullSentence
                            );
                            return (
                              <div className="p-3.5 rounded-2xl bg-[#F4EFE6]/70 border border-[#A7D08C]/40 space-y-2.5 text-xs">
                                <div className="flex items-center justify-between">
                                  <span className="font-black text-[#2E3E2B] flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                                    <Target className="w-3.5 h-3.5 text-[#4A7C39]" />
                                    <span>Giải thích lý do chọn & điền từ:</span>
                                  </span>
                                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border shadow-2xs ${grammarInfo.posColor}`}>
                                    {grammarInfo.posBadge}
                                  </span>
                                </div>

                                <div className="space-y-1.5">
                                  <p className="text-stone-700 leading-relaxed">
                                    <strong className="text-[#2E3E2B]">Cấu trúc & Vai trò:</strong> {grammarInfo.roleAnalysis}
                                  </p>
                                  <p className="text-stone-700 leading-relaxed">
                                    <strong className="text-[#2E3E2B]">Collocation học thuật:</strong>{' '}
                                    <span className="text-[#4A7C39] font-bold">{grammarInfo.collocation}</span>
                                  </p>
                                  <div className="text-[#15803D] bg-white p-2.5 rounded-xl border border-[#A7D08C]/30 leading-relaxed shadow-2xs">
                                    <strong className="text-[#14532D]">✓ Lý do chọn đáp án:</strong> {grammarInfo.selectionReason}
                                  </div>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Memory Hook / Collocation if present */}
                          {current.memory_hook && (
                            <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                              <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                              <div>
                                <strong className="text-amber-800">Mẹo nhớ nhanh:</strong> {current.memory_hook}
                              </div>
                            </div>
                          )}

                          {/* Nút Chuyển Câu Tiếp Theo */}
                          <div className="pt-2 flex justify-end">
                            <button
                              type="button"
                              onClick={handleNextQuestion}
                              className="w-full sm:w-auto min-h-[46px] bg-[#4A7C39] text-white px-8 py-2.5 rounded-full font-black text-sm shadow-md hover:bg-[#3B642D] transition-all flex items-center justify-center gap-2 cursor-pointer touch-manipulation active:scale-95"
                            >
                              <span>Câu tiếp theo</span>
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* 4. SRS AI MODE */}
                {quizType === 'srs' && current && (
                  <div className="space-y-4">
                    <div className="bg-white p-5 rounded-2xl border-2 border-[#A7D08C]/40 shadow-xs">
                      <p className="text-sm font-bold text-[#2E3E2B] text-center leading-relaxed">
                        {current.question}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5">
                      {(current.options || []).map((opt: string, i: number) => {
                        const isCorrect = cleanOptionText(opt).toLowerCase() === cleanOptionText(current.correct_answer || '').toLowerCase();
                        const isSelected = userSelectedOption && cleanOptionText(userSelectedOption).toLowerCase() === cleanOptionText(opt).toLowerCase();
                        let btnStyle = "bg-white hover:bg-[#F0FDF4] border-2 border-[#A7D08C]/40 text-[#2E3E2B]";
                        if (feedback) {
                          if (isCorrect) btnStyle = "bg-[#DCFCE7] border-[#22C55E] text-[#14532D] font-black shadow-sm ring-2 ring-[#22C55E]/40";
                          else if (isSelected && !isCorrect) btnStyle = "bg-[#FEE2E2] border-[#EF4444] text-[#991B1B] font-bold shadow-sm";
                          else btnStyle = "bg-white border-stone-200 text-[#2E3E2B]";
                        }
                        return (
                          <button
                            key={`${current.word}-srs-${opt}-${i}`}
                            type="button"
                            disabled={feedback !== null}
                            onClick={() => handleAnswerClassic(opt)}
                            className={`p-3.5 rounded-2xl border-2 font-bold text-left transition-all flex items-center justify-between cursor-pointer min-h-[52px] shadow-xs ${btnStyle}`}
                          >
                            <span className="text-sm font-semibold">{cleanOptionText(opt)}</span>
                            {feedback && isCorrect && (
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-[10px] font-black bg-[#16A34A] text-white px-2 py-0.5 rounded-full">ĐÚNG</span>
                                <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                              </div>
                            )}
                            {feedback && isSelected && !isCorrect && (
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-[10px] font-black bg-[#DC2626] text-white px-2 py-0.5 rounded-full">BẠN CHỌN</span>
                                <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {feedback && (
                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={handleNextQuestion}
                          className="min-h-[44px] bg-[#4A7C39] text-white px-7 py-2.5 rounded-full font-bold shadow-md hover:bg-[#3B642D] transition-all flex items-center gap-2 cursor-pointer"
                        >
                          <span>Câu tiếp theo</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
             ) : (
              /* Comprehensive IELTS Academic Finish & Diagnostic Scorecard Screen */
              <div className="py-2 space-y-6">
                {/* 1. Performance Overview Banner */}
                <div className="p-6 rounded-3xl bg-white border-2 border-[#A7D08C]/50 shadow-xs text-center relative overflow-hidden space-y-4">
                  <div className="w-16 h-16 bg-[#EAF2E3] border-2 border-[#A7D08C]/60 rounded-2xl flex items-center justify-center mx-auto text-[#4A7C39] shadow-xs">
                    <Trophy className="w-8 h-8" />
                  </div>

                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#4A7C39] bg-[#EAF2E3] px-3 py-1 rounded-full border border-[#A7D08C]/40">
                      Báo Cáo Đánh Giá Chi Tiết • IELTS Evaluation
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-display font-black text-[#2E3E2B] mt-2">
                      Hoàn Thành Phiên Ôn Tập!
                    </h3>
                    <p className="text-xs text-stone-600 mt-1">
                      {quizType === 'textbook' ? '1. Ngữ Cảnh Chuẩn Cambridge' :
                       quizType === 'speech' ? '2. Luyện Phát Âm & Phản Xạ Mic' :
                       quizType === 'fill_in' ? '3. Thử Thách Điền Từ & Chính Tả' :
                       quizType === 'vocab_meaning' || quizType === 'classic_vocab' ? '5. Trắc Nghiệm & Điền Từ Dịch Nghĩa' :
                       'Ôn Tập Tổng Hợp'}
                    </p>
                  </div>

                  {/* Score & Band Assessment Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                    <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#A7D08C]/30 text-center">
                      <span className="text-[10px] font-bold text-stone-500 uppercase block">Điểm số</span>
                      <span className="text-xl sm:text-2xl font-black text-[#4A7C39]">
                        {score} <span className="text-xs text-stone-400 font-normal">/ {activeQuestions.length}</span>
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#A7D08C]/30 text-center">
                      <span className="text-[10px] font-bold text-stone-500 uppercase block">Độ chính xác</span>
                      <span className="text-xl sm:text-2xl font-black text-[#2E3E2B]">
                        {activeQuestions.length > 0 ? Math.round((score / activeQuestions.length) * 100) : 0}%
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#A7D08C]/30 text-center">
                      <span className="text-[10px] font-bold text-stone-500 uppercase block">Từ chuẩn xác</span>
                      <span className="text-xl sm:text-2xl font-black text-emerald-600">
                        {quizReviews.filter(r => r.isCorrect).length}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#A7D08C]/30 text-center">
                      <span className="text-[10px] font-bold text-stone-500 uppercase block">Cần rèn luyện</span>
                      <span className="text-xl sm:text-2xl font-black text-rose-600">
                        {quizReviews.filter(r => !r.isCorrect || (r.score !== undefined && r.score < 70)).length}
                      </span>
                    </div>
                  </div>

                  {/* IELTS Band Equivalent Evaluation Badge */}
                  {(() => {
                    const accuracy = activeQuestions.length > 0 ? Math.round((score / activeQuestions.length) * 100) : 0;
                    let bandLabel = "Band 8.0+ • Xuất sắc";
                    let bandDesc = "Phản xạ từ vựng và ngữ cảnh học thuật đạt mức độ thành thạo cao.";
                    let badgeColor = "bg-emerald-50 text-emerald-800 border-emerald-300";

                    if (accuracy < 50) {
                      bandLabel = "Cần tăng tốc • Dưới 5.5";
                      bandDesc = "Cần củng cố thêm phát âm và nhận diện mặt chữ thường xuyên hơn.";
                      badgeColor = "bg-rose-50 text-rose-800 border-rose-300";
                    } else if (accuracy < 70) {
                      bandLabel = "Band 5.5 - 6.5 • Khá tốt";
                      bandDesc = "Nắm được nghĩa cơ bản, cần rèn luyện thêm về bẫy collocation và âm cuối.";
                      badgeColor = "bg-amber-50 text-amber-800 border-amber-300";
                    } else if (accuracy < 85) {
                      bandLabel = "Band 7.0 - 7.5 • Tốt";
                      bandDesc = "Vốn từ vững vàng, kiểm soát tốt cấu trúc câu và phát âm tương đối chuẩn xác.";
                      badgeColor = "bg-blue-50 text-blue-800 border-blue-300";
                    }

                    return (
                      <div className={`p-3 rounded-2xl border flex items-center justify-between text-left ${badgeColor}`}>
                        <div className="flex items-center gap-2.5">
                          <Sparkles className="w-5 h-5 shrink-0" />
                          <div>
                            <span className="text-xs font-black block">{bandLabel}</span>
                            <span className="text-[11px] opacity-90 block">{bandDesc}</span>
                          </div>
                        </div>
                        <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-white shadow-2xs shrink-0">
                          {accuracy}%
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {/* 2. Detailed Words Diagnostic & Practice Table */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-[#4A7C39]" />
                      <h4 className="text-sm font-black text-[#2E3E2B] uppercase tracking-wider">
                        Bảng Đánh Giá & Chẩn Đoán Lỗi Từng Từ
                      </h4>
                    </div>

                    {/* Filter Tabs */}
                    <div className="inline-flex items-center bg-stone-200/70 p-0.5 rounded-full text-xs font-bold border border-stone-300/60 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setReviewFilterTab('WRONG')}
                        className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                          reviewFilterTab === 'WRONG'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        Cần rèn luyện ({quizReviews.filter(r => !r.isCorrect || (r.score !== undefined && r.score < 70)).length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setReviewFilterTab('CORRECT')}
                        className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                          reviewFilterTab === 'CORRECT'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        Đã đạt ({quizReviews.filter(r => r.isCorrect).length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setReviewFilterTab('ALL')}
                        className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                          reviewFilterTab === 'ALL'
                            ? 'bg-[#4A7C39] text-white shadow-xs'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        Tất cả ({quizReviews.length})
                      </button>
                    </div>
                  </div>

                  {/* Word Review Cards List */}
                  <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
                    {(() => {
                      const displayedReviews = quizReviews.filter(r => {
                        if (reviewFilterTab === 'WRONG') return !r.isCorrect || (r.score !== undefined && r.score < 70);
                        if (reviewFilterTab === 'CORRECT') return r.isCorrect && (r.score === undefined || r.score >= 70);
                        return true;
                      });

                      if (displayedReviews.length === 0) {
                        return (
                          <div className="text-center py-8 text-xs text-stone-500 bg-white rounded-2xl border border-stone-200">
                            {reviewFilterTab === 'WRONG'
                              ? '🎉 Chúc mừng! Bạn không có từ nào bị sai hoặc phát âm yếu trong lượt thi này.'
                              : 'Chưa có dữ liệu đánh giá.'}
                          </div>
                        );
                      }

                      return displayedReviews.map((r, idx) => (
                        <div
                          key={`${r.word}-${idx}`}
                          className={`p-4 rounded-2xl border-2 transition-all shadow-2xs space-y-2 text-left ${
                            r.isCorrect && (r.score === undefined || r.score >= 70)
                              ? 'bg-white border-emerald-200/70'
                              : 'bg-white border-rose-200 hover:border-rose-300'
                          }`}
                        >
                          {/* Word Header */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-base sm:text-lg font-black text-[#2E3E2B]">
                                  {r.word}
                                </span>
                                {r.phonetic && (
                                  <span className="text-xs font-mono text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md font-medium">
                                    {r.phonetic}
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => playAudio(r.word, r.audio_url)}
                                  className="p-1 rounded-full hover:bg-[#EAF2E3] text-[#4A7C39] transition-transform active:scale-95 cursor-pointer"
                                  title="Nghe phát âm chuẩn"
                                >
                                  <Volume2 className="w-4 h-4" />
                                </button>
                              </div>
                              <p className="text-xs text-stone-600 font-medium mt-0.5">
                                {r.meaning}
                              </p>
                            </div>

                            {/* SubType & Status Badges */}
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                                r.isCorrect && (r.score === undefined || r.score >= 70)
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : 'bg-rose-50 text-rose-800 border-rose-300'
                              }`}>
                                {r.isCorrect && (r.score === undefined || r.score >= 70) ? '✓ Đạt yêu cầu' : '⚠️ Cần rèn luyện'}
                              </span>
                              <span className="text-[9px] font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md uppercase">
                                {r.quizSubType === 'SPEECH' ? '🎤 Luyện phát âm' :
                                 r.quizSubType === 'CONTEXT' ? '🎯 Ngữ cảnh Cambridge' :
                                 r.quizSubType === 'FILL_IN' ? '✍️ Điền từ chính tả' :
                                 r.quizSubType === 'ABCD' ? '🔤 Trắc nghiệm nghĩa' : '🧠 Ôn tập SRS'}
                              </span>
                            </div>
                          </div>

                          {/* Diagnostic Details Box */}
                          <div className={`p-3 rounded-xl text-xs space-y-1.5 ${
                            r.isCorrect && (r.score === undefined || r.score >= 70) ? 'bg-[#F4F9F2] text-[#14532D]' : 'bg-[#FEF2F2] text-[#991B1B]'
                          }`}>
                            {/* Specific Mode Diagnostics */}
                            {r.quizSubType === 'SPEECH' && (
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-[11px] font-bold">
                                  <span>Độ chuẩn xác âm học: <strong>{r.score !== undefined ? `${r.score}%` : 'N/A'}</strong></span>
                                  <span className="font-semibold">{r.errorType}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[11px]">
                                  <span className="opacity-80">Máy nhận diện được:</span>
                                  <strong className="font-mono bg-white/80 px-2 py-0.5 rounded border border-rose-200">
                                    "{r.userAnswer || '(Không nhận được âm)'}"
                                  </strong>
                                </div>
                                {r.errorDetail && (
                                  <p className="text-[11px] leading-relaxed opacity-95 pt-0.5">
                                    💡 <strong>Chẩn đoán & Khuyên luyện:</strong> {r.errorDetail}
                                  </p>
                                )}
                              </div>
                            )}

                            {r.quizSubType === 'CONTEXT' && (
                              <div className="space-y-1">
                                <div className="text-[11px] font-bold">
                                  <span>Phân loại: <strong>{r.errorType}</strong></span>
                                </div>
                                {r.errorDetail && (
                                  <p className="text-[11px] leading-relaxed opacity-95">
                                    {r.errorDetail}
                                  </p>
                                )}
                              </div>
                            )}

                            {r.quizSubType === 'FILL_IN' && (
                              <div className="space-y-1">
                                <div className="text-[11px] font-bold">
                                  <span>Chẩn đoán: <strong>{r.errorType}</strong></span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[11px]">
                                  <span className="opacity-80">Bạn đã gõ:</span>
                                  <strong className="font-mono bg-white/80 px-2 py-0.5 rounded border border-rose-200">
                                    "{r.userAnswer}"
                                  </strong>
                                  <span className="opacity-80">vs Chuẩn:</span>
                                  <strong className="font-mono bg-white/80 px-2 py-0.5 rounded border border-emerald-300 text-emerald-800">
                                    "{r.correctAnswer}"
                                  </strong>
                                </div>
                              </div>
                            )}

                            {r.quizSubType === 'ABCD' && (
                              <div className="space-y-1">
                                <div className="text-[11px] font-bold">
                                  <span>Chẩn đoán: <strong>{r.errorType}</strong></span>
                                </div>
                                {r.errorDetail && (
                                  <p className="text-[11px] leading-relaxed opacity-95">
                                    {r.errorDetail}
                                  </p>
                                )}
                              </div>
                            )}

                            {r.quizSubType === 'SRS' && (
                              <div className="space-y-1">
                                <div className="text-[11px] font-bold">
                                  <span>Chẩn đoán: <strong>{r.errorType}</strong></span>
                                </div>
                                {r.errorDetail && (
                                  <p className="text-[11px] leading-relaxed opacity-95">
                                    {r.errorDetail}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* 3. Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-3 border-t border-[#A7D08C]/30">
                  {quizReviews.some(r => !r.isCorrect || (r.score !== undefined && r.score < 70)) ? (
                    <button
                      type="button"
                      onClick={handleRetryWeakWords}
                      className="w-full sm:w-auto min-h-[46px] px-6 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Rèn Luyện Lại Các Từ Này Ngay ({quizReviews.filter(r => !r.isCorrect || (r.score !== undefined && r.score < 70)).length} từ)</span>
                    </button>
                  ) : (
                    <div />
                  )}

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setQuizType(null)}
                      className="flex-1 sm:flex-none min-h-[44px] bg-[#4A7C39] text-white px-5 py-2.5 rounded-full font-bold shadow-md hover:bg-[#3B642D] transition-all cursor-pointer text-xs flex items-center justify-center gap-1.5"
                    >
                      <span>Chọn phần thi khác</span>
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="min-h-[44px] bg-stone-700 text-white px-5 py-2.5 rounded-full font-bold shadow-md hover:bg-stone-800 transition-all cursor-pointer text-xs"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
