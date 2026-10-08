// frontend/data/grammarLessons.ts
// Curated IELTS Academic Grammar Knowledge Base & Practice Exercises
// Zero latency (0ms), Zero hallucination, Aligned with Cambridge Band 7.5+ Standards & CEFR EGP

export interface AcademicExample {
  sentence: string;
  task_type: 'Task 1' | 'Task 2' | 'Speaking';
  analysis: string;
  band_score: string;
}

export type GrammarCategory = 
  | 'tenses' 
  | 'modals' 
  | 'sentence_structures' 
  | 'clauses' 
  | 'verb_forms' 
  | 'modifiers' 
  | 'articles';

export interface GrammarTopicMeta {
  id: GrammarCategory;
  title_vi: string;
  title_en: string;
  icon_name: string;
  cefr_span: string;
  summary: string;
}

export const GRAMMAR_TOPICS: GrammarTopicMeta[] = [
  {
    id: 'tenses',
    title_vi: 'Các Thì & Thời Gian',
    title_en: 'Tenses & Aspects',
    icon_name: 'Clock',
    cefr_span: 'A2 - C1',
    summary: '12 thì cơ bản, phân biệt thì dễ nhầm và dự báo tương lai chuẩn Task 1.'
  },
  {
    id: 'modals',
    title_vi: 'Động Từ Khuyết Thiếu & Hedging',
    title_en: 'Modals & Semi-modals',
    icon_name: 'ShieldCheck',
    cefr_span: 'B1 - B2',
    summary: 'Kỹ thuật Hedging giảm tính quả quyết, diễn đạt khả năng và suy đoán quá khứ.'
  },
  {
    id: 'sentence_structures',
    title_vi: 'Cấu Trúc Câu & Đảo Ngữ',
    title_en: 'Sentence Structures & Inversion',
    icon_name: 'Layers',
    cefr_span: 'B2 - C1',
    summary: 'Passive Voice học thuật, Đảo ngữ (Inversion) và Câu điều kiện hỗn hợp Band 8.0+.'
  },
  {
    id: 'clauses',
    title_vi: 'Mệnh Đề & Liên Từ',
    title_en: 'Clauses & Connectors',
    icon_name: 'GitBranch',
    cefr_span: 'B2 - C1',
    summary: 'Rút gọn mệnh đề quan hệ (V-ing/V-ed), liên từ nhượng bộ và mệnh đề danh ngữ.'
  },
  {
    id: 'verb_forms',
    title_vi: 'Dạng Động Từ & Phân Từ',
    title_en: 'Verb Forms & Participles',
    icon_name: 'CheckCircle2',
    cefr_span: 'B1 - B2',
    summary: 'Gerund vs Infinitive mang đổi nghĩa, V-ing làm chủ ngữ số ít và phân từ hoàn thành.'
  },
  {
    id: 'modifiers',
    title_vi: 'Mạo Từ & Lượng Từ',
    title_en: 'Modifiers & Determiners',
    icon_name: 'Sparkles',
    cefr_span: 'A2 - B2',
    summary: 'Khắc chế 70% lỗi mạo từ (The, A/An, Zero article) và so sánh kép trong IELTS.'
  }
];

export interface GrammarLesson {
  id: string;
  category: GrammarCategory;
  title: string;
  vietnameseTitle: string;
  cefr_level?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
  timeline_position?: 'past' | 'present' | 'future';
  formula: string | { positive: string; negative: string; question: string };
  three_forms?: {
    affirmative: string;
    negative: string;
    interrogative: string;
  };
  signal_markers?: string[];
  rule_summary: string;
  ielts_application: string;
  common_pitfalls: string[];
  academic_examples: AcademicExample[];
  youtube_id?: string;
  youtube_title?: string;
  youtube_channel?: string;
}

export type MechanicType = 'MULTIPLE_CHOICE' | 'GAP_FILL' | 'SENTENCE_SCRAMBLE' | 'ERROR_SPOTTING';

export interface GrammarDrill {
  id: string;
  category: GrammarCategory;
  mechanic: MechanicType;
  title: string;
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

// Backward compatible interface
export interface GrammarExercise {
  id: string;
  category: 'tenses' | 'articles';
  type: 'article_cloze' | 'tense_shifter' | 'error_spotting';
  title: string;
  prompt: string;
  sentence_with_blank: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  ielts_tip: string;
  target_concept: string;
  vault_word_slot?: string;
}

// ==========================================
// 1. TENSES & ASPECTS LESSONS
// ==========================================
export const TENSE_LESSONS: GrammarLesson[] = [
  // --- 1. PRESENT SIMPLE ---
  {
    id: 'present_simple',
    category: 'tenses',
    title: 'Present Simple (Hiện tại đơn)',
    vietnameseTitle: 'Hiện Tại Đơn - Chân Lý Khoa Học & Mở Bài Task 2',
    cefr_level: 'A1',
    timeline_position: 'present',
    formula: 'S + V(s/es) | S + am/is/are',
    three_forms: {
      affirmative: '(+) S + V(s/es) | S + am/is/are + N/Adj',
      negative: '(-) S + do/does not + V-inf | S + am/is/are not',
      interrogative: '(?) Do/Does + S + V-inf? | Am/Is/Are + S...?'
    },
    signal_markers: ['always', 'usually', 'frequently', 'regularly', 'every day', 'in general', 'factually'],
    rule_summary: 'Diễn tả chân lý, quy luật khoa học hiển nhiên, thói quen lặp đi lặp lại hoặc sự thật khách quan.',
    ielts_application: 'Viết câu chủ đề (Topic sentence), định nghĩa khái niệm và phân tích các chân lý phổ quát trong IELTS Writing Task 2.',
    common_pitfalls: [
      'Quên chia đuôi -s/es cho chủ ngữ số ít (đặc biệt sau cụm danh từ dài).',
      'Động từ trạng thái (Stative Verbs: understand, belong, believe, perceive) KHÔNG chia ở tiếp diễn, bắt buộc dùng Hiện tại đơn.'
    ],
    academic_examples: [
      {
        sentence: 'Urban infrastructure expansion inherently demands substantial financial allocations from federal reserves.',
        task_type: 'Task 2',
        analysis: 'Chủ ngữ số ít "Urban infrastructure expansion" đi với động từ chia số ít "demands".',
        band_score: 'Band 8.0'
      }
    ],
    youtube_id: 'L9AWrJnhsRI',
    youtube_title: 'Present Simple Tense - Oxford Online English',
    youtube_channel: 'Oxford Online English'
  },

  // --- 2. PRESENT CONTINUOUS ---
  {
    id: 'present_continuous',
    category: 'tenses',
    title: 'Present Continuous (Hiện tại tiếp diễn)',
    vietnameseTitle: 'Hiện Tại Tiếp Diễn - Xu Hướng Đang Biến Chuyển',
    cefr_level: 'A2',
    timeline_position: 'present',
    formula: 'S + am/is/are + V-ing',
    three_forms: {
      affirmative: '(+) S + am/is/are + V-ing',
      negative: '(-) S + am/is/are not + V-ing',
      interrogative: '(?) Am/Is/Are + S + V-ing?'
    },
    signal_markers: ['currently', 'presently', 'at present', 'right now', 'at this moment', 'these days'],
    rule_summary: 'Diễn tả hành động đang diễn ra tại thời điểm nói hoặc một xu hướng xã hội đang trong quá trình chuyển biến (Gradual change).',
    ielts_application: 'Miêu tả sự thay đổi và chuyển dịch kinh tế - xã hội đang diễn tiến trong Task 2 (ví dụ: biến đổi khí hậu đang gia tốc).',
    common_pitfalls: [
      'Áp dụng tiếp diễn cho Stative Verbs như "is knowing", "is understanding" (SAI nghiêm trọng).',
      'Quên nhân đôi phụ âm cuối khi thêm -ing (run -> running, begin -> beginning).'
    ],
    academic_examples: [
      {
        sentence: 'Technological disruption is currently transforming pedagogical paradigms across higher education institutions.',
        task_type: 'Task 2',
        analysis: '"is currently transforming" diễn tả một xu hướng biến đổi mạnh mẽ đang diễn tiến ở hiện tại.',
        band_score: 'Band 8.0'
      }
    ],
    youtube_id: '_j4Z1cQ8f8U',
    youtube_title: 'Present Continuous Tense - Oxford Online English',
    youtube_channel: 'Oxford Online English'
  },

  // --- 3. PRESENT PERFECT ---
  {
    id: 'present_perfect',
    category: 'tenses',
    title: 'Present Perfect (Hiện tại hoàn thành)',
    vietnameseTitle: 'Hiện Tại Hoàn Thành - Mở Bài Xu Hướng Thời Đại Task 2',
    cefr_level: 'B1',
    timeline_position: 'present',
    formula: 'S + have/has + V3/V-ed',
    three_forms: {
      affirmative: '(+) S + have/has + V3/V-ed',
      negative: '(-) S + have/has not (haven\'t/hasn\'t) + V3/V-ed',
      interrogative: '(?) Have/Has + S + V3/V-ed?'
    },
    signal_markers: ['over the past decade', 'in recent years', 'since', 'for', 'lately', 'so far', 'up to now'],
    rule_summary: 'Diễn tả hành động xảy ra trong quá khứ kéo dài đến hiện tại hoặc để lại hệ quả rõ rệt mà không xác định mốc thời gian đóng.',
    ielts_application: 'Tiêu chuẩn vàng mở đầu thân bài và mở bài Writing Task 2 khi nói về bối cảnh thời đại gần đây ("Over the last few decades...").',
    common_pitfalls: [
      'Dùng với mốc thời gian quá khứ đóng như "in 2010" hoặc "yesterday" (SAI -> phải dùng Past Simple).',
      'Nhầm lẫn giữa "have been to" (đã từng đến) và "have gone to" (đã đi và chưa về).'
    ],
    academic_examples: [
      {
        sentence: 'Over the last two decades, advancements in automation have transformed traditional manufacturing sectors.',
        task_type: 'Task 2',
        analysis: 'Cụm "Over the last two decades" là chỉ dấu bắt buộc của Present Perfect.',
        band_score: 'Band 8.5'
      }
    ],
    youtube_id: 'o1_0G_K4gwg',
    youtube_title: 'Present Perfect Tense - Oxford Online English',
    youtube_channel: 'Oxford Online English'
  },

  // --- 4. PRESENT PERFECT CONTINUOUS ---
  {
    id: 'present_perfect_continuous',
    category: 'tenses',
    title: 'Present Perfect Continuous (Hiện tại hoàn thành tiếp diễn)',
    vietnameseTitle: 'Hiện Tại Hoàn Thành Tiếp Diễn - Nhấn Mạnh Tính Liên Tục',
    cefr_level: 'B2',
    timeline_position: 'present',
    formula: 'S + have/has been + V-ing',
    three_forms: {
      affirmative: '(+) S + have/has been + V-ing',
      negative: '(-) S + have/has not been + V-ing',
      interrogative: '(?) Have/Has + S + been + V-ing?'
    },
    signal_markers: ['for the entire decade', 'since morning', 'continuously', 'all year round'],
    rule_summary: 'Nhấn mạnh quá trình và tính liên tục kéo dài không gián đoạn của hành động từ quá khứ đến hiện tại.',
    ielts_application: 'Diễn đạt các nỗ lực kéo dài liên tục của các chính phủ hoặc tổ chức bảo vệ môi trường.',
    common_pitfalls: [
      'Nhầm với Present Perfect đơn khi nhấn mạnh kết quả thay vì quá trình.',
      'Dùng cho động từ trạng thái chỉ sở hữu hoặc cảm xúc.'
    ],
    academic_examples: [
      {
        sentence: 'Developing nations have been striving tirelessly to balance industrialization with ecological preservation.',
        task_type: 'Task 2',
        analysis: '"have been striving" nhấn mạnh nỗ lực bền bỉ và diễn ra liên tục.',
        band_score: 'Band 8.5'
      }
    ],
    youtube_id: '1_ZqQxYQj-Y',
    youtube_title: 'Present Perfect Continuous - Oxford Online English',
    youtube_channel: 'Oxford Online English'
  },

  // --- 5. PAST SIMPLE ---
  {
    id: 'past_simple',
    category: 'tenses',
    title: 'Past Simple (Quá khứ đơn)',
    vietnameseTitle: 'Quá Khứ Đơn - Vũ Khí 90% Đề Thi Task 1',
    cefr_level: 'A2',
    timeline_position: 'past',
    formula: 'S + V-ed / V2 | S + was/were',
    three_forms: {
      affirmative: '(+) S + V-ed/V2 | S + was/were',
      negative: '(-) S + did not (didn\'t) + V-inf | S + was/were not',
      interrogative: '(?) Did + S + V-inf? | Was/Were + S...?'
    },
    signal_markers: ['yesterday', 'ago', 'last year', 'in 2010', 'between 2000 and 2015', 'during the 1990s'],
    rule_summary: 'Diễn tả hành động, sự kiện hoặc xu hướng đã bắt đầu và kết thúc hoàn toàn tại thời điểm xác định trong quá khứ.',
    ielts_application: 'Bắt buộc dùng trong 90% các bài IELTS Writing Task 1 khi biểu đồ có các mốc năm trong quá khứ để miêu tả xu hướng.',
    common_pitfalls: [
      'Quên lùi thì: Biểu đồ cho năm 2012 nhưng thí sinh vẫn viết "The figures increase to 40%".',
      'Dùng Present Perfect khi có năm cụ thể (viết "has increased in 2015" là SAI).'
    ],
    academic_examples: [
      {
        sentence: 'Between 2005 and 2015, the proportion of households with high-speed internet escalated from 22% to 68%.',
        task_type: 'Task 1',
        analysis: 'Giai đoạn 2005-2015 đã kết thúc nên bắt buộc dùng "escalated".',
        band_score: 'Band 8.0'
      }
    ],
    youtube_id: 'xL6_B_Y2_qY',
    youtube_title: 'Past Simple Tense - Oxford Online English',
    youtube_channel: 'Oxford Online English'
  },

  // --- 6. PAST CONTINUOUS ---
  {
    id: 'past_continuous',
    category: 'tenses',
    title: 'Past Continuous (Quá khứ tiếp diễn)',
    vietnameseTitle: 'Quá Khứ Tiếp Diễn - Bối Cảnh Xen Kẽ & Speaking',
    cefr_level: 'B1',
    timeline_position: 'past',
    formula: 'S + was/were + V-ing',
    three_forms: {
      affirmative: '(+) S + was/were + V-ing',
      negative: '(-) S + was/were not (wasn\'t/weren\'t) + V-ing',
      interrogative: '(?) Was/Were + S + V-ing?'
    },
    signal_markers: ['at 7 PM yesterday', 'while', 'when', 'at that precise moment in 2010'],
    rule_summary: 'Diễn tả hành động đang xảy ra tại một thời điểm cụ thể trong quá khứ, hoặc một hành động nền đang diễn ra thì bị hành động khác cắt ngang.',
    ielts_application: 'Rất đắt giá trong IELTS Speaking Part 2 khi kể lại một trải nghiệm trong quá khứ ("While I was preparing for...").',
    common_pitfalls: [
      'Phân biệt When vs While: Mệnh đề sau While thường dùng tiếp diễn (While S + was V-ing), sau When thường dùng quá khứ đơn.',
      'Dùng nhầm số ít/số nhiều của "was/were".'
    ],
    academic_examples: [
      {
        sentence: 'While municipal authorities were deliberating policy reforms, civic organizations initiated grassroots conservation campaigns.',
        task_type: 'Task 2',
        analysis: 'Hành động nền "were deliberating" diễn ra liên tục trong khi hành động khác bùng nổ.',
        band_score: 'Band 8.0'
      }
    ],
    youtube_id: 'qLz9tF5_E18',
    youtube_title: 'Past Continuous Tense - Oxford Online English',
    youtube_channel: 'Oxford Online English'
  },

  // --- 7. PAST PERFECT ---
  {
    id: 'past_perfect',
    category: 'tenses',
    title: 'Past Perfect (Quá khứ hoàn thành)',
    vietnameseTitle: 'Quá Khứ Hoàn Thành - Bí Kíp Ăn Điểm GRA Band 7.5+ Task 1',
    cefr_level: 'B2',
    timeline_position: 'past',
    formula: 'S + had + V3/V-ed',
    three_forms: {
      affirmative: '(+) S + had + V3/V-ed',
      negative: '(-) S + had not (hadn\'t) + V3/V-ed',
      interrogative: '(?) Had + S + V3/V-ed?'
    },
    signal_markers: ['by the time', 'prior to', 'before', 'by 2010', 'already', 'hardly... when'],
    rule_summary: 'Diễn tả hành động xảy ra và hoàn tất TRƯỚC một hành động hoặc mốc thời gian khác trong quá khứ.',
    ielts_application: 'Vũ khí nâng band GRA lên 7.5+ trong Task 1 khi kết hợp với liên từ "By the time" hoặc "Prior to" để so sánh 2 mốc dữ liệu.',
    common_pitfalls: [
      'Lạm dụng quá khứ hoàn thành khi không có mốc đối chiếu quá khứ thứ hai.',
      'Quên chia động từ phân từ 2 bất quy tắc.'
    ],
    academic_examples: [
      {
        sentence: 'By the time the new conservation policy was introduced in 2010, carbon emissions had already reached an unprecedented peak.',
        task_type: 'Task 1',
        analysis: '"had already reached" hoàn tất trước mốc "was introduced" trong quá khứ.',
        band_score: 'Band 8.5'
      }
    ],
    youtube_id: 'xZz7nZ5i5-o',
    youtube_title: 'Past Perfect Tense - Oxford Online English',
    youtube_channel: 'Oxford Online English'
  },

  // --- 8. PAST PERFECT CONTINUOUS ---
  {
    id: 'past_perfect_continuous',
    category: 'tenses',
    title: 'Past Perfect Continuous (Quá khứ hoàn thành tiếp diễn)',
    vietnameseTitle: 'Quá Khứ Hoàn Thành Tiếp Diễn - Tiến Trình Kéo Dài Quá Khứ',
    cefr_level: 'B2',
    timeline_position: 'past',
    formula: 'S + had been + V-ing',
    three_forms: {
      affirmative: '(+) S + had been + V-ing',
      negative: '(-) S + had not been + V-ing',
      interrogative: '(?) Had + S + been + V-ing?'
    },
    signal_markers: ['had been V-ing for years before', 'until that pivotal moment'],
    rule_summary: 'Diễn tả hành động xảy ra và diễn tiến liên tục trong một khoảng thời gian trước một hành động khác trong quá khứ.',
    ielts_application: 'Miêu tả chuỗi phát triển kinh tế kéo dài trước khi cuộc khủng hoảng xảy ra trong bài Task 1 hoặc Task 2.',
    common_pitfalls: [
      'Dùng cho động từ không chỉ hành động tiếp diễn (như "belong", "know").'
    ],
    academic_examples: [
      {
        sentence: 'The regional manufacturing sector had been expanding rapidly for over a decade before the economic crisis struck in 2008.',
        task_type: 'Task 1',
        analysis: 'Nhấn mạnh đà tăng trưởng liên tục kéo dài hơn một thập kỷ trước khi khủng hoảng bùng phát.',
        band_score: 'Band 8.5'
      }
    ],
    youtube_id: 'Rk-8P_n3jJw',
    youtube_title: 'Past Perfect Continuous - Oxford Online English',
    youtube_channel: 'Oxford Online English'
  },

  // --- 9. FUTURE SIMPLE & PROJECTIONS ---
  {
    id: 'future_simple',
    category: 'tenses',
    title: 'Future Simple & Projections (Tương lai & Dự báo)',
    vietnameseTitle: 'Dự Báo Tương Lai - Tuyệt Đối Tránh "Will" Trong Task 1',
    cefr_level: 'B1',
    timeline_position: 'future',
    formula: 'S + is/are projected / predicted to + V-inf | S + will + V-inf',
    three_forms: {
      affirmative: '(+) S + is/are projected to + V-inf | S + will + V-inf',
      negative: '(-) S + is/are not anticipated to + V-inf | S + will not (won\'t) + V-inf',
      interrogative: '(?) Is/Are + S + forecasted to + V-inf? | Will + S + V-inf?'
    },
    signal_markers: ['by 2030', 'in 2050', 'over the coming decades', 'in the foreseeable future'],
    rule_summary: 'Diễn tả số liệu hoặc xu hướng trong tương lai. Trong văn phong học thuật IELTS, tránh khẳng định 100% bằng "will".',
    ielts_application: 'Bắt buộc dùng thể bị động dự báo ("is projected/anticipated to") trong Task 1 có năm tương lai.',
    common_pitfalls: [
      'Lạm dụng "will": Viết "The population will rise to 10 billion" làm mất tính khách quan học thuật.',
      'Quên chia thể bị động (phải là "is projected to", không phải "projects to").'
    ],
    academic_examples: [
      {
        sentence: 'By 2040, the proportion of global electricity generated from solar power is projected to reach approximately 45%.',
        task_type: 'Task 1',
        analysis: 'Dùng cấu trúc dự báo khoa học khách quan Band 8.5+ thay cho "will reach".',
        band_score: 'Band 8.5'
      }
    ],
    youtube_id: 'H3r9bT1K8b8',
    youtube_title: 'Future Tenses & Projections - Oxford Online English',
    youtube_channel: 'Oxford Online English'
  },

  // --- 10. FUTURE CONTINUOUS ---
  {
    id: 'future_continuous',
    category: 'tenses',
    title: 'Future Continuous (Tương lai tiếp diễn)',
    vietnameseTitle: 'Tương Lai Tiếp Diễn - Xu Hướng Tại Mốc Tương Lai',
    cefr_level: 'B2',
    timeline_position: 'future',
    formula: 'S + will be + V-ing',
    three_forms: {
      affirmative: '(+) S + will be + V-ing',
      negative: '(-) S + will not be + V-ing',
      interrogative: '(?) Will + S + be + V-ing?'
    },
    signal_markers: ['at this time in 2030', 'during the upcoming decade', 'by the year 2045'],
    rule_summary: 'Diễn tả hành động đang diễn ra tại một thời điểm hoặc giai đoạn cụ thể trong tương lai.',
    ielts_application: 'Phân tích các viễn cảnh công nghệ và đời sống tương lai trong Speaking Part 3 và Task 2.',
    common_pitfalls: [
      'Quên "be" sau "will" (viết "will V-ing" là sai cú pháp).'
    ],
    academic_examples: [
      {
        sentence: 'By 2035, millions of commuters will be utilizing autonomous zero-emission vehicles on a daily basis.',
        task_type: 'Task 2',
        analysis: '"will be utilizing" khắc họa sống động bức tranh tương lai đang diễn ra thường nhật.',
        band_score: 'Band 8.0'
      }
    ],
    youtube_id: 'mD5c5gL1j0k',
    youtube_title: 'Future Continuous Tense - BBC Learning English',
    youtube_channel: 'BBC Learning English'
  },

  // --- 11. FUTURE PERFECT ---
  {
    id: 'future_perfect',
    category: 'tenses',
    title: 'Future Perfect (Tương lai hoàn thành)',
    vietnameseTitle: 'Tương Lai Hoàn Thành - Điểm Nhấn Cú Pháp Band 8.5+ Task 1',
    cefr_level: 'B2',
    timeline_position: 'future',
    formula: 'S + will have + V3/V-ed',
    three_forms: {
      affirmative: '(+) S + will have + V3/V-ed',
      negative: '(-) S + will not have + V3/V-ed',
      interrogative: '(?) Will + S + have + V3/V-ed?'
    },
    signal_markers: ['by 2050', 'by the end of the projection period', 'by the time S + V(pres)'],
    rule_summary: 'Diễn tả hành động hoặc cột mốc số liệu sẽ hoàn tất TRƯỚC một thời điểm xác định trong tương lai.',
    ielts_application: 'Cực kỳ đắt giá khi tổng kết mốc cuối cùng của biểu đồ dự báo tương lai trong Task 1 ("By 2050, the figure will have overtaken...").',
    common_pitfalls: [
      'Trong mệnh đề phụ chỉ thời gian với "by the time", động từ phải chia Hiện tại đơn, KHÔNG dùng "will".'
    ],
    academic_examples: [
      {
        sentence: 'By the end of the projection timeline in 2050, global investments in clean energy will have surpassed traditional fossil fuels.',
        task_type: 'Task 1',
        analysis: '"will have surpassed" thể hiện sự kiểm soát cấu trúc thời gian tương lai tuyệt đỉnh Band 8.5+.',
        band_score: 'Band 8.5'
      }
    ],
    youtube_id: 'r8F9pL0K7jI',
    youtube_title: 'Future Perfect Tense - Oxford Online English',
    youtube_channel: 'Oxford Online English'
  },

  // --- 12. FUTURE PERFECT CONTINUOUS ---
  {
    id: 'future_perfect_continuous',
    category: 'tenses',
    title: 'Future Perfect Continuous (Tương lai hoàn thành tiếp diễn)',
    vietnameseTitle: 'Tương Lai Hoàn Thành Tiếp Diễn - Đỉnh Cao Ngữ Pháp C1',
    cefr_level: 'C1',
    timeline_position: 'future',
    formula: 'S + will have been + V-ing',
    three_forms: {
      affirmative: '(+) S + will have been + V-ing',
      negative: '(-) S + will not have been + V-ing',
      interrogative: '(?) Will + S + have been + V-ing?'
    },
    signal_markers: ['for over three decades by 2050', 'by next century'],
    rule_summary: 'Nhấn mạnh tính liên tục kéo dài chạm tới một mốc thời gian trong tương lai.',
    ielts_application: 'Diễn đạt một quá trình chuyển đổi sinh thái kéo dài nhiều thập kỷ cho tới mốc tương lai.',
    common_pitfalls: [
      'Ít gặp trong văn viết thông thường, chỉ sử dụng khi thực sự cần nhấn mạnh quá trình liên tục để tránh rườm rà.'
    ],
    academic_examples: [
      {
        sentence: 'By 2050, pioneering eco-cities will have been operating with net-zero carbon footprints for more than two decades.',
        task_type: 'Task 2',
        analysis: 'Cấu trúc C1 hiếm có giúp bài viết đạt điểm tuyệt đối về Grammatical Range.',
        band_score: 'Band 9.0'
      }
    ],
    youtube_id: 'k8L1vK7j2aM',
    youtube_title: 'Future Perfect Continuous - Oxford Online English',
    youtube_channel: 'Oxford Online English'
  }
];

// ==========================================
// 2. MODALS & HEDGING LESSONS
// ==========================================
export const MODAL_LESSONS: GrammarLesson[] = [
  {
    id: 'academic_hedging_modals',
    category: 'modals',
    title: 'Hedging with Modals (Could, May, Might)',
    vietnameseTitle: 'Kỹ Thuật Hedging - Bí Quyết Viết Khách Quan Band 8.0+',
    cefr_level: 'B2',
    formula: 'S + may / might / could + V-inf (hoặc: may well / could potentially)',
    rule_summary: 'Sử dụng động từ khuyết thiếu để làm mềm luận điểm, tránh sự võ đoán và khái quát hóa thái quá (overgeneralization).',
    ielts_application: 'Giám khảo IELTS đánh giá rất cao việc thí sinh biết "hedging" khi thảo luận các vấn đề xã hội phức tạp trong Task 2.',
    common_pitfalls: [
      'Dùng từ khẳng định 100% như "Watching TV makes all children violent".',
      'Lẫn lộn giữa "may" và "can" khi diễn đạt tính khả dĩ mang tính học thuật.'
    ],
    academic_examples: [
      {
        sentence: 'Unregulated artificial intelligence could potentially exacerbate systemic inequalities across labor markets.',
        task_type: 'Task 2',
        analysis: '"could potentially exacerbate" thể hiện quan điểm thận trọng, phân tích khách quan đúng phong cách học thuật.',
        band_score: 'Band 8.5'
      }
    ]
  }
];

// ==========================================
// 3. SENTENCE STRUCTURES & INVERSION
// ==========================================
export const SENTENCE_STRUCTURE_LESSONS: GrammarLesson[] = [
  {
    id: 'inversion_negative_adverbs',
    category: 'sentence_structures',
    title: 'Negative Adverb Inversion (Đảo ngữ)',
    vietnameseTitle: 'Đảo Ngữ Trạng Từ Phủ Định - Điểm Nhấn GRA Band 8.0+',
    cefr_level: 'C1',
    formula: 'Seldom / Rarely / Under no circumstances + Aux + S + V-inf',
    rule_summary: 'Khi trạng từ phủ định hoặc hạn định đứng đầu câu, trợ động từ phải được đảo lên trước chủ ngữ.',
    ielts_application: 'Dùng 1 câu đảo ngữ trong thân bài hoặc kết bài Writing Task 2 giúp bài viết nổi bật và chứng minh khả năng kiểm soát cấu trúc câu phức tạp.',
    common_pitfalls: [
      'Quên đảo trợ động từ (viết "Seldom governments take action" là SAI).',
      'Đảo sai thì của trợ động từ (do/does/did).'
    ],
    academic_examples: [
      {
        sentence: 'Seldom do municipal authorities allocate sufficient fiscal resources to rural infrastructure rejuvenation.',
        task_type: 'Task 2',
        analysis: 'Cấu trúc "Seldom do municipal authorities allocate..." đẩy câu văn lên đẳng cấp học thuật Band 8.5+.',
        band_score: 'Band 8.5'
      }
    ]
  },
  {
    id: 'passive_reporting',
    category: 'sentence_structures',
    title: 'Impersonal Passive (Thể Bị Động Khách Quan)',
    vietnameseTitle: 'Bị Động Khách Quan - Tránh Xưng "I / We" Trong Task 2',
    cefr_level: 'B2',
    formula: 'It is widely believed / argued / asserted that + S + V',
    rule_summary: 'Cấu trúc bị động khách quan cho phép đưa ra quan điểm của số đông mà không cần dùng đại từ nhân xưng.',
    ielts_application: 'Câu dẫn nhập tuyệt vời cho các đoạn bàn về ý kiến trái chiều (Discussion Essay).',
    common_pitfalls: [
      'Quên "that" sau động từ tường thuật.',
      'Dùng "It believes that" (thiếu to be).'
    ],
    academic_examples: [
      {
        sentence: 'It is widely acknowledged that compulsory environmental curricula foster sustainable civic consciousness.',
        task_type: 'Task 2',
        analysis: '"It is widely acknowledged that..." thể hiện văn phong trang trọng, khách quan.',
        band_score: 'Band 8.0'
      }
    ]
  }
];

// ==========================================
// 4. CLAUSES & CONNECTORS
// ==========================================
export const CLAUSE_LESSONS: GrammarLesson[] = [
  {
    id: 'reduced_relative_clauses',
    category: 'clauses',
    title: 'Reduced Relative Clauses (Rút gọn Mệnh đề Quan hệ)',
    vietnameseTitle: 'Rút Gọn Mệnh Đề Quan Hệ - Viết Câu Cô Đọng & Tinh Tế',
    cefr_level: 'B2',
    formula: 'N + V-ing (Chủ động) | N + V3/V-ed (Bị động)',
    rule_summary: 'Lược bỏ đại từ quan hệ (who, which, that) và trợ động từ to be để biến mệnh đề thành cụm phân từ.',
    ielts_application: 'Tăng sự mượt mà và cô đọng trong cả Task 1 (miêu tả biểu đồ) và Task 2.',
    common_pitfalls: [
      'Nhầm lẫn giữa thể chủ động (V-ing) và bị động (V-ed).',
      'Tạo ra lỗi "Dangling Participle" (chủ ngữ phân từ không khớp với chủ ngữ chính của câu).'
    ],
    academic_examples: [
      {
        sentence: 'Stringent environmental regulations implemented by the central government prompted substantial industrial upgrades.',
        task_type: 'Task 2',
        analysis: '"regulations implemented by..." rút gọn từ "regulations which were implemented by...".',
        band_score: 'Band 8.5'
      }
    ]
  }
];

// ==========================================
// 5. VERB FORMS & PARTICIPLES
// ==========================================
export const VERB_FORM_LESSONS: GrammarLesson[] = [
  {
    id: 'gerund_as_subject',
    category: 'verb_forms',
    title: 'Gerund as Subject (V-ing làm chủ ngữ)',
    vietnameseTitle: 'Danh Động Từ Làm Chủ Ngữ & Sự Hòa Hợp Chủ Vị',
    cefr_level: 'B1',
    formula: 'V-ing + Object/Modifier + Singular Verb (is / was / has / V-s/es)',
    rule_summary: 'Khi một hành động được biến thành danh động từ (Gerund) làm chủ ngữ, toàn bộ cụm đó được xem là ngôi thứ ba số ít.',
    ielts_application: 'Mở đầu câu luận điểm tự nhiên nhất trong Task 2 thay vì lặp lại các danh từ đơn giản.',
    common_pitfalls: [
      'Chia động từ số nhiều theo danh từ đứng ngay trước động từ (ví dụ: "Investing in renewable resources *require*..." là SAI, phải là "requires").'
    ],
    academic_examples: [
      {
        sentence: 'Subsidizing tertiary tuition fees alleviates financial burdens on underprivileged households.',
        task_type: 'Task 2',
        analysis: 'Chủ ngữ "Subsidizing tertiary tuition fees" là số ít -> động từ "alleviates" thêm "s".',
        band_score: 'Band 8.0'
      }
    ]
  }
];

// ==========================================
// 6. MODIFIERS & DETERMINERS (ARTICLES)
// ==========================================
export const ARTICLE_LESSONS: GrammarLesson[] = [
  // --- 1. INDEFINITE ARTICLES A / AN ---
  {
    id: 'indefinite_articles_a_an',
    category: 'modifiers',
    title: 'Indefinite Articles "A / AN" (Mạo từ bất định)',
    vietnameseTitle: 'Mạo Từ "A / AN" - Phát Âm, Âm Câm & 100% Trường Hợp Ngoại Lệ',
    cefr_level: 'A2',
    formula: 'A + Phụ âm (Consonant Sound) | AN + Nguyên âm (Vowel Sound)',
    three_forms: {
      affirmative: '(+) S + is/are + a/an + Singular Countable Noun',
      negative: '(-) S + is/are not + a/an + Singular Countable Noun',
      interrogative: '(?) Is/Are there + a/an + Singular Countable Noun...?'
    },
    signal_markers: ['a university', 'an hour', 'a European country', 'an honest mistake', 'a one-way street', 'a unique approach'],
    rule_summary: 'Dùng trước danh từ đếm được số ít khi được nhắc đến lần đầu tiên hoặc mang nghĩa "một". QUAN TRỌNG: Lựa chọn A hay AN phụ thuộc vào PHIÊN ÂM của từ đứng ngay sau, KHÔNG phụ thuộc vào chữ cái viết.',
    ielts_application: 'Tránh các lỗi trừ điểm GRA ngớ ngẩn ngay tại câu mở đoạn và các ví dụ minh họa trong Writing & Speaking.',
    common_pitfalls: [
      'Âm "H" câm: Viết "a hour" (SAI -> phải là "an hour" vì phiên âm /ˈaʊ.ər/ bắt đầu bằng nguyên âm). Tương tự: "an honest person", "an honor".',
      'Chữ cái nguyên âm nhưng phiên âm là bán phụ âm /j/ hoặc /w/: Viết "an university" (SAI -> phải là "a university" vì /juː.nɪˈvɜː.sə.ti/). Tương tự: "a European country", "a uniform", "a one-parent family".',
      'Dùng "a/an" trước danh từ không đếm được: Viết "an information", "an advice", "a research" (SAI NGHIÊM TRỌNG -> phải là "a piece of advice/research" hoặc bỏ a/an).'
    ],
    academic_examples: [
      {
        sentence: 'Transitioning to renewable energy offers a unique opportunity to revitalize declining industrial heartlands.',
        task_type: 'Task 2',
        analysis: 'Dùng "a unique opportunity" (không phải "an") vì "unique" phát âm bắt đầu bằng bán phụ âm /j/.',
        band_score: 'Band 8.0'
      }
    ],
    youtube_id: 't4L6gU4iP8M',
    youtube_title: 'How to Use Articles in English (A, An, The) - Oxford Online English',
    youtube_channel: 'Oxford Online English'
  },

  // --- 2. DEFINITE ARTICLE THE ---
  {
    id: 'the_definite',
    category: 'modifiers',
    title: 'Definite Article "THE" (Mạo từ xác định)',
    vietnameseTitle: 'Mạo Từ "THE" - 5 Quy Tắc Ăn Điểm Tuyệt Đối IELTS Task 1 & 2',
    cefr_level: 'B1',
    formula: 'THE + Singular / Plural / Uncountable Noun (khi đối tượng đã xác định)',
    three_forms: {
      affirmative: '(+) THE + Noun (đã xác định / duy nhất / so sánh nhất)',
      negative: '(-) Without THE + Noun',
      interrogative: '(?) Does THE + Noun demonstrate...?'
    },
    signal_markers: ['the percentage of', 'the proportion of', 'the environment', 'the internet', 'the government', 'the most significant'],
    rule_summary: 'Dùng khi đối tượng được cả người viết và người đọc biết rõ, đối tượng là duy nhất trong vũ trụ, trước so sánh nhất, số thứ tự, và các danh từ chỉ nhóm địa lý/liên bang.',
    ielts_application: 'Chiếm tới 70% số lỗi mạo từ của thí sinh IELTS: Bắt buộc có "the" trước các cụm tỷ lệ trong Task 1 ("the proportion of", "the volume of") và các thực thể duy nhất trong Task 2 ("the environment", "the biosphere").',
    common_pitfalls: [
      'Quên "the" trước cụm tỷ lệ Task 1: Viết "Percentage of cars escalated" (SAI -> phải là "The percentage of cars").',
      'Quên "the" trước thực thể duy nhất: Viết "protect environment" (SAI -> phải là "protect the environment"), "browse internet" (SAI -> "the internet").',
      'Thừa "the" trước tên quốc gia đơn: Viết "The Vietnam", "The China" (SAI -> chỉ dùng "the" với liên bang/quần đảo: "The UK", "The US", "The Netherlands").',
      'Nhầm giữa "The number of" (đi với động từ số ít) và "A number of" (đi với động từ số nhiều).'
    ],
    academic_examples: [
      {
        sentence: 'The proportion of graduates seeking overseas employment escalated considerably over the five-year period.',
        task_type: 'Task 1',
        analysis: 'Bắt buộc có "The" đứng đầu cụm danh từ chỉ số liệu "The proportion of...".',
        band_score: 'Band 8.0'
      }
    ],
    youtube_id: 't4L6gU4iP8M',
    youtube_title: 'Definite Article "The" Deep Dive - Oxford Online English',
    youtube_channel: 'Oxford Online English'
  },

  // --- 3. ZERO ARTICLE ---
  {
    id: 'zero_article',
    category: 'modifiers',
    title: 'Zero Article "Ø" (Mạo từ rỗng)',
    vietnameseTitle: 'Mạo Từ Rỗng "Ø" - Bí Quyết Khái Quát Hóa Học Thuật Task 2',
    cefr_level: 'B1',
    formula: 'Ø + Plural Countable Noun / Uncountable Noun (khi nói chung chung)',
    three_forms: {
      affirmative: '(+) Ø + Plural / Uncountable Noun + Verb',
      negative: '(-) Lack of Ø + Uncountable Noun',
      interrogative: '(?) Does Ø + Uncountable Noun enhance...?'
    },
    signal_markers: ['Ø education', 'Ø pollution', 'Ø technological innovations', 'by car / by bus', 'at school / at work'],
    rule_summary: 'KHÔNG dùng mạo từ khi nói về các khái niệm trừu tượng, danh từ không đếm được nói chung hoặc danh từ đếm được số nhiều mang nghĩa khái quát.',
    ielts_application: 'Tiêu chuẩn vàng của văn phong học thuật Task 2: Khi thảo luận về giáo dục, ô nhiễm, xã hội nói chung, tuyệt đối không được thêm "the".',
    common_pitfalls: [
      'Thêm "the" tùy tiện trước danh từ trừu tượng: Viết "The education plays a vital role" (SAI NGHIÊM TRỌNG -> Phải là "Ø Education plays a vital role").',
      'Thêm "the" trước tên môn học, bữa ăn, thể thao hoặc phương tiện giao thông sau giới từ "by" (viết "by the bus" là SAI -> phải là "by bus").'
    ],
    academic_examples: [
      {
        sentence: 'Ø Higher education plays a pivotal role in fostering sustainable economic prosperity.',
        task_type: 'Task 2',
        analysis: '"Higher education" là khái niệm trừu tượng nói chung -> Dùng Zero Article Ø (không có "the").',
        band_score: 'Band 8.5'
      }
    ],
    youtube_id: 't4L6gU4iP8M',
    youtube_title: 'When NOT to use an article in English - Oxford Online English',
    youtube_channel: 'Oxford Online English'
  }
];

// All lessons array
export const ALL_GRAMMAR_LESSONS: GrammarLesson[] = [
  ...TENSE_LESSONS,
  ...MODAL_LESSONS,
  ...SENTENCE_STRUCTURE_LESSONS,
  ...CLAUSE_LESSONS,
  ...VERB_FORM_LESSONS,
  ...ARTICLE_LESSONS
];

// ==========================================
// 7. COMPREHENSIVE STATIC DRILLS (4 MECHANICS)
// ==========================================
export const STATIC_DRILLS: GrammarDrill[] = [
  // --- 1. MULTIPLE CHOICE ---
  {
    id: 'drill-mcq-1',
    category: 'tenses',
    mechanic: 'MULTIPLE_CHOICE',
    title: 'Chia thì Writing Task 1 - Mốc năm quá khứ đóng',
    prompt: 'Chọn dạng động từ chính xác nhất theo chuẩn học thuật:',
    target_concept: 'Past Simple with Closed Time Frame',
    cefr_level: 'B1',
    ielts_tip: 'Đừng dùng Present Perfect khi câu đã có mốc năm quá khứ rõ ràng như "between X and Y".',
    explanation: 'Khoảng thời gian "Between 1990 and 2010" đã kết thúc hoàn toàn trong quá khứ nên bắt buộc dùng thì Quá khứ đơn: "escalated".',
    content_payload: {
      sentence_with_blank: 'Between 1990 and 2010, the car ownership rate in European countries [ _____ ] by nearly 35%.',
      options: ['escalated', 'has escalated', 'was escalating', 'escalates'],
      correct_answer: 'escalated'
    }
  },
  {
    id: 'drill-mcq-2',
    category: 'sentence_structures',
    mechanic: 'MULTIPLE_CHOICE',
    title: 'Dự báo học thuật Task 1 - Tránh dùng "will"',
    prompt: 'Chọn cấu trúc diễn đạt dự báo khách quan chuẩn Band 8.5+:',
    target_concept: 'Future Academic Projections',
    cefr_level: 'B2',
    ielts_tip: 'Trong IELTS Task 1, số liệu tương lai là dự báo khoa học (projections). Dùng cấu trúc bị động "is projected to".',
    explanation: 'Cấu trúc "is projected to exceed" thể hiện phong cách khách quan chuẩn mực của bài viết học thuật.',
    content_payload: {
      sentence_with_blank: 'By 2050, the global population residing in metropolitan centers [ _____ ] 68%.',
      options: ['is projected to exceed', 'will exceed', 'exceeds', 'has exceeded'],
      correct_answer: 'is projected to exceed'
    }
  },

  // --- 2. GAP FILL / CLOZE TEST ---
  {
    id: 'drill-gap-1',
    category: 'verb_forms',
    mechanic: 'GAP_FILL',
    title: 'Hòa hợp Chủ - Vị với Danh động từ làm chủ ngữ',
    prompt: 'Chia dạng đúng của động từ trong ngoặc để hoàn thiện câu luận điểm Task 2:',
    target_concept: 'Subject-Verb Agreement with Gerunds',
    cefr_level: 'B2',
    ielts_tip: 'Cụm danh động từ "V-ing" làm chủ ngữ luôn đi với động từ số ít.',
    explanation: 'Chủ ngữ "Investing in renewable energy" là số ít, do đó động từ "demand" phải thêm "s" -> "demands".',
    content_payload: {
      sentence_with_blank: 'Investing in renewable energy infrastructures [ _____ ] substantial public funding.',
      base_word: 'demand',
      acceptable_answers: ['demands']
    }
  },
  {
    id: 'drill-gap-2',
    category: 'tenses',
    mechanic: 'GAP_FILL',
    title: 'Quá khứ hoàn thành với mốc so sánh Task 1',
    prompt: 'Chia dạng đúng của động từ trong ngoặc:',
    target_concept: 'Past Perfect with "By [Year]"',
    cefr_level: 'B2',
    ielts_tip: 'Cấu trúc "By + [Past Year], S + had + V3" là điểm nhấn ngữ pháp đắt giá đẩy tiêu chí GRA lên Band 8.0+.',
    explanation: 'Giới từ "By 2005" (tính đến trước năm 2005) yêu cầu thì Quá khứ hoàn thành "had overtaken".',
    content_payload: {
      sentence_with_blank: 'By 2005, hydroelectric energy [ _____ ] coal as the country’s dominant power source.',
      base_word: 'overtake',
      acceptable_answers: ['had overtaken']
    }
  },

  // --- 3. SENTENCE SCRAMBLE ---
  {
    id: 'drill-scramble-1',
    category: 'sentence_structures',
    mechanic: 'SENTENCE_SCRAMBLE',
    title: 'Đảo ngữ với trạng từ phủ định Seldom',
    prompt: 'Bấm các thẻ từ sau theo đúng thứ tự để tạo câu đảo ngữ học thuật Band 8.0+:',
    target_concept: 'Negative Inversion with Seldom',
    cefr_level: 'C1',
    ielts_tip: 'Seldom + do/does/did + S + V-inf là cấu trúc đảo ngữ kinh điển tạo ấn tượng mạnh với giám khảo.',
    explanation: 'Khi "Seldom" đứng đầu câu, trợ động từ "do" phải đảo lên trước chủ ngữ "governments".',
    content_payload: {
      scrambled_tokens: ['Seldom', 'governments', 'do', 'such severe crises', 'address', 'effectively.'],
      ordered_tokens: ['Seldom', 'do', 'governments', 'address', 'such severe crises', 'effectively.']
    }
  },
  {
    id: 'drill-scramble-2',
    category: 'clauses',
    mechanic: 'SENTENCE_SCRAMBLE',
    title: 'Mệnh đề quan hệ rút gọn bị động',
    prompt: 'Sắp xếp các thẻ từ thành câu hoàn chỉnh cô đọng:',
    target_concept: 'Reduced Relative Clause with Past Participle',
    cefr_level: 'B2',
    ielts_tip: 'Rút gọn mệnh đề bằng phân từ 2 (V-ed/V3) giúp câu văn ngắn gọn và tăng điểm GRA.',
    explanation: '"Policies enacted by municipal authorities..." là dạng rút gọn của "Policies which were enacted by...".',
    content_payload: {
      scrambled_tokens: ['Policies', 'enacted by', 'authorities', 'municipal', 'traffic congestion.', 'reduced'],
      ordered_tokens: ['Policies', 'enacted by', 'municipal', 'authorities', 'reduced', 'traffic congestion.']
    }
  },

  // --- 4. ERROR SPOTTING ---
  {
    id: 'drill-error-1',
    category: 'clauses',
    mechanic: 'ERROR_SPOTTING',
    title: 'Phát hiện lỗi sai liên từ: Although vs Despite',
    prompt: 'Bấm chọn cụm từ gạch chân chứa lỗi sai ngữ pháp trong câu học thuật sau:',
    target_concept: 'Connectors: Although vs Despite',
    cefr_level: 'B2',
    ielts_tip: "'Although' đi với mệnh đề (S + V), còn 'Despite / In spite of' đi với cụm danh từ.",
    explanation: "Đứng trước cụm danh từ 'the rapid expansion of AI', không được dùng 'Although'. Phải thay bằng 'Despite' hoặc 'In spite of'.",
    content_payload: {
      segments: [
        { id: 'A', text: 'Although' },
        { id: 'B', text: 'the rapid expansion of AI,' },
        { id: 'C', text: 'ethical guidelines remain' },
        { id: 'D', text: 'alarmingly underdeveloped.' }
      ],
      error_segment_id: 'A',
      correction: 'Despite / In spite of'
    }
  },
  {
    id: 'drill-error-2',
    category: 'modifiers',
    mechanic: 'ERROR_SPOTTING',
    title: 'Phát hiện lỗi mạo từ với danh từ trừu tượng',
    prompt: 'Bấm chọn phân đoạn gạch chân sử dụng mạo từ sai:',
    target_concept: 'Zero Article with Abstract Concepts',
    cefr_level: 'B1',
    ielts_tip: 'Tuyệt đối không dùng "the" trước các danh từ trừu tượng nói chung như "education", "technology", "pollution".',
    explanation: "'Higher education' là khái niệm trừu tượng nói chung, do đó dùng Zero Article (Ø). Viết 'The higher education' là sai ngữ pháp.",
    content_payload: {
      segments: [
        { id: 'A', text: 'Sociologists believe that' },
        { id: 'B', text: 'the higher education' },
        { id: 'C', text: 'serves as a catalyst' },
        { id: 'D', text: 'for social mobility.' }
      ],
      error_segment_id: 'B',
      correction: 'Ø Higher education'
    }
  }
];

// Backward compatible STATIC_GRAMMAR_EXERCISES
export const STATIC_GRAMMAR_EXERCISES: GrammarExercise[] = [
  {
    id: 'art-ex-1',
    category: 'articles',
    type: 'article_cloze',
    title: 'Mạo từ trong Task 1 - Cụm tỷ lệ số liệu',
    prompt: 'Chọn mạo từ thích hợp để điền vào chỗ trống:',
    sentence_with_blank: 'According to the graph, [ _____ ] proportion of households with solar panels increased substantially.',
    options: ['a', 'an', 'the', 'Ø'],
    correct_answer: 'the',
    explanation: 'Cụm "proportion of..." đã được xác định bởi mệnh đề bổ nghĩa phía sau, do đó BẮT BUỘC dùng mạo từ xác định "the".',
    ielts_tip: 'Trong Writing Task 1, luôn luôn dùng "The proportion of...", "The percentage of...".',
    target_concept: 'The Definite Article with Proportions'
  },
  {
    id: 'art-ex-2',
    category: 'articles',
    type: 'article_cloze',
    title: 'Mạo từ trong Task 2 - Danh từ trừu tượng khái quát',
    prompt: 'Chọn mạo từ thích hợp để điền vào chỗ trống:',
    sentence_with_blank: 'Many sociologists argue that [ _____ ] quality education is the cornerstone of societal progress.',
    options: ['a', 'an', 'the', 'Ø'],
    correct_answer: 'Ø',
    explanation: '"Quality education" ở đây là danh từ trừu tượng không đếm được, dùng Zero Article (Ø).',
    ielts_tip: 'Tuyệt đối tránh viết "The education" khi nói về các khái niệm trừu tượng nói chung trong Task 2.',
    target_concept: 'Zero Article with Abstract Generalizations'
  },
  {
    id: 'tense-ex-1',
    category: 'tenses',
    type: 'tense_shifter',
    title: 'Chia thì Writing Task 1 - Mốc năm quá khứ',
    prompt: 'Chọn dạng động từ chính xác nhất:',
    sentence_with_blank: 'Between 1990 and 2010, the car ownership rate in European countries [ ___________ ] by nearly 35%.',
    options: ['escalated', 'has escalated', 'was escalating', 'escalates'],
    correct_answer: 'escalated',
    explanation: 'Giai đoạn "Between 1990 and 2010" đã chấm dứt hoàn toàn trong quá khứ -> Dùng Quá khứ đơn (Past Simple).',
    ielts_tip: 'Đừng dùng Present Perfect khi câu đã có mốc thời gian quá khứ rõ ràng.',
    target_concept: 'Past Simple with Closed Time Frames'
  }
];

// Helper: Tự động ghép từ vựng trong kho của người dùng vào các bài tập đa cơ chế
export function generateVaultInfusedExercises(vaultWords: { word: string; meaning: string; phonetic?: string }[]): GrammarDrill[] {
  if (!vaultWords || vaultWords.length === 0) {
    return STATIC_DRILLS;
  }

  const result: GrammarDrill[] = [...STATIC_DRILLS];

  vaultWords.slice(0, 6).forEach((v, index) => {
    const cleanWord = (v.word || '').trim().toLowerCase();
    
    // Bài tập Gap Fill với từ vựng của user:
    result.push({
      id: `vault-gap-${index}-${cleanWord}`,
      category: 'tenses',
      mechanic: 'GAP_FILL',
      title: `Chia thì quá khứ với từ của bạn: "${v.word}"`,
      prompt: `Chia động từ "${cleanWord}" (${v.meaning}) phù hợp với ngữ cảnh biểu đồ quá khứ IELTS Task 1:`,
      target_concept: `Past Simple with User Vocabulary: ${cleanWord}`,
      vault_word_slot: cleanWord,
      cefr_level: 'B2',
      ielts_tip: `Sử dụng từ vựng học thuật "${cleanWord}" ở thì quá khứ đơn giúp mô tả biểu đồ Task 1 chuẩn xác.`,
      explanation: `Mốc thời gian 2010-2020 đã kết thúc hoàn toàn trong quá khứ nên động từ "${cleanWord}" phải được chia ở thì Quá khứ đơn.`,
      content_payload: {
        sentence_with_blank: `Between 2010 and 2020, sustainable measures substantially [ _____ ] (${cleanWord}) carbon emissions.`,
        base_word: cleanWord,
        acceptable_answers: [`${cleanWord.replace(/e$/, '')}ed`, `${cleanWord}ed`]
      }
    });

    // Bài tập MCQ Mạo từ với từ vựng của user:
    result.push({
      id: `vault-mcq-${index}-${cleanWord}`,
      category: 'modifiers',
      mechanic: 'MULTIPLE_CHOICE',
      title: `Luyện Mạo Từ với từ vựng của bạn: "${v.word}"`,
      prompt: `Chọn mạo từ đúng khi kết hợp với cụm từ chứa "${v.word}" (${v.meaning}):`,
      target_concept: `Article with User Vault Word: ${cleanWord}`,
      vault_word_slot: cleanWord,
      cefr_level: 'B1',
      ielts_tip: `Bạn vừa ôn tập từ vựng "${v.word}" vừa rèn luyện nguyên tắc mạo từ bất định a/an.`,
      explanation: `Từ "${cleanWord}" đóng vai trò tính từ bổ nghĩa cho danh từ đếm được số ít "strategy" được nhắc đến lần đầu -> dùng "${/^[ueoai]/i.test(cleanWord) ? 'an' : 'a'} ${cleanWord} strategy".`,
      content_payload: {
        sentence_with_blank: `The prime minister emphasized that adopting [ _____ ] ${cleanWord} strategy is essential.`,
        options: ['a', 'an', 'the', 'Ø'],
        correct_answer: /^[ueoai]/i.test(cleanWord) ? 'an' : 'a'
      }
    });
  });

  return result.sort(() => Math.random() - 0.5);
}
