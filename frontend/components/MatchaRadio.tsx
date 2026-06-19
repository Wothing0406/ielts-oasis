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

  // Custom Audio States
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

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

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    setIsPlaying(!audio.paused);
    setCurrentTime(audio.currentTime);
    if (audio.duration) setDuration(audio.duration);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [test?.audio_url]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(console.error);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const formatTimeMinSec = (secs: number) => {
    if (isNaN(secs)) return "0:00";
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

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
          <div className="bg-[#FAF9F5] dark:bg-neutral-850 p-6 rounded-3xl border border-primary/10 flex flex-col items-center justify-between gap-6 min-h-[600px]">
            <div className="w-full text-center">
              <h4 className="text-xl font-bold text-[#8C6239] dark:text-neutral-200 truncate">{test.title || "Matcha Radio Listening"}</h4>
              {test.context && <p className="text-xs opacity-60 mt-1 max-w-sm mx-auto">{test.context}</p>}
            </div>

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
              <div className="w-full flex flex-col items-center gap-5 my-auto">
                <audio ref={audioRef} src={test.audio_url} />

                {/* self-contained animation styles */}
                <style>{`
                  @keyframes bounce-bar {
                    0%, 100% { height: 6px; }
                    50% { height: 28px; }
                  }
                  .v-bar {
                    width: 3px;
                    background-color: #9CC29C;
                    border-radius: 2px;
                    height: 6px;
                  }
                  .v-bar-active-1 { animation: bounce-bar 0.9s ease-in-out infinite; }
                  .v-bar-active-2 { animation: bounce-bar 0.6s ease-in-out infinite 0.15s; }
                  .v-bar-active-3 { animation: bounce-bar 1.1s ease-in-out infinite 0.3s; }
                  .v-bar-active-4 { animation: bounce-bar 0.8s ease-in-out infinite 0.1s; }
                  .v-bar-active-5 { animation: bounce-bar 1.0s ease-in-out infinite 0.4s; }
                  .v-bar-active-6 { animation: bounce-bar 0.7s ease-in-out infinite 0.2s; }
                `}</style>

                {/* Retro Analog Tuner Dial */}
                <div className="w-full max-w-sm bg-[#F3EFE0] dark:bg-neutral-800 border border-[#8C6239]/20 rounded-xl p-3 shadow-inner relative overflow-hidden">
                  <div className="flex justify-between text-[10px] font-mono text-[#8C6239]/70 select-none px-2 mb-1">
                    <span>88</span>
                    <span>92</span>
                    <span>98</span>
                    <span>104</span>
                    <span>108 MHz</span>
                  </div>
                  {/* Tuner scale marks */}
                  <div className="h-4 border-t-2 border-b border-[#8C6239]/20 flex justify-between px-2 select-none pointer-events-none opacity-40">
                    {"||||||||||||||||||||||||||".split("").map((c, i) => (
                      <span key={i} className="text-[6px] font-serif">-</span>
                    ))}
                  </div>
                  {/* Sliding Needle */}
                  <div 
                    className="absolute top-2 w-0.5 h-10 bg-red-500 transition-all duration-300 pointer-events-none shadow"
                    style={{ left: `${4 + (currentTime / (duration || 1)) * 91}%` }}
                  />
                </div>

                {/* Circular speaker & Audio Visualizer Section */}
                <div className="flex items-center gap-6 my-2">
                  {/* Visualizer Left */}
                  <div className="flex items-end gap-1 h-8 w-12 justify-end">
                    <div className={`v-bar ${isPlaying ? 'v-bar-active-1' : ''}`} />
                    <div className={`v-bar ${isPlaying ? 'v-bar-active-2' : ''}`} />
                    <div className={`v-bar ${isPlaying ? 'v-bar-active-3' : ''}`} />
                  </div>

                  {/* Spinning vinyl record disc */}
                  <button 
                    onClick={togglePlay}
                    className="w-28 h-28 rounded-full bg-neutral-900 border-4 border-neutral-700 flex items-center justify-center relative shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer group"
                    style={{
                      backgroundImage: 'radial-gradient(circle, #333 10%, #111 60%, #000 100%)',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3), inset 0 0 10px rgba(255,255,255,0.1)'
                    }}
                  >
                    {/* Concentric circles grooves */}
                    <div className="absolute inset-2 rounded-full border border-neutral-800/30 opacity-40"></div>
                    <div className="absolute inset-4 rounded-full border border-neutral-800/30 opacity-40"></div>
                    <div className="absolute inset-6 rounded-full border border-neutral-800/30 opacity-40"></div>
                    <div className="absolute inset-8 rounded-full border border-neutral-800/30 opacity-40"></div>
                    
                    {/* Spinning label container */}
                    <div className={`absolute inset-0 flex items-center justify-center ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '8s' }}>
                      {/* Green center label */}
                      <div className="w-12 h-12 bg-[#9CC29C] rounded-full border border-[#FAF9F5]/40 flex items-center justify-center relative shadow-inner">
                        {/* Spindle hole */}
                        <div className="w-2.5 h-2.5 bg-[#FAF9F5] rounded-full"></div>
                      </div>
                    </div>

                    {/* Overlay play/pause state indicator */}
                    <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="material-symbols-rounded text-white text-3xl select-none">
                        {isPlaying ? 'pause' : 'play_arrow'}
                      </span>
                    </div>
                  </button>

                  {/* Visualizer Right */}
                  <div className="flex items-end gap-1 h-8 w-12 justify-start">
                    <div className={`v-bar ${isPlaying ? 'v-bar-active-4' : ''}`} />
                    <div className={`v-bar ${isPlaying ? 'v-bar-active-5' : ''}`} />
                    <div className={`v-bar ${isPlaying ? 'v-bar-active-6' : ''}`} />
                  </div>
                </div>

                {/* Custom player pill control bar */}
                <div className="w-full max-w-md bg-[#FAF9F5] dark:bg-neutral-800 px-6 py-3 rounded-full flex items-center gap-4 shadow-sm border border-[#8C6239]/20">
                  <button 
                    onClick={togglePlay}
                    className="text-neutral-800 dark:text-white hover:opacity-85 transition-opacity"
                  >
                    <span className="material-symbols-rounded font-bold text-lg select-none">
                      {isPlaying ? 'pause' : 'play_arrow'}
                    </span>
                  </button>
                  
                  <span className="text-xs font-mono text-neutral-600 dark:text-neutral-300 select-none whitespace-nowrap">
                    {formatTimeMinSec(currentTime)} / {formatTimeMinSec(duration)}
                  </span>

                  {/* Seek bar */}
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleSeek}
                    className="flex-1 accent-[#8C6239] h-1 rounded-lg cursor-pointer bg-neutral-300 dark:bg-neutral-600 outline-none"
                  />

                  <button 
                    onClick={toggleMute}
                    className="text-neutral-800 dark:text-white hover:opacity-85 transition-opacity"
                  >
                    <span className="material-symbols-rounded text-lg select-none">
                      {isMuted ? 'volume_off' : 'volume_up'}
                    </span>
                  </button>

                  <span className="material-symbols-rounded text-lg text-neutral-400 select-none cursor-pointer">
                    more_vert
                  </span>
                </div>

                {/* Bookmarks & Notes Section */}
                <div className="w-full p-4 bg-white/70 dark:bg-neutral-900/70 rounded-2xl border border-[#9CC29C]/30 shadow-sm mt-auto">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Note (e.g. Hard to hear)..."
                      value={newBookmarkLabel}
                      onChange={e => setNewBookmarkLabel(e.target.value)}
                      className="flex-1 px-4 py-3 rounded-xl border border-[#9CC29C]/30 bg-white dark:bg-neutral-800 outline-none focus:border-[#9CC29C] text-sm"
                    />
                    <button 
                      type="button" 
                      onClick={addBookmark} 
                      className="px-4 py-3 bg-[#9CC29C] text-white rounded-xl font-bold flex items-center justify-center hover:bg-[#8bb48b] active:scale-95 transition-all shadow-sm"
                    >
                      <span className="material-symbols-rounded text-[18px]">bookmark_add</span>
                    </button>
                  </div>
                  {bookmarks.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[#9CC29C]/20">
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
