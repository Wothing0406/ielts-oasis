// frontend/data/grammarLessons.ts
// Curated IELTS Academic Grammar Knowledge Base & Practice Exercises
// Zero latency (0ms), Zero hallucination, Aligned with Cambridge Band 7.5+ Standards

export interface AcademicExample {
  sentence: string;
  task_type: 'Task 1' | 'Task 2' | 'Speaking';
  analysis: string;
  band_score: string;
}

export interface GrammarLesson {
  id: string;
  category: 'tenses' | 'articles';
  title: string;
  vietnameseTitle: string;
  timeline_position?: 'past' | 'present' | 'future';
  formula: string;
  rule_summary: string;
  ielts_application: string;
  common_pitfalls: string[];
  academic_examples: AcademicExample[];
}

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
  vault_word_slot?: string; // Tên vị trí để chèn từ trong kho vào câu
}

export const TENSE_LESSONS: GrammarLesson[] = [
  {
    id: 'past_simple',
    category: 'tenses',
    title: 'Past Simple (Quá khứ đơn)',
    vietnameseTitle: 'Quá Khứ Đơn - Vũ Khí 90% Đề Thi Task 1',
    timeline_position: 'past',
    formula: 'S + V-ed / V2 (Phủ định: S + did not + V-inf)',
    rule_summary: 'Diễn tả hành động, sự kiện hoặc xu hướng đã bắt đầu và kết thúc hoàn toàn tại một thời điểm xác định trong quá khứ.',
    ielts_application: 'Bắt buộc dùng trong IELTS Writing Task 1 khi biểu đồ có các mốc năm trong quá khứ (ví dụ: 1995 đến 2020) để miêu tả số liệu tăng, giảm, dao động.',
    common_pitfalls: [
      'Lỗi quên lùi thì: Biểu đồ cho năm 2010 nhưng thí sinh vẫn viết "The rate increases to 45%".',
      'Lẫn lộn với Present Perfect khi có mốc năm rõ ràng (viết "has increased in 2015" là SAI, phải viết "increased in 2015").'
    ],
    academic_examples: [
      {
        sentence: 'Between 2005 and 2015, the proportion of households with high-speed internet escalated from 22% to 68%.',
        task_type: 'Task 1',
        analysis: 'Dùng "escalated" (quá khứ đơn) vì giai đoạn 2005-2015 đã kết thúc hoàn toàn trong quá khứ.',
        band_score: 'Band 8.0'
      },
      {
        sentence: 'In 2012, fossil fuels accounted for the vast majority of national energy consumption.',
        task_type: 'Task 1',
        analysis: 'Cụm "In 2012" ấn định thời điểm dứt khoát -> Dùng "accounted for".',
        band_score: 'Band 8.5'
      }
    ]
  },
  {
    id: 'past_perfect',
    category: 'tenses',
    title: 'Past Perfect (Quá khứ hoàn thành)',
    vietnameseTitle: 'Quá Khứ Hoàn Thành - Bí Kíp Ăn Điểm GRA Band 7.5+ Task 1',
    timeline_position: 'past',
    formula: 'S + had + V3/V-ed',
    rule_summary: 'Diễn tả một hành động xảy ra và hoàn tất TRƯỚC một hành động hoặc mốc thời gian khác trong quá khứ.',
    ielts_application: 'Cực kỳ đắt giá trong Writing Task 1 khi dùng với liên từ "By the time", "Prior to", hoặc "Before" để so sánh 2 mốc số liệu.',
    common_pitfalls: [
      'Lạm dụng quá mức khi không có mốc đối chiếu quá khứ thứ hai.',
      'Quên chia dạng phân từ 2 (V3) của các bất quy tắc thông dụng (surpassed, fallen, overtaken).'
    ],
    academic_examples: [
      {
        sentence: 'By the time the new conservation policy was introduced in 2010, carbon emissions had already reached an unprecedented peak.',
        task_type: 'Task 1',
        analysis: '"had already reached" xảy ra trước mốc năm 2010 ("was introduced"), thể hiện sự kiểm soát cấu trúc câu phức hoàn hảo.',
        band_score: 'Band 8.5'
      },
      {
        sentence: 'Prior to the economic downtown, the manufacturing sector had dominated the national GDP for nearly a decade.',
        task_type: 'Task 1',
        analysis: 'Dùng "had dominated" để nhấn mạnh sự thống trị kéo dài trước khi khủng hoảng xảy ra.',
        band_score: 'Band 8.0'
      }
    ]
  },
  {
    id: 'present_perfect',
    category: 'tenses',
    title: 'Present Perfect (Hiện tại hoàn thành)',
    vietnameseTitle: 'Hiện Tại Hoàn Thành - Dẫn Nhập Bối Cảnh Writing Task 2',
    timeline_position: 'present',
    formula: 'S + have / has + V3/V-ed',
    rule_summary: 'Diễn tả hành động bắt đầu trong quá khứ, kéo dài đến hiện tại hoặc để lại kết quả ảnh hưởng trực tiếp đến hiện tại.',
    ielts_application: 'Mẫu câu vàng để viết câu mở đầu (Introduction) Task 2 khi nêu xu hướng thời đại: "Over the last few decades...", "In recent years...".',
    common_pitfalls: [
      'Dùng Present Perfect kèm với một mốc năm cụ thể trong quá khứ (ví dụ: "has plummeted in 2018" -> SAI).',
      'Quên chia "has" khi chủ ngữ là danh từ không đếm được như "technology", "climate change", "urbanization".'
    ],
    academic_examples: [
      {
        sentence: 'Over recent decades, rapid technological proliferation has transformed traditional educational paradigms.',
        task_type: 'Task 2',
        analysis: '"has transformed" nối quá khứ với hiện tại, tạo nền tảng vững chắc cho bài luận Task 2.',
        band_score: 'Band 8.0'
      },
      {
        sentence: 'Public awareness regarding environmental sustainability has witnessed a significant surge.',
        task_type: 'Task 2',
        analysis: 'Hành động nhận thức tăng lên kéo dài đến nay -> Dùng Present Perfect kết hợp collocation C1.',
        band_score: 'Band 8.5'
      }
    ]
  },
  {
    id: 'present_simple',
    category: 'tenses',
    title: 'Present Simple (Hiện tại đơn)',
    vietnameseTitle: 'Hiện Tại Đơn - Lập Luận Khách Quan & Định Luật Xã Hội',
    timeline_position: 'present',
    formula: 'S + V(s/es) / am/is/are (Phủ định: do/does not + V-inf)',
    rule_summary: 'Diễn tả quy luật tự nhiên, sự thật hiển nhiên hoặc quan điểm lập luận học thuật mang tính phổ quát.',
    ielts_application: 'Sử dụng xuyên suốt các đoạn thân bài (Body paragraphs) của Writing Task 2 khi phân tích nguyên nhân - kết quả và giải pháp.',
    common_pitfalls: [
      'Lỗi Subject-Verb Agreement (sự hòa hợp chủ-vị): Quên thêm "s/es" khi chủ ngữ là danh từ số ít hoặc mệnh đề danh ngữ.',
      'Dùng Hiện tại đơn để miêu tả biểu đồ Task 1 có năm quá khứ.'
    ],
    academic_examples: [
      {
        sentence: 'Investing in renewable energy resources mitigates long-term dependence on finite fossil fuels.',
        task_type: 'Task 2',
        analysis: 'Chủ ngữ danh động từ "Investing in..." là số ít -> động từ "mitigates" thêm "s", khẳng định một chân lý khách quan.',
        band_score: 'Band 8.0'
      }
    ]
  },
  {
    id: 'future_projections',
    category: 'tenses',
    title: 'Future Projections (Cấu trúc Dự đoán Tương lai)',
    vietnameseTitle: 'Dự Báo Tương Lai - Tuyệt Đối Tránh "Will" Trong Task 1',
    timeline_position: 'future',
    formula: 'S + is/are projected / predicted / anticipated / forecasted to + V-inf',
    rule_summary: 'Diễn tả số liệu hoặc xu hướng trong tương lai mang tính dự đoán khoa học, tránh khẳng định chủ quan tuyệt đối.',
    ielts_application: 'Bắt buộc dùng trong Task 1 khi có các năm tương lai (ví dụ: 2030, 2050). Tuyệt đối không dùng "will increase" vì số liệu tương lai là dự báo, không phải chắc chắn 100%.',
    common_pitfalls: [
      'Lạm dụng từ "will": Viết "The population will rise to 8 billion" khiến bài viết mất tính khách quan học thuật (Academic Tone).',
      'Quên chia thể bị động (phải là "is projected to", không phải "projects to").'
    ],
    academic_examples: [
      {
        sentence: 'By 2040, the proportion of global electricity generated from solar power is projected to reach approximately 45%.',
        task_type: 'Task 1',
        analysis: 'Dùng "is projected to reach" thể hiện chuẩn mực dự báo khoa học Band 8.5+ trong Task 1.',
        band_score: 'Band 8.5'
      },
      {
        sentence: 'Autonomous electric vehicles are anticipated to witness widespread adoption over the coming decade.',
        task_type: 'Task 2',
        analysis: 'Dùng "are anticipated to witness" mang sắc thái dự đoán khách quan thuyết phục.',
        band_score: 'Band 8.0'
      }
    ]
  }
];

export const ARTICLE_LESSONS: GrammarLesson[] = [
  {
    id: 'the_definite',
    category: 'articles',
    title: 'Definite Article "THE" (Mạo từ xác định)',
    vietnameseTitle: 'Mạo Từ "THE" - 5 Quy Tắc Ăn Điểm Tuyệt Đối IELTS',
    formula: 'THE + Singular / Plural / Uncountable Noun (khi đã xác định)',
    rule_summary: 'Dùng khi cả người nói và người nghe đều biết rõ đối tượng đang được đề cập, hoặc đối tượng là duy nhất.',
    ielts_application: 'Chiếm 70% số lỗi mạo từ trong Task 1 & 2. Bắt buộc có "the" trước các cụm tỷ lệ ("the percentage of", "the proportion of") và so sánh nhất.',
    common_pitfalls: [
      'Quên "the" trước cụm tỷ lệ: Viết "Percentage of students increased" (SAI -> phải là "The percentage of students").',
      'Quên "the" trước các thực thể duy nhất: "environment", "internet", "government", "workforce".',
      'Thừa "the" trước tên nước đơn: Viết "The Vietnam", "The Japan" (SAI -> chỉ dùng "the" với liên bang/quần đảo: "The UK", "The US").'
    ],
    academic_examples: [
      {
        sentence: 'The proportion of graduates seeking overseas employment escalated considerably.',
        task_type: 'Task 1',
        analysis: 'Bắt buộc có "The" đứng đầu cụm "The proportion of...".',
        band_score: 'Band 8.0'
      },
      {
        sentence: 'Governments worldwide must safeguard the environment for future generations.',
        task_type: 'Task 2',
        analysis: '"The environment" là thực thể sinh thái duy nhất của nhân loại -> Luôn luôn có "the".',
        band_score: 'Band 8.5'
      }
    ]
  },
  {
    id: 'a_an_indefinite',
    category: 'articles',
    title: 'Indefinite Articles "A / AN" (Mạo từ bất định)',
    vietnameseTitle: 'Mạo Từ "A / AN" - Nguyên Tắc Danh Từ Đếm Được Số Ít',
    formula: 'A/AN + Singular Countable Noun (nhắc đến lần đầu tiên / chưa xác định)',
    rule_summary: 'Dùng trước danh từ đếm được số ít khi được nhắc đến lần đầu tiên hoặc chỉ một thành viên chung trong một nhóm.',
    ielts_application: 'Dùng khi đưa ra một ví dụ, một giải pháp hoặc một nguyên nhân mới trong bài viết Task 2.',
    common_pitfalls: [
      'Đặt danh từ đếm được số ít đứng trơ trọi một mình (Single Countable Law): Viết "Government should implement policy" (SAI NẶNG -> Phải là "A government should implement a policy" hoặc "Governments should implement policies").',
      'Nhầm lẫn giữa "a" và "an" dựa trên chữ viết thay vì phiên âm (ví dụ: "a university" vì âm /j/, nhưng "an hour" vì âm câm /aʊ/).'
    ],
    academic_examples: [
      {
        sentence: 'Implementing a congestion charge represents an effective remedy for urban traffic bottlenecks.',
        task_type: 'Task 2',
        analysis: '"a congestion charge" (một loại phí đếm được) và "an effective remedy" (một giải pháp bắt đầu bằng nguyên âm /e/).',
        band_score: 'Band 8.0'
      }
    ]
  },
  {
    id: 'zero_article',
    category: 'articles',
    title: 'Zero Article "Ø" (Mạo từ rỗng)',
    vietnameseTitle: 'Mạo Từ Rỗng "Ø" - Khái Quát Hóa Học Thuật Band 8.0',
    formula: 'Ø + Plural Nouns / Uncountable Nouns (khi nói chung chung)',
    rule_summary: 'KHÔNG dùng mạo từ khi nói về các khái niệm trừu tượng, danh từ không đếm được nói chung hoặc danh từ đếm được số nhiều mang nghĩa khái quát.',
    ielts_application: 'Tiêu chuẩn vàng của văn phong học thuật Task 2: Khi nói về giáo dục, ô nhiễm, xã hội nói chung, tuyệt đối không được thêm "the".',
    common_pitfalls: [
      'Thêm "the" tùy tiện trước danh từ trừu tượng: Viết "The education plays a vital role" (SAI NGHIÊM TRỌNG -> Phải là "Ø Education plays a vital role").',
      'Thêm "the" trước danh từ đếm được số nhiều khi nói về đối tượng chung: Viết "The students should study hard" khi không nói về nhóm học sinh cụ thể nào.'
    ],
    academic_examples: [
      {
        sentence: 'Ø Higher education plays a pivotal role in fostering economic growth.',
        task_type: 'Task 2',
        analysis: '"Higher education" là danh từ trừu tượng nói chung -> Dùng Zero Article Ø (không có "the").',
        band_score: 'Band 8.5'
      },
      {
        sentence: 'Ø Fossil fuels continue to generate severe Ø environmental degradation.',
        task_type: 'Task 2',
        analysis: 'Cả "fossil fuels" (số nhiều chung) và "environmental degradation" (không đếm được) đều dùng Zero Article Ø.',
        band_score: 'Band 8.5'
      }
    ]
  }
];

export const STATIC_GRAMMAR_EXERCISES: GrammarExercise[] = [
  // --- BÀI TẬP MẠO TỪ (ARTICLES) ---
  {
    id: 'art-ex-1',
    category: 'articles',
    type: 'article_cloze',
    title: 'Mạo từ trong Task 1 - Cụm tỷ lệ số liệu',
    prompt: 'Chọn mạo từ thích hợp để điền vào chỗ trống:',
    sentence_with_blank: 'According to the graph, [ _____ ] proportion of households with solar panels increased substantially.',
    options: ['a', 'an', 'the', 'Ø'],
    correct_answer: 'the',
    explanation: 'Cụm "proportion of..." đã được xác định bởi mệnh đề bổ nghĩa "households with solar panels" phía sau, do đó BẮT BUỘC dùng mạo từ xác định "the".',
    ielts_tip: 'Trong Writing Task 1, luôn luôn dùng "The proportion of...", "The percentage of...", "The number of...". Không bao giờ dùng mạo từ rỗng hay "a" ở vị trí này.',
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
    explanation: '"Quality education" ở đây là danh từ trừu tượng không đếm được, đang được đề cập một cách khái quát nói chung, do đó dùng Zero Article (Ø).',
    ielts_tip: 'Tuyệt đối tránh viết "The education" hay "The technology" khi nói về các khái niệm trừu tượng nói chung trong Task 2.',
    target_concept: 'Zero Article with Abstract Generalizations'
  },
  {
    id: 'art-ex-3',
    category: 'articles',
    type: 'article_cloze',
    title: 'Mạo từ với thực thể duy nhất',
    prompt: 'Chọn mạo từ thích hợp để điền vào chỗ trống:',
    sentence_with_blank: 'Human activities have exerted irreversible pressure on [ _____ ] environment.',
    options: ['a', 'an', 'the', 'Ø'],
    correct_answer: 'the',
    explanation: '"Environment" là thực thể môi trường sinh thái duy nhất của hành tinh, do đó luôn đi kèm mạo từ xác định "the".',
    ielts_tip: 'Các từ luôn có "the": the environment, the internet, the ozone layer, the atmosphere, the government.',
    target_concept: 'The with Unique Entities'
  },
  {
    id: 'art-ex-4',
    category: 'articles',
    type: 'article_cloze',
    title: 'Mạo từ với Tên Quốc Gia Địa Danh',
    prompt: 'Chọn mạo từ thích hợp để điền vào chỗ trống:',
    sentence_with_blank: 'While renewable adoption surged in [ _____ ] United Kingdom, coal remained prevalent in [ _____ ] China.',
    options: ['the / Ø', 'Ø / the', 'the / the', 'a / Ø'],
    correct_answer: 'the / Ø',
    explanation: '"United Kingdom" là một liên bang vương quốc hợp nhất nên bắt buộc có "the" (The UK). Ngược lại, các quốc gia đơn lẻ như China, Vietnam, France dùng Zero Article (Ø).',
    ielts_tip: 'Chỉ dùng "the" với: The UK, The USA, The UAE, The Netherlands, The Philippines. Tất cả các nước đơn lẻ khác không có "the".',
    target_concept: 'Articles with Countries'
  },

  // --- BÀI TẬP CHIA THÌ (TENSES) ---
  {
    id: 'tense-ex-1',
    category: 'tenses',
    type: 'tense_shifter',
    title: 'Chia thì Writing Task 1 - Mốc năm quá khứ',
    prompt: 'Chọn dạng động từ chính xác nhất:',
    sentence_with_blank: 'Between 1990 and 2010, the car ownership rate in European countries [ ___________ ] by nearly 35%.',
    options: ['escalated', 'has escalated', 'was escalating', 'escalates'],
    correct_answer: 'escalated',
    explanation: 'Giai đoạn "Between 1990 and 2010" đã chấm dứt hoàn toàn trong quá khứ -> Bắt buộc dùng thì Quá khứ đơn (Past Simple): "escalated".',
    ielts_tip: 'Đừng dùng Present Perfect khi câu đã có mốc thời gian quá khứ rõ ràng như "between X and Y" hay "in 2010".',
    target_concept: 'Past Simple with Closed Time Frames'
  },
  {
    id: 'tense-ex-2',
    category: 'tenses',
    type: 'tense_shifter',
    title: 'Chia thì Writing Task 1 - Mốc trước mốc trong quá khứ',
    prompt: 'Chọn dạng động từ chính xác nhất:',
    sentence_with_blank: 'By 2005, hydroelectric energy [ ___________ ] coal as the country’s dominant power source.',
    options: ['had overtaken', 'overtook', 'has overtaken', 'is overtaking'],
    correct_answer: 'had overtaken',
    explanation: 'Giới từ "By + năm quá khứ" (By 2005) mang nghĩa "Tính đến trước năm 2005" -> Hành động vượt qua đã hoàn tất trước mốc 2005 -> Dùng Quá khứ hoàn thành "had overtaken".',
    ielts_tip: 'Cấu trúc "By + [Past Year], S + had + V3" là điểm nhấn ngữ pháp đắt giá giúp đẩy tiêu chí GRA lên Band 8.0+.',
    target_concept: 'Past Perfect with "By + Past Year"'
  },
  {
    id: 'tense-ex-3',
    category: 'tenses',
    type: 'tense_shifter',
    title: 'Chia thì Writing Task 1 - Dự báo tương lai',
    prompt: 'Chọn cấu trúc diễn đạt dự báo học thuật chuẩn nhất:',
    sentence_with_blank: 'By 2050, the global population living in urban centers [ ___________ ] 68%.',
    options: ['is projected to exceed', 'will exceed', 'exceeds', 'has been projected to exceed'],
    correct_answer: 'is projected to exceed',
    explanation: 'Trong IELTS Task 1, số liệu tương lai là dự báo khoa học (projections). Dùng cấu trúc bị động học thuật "is projected to exceed" thể hiện phong cách khách quan chuẩn Band 8.5+.',
    ielts_tip: 'Tránh dùng "will exceed" vì nghe có tính quả quyết cá nhân, không phù hợp văn phong phân tích biểu đồ học thuật.',
    target_concept: 'Future Academic Projections'
  },
  {
    id: 'tense-ex-4',
    category: 'tenses',
    type: 'tense_shifter',
    title: 'Chia thì Writing Task 2 - Xu hướng thời đại',
    prompt: 'Chọn dạng động từ chính xác nhất:',
    sentence_with_blank: 'Over the past two decades, the rise of artificial intelligence [ ___________ ] unprecedented workforce disruption.',
    options: ['has precipitated', 'precipitated', 'precipitates', 'will precipitate'],
    correct_answer: 'has precipitated',
    explanation: 'Cụm thời gian "Over the past two decades" chỉ khoảng thời gian kéo dài từ quá khứ đến hiện tại -> Bắt buộc dùng Hiện tại hoàn thành "has precipitated".',
    ielts_tip: '"Over the past/last X decades..." luôn luôn đi với thì Hiện tại hoàn thành trong mở bài Task 2.',
    target_concept: 'Present Perfect with "Over the past..."'
  }
];

// Helper: Tự động ghép từ vựng trong kho của người dùng vào các câu bài tập ngữ pháp
export function generateVaultInfusedExercises(vaultWords: { word: string; meaning: string; phonetic?: string }[]): GrammarExercise[] {
  if (!vaultWords || vaultWords.length === 0) {
    return STATIC_GRAMMAR_EXERCISES;
  }

  const result: GrammarExercise[] = [...STATIC_GRAMMAR_EXERCISES];

  // Ghép các từ trong kho vào khung câu bài tập ngữ pháp thực tế
  vaultWords.slice(0, 5).forEach((v, index) => {
    const cleanWord = (v.word || '').trim().toLowerCase();
    
    // Bài tập mạo từ lồng ghép từ vựng của user:
    result.push({
      id: `vault-art-${index}-${cleanWord}`,
      category: 'articles',
      type: 'article_cloze',
      title: `Luyện Mạo Từ với từ vựng của bạn: "${v.word}"`,
      prompt: `Chọn mạo từ đúng khi kết hợp với từ "${v.word}" (${v.meaning}) trong ngữ cảnh IELTS:`,
      sentence_with_blank: `The minister emphasized that adopting [ _____ ] ${cleanWord} strategy is imperative for long-term recovery.`,
      options: ['a', 'an', 'the', 'Ø'],
      correct_answer: /^[ueoai]/i.test(cleanWord) ? 'an' : 'a',
      explanation: `Từ "${cleanWord}" đóng vai trò tính từ bổ nghĩa cho danh từ đếm được số ít "strategy" được nhắc đến lần đầu -> dùng "${/^[ueoai]/i.test(cleanWord) ? 'an' : 'a'}" ${cleanWord} strategy.`,
      ielts_tip: `Bạn vừa ôn tập từ vựng "${v.word}" (${v.meaning}) vừa rèn luyện quy tắc mạo từ bất định a/an trước cụm danh từ.`,
      target_concept: `Article with User Vault Word: ${cleanWord}`,
      vault_word_slot: cleanWord
    });

    // Bài tập chia thì lồng ghép từ vựng của user:
    result.push({
      id: `vault-tense-${index}-${cleanWord}`,
      category: 'tenses',
      type: 'tense_shifter',
      title: `Luyện Chia Thì với từ vựng của bạn: "${v.word}"`,
      prompt: `Chia động từ "${cleanWord}" (${v.meaning}) phù hợp với ngữ cảnh biểu đồ quá khứ IELTS Task 1:`,
      sentence_with_blank: `Between 2012 and 2020, sustainable innovations substantially [ ___________ ] (${cleanWord}) industrial carbon waste.`,
      options: [`${cleanWord}ed`, `has ${cleanWord}ed`, `is ${cleanWord}ing`, `${cleanWord}s`],
      correct_answer: `${cleanWord}ed`,
      explanation: `Khoảng thời gian "Between 2012 and 2020" là mốc thời gian quá khứ đã kết thúc -> Động từ "${cleanWord}" phải được chia ở thì Quá khứ đơn: "${cleanWord}ed".`,
      ielts_tip: `Sử dụng từ vựng học thuật "${cleanWord}" ở thì quá khứ đơn giúp mô tả biểu đồ Task 1 chính xác và đạt điểm GRA cao.`,
      target_concept: `Past Simple with User Vault Word: ${cleanWord}`,
      vault_word_slot: cleanWord
    });
  });

  return result.sort(() => Math.random() - 0.5);
}
