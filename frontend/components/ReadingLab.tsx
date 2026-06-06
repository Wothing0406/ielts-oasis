import { useState, useEffect } from 'react';

export default function ReadingLab() {
  const [passage, setPassage] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [score, setScore] = useState<{correct: number, total: number} | null>(null);
  
  const [activeTab, setActiveTab] = useState<"manual" | "community">("manual");
  const [inputText, setInputText] = useState("");
  const [showInput, setShowInput] = useState(false);
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

  const generateReadingTest = async (textToUse: string) => {
    if (!textToUse.trim()) return;
    setLoading(true);
    setScore(null);
    setAnswers({});
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/reading/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToUse })
      });
      const data = await res.json();
      setPassage(data);
      setShowInput(false);
    } catch (err) {
      console.error(err);
      alert("AI generation failed. Please try again later.");
    }
    setLoading(false);
  };

  const submitTest = () => {
    if (!passage || !passage.questions) return;
    let correct = 0;
    passage.questions.forEach((q: any) => {
      if (answers[q.id]?.toLowerCase().trim() === q.answer.toLowerCase().trim()) {
        correct++;
      }
    });
    setScore({ correct, total: passage.questions.length });
  };

  return (
    <div className="p-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center text-primary">
            <span className="material-symbols-rounded">menu_book</span>
          </div>
          <div>
            <h3 className="font-display text-2xl font-bold">Reading Lab</h3>
            <p className="text-sm opacity-60">AI-Generated IELTS Reading Practice</p>
          </div>
        </div>
        {!passage && !showInput ? (
          <button 
            onClick={() => setShowInput(true)} 
            className="text-sm font-bold bg-primary text-white px-8 py-3 rounded-full shadow-lg hover:scale-105 transition-all"
          >
            Create New Test
          </button>
        ) : passage && !score ? (
          <button 
            onClick={submitTest}
            className="text-sm font-bold bg-accent text-white px-8 py-3 rounded-full shadow-lg hover:scale-105 transition-all"
          >
            Submit Answers
          </button>
        ) : passage && score ? (
          <button 
            onClick={() => { setPassage(null); setShowInput(true); }}
            className="text-sm font-bold bg-secondary text-primary border border-primary px-8 py-3 rounded-full shadow hover:scale-105 transition-all"
          >
            Try Another
          </button>
        ) : null}
      </div>

      {showInput && !passage && (
        <div className="mb-8 p-6 bg-secondary/30 rounded-2xl border border-primary/20">
          <div className="flex flex-wrap gap-2 mb-6">
            <button 
              onClick={() => setActiveTab("manual")}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'manual' ? 'bg-primary text-white shadow' : 'bg-white text-primary border border-primary/20'}`}
            >
               Nhập văn bản thủ công
            </button>
            <button 
              onClick={() => setActiveTab("community")}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'community' ? 'bg-primary text-white shadow' : 'bg-white text-primary border border-primary/20'}`}
            >
               Bài viết Cộng đồng
            </button>
          </div>

          {activeTab === "manual" && (
            <div className="animate-fade-in">
              <h4 className="font-bold mb-4">Paste your text here to generate a reading test:</h4>
              <textarea 
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                className="w-full h-40 p-4 rounded-xl border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 outline-none focus:ring-2 focus:ring-primary mb-4"
                placeholder="E.g., A news article, an essay, or any English paragraph..."
              ></textarea>
              <button 
                onClick={() => generateReadingTest(inputText)}
                disabled={loading || !inputText.trim()}
                className="w-full text-sm font-bold bg-primary text-white px-8 py-4 rounded-xl shadow hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <><span className="material-symbols-rounded animate-spin">sync</span> AI is generating questions...</> : "Generate Reading Test"}
              </button>
            </div>
          )}

          {activeTab === "community" && (
            <div className="animate-fade-in">
              <h4 className="font-bold mb-4">Chọn 1 bài viết hay từ cộng đồng để làm bài đọc:</h4>
              {communityPosts.length === 0 ? (
                <p className="text-sm opacity-60">Không tìm thấy bài viết nào hoặc đang tải...</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {communityPosts.map(post => (
                    <div key={post.id} className="p-4 border border-primary/20 rounded-xl bg-white dark:bg-neutral-900 hover:border-primary cursor-pointer transition-all flex flex-col justify-between"
                         onClick={() => generateReadingTest(post.full_content)}>
                      <p className="text-sm line-clamp-3 mb-3">{post.content}</p>
                      <div className="flex items-center justify-between text-xs opacity-70">
                        <span>Bởi: {post.username}</span>
                        <span className="flex items-center gap-1"><span className="material-symbols-rounded text-[14px]">menu_book</span> Luyện đọc bài này</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {loading && <p className="text-center font-bold text-primary animate-pulse">AI is generating questions...</p>}
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

      {passage && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Passage Section */}
          <div className="bg-secondary/40 dark:bg-neutral-800/40 p-6 rounded-2xl border border-primary/10 h-[600px] overflow-y-auto custom-scrollbar text-justify text-lg leading-relaxed whitespace-pre-wrap">
            <h4 className="text-2xl font-bold mb-4 text-center">{passage.title}</h4>
            {passage.content}
          </div>

          {/* Questions Section */}
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-primary/20 h-[600px] overflow-y-auto custom-scrollbar shadow-inner">
            <h4 className="text-xl font-bold mb-4 text-primary border-b border-primary/20 pb-2">Questions 1-{passage.questions?.length || 0}</h4>
            
            <div className="space-y-6">
              {(passage.questions || []).map((q: any) => (
                <div key={q.id} className="p-4 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                  <p className="font-semibold mb-3"><span className="text-primary mr-2">{q.id}.</span>{q.text}</p>
                  
                  {q.type === "multiple_choice" && (
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
                  )}

                  {q.type === "fill_in_the_blank" && (
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
                    <div className="mt-3 text-sm font-bold">
                      {answers[q.id]?.toLowerCase().trim() === q.answer.toLowerCase().trim() ? (
                        <span className="text-green-500">✅ Correct</span>
                      ) : (
                        <span className="text-red-500">❌ Incorrect (Answer: {q.answer})</span>
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
