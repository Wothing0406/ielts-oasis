"use client";

import React from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const Library = ({ vocabList, onAdd, onDelete }: { vocabList: any[], onAdd: (word: string) => void, onDelete: (id: number) => void }) => {
  const [newBrew, setNewBrew] = React.useState('');
  const [isBrewing, setIsBrewing] = React.useState(false);
  const playAudio = async (word: string) => {
    try {
      const res = await fetch(`${API_URL}/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word }),
      });
      const data = await res.json();
      if (data.audio_url) {
        const audio = new Audio(`${API_URL}${data.audio_url}`);
        audio.play();
      }
    } catch (err) { console.error("TTS error:", err); }
  };

  return (
    <section className="xl:col-span-5 matcha-card p-8 bento-card">
      <div className="flex items-center justify-between mb-8">
        <h3 className="font-display text-xl font-bold flex items-center gap-2">
          <span className="material-symbols-rounded text-primary">dictionary</span> My Library
        </h3>
        <button className="text-xs font-bold text-primary bg-primary/10 px-4 py-2 rounded-full hover:bg-primary/20 transition-all">
          Browse All
        </button>
      </div>
      
      <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
        {vocabList.length > 0 ? vocabList.slice(0, 5).map((item, i) => (
          <div key={i} className="p-4 bg-secondary dark:bg-neutral-800 rounded-medium flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => playAudio(item.word)}
                className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
              >
                <span className="material-symbols-rounded text-lg">volume_up</span>
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm text-accent dark:text-primary">{item.word}</p>
                  <span className="text-[10px] text-accent/40 italic">{item.phonetic}</span>
                </div>
                <p className="text-xs opacity-60 text-accent dark:text-secondary">{item.meaning}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="material-symbols-rounded text-primary opacity-0 group-hover:opacity-100 transition-opacity">check_circle</span>
              <button 
                onClick={() => onDelete(item.id)}
                className="w-8 h-8 rounded-full bg-red-100 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
              >
                <span className="material-symbols-rounded text-sm">delete</span>
              </button>
            </div>
          </div>
        )) : (
          <div className="p-4 border-2 border-dashed border-primary/20 rounded-medium flex items-center justify-center text-accent dark:text-secondary opacity-50">
             No words in your library yet.
          </div>
        )}
      </div>
      
      <div className="mt-6 flex flex-col gap-3">
        <input 
          type="text" 
          placeholder="Type a word to brew..." 
          className="px-4 py-3 bg-secondary rounded-full border-none focus:ring-2 focus:ring-primary text-sm"
          value={newBrew}
          onChange={(e) => setNewBrew(e.target.value)}
        />
        <button 
          onClick={() => { if(newBrew) { onAdd(newBrew); setNewBrew(''); } }}
          className="w-full bg-primary text-white py-4 rounded-full font-bold hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <span className="material-symbols-rounded">coffee</span>
          Brew Word
        </button>
      </div>
    </section>
  );
};

export default Library;
