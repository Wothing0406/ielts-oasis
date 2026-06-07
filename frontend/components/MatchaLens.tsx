"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = '/api';

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

const MatchaLens = ({ onAdd, vocabList = [] }: { onAdd: (word: any) => Promise<any>, vocabList?: any[] }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState<DetectedWord[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [zoom, setZoom] = useState(1);
  const [capabilities, setCapabilities] = useState<any>(null);
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set());
  const [detectError, setDetectError] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<number>(1);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const w = videoRef.current.videoWidth;
      const h = videoRef.current.videoHeight;
      if (w && h) {
        setAspectRatio(w / h);
      }
    }
  };

  const getObjectCoverCoords = (box: number[]) => {
    if (!box || box.length < 4) return { left: 0, top: 0, width: 0, height: 0, centerX: 0, labelTop: 0 };
    const [xmin, ymin, xmax, ymax] = box;
    
    let left = xmin;
    let width = xmax - xmin;
    let top = ymin;
    let height = ymax - ymin;
    
    if (aspectRatio > 1) {
      // Landscape: cropped left/right
      left = xmin * aspectRatio - (aspectRatio - 1) / 2;
      width = (xmax - xmin) * aspectRatio;
    } else if (aspectRatio < 1) {
      // Portrait: cropped top/bottom
      top = ymin / aspectRatio - (1 / aspectRatio - 1) / 2;
      height = (ymax - ymin) / aspectRatio;
    }
    
    const centerX = left + width / 2;
    
    return {
      left: left * 100,
      top: top * 100,
      width: width * 100,
      height: height * 100,
      centerX: centerX * 100,
      labelTop: top * 100
    };
  };

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
    
    // Resize to max 800px to reduce upload size
    const MAX = 800;
    const scale = Math.min(MAX / video.videoWidth, MAX / video.videoHeight, 1);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.7); // compress
    setPreview(dataUrl);
    setAspectRatio(canvas.width / canvas.height);
    stopCamera();
    
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], "snapshot.jpg", { type: "image/jpeg" });
    uploadFile(file, dataUrl);
  };



  const uploadFile = async (file: File, existingPreview?: string) => {
    setIsUploading(true);
    setDetectError(null);

    if (existingPreview) {
      setPreview(existingPreview);
    } else {
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      const img = new Image();
      img.onload = () => {
        if (img.width && img.height) {
          setAspectRatio(img.width / img.height);
        }
      };
      img.src = objectUrl;
    }

    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${API_URL}/vocabulary/detect`, { method: 'POST', body: formData });
      if (!res.ok) {
        const text = await res.text();
        console.error('[MatchaLens] server error:', res.status, text.slice(0, 200));
        setDetectError(`Lỗi server (${res.status}). Thử lại sau!`);
        return;
      }
      const data = await res.json();
      console.log('[MatchaLens] detect response:', data);
      const items = data.items || [];
      console.log('[MatchaLens] detected items count:', items.length, items);
      setResults(items);
      
      if (items.length === 0) {
        setDetectError('AI không phát hiện được vật thể nào. Hãy thử ảnh khác có nhiều vật hơn!');
      }
      // Keep original camera snapshot - don't replace with server URL
      // so bounding box coordinates align correctly with the displayed image
    } catch (err: any) { 
      console.error('[MatchaLens] detect error:', err);
      setDetectError(`Lỗi kết nối: ${err.message}`);
    }
    finally { setIsUploading(false); }
  };

  const handleSave = async (item: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (savedWords.has(item.word)) return;
    
    // Disable instantly
    setSavedWords(prev => {
      const next = new Set(prev);
      next.add(item.word);
      return next;
    });
    
    // Check client side duplicate
    const isDuplicate = vocabList.some(v => v.word.toLowerCase() === item.word.toLowerCase());
    if (isDuplicate) {
      (window as any).showToast(`Từ vựng "${item.word}" đã có sẵn trong kho! 🍵`, "info");
      return;
    }

    const result = await onAdd(item);
    if (result && result.success) {
      // success
    } else {
      if (result && result.status === "duplicate") {
        (window as any).showToast(`Từ vựng "${item.word}" đã có sẵn trong kho! 🍵`, "info");
      } else {
        (window as any).showToast("Có lỗi xảy ra khi lưu từ vựng. 🍵", "error");
        // Re-enable on failure
        setSavedWords(prev => {
          const next = new Set(prev);
          next.delete(item.word);
          return next;
        });
      }
    }
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
            onLoadedMetadata={handleLoadedMetadata}
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
               const coords = getObjectCoverCoords(item.box);
               const { left, top, width, height, centerX, labelTop } = coords;

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
                     {(() => {
                       const isSaved = savedWords.has(item.word) || vocabList.some((v: any) => v.word.toLowerCase() === item.word.toLowerCase());
                       return (
                         <div className="bg-white/95 backdrop-blur-sm px-2.5 py-1.5 rounded-xl shadow-lg border-2 border-primary flex flex-col items-center min-w-[80px]">
                           <span className="text-[11px] font-black text-primary uppercase leading-none mb-0.5">{item.word}</span>
                           <span className="text-[9px] text-accent/60 italic leading-none mb-0.5">{item.phonetic}</span>
                           <span className="text-[9px] text-accent font-bold leading-none mb-1">{item.meaning}</span>
                           <button
                             type="button"
                             onClick={(e) => handleSave(item, e)}
                             disabled={isSaved}
                             className={`w-full px-2 py-0.5 rounded-md text-[9px] font-bold flex items-center justify-center gap-0.5 transition-all ${isSaved ? 'bg-green-100 text-green-600' : 'bg-primary text-white hover:bg-primary/80'}`}
                           >
                             <span className="material-symbols-rounded text-[10px]">{isSaved ? 'check_circle' : 'bookmark_add'}</span>
                             {isSaved ? 'Đã lưu' : 'Lưu từ'}
                           </button>
                         </div>
                       );
                     })()}
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

      <div className="grid grid-cols-2 gap-4 w-full mt-auto">
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

      {/* Results panel - always visible after detect */}
      {results.length > 0 && (
        <div className="w-full mt-3">
          <p className="text-[10px] font-black text-accent/40 uppercase tracking-widest mb-2">
            🔍 Phát hiện {results.length} vật thể:
          </p>
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
            {results.map((item, idx) => {
              const isSaved = savedWords.has(item.word) || vocabList.some((v: any) => v.word.toLowerCase() === item.word.toLowerCase());
              return (
                <motion.div
                  key={`result-${item.word}-${idx}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.06 }}
                  className="flex items-center justify-between bg-secondary/40 border border-primary/15 rounded-xl px-3 py-2"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-primary">{item.word}</span>
                    <span className="text-[10px] text-accent/50 italic">{item.phonetic}</span>
                    <span className="text-xs text-accent/80 font-bold">{item.meaning}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleSave(item, e)}
                    disabled={isSaved}
                    className={`ml-2 px-3 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1 flex-shrink-0 transition-all ${isSaved ? 'bg-green-100 text-green-600' : 'bg-primary text-white hover:bg-primary/80'}`}
                  >
                    <span className="material-symbols-rounded text-[12px]">{isSaved ? 'check_circle' : 'bookmark_add'}</span>
                    {isSaved ? 'Đã lưu' : 'Lưu'}
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchaLens;
