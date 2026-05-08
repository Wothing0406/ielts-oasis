"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = '/api';

interface DetectedWord {
  word: string;
  meaning: string;
  phonetic: string;
  box?: number[]; // [x1, y1, x2, y2] in percentages
}

const MatchaLens = ({ onAdd }: { onAdd: (word: any) => void }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState<DetectedWord[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [zoom, setZoom] = useState(1);
  const [capabilities, setCapabilities] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async (mode: 'user' | 'environment' = facingMode) => {
    setIsCameraOpen(true);
    setPreview(null);
    setResults([]);
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: mode, 
          width: { ideal: 1280 }, 
          height: { ideal: 1280 } 
        } 
      });
      
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;

      const track = stream.getVideoTracks()[0];
      const caps = track.getCapabilities() as any;
      setCapabilities(caps);
      
      if (caps.zoom) {
        setZoom(caps.zoom.min || 1);
      }
    } catch (err) {
      console.error("Camera error:", err);
      setIsCameraOpen(false);
    }
  };

  const handleZoom = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setZoom(val);
    const track = streamRef.current?.getVideoTracks()[0];
    if (track && capabilities?.zoom) {
      track.applyConstraints({ advanced: [{ zoom: val }] as any });
    }
  };

  const switchCamera = () => {
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);
    if (isCameraOpen) startCamera(newMode);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsCameraOpen(false);
  };

  const takeSnapshot = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setPreview(dataUrl);
    stopCamera();
    
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], "snapshot.jpg", { type: "image/jpeg" });
    uploadFile(file);
  };

  const playAudio = async (word: string) => {
    try {
      const res = await fetch(`${API_URL}/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word }),
      });
      const data = await res.json();
      if (data.audio_url) {
        const audio = new Audio(data.audio_url);
        audio.play();
      }
    } catch (err) { console.error("TTS error:", err); }
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${API_URL}/vocabulary/detect`, { method: 'POST', body: formData });
      const data = await res.json();
      const items = data.items || [];
      setResults(items);
      
      if (data.image_url) {
        setPreview(`${API_URL}${data.image_url}`);
      }

      // Auto-pronounce removed as per user request
      // if (items.length > 0) {
      //   playAudio(items[0].word);
      // }
    } catch (err) { console.error(err); }
    finally { setIsUploading(false); }
  };

  return (
    <section className="xl:col-span-4 matcha-card p-4 bento-card flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-4">
        <h3 className="font-display text-lg font-bold flex items-center gap-2">
          <span className="material-symbols-rounded text-primary">filter_center_focus</span> Matcha Lens
        </h3>
        <div className="flex gap-2">
           {isCameraOpen && capabilities?.zoom && (
             <div className="flex items-center gap-2 bg-secondary/50 px-3 py-1 rounded-full border border-primary/10">
                <span className="material-symbols-rounded text-sm">zoom_in</span>
                <input 
                  type="range" 
                  min={capabilities.zoom.min} 
                  max={capabilities.zoom.max} 
                  step="0.1" 
                  value={zoom} 
                  onChange={handleZoom}
                  className="w-20 h-1 accent-primary"
                />
                <span className="text-[10px] font-bold w-6">{zoom.toFixed(1)}x</span>
             </div>
           )}
           {isCameraOpen && (
             <button 
               onClick={switchCamera}
               className="p-2 bg-secondary rounded-full text-accent hover:bg-primary/20 transition-all shadow-sm"
             >
               <span className="material-symbols-rounded">flip_camera_ios</span>
             </button>
           )}
        </div>
      </div>
      
      <div className="relative w-full aspect-square rounded-3xl overflow-hidden border-4 border-primary/10 mb-6 shadow-inner bg-secondary/30">
        {isCameraOpen ? (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover" 
          />
        ) : preview ? (
          <div className="relative w-full h-full bg-black flex items-center justify-center">
             <img src={preview} className="w-full h-full object-contain" alt="Preview" />
                          <AnimatePresence>
                {results.map((item, idx) => {
                  if (!item.box) return null;
                  // Standard mapping: box is [x1, y1, x2, y2]
                  const left = item.box[0] * 100;
                  const top = item.box[1] * 100;
                  
                  return (
                    <motion.div 
                      key={`${item.word}-${idx}`}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute z-[999] cursor-pointer"
                      style={{ 
                        left: `${left}%`, 
                        top: `${top}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                      onClick={() => onAdd(item)}
                    >
                      <div className="bg-white p-2 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.3)] border-2 border-primary flex flex-col items-center min-w-[80px] hover:scale-110 transition-transform">
                         <span className="text-[10px] font-black text-primary uppercase leading-none mb-1">{item.word}</span>
                         <span className="text-[9px] text-accent font-bold leading-none mb-1">{item.meaning}</span>
                         <span className="text-[8px] text-accent/50 italic leading-none font-medium">{item.phonetic}</span>
                         <div className="w-4 h-1 bg-primary/20 rounded-full mt-1"></div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {results.length === 0 && !isUploading && (
                <div className="absolute bottom-4 bg-black/50 text-white text-[10px] px-4 py-1 rounded-full backdrop-blur-sm">
                  Chưa phát hiện được vật thể. Hãy thử góc khác!
                </div>
              )}
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-accent/20 cursor-pointer" onClick={() => startCamera()}>
             <span className="material-symbols-rounded text-6xl mb-2">add_a_photo</span>
             <p className="text-xs font-bold uppercase tracking-widest">Chạm để mở Camera</p>
          </div>
        )}

        {isUploading && (
           <div className="absolute inset-0 bg-primary/60 backdrop-blur-md flex flex-col items-center justify-center z-[60]">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-white/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="material-symbols-rounded absolute inset-0 flex items-center justify-center text-white text-2xl">search_insights</span>
              </div>
              <span className="text-white text-[10px] font-black uppercase tracking-[0.3em] mt-4">AI ANALYZING</span>
           </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 w-full">
        <button 
          onClick={() => isCameraOpen ? takeSnapshot() : startCamera()}
          className="bg-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 text-sm hover:scale-[1.02] shadow-lg shadow-primary/20 transition-all active:scale-95"
        >
          <span className="material-symbols-rounded text-lg">{isCameraOpen ? 'photo_camera' : 'videocam'}</span> 
          {isCameraOpen ? 'Chụp ảnh' : 'Mở Camera'}
        </button>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="bg-white text-accent py-4 rounded-2xl font-bold flex items-center justify-center gap-2 text-sm border-2 border-primary/20 hover:bg-primary/5 transition-all"
        >
          <span className="material-symbols-rounded text-lg">image</span> Thư viện
        </button>
        <input type="file" ref={fileInputRef} onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0])} className="hidden" />
      </div>

      <canvas ref={canvasRef} className="hidden" />
      
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </section>
  );
};

export default MatchaLens;
