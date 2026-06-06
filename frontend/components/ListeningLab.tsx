"use client";
import { useState, useEffect } from 'react';

export default function ListeningLab() {
  const [test, setTest] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [score, setScore] = useState<{correct: number, total: number} | null>(null);
  
  const [activeTab, setActiveTab] = useState<"youtube" | "manual" | "community">("youtube");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [manualText, setManualText] = useState("");
  const [showInput, setShowInput] = useState(false);

  // Fetch from Community when community tab is selected
  const [communityPosts, setCommunityPosts] = useState<any[]>([]);

  useEffect(() => {
    if (activeTab === "community" && communityPosts.length === 0) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/community/feed`)
        .then(res => res.json())
        .then(data => {
          if (data.writings) setCommunityPosts(data.writings);
        })
        .catch(console.error);
    }
  }, [activeTab]);

  const resetState = () => {
    setLoading(true);
    setScore(null);
    setAnswers({});
  };

  const generateFromYoutube = async () => {
    if (!youtubeUrl.trim()) return;
    resetState();
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/listening/youtube`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: youtubeUrl })
      });
      const data = await res.json();
      if (data.error) {
        alert("Lỗi: " + data.error);
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/listening/generate-from-text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToUse })
      });
      const data = await res.json();
      if (data.error) {
        alert("Lỗi: " + data.error);
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

  const submitTest = () => {
    if (!test || !test.questions) return;
    let correct = 0;
    test.questions.forEach((q: any) => {
      // Both correctAnswer (from youtube) or answer (from text)
      const expected = q.correctAnswer || q.answer;
      if (answers[q.id]?.toLowerCase().trim() === expected?.toLowerCase().trim()) {
        correct++;
      }
    });
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
            <h3 className="font-display text-2xl font-bold">Listening Lab</h3>
            <p className="text-sm opacity-60">AI-Generated IELTS Listening Practice</p>
          </div>
        </div>
        {!test && !showInput ? (
          <button 
            onClick={() => setShowInput(true)} 
            className="text-sm font-bold bg-primary text-white px-8 py-3 rounded-full shadow-lg hover:scale-105 transition-all"
          >
            Create New Test
          </button>
        ) : test && !score ? (
          <button 
            onClick={submitTest}
            className="text-sm font-bold bg-accent text-white px-8 py-3 rounded-full shadow-lg hover:scale-105 transition-all"
          >
            Submit Answers
          </button>
        ) : test && score ? (
          <button 
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
            <button 
              onClick={() => setActiveTab("youtube")}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'youtube' ? 'bg-primary text-white shadow' : 'bg-white text-primary border border-primary/20'}`}
            >
               YouTube Video
            </button>
            <button 
              onClick={() => setActiveTab("manual")}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'manual' ? 'bg-primary text-white shadow' : 'bg-white text-primary border border-primary/20'}`}
            >
               Nhập thủ công
            </button>
            <button 
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
              <button 
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
              <h4 className="font-bold mb-4">Dán đoạn hội thoại/đoạn văn tiếng Anh để AI tạo Audio:</h4>
              <textarea 
                value={manualText}
                onChange={e => setManualText(e.target.value)}
                className="w-full h-32 p-4 rounded-xl border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 outline-none focus:ring-2 focus:ring-primary mb-4"
                placeholder="Ex: Good morning, welcome to our hotel. How can I help you?..."
              />
              <button 
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
              <h4 className="font-bold mb-4">Chọn 1 bài viết hay từ cộng đồng để luyện nghe:</h4>
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
                 ></iframe>
              </div>
            ) : (
              <div className="w-full max-w-md bg-white dark:bg-neutral-900 p-6 rounded-3xl shadow-lg border border-primary/20 flex flex-col items-center gap-6 my-auto">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
                  <span className="material-symbols-rounded text-4xl text-primary">volume_up</span>
                </div>
                <audio controls className="w-full" src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${test.audio_url}`}>
                  Your browser does not support the audio element.
                </audio>
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
                  <p className="font-semibold mb-3"><span className="text-primary mr-2">{q.id}.</span>{q.question || q.text}</p>
                  
                  {q.options && q.options.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {q.options.map((opt: string, i: number) => (
                        <label key={i} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors ${answers[q.id] === opt ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-neutral-700'}`}>
                          <input 
                            type="radio" 
                            name={`q-${q.id}`} 
                            value={opt}
                            checked={answers[q.id] === opt}
                            onChange={(e) => setAnswers({...answers, [q.id]: e.target.value})}
                            className="text-primary focus:ring-primary"
                            disabled={!!score}
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <input 
                      type="text" 
                      placeholder="Type your answer here..."
                      value={answers[q.id] || ''}
                      onChange={(e) => setAnswers({...answers, [q.id]: e.target.value})}
                      className="w-full p-3 rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                      disabled={!!score}
                    />
                  )}

                  {score && (
                    <div className="mt-4 text-sm bg-white dark:bg-neutral-900 p-3 rounded-lg border border-gray-200 dark:border-neutral-700">
                      <div className="font-bold mb-1">
                        {answers[q.id]?.toLowerCase().trim() === (q.correctAnswer || q.answer)?.toLowerCase().trim() ? (
                          <span className="text-green-500 flex items-center gap-1"><span className="material-symbols-rounded text-sm">check_circle</span> Correct</span>
                        ) : (
                          <span className="text-red-500 flex items-center gap-1"><span className="material-symbols-rounded text-sm">cancel</span> Incorrect (Answer: {q.correctAnswer || q.answer})</span>
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
