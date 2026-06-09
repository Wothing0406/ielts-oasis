"use client";
import { useState, useEffect, useRef } from 'react';

const levenshtein = (a: string, b: string) => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) { matrix[i] = [i]; }
  for (let j = 0; j <= a.length; j++) { matrix[0][j] = j; }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
      }
    }
  }
  return matrix[b.length][a.length];
};

interface MatchaRadioProps {
  initialContext?: string;
}

export default function MatchaRadio({ initialContext }: MatchaRadioProps) {
  const [test, setTest] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [score, setScore] = useState<{ correct: number, total: number } | null>(null);

  const [activeTab, setActiveTab] = useState<"youtube" | "manual" | "community">("youtube");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeMode, setYoutubeMode] = useState<"quiz" | "dictation">("quiz");
  const [manualText, setManualText] = useState("");
  const [manualMode, setManualMode] = useState<"conversation" | "paragraph">("conversation");
  const [showInput, setShowInput] = useState(false);

  // Bookmarking state
  const audioRef = useRef<HTMLAudioElement>(null);
  const [bookmarks, setBookmarks] = useState<{ time: number, label: string }[]>([]);
  const [newBookmarkLabel, setNewBookmarkLabel] = useState("");

  // Fetch from Community when community tab is selected
  const [communityPosts, setCommunityPosts] = useState<any[]>([]);
  const [communityFilter, setCommunityFilter] = useState("new");

  useEffect(() => {
    if (activeTab === "community") {
      fetch(`/api/community/feed?sort_by=${communityFilter}`)
        .then(res => res.json())
        .then(data => {
          if (data.writings) setCommunityPosts(data.writings.filter((w: any) => w.full_content && w.full_content.length > 200));
        })
        .catch(console.error);
    }
  }, [activeTab, communityFilter]);

  useEffect(() => {
    if (initialContext) {
      setActiveTab("manual");
      setManualText(initialContext);
      generateFromText(initialContext);
    }
  }, [initialContext]);

  const resetState = () => {
    setLoading(true);
    setScore(null);
    setAnswers({});
    setBookmarks([]);
  };

  const generateFromYoutube = async () => {
    if (!youtubeUrl.trim()) return;
    resetState();
    try {
      const res = await fetch('/api/listening/youtube', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: youtubeUrl, mode: youtubeMode })
      });
      const data = await res.json();
      if (data.error || data.detail) {
        alert("Lỗi: " + (data.error || data.detail));
      } else if (data.is_suitable === false) {
        alert("Video này không phù hợp: " + (data.reason || "AI không thể trích xuất phụ đề tiếng Anh từ video này."));
      } else {
        setTest({ ...data, type: "youtube", sourceUrl: youtubeUrl });
        setShowInput(false);
      }
    } catch (err) {
      console.error(err);
      alert("AI generation failed. Please try again later.");
    }
    setLoading(false);
  };

  const generateFromText = async (textToUse: string, isCommunity: boolean = false) => {
    if (!textToUse.trim()) return;
    resetState();
    try {
      const res = await fetch('/api/listening/generate-from-text', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToUse, mode: isCommunity ? "paragraph" : manualMode })
      });
      const data = await res.json();
      if (data.error || data.detail) {
        alert("Lỗi: " + (data.error || data.detail));
      } else {
        setTest({ ...data, type: isCommunity ? "community" : "manual", originalText: textToUse });
        setShowInput(false);
      }
    } catch (err) {
      console.error(err);
      alert("AI generation failed. Please try again later.");
    }
    setLoading(false);
  };

  const getYoutubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const addBookmark = () => {
    if (audioRef.current) {
      const currentTime = audioRef.current.currentTime;
      setBookmarks([...bookmarks, { time: currentTime, label: newBookmarkLabel || `00:${Math.floor(currentTime).toString().padStart(2, '0')}` }]);
      setNewBookmarkLabel("");
    }
  };

  const jumpToBookmark = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      audioRef.current.play();
    }
  };

  const submitTest = () => {
    if (!test || !test.questions) return;
    let correct = 0;

    // We will augment test questions with a fuzzyMatch flag
    const gradedQuestions = test.questions.map((q: any) => {
      const expected = q.correctAnswer || q.answer || "";
      const userAns = answers[q.id] || "";

      const cleanUser = userAns.toLowerCase().replace(/[.,!?]/g, '').trim();
      const cleanExpected = expected.toLowerCase().replace(/[.,!?]/g, '').trim();

      let isCorrect = false;
      let isFuzzy = false;

      if (cleanUser === cleanExpected) {
        isCorrect = true;
      } else if (cleanUser && cleanExpected) {
        // allow missing "s" or "es"
        if (cleanUser + 's' === cleanExpected || cleanUser + 'es' === cleanExpected || cleanExpected + 's' === cleanUser || cleanExpected + 'es' === cleanUser) {
          isCorrect = true;
          isFuzzy = true;
        } else if (cleanUser.length > 4 && cleanExpected.length > 4 && levenshtein(cleanUser, cleanExpected) <= 2) {
          // Allow minor spelling mistake (max 2 characters difference)
          isCorrect = true;
          isFuzzy = true;
        }
      }

      if (isCorrect) correct++;

      return { ...q, isCorrect, isFuzzy };
    });

    setTest({ ...test, questions: gradedQuestions });
    setScore({ correct, total: test.questions.length });
  };

  return (
    <div className="p-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center text-primary">
            <span className="material-symbols-rounded">headphones</span>
          </div>
          <div>
            <h3 className="font-display text-2xl font-bold">Matcha Radio</h3>
            <p className="text-sm opacity-60">AI-Generated IELTS Listening Practice</p>
          </div>
        </div>
        {!test && !showInput ? (
          <button type="button"
            onClick={() => setShowInput(true)}
            className="text-sm font-bold bg-primary text-white px-8 py-3 rounded-full shadow-lg hover:scale-105 transition-all"
          >
            Create New Test
          </button>
        ) : test && !score ? (
          <button type="button"
            onClick={submitTest}
            className="text-sm font-bold bg-accent text-white px-8 py-3 rounded-full shadow-lg hover:scale-105 transition-all"
          >
            Submit Answers
          </button>
        ) : test && score ? (
          <button type="button"
            onClick={() => { setTest(null); setShowInput(true); }}
            className="text-sm font-bold bg-secondary text-primary border border-primary px-8 py-3 rounded-full shadow hover:scale-105 transition-all"
          >
            Try Another
          </button>
        ) : null}
      </div>

      {showInput && !test && (
        <div className="mb-8 p-6 bg-secondary/30 rounded-2xl border border-primary/20">
          <div className="flex flex-wrap gap-2 mb-6">
            <button type="button"
              onClick={() => setActiveTab("youtube")}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'youtube' ? 'bg-primary text-white shadow' : 'bg-white text-primary border border-primary/20'}`}
            >
              YouTube Video
            </button>
            <button type="button"
              onClick={() => setActiveTab("manual")}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'manual' ? 'bg-primary text-white shadow' : 'bg-white text-primary border border-primary/20'}`}
            >
              Nhập thủ công
            </button>
            <button type="button"
              onClick={() => setActiveTab("community")}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'community' ? 'bg-primary text-white shadow' : 'bg-white text-primary border border-primary/20'}`}
            >
              Bài viết Cộng đồng
            </button>
          </div>

          {activeTab === "youtube" && (
            <div className="animate-fade-in">
              <h4 className="font-bold mb-4">Dán link YouTube (Cần có phụ đề tiếng Anh):</h4>
              <input
                type="text"
                value={youtubeUrl}
                onChange={e => setYoutubeUrl(e.target.value)}
                className="w-full p-4 rounded-xl border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 outline-none focus:ring-2 focus:ring-primary mb-4"
                placeholder="https://www.youtube.com/watch?v=..."
              />
              <div className="flex gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={youtubeMode === 'quiz'} onChange={() => setYoutubeMode('quiz')} className="text-primary focus:ring-primary" />
                  <span>Trắc nghiệm (Quiz)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={youtubeMode === 'dictation'} onChange={() => setYoutubeMode('dictation')} className="text-primary focus:ring-primary" />
                  <span>Nghe điền từ (Dictation)</span>
                </label>
              </div>
              <button type="button"
                onClick={generateFromYoutube}
                disabled={loading || !youtubeUrl.trim()}
                className="w-full text-sm font-bold bg-primary text-white px-8 py-4 rounded-xl shadow hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <><span className="material-symbols-rounded animate-spin">sync</span> AI is analyzing video...</> : "Generate from YouTube"}
              </button>
            </div>
          )}

          {activeTab === "manual" && (
            <div className="animate-fade-in">
              <h4 className="font-bold mb-2">Dán đoạn {manualMode === 'conversation' ? 'hội thoại' : 'văn'} tiếng Anh để AI tạo Audio:</h4>
              <p className="text-xs text-primary mb-4 opacity-80 bg-primary/5 p-3 rounded-lg border border-primary/20">
                💡 <b>Mẹo:</b> Để AI đọc chuẩn giọng, hãy dùng định dạng JSON. Bạn có thể chép prompt này đưa cho Gemini/ChatGPT: 
                <br/><code className="bg-primary/20 px-1 py-0.5 rounded mt-1 inline-block select-all">
                  {manualMode === 'conversation' 
                    ? `Hãy chuyển đoạn hội thoại dưới đây thành 1 mảng JSON, trong đó mỗi câu thoại là một object có key là tên nhân vật (viết thường), ví dụ: [{"a": "hello"}, {"b": "hi"}]` 
                    : `Hãy chuyển đoạn văn dưới đây thành 1 mảng JSON có đúng 1 object duy nhất với key là "text", ví dụ: [{"text": "I am an authentic, adaptive, and witty AI collaborator..."}]`
                  }
                </code>
              </p>
              <textarea
                value={manualText}
                onChange={e => setManualText(e.target.value)}
                className="w-full h-48 p-4 rounded-xl border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 outline-none focus:ring-2 focus:ring-primary mb-4 font-mono text-sm"
                placeholder={manualMode === 'conversation'
                  ? `Ví dụ định dạng JSON hội thoại:\n[\n  {\n    "a": "Hey, are you ready for the English exam tomorrow?"\n  },\n  {\n    "b": "Not really. I'm still trying to memorize the vocabulary."\n  }\n]\n\nHoặc dán đoạn văn bình thường vào đây...`
                  : `Ví dụ định dạng JSON đoạn văn:\n[\n  {\n    "text": "I am an authentic, adaptive, and witty AI collaborator designed to work alongside you on any project or idea..."\n  }\n]\n\nHoặc dán đoạn văn bình thường vào đây...`
                }
              />
              <div className="flex gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={manualMode === 'conversation'} onChange={() => setManualMode('conversation')} className="text-primary focus:ring-primary" />
                  <span>Hội thoại (Sinh 10-20 câu ABCD khó dần)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={manualMode === 'paragraph'} onChange={() => setManualMode('paragraph')} className="text-primary focus:ring-primary" />
                  <span>Đoạn văn (Trắc nghiệm + Điền từ)</span>
                </label>
              </div>
              <button type="button"
                onClick={() => generateFromText(manualText, false)}
                disabled={loading || !manualText.trim()}
                className="w-full text-sm font-bold bg-primary text-white px-8 py-4 rounded-xl shadow hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <><span className="material-symbols-rounded animate-spin">sync</span> AI is generating audio and questions...</> : "Generate from Text"}
              </button>
            </div>
          )}

          {activeTab === "community" && (
            <div className="animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold">Chọn 1 bài viết hay từ cộng đồng để luyện nghe:</h4>
                <select 
                  className="bg-white border border-primary/20 text-accent text-sm rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-primary"
                  value={communityFilter}
                  onChange={(e) => setCommunityFilter(e.target.value)}
                >
                  <option value="new">Mới nhất</option>
                  <option value="hot">Đang Hot (Top tương tác)</option>
                  <option value="top">Điểm cao nhất</option>
                </select>
              </div>
              {communityPosts.length === 0 ? (
                <p className="text-sm opacity-60">Không tìm thấy bài viết nào hoặc đang tải...</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {communityPosts.map(post => (
                    <div key={post.id} className="p-4 border border-primary/20 rounded-xl bg-white dark:bg-neutral-900 hover:border-primary cursor-pointer transition-all flex flex-col justify-between"
                      onClick={() => generateFromText(post.full_content, true)}>
                      <p className="text-sm line-clamp-3 mb-3">{post.content}</p>
                      <div className="flex items-center justify-between text-xs opacity-70">
                        <span>Bởi: {post.username}</span>
                        <span className="flex items-center gap-1"><span className="material-symbols-rounded text-[14px]">headphones</span> Luyện nghe bài này</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {loading && <p className="text-center font-bold text-primary animate-pulse">AI is generating audio and questions...</p>}
            </div>
          )}
        </div>
      )}

      {score && (
        <div className="mb-6 p-4 bg-green-100 border border-green-300 rounded-xl text-green-800 flex justify-between items-center">
          <span className="font-bold">Test Completed!</span>
          <span className="text-xl font-bold">Score: {score.correct} / {score.total} ({(score.correct / score.total * 100).toFixed(0)}%)</span>
        </div>
      )}

      {test && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Audio Player Section */}
          <div className="bg-secondary/40 dark:bg-neutral-800/40 p-6 rounded-2xl border border-primary/10 flex flex-col items-center gap-6 h-[600px] overflow-hidden">
            <h4 className="text-xl font-bold text-center w-full truncate">{test.title || "Listening Test"}</h4>
            {test.context && <p className="text-center opacity-70 text-sm px-4">{test.context}</p>}

            {test.type === "youtube" ? (
              <div className="w-full flex-1 bg-black rounded-xl overflow-hidden shadow-inner flex items-center justify-center min-h-[200px]">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${getYoutubeVideoId(test.sourceUrl)}`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  sandbox="allow-scripts allow-same-origin allow-presentation"
                ></iframe>
              </div>
            ) : (
              <div className="w-full flex flex-col items-center gap-4 my-auto">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
                  <span className="material-symbols-rounded text-4xl text-primary">volume_up</span>
                </div>
                <audio ref={audioRef} controls className="w-full" src={test.audio_url}>
                  <track kind="captions" />
                  Your browser does not support the audio element.
                </audio>

                {/* Bookmarks Section */}
                <div className="w-full mt-4 p-4 bg-white dark:bg-neutral-900 rounded-xl border border-primary/20 shadow-sm">
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      placeholder="Note (e.g. Hard to hear)..."
                      value={newBookmarkLabel}
                      onChange={e => setNewBookmarkLabel(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-neutral-600 bg-transparent outline-none focus:border-primary"
                    />
                    <button type="button" onClick={addBookmark} className="px-3 py-2 bg-primary text-white text-sm rounded-lg font-bold flex items-center gap-1 hover:bg-primary/90">
                      <span className="material-symbols-rounded text-[18px]">bookmark_add</span>
                    </button>
                  </div>
                  {bookmarks.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {bookmarks.map((bm, idx) => (
                        <button type="button" key={idx} onClick={() => jumpToBookmark(bm.time)} className="px-3 py-1 bg-secondary/50 border border-primary/30 text-primary rounded-full text-xs hover:bg-primary hover:text-white transition-colors flex items-center gap-1">
                          <span className="material-symbols-rounded text-[14px]">play_circle</span>
                          {bm.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-700/50 text-sm w-full mt-auto">
              <p className="font-bold mb-1 flex items-center gap-2"><span className="material-symbols-rounded text-base">warning</span> Instructions</p>
              <ul className="list-disc pl-5 opacity-80">
                <li>Play the audio/video to listen.</li>
                <li>Answer the questions generated by AI on the right.</li>
              </ul>
            </div>
          </div>

          {/* Questions Section */}
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-primary/20 h-[600px] overflow-y-auto custom-scrollbar shadow-inner">
            <h4 className="text-xl font-bold mb-4 text-primary border-b border-primary/20 pb-2">Questions 1-{test.questions?.length || 0}</h4>

            <div className="space-y-6">
              {(test.questions || []).map((q: any) => (
                <div key={q.id} className="p-4 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                  {(q.type === 'fill_in_the_blank' || !q.options || q.options.length === 0) && (q.question || q.text || '').includes('_______') ? (
                    <p className="font-semibold mb-3 leading-loose">
                      <span className="text-primary mr-2">{q.id}.</span>
                      {(q.question || q.text || '').split('_______').map((part: string, idx: number, arr: string[]) => (
                        <span key={idx}>
                          {part}
                          {idx < arr.length - 1 && (
                            <input
                              type="text"
                              value={answers[q.id] || ''}
                              onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                              className="mx-2 px-2 py-1 w-32 border-b-2 border-primary bg-transparent outline-none focus:bg-primary/10 text-center font-bold"
                              disabled={!!score}
                            />
                          )}
                        </span>
                      ))}
                    </p>
                  ) : (
                    <p className="font-semibold mb-3"><span className="text-primary mr-2">{q.id}.</span>{q.question || q.text}</p>
                  )}

                  {q.options && q.options.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {q.options.map((opt: string, i: number) => (
                        <label key={i} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors ${answers[q.id] === opt ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-neutral-700'}`}>
                          <input
                            type="radio"
                            name={`q-${q.id}`}
                            value={opt}
                            checked={answers[q.id] === opt}
                            onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                            className="text-primary focus:ring-primary"
                            disabled={!!score}
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  ) : (!(q.type === 'fill_in_the_blank' || !q.options || q.options.length === 0) || !(q.question || q.text || '').includes('_______')) && (
                    <input
                      type="text"
                      placeholder="Type your answer here..."
                      value={answers[q.id] || ''}
                      onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                      className="w-full p-3 rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                      disabled={!!score}
                    />
                  )}

                  {score && (
                    <div className="mt-4 text-sm bg-white dark:bg-neutral-900 p-3 rounded-lg border border-gray-200 dark:border-neutral-700">
                      <div className="mb-1">
                        {q.isCorrect ? (
                          q.isFuzzy ? (
                            <div className="text-yellow-600 dark:text-yellow-500 flex flex-col gap-1">
                              <span className="flex items-center gap-1 font-bold"><span className="material-symbols-rounded text-sm">check_circle</span> Chấp nhận được!</span>
                              <span className="text-gray-600 dark:text-gray-400 text-xs">Bạn chọn: <strong>{answers[q.id] || "Bỏ trống"}</strong></span>
                              <span className="text-green-600 dark:text-green-400 text-xs">Đáp án gốc: <strong>{q.correctAnswer || q.answer}</strong></span>
                            </div>
                          ) : (
                            <div className="text-green-500 flex flex-col gap-1">
                              <span className="flex items-center gap-1 font-bold"><span className="material-symbols-rounded text-sm">check_circle</span> Chính xác!</span>
                              <span className="text-gray-600 dark:text-gray-400 text-xs">Đáp án: <strong>{q.correctAnswer || q.answer}</strong></span>
                            </div>
                          )
                        ) : (
                          <div className="text-red-500 flex flex-col gap-1">
                            <span className="flex items-center gap-1 font-bold"><span className="material-symbols-rounded text-sm">cancel</span> Sai rồi!</span>
                            <span className="text-gray-600 dark:text-gray-400 text-xs mt-1">Bạn chọn: <strong className="text-red-500 line-through">{answers[q.id] || "Bỏ trống"}</strong></span>
                            <span className="text-green-600 dark:text-green-400 text-xs">Đáp án đúng: <strong>{q.correctAnswer || q.answer}</strong></span>
                          </div>
                        )}
                      </div>
                      {q.explanation && (
                        <p className="opacity-70 mt-2 text-[13px] border-t border-gray-100 dark:border-neutral-700 pt-2">{q.explanation}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
