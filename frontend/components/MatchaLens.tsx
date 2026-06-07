"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = '/api';
// For file uploads we call backend directly via /api proxy route
// but use a dedicated path that bypasses Next.js body limit issues
const BACKEND_URL = '/api';

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
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set());
  const [detectError, setDetectError] = useState<string | null>(null);

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



  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setDetectError(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      // Call backend directly to avoid Next.js proxy 503 on large file uploads
      const res = await fetch(`${BACKEND_URL}/vocabulary/detect`, { method: 'POST', body: formData });
      const data = await res.json();
      console.log('[MatchaLens] detect response:', data);
      const items = data.items || [];
      console.log('[MatchaLens] detected items count:', items.length);
      setResults(items);
      
      if (items.length === 0) {
        setDetectError('AI không phát hiện được vật thể nào. Hãy thử ảnh khác có nhiều vật hơn!');
      }
      
      if (data.image_url) {
        setPreview(`${BACKEND_URL}${data.image_url}`);
      }
    } catch (err: any) { 
      console.error('[MatchaLens] detect error:', err);
      setDetectError(`Lỗi kết nối: ${err.message}`);
    }
    finally { setIsUploading(false); }
  };

  const handleSave = (item: any, e: React.MouseEvent) => {
    e.stopPropagation();
    onAdd(item);
    setSavedWords(new Set(savedWords).add(item.word));
  };

  return (
    <div className="w-full h-full p-4 flex flex-col items-center">
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
             <button type="button" 
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
          <div className="relative w-full h-full bg-black overflow-hidden">
             <img 
               src={preview} 
               className="w-full h-full object-cover" 
               alt="Preview" 
             />
             {results.map((item, idx) => {
               if (!item.box || item.box.length < 4) return null;
               const [xmin, ymin, xmax, ymax] = item.box;
               const left   = xmin * 100;
               const top    = ymin * 100;
               const width  = (xmax - xmin) * 100;
               const height = (ymax - ymin) * 100;
               const centerX = ((xmin + xmax) / 2) * 100;
               const labelTop = ymin * 100;

               return (
                 <React.Fragment key={`${item.word}-${idx}`}>
                   {/* Bounding box */}
                   <div
                     className="absolute border-2 border-primary rounded-lg pointer-events-none"
                     style={{
                       left: `${left}%`,
                       top: `${top}%`,
                       width: `${width}%`,
                       height: `${height}%`,
                       boxShadow: '0 0 0 1px rgba(0,0,0,0.3)'
                     }}
                   />
                   {/* Vocab card at top of bounding box */}
                   <motion.div
                     initial={{ scale: 0, opacity: 0 }}
                     animate={{ scale: 1, opacity: 1 }}
                     transition={{ delay: idx * 0.08 }}
                     className="absolute z-[999]"
                     style={{
                       left: `${centerX}%`,
                       top: `${Math.max(labelTop - 1, 0)}%`,
                       transform: 'translate(-50%, -100%)',
                     }}
                   >
                     <div className="bg-white/95 backdrop-blur-sm px-2.5 py-1.5 rounded-xl shadow-lg border-2 border-primary flex flex-col items-center min-w-[80px]">
                       <span className="text-[11px] font-black text-primary uppercase leading-none mb-0.5">{item.word}</span>
                       <span className="text-[9px] text-accent/60 italic leading-none mb-0.5">{item.phonetic}</span>
                       <span className="text-[9px] text-accent font-bold leading-none mb-1">{item.meaning}</span>
                       <button
                         type="button"
                         onClick={(e) => handleSave(item, e)}
                         disabled={savedWords.has(item.word)}
                         className={`w-full px-2 py-0.5 rounded-md text-[9px] font-bold flex items-center justify-center gap-0.5 transition-all ${savedWords.has(item.word) ? 'bg-green-100 text-green-600' : 'bg-primary text-white hover:bg-primary/80'}`}
                       >
                         <span className="material-symbols-rounded text-[10px]">{savedWords.has(item.word) ? 'check_circle' : 'bookmark_add'}</span>
                         {savedWords.has(item.word) ? 'Đã lưu' : 'Lưu từ'}
                       </button>
                     </div>
                     {/* Arrow pointing down to object */}
                     <div className="w-2 h-2 bg-primary rotate-45 mx-auto -mt-1 rounded-sm" />
                   </motion.div>
                 </React.Fragment>
               );
             })}
             {detectError && (
               <div className="absolute bottom-4 left-2 right-2 bg-red-500/80 text-white text-[10px] px-4 py-2 rounded-full text-center backdrop-blur-sm">
                 {detectError}
               </div>
             )}
             {results.length === 0 && !isUploading && !detectError && (
               <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-[10px] px-4 py-1 rounded-full backdrop-blur-sm whitespace-nowrap">
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
        <button type="button" 
          onClick={() => isCameraOpen ? takeSnapshot() : startCamera()}
          className="bg-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 text-sm hover:scale-[1.02] shadow-lg shadow-primary/20 transition-all active:scale-95"
        >
          <span className="material-symbols-rounded text-lg">{isCameraOpen ? 'photo_camera' : 'videocam'}</span> 
          {isCameraOpen ? 'Chụp ảnh' : 'Mở Camera'}
        </button>
        <button type="button" 
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
    </div>
  );
};

export default MatchaLens;
