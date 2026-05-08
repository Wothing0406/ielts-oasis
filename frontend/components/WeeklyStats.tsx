"use client";

import React from 'react';

const WeeklyStats = () => {
  return (
    <section className="xl:col-span-7 matcha-card p-8 bento-card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display text-xl font-bold flex items-center gap-2">
          <span className="material-symbols-rounded text-primary">quiz</span> Weekly Stats
        </h3>
        <div className="flex items-center gap-2 px-4 py-2 bg-secondary dark:bg-neutral-800 rounded-full text-sm font-bold text-accent dark:text-primary">
          <span className="material-symbols-rounded text-yellow-500 scale-75">bolt</span> Streak: 5 Days
        </div>
      </div>
      
      <div className="relative h-64 bg-secondary/50 dark:bg-neutral-800/50 rounded-medium border-2 border-dashed border-primary/20 flex flex-col items-center justify-center text-center p-8">
        <div className="mb-6">
          <span className="material-symbols-rounded text-5xl text-primary mb-2">auto_stories</span>
          <h4 className="font-bold text-lg text-accent dark:text-primary">Keep the momentum!</h4>
          <p className="text-sm opacity-70 text-accent dark:text-secondary">You've mastered 12 new words this week.</p>
        </div>
        
        <button className="bg-primary text-white px-12 py-4 rounded-full font-bold shadow-lg shadow-primary/20 hover:scale-105 hover:shadow-xl transition-all flex items-center gap-2 group">
          Review History 
          <span className="material-symbols-rounded group-hover:translate-x-1 transition-transform">trending_flat</span>
        </button>
      </div>
    </section>
  );
};

export default WeeklyStats;
