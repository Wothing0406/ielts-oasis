"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Loader2, Plus, StopCircle, CameraIcon, Leaf } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = '/api';

interface DetectedWord {
  word: string;
  meaning: string;
  phonetic: string;
  box?: number[];
  image_url?: string;
}

const MatchaLens = ({ onAdd }: { onAdd: (word: any) => void }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState<DetectedWord[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [modelStatus, setModelStatus] = useState<'loading' | 'ready'>('loading');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const checkModel = async () => {
      try {
        const res = await fetch(`${API_URL}/health/yolo`);
        const data = await res.json();
        if (data.status === 'ready') setModelStatus('ready');
        else setTimeout(checkModel, 3000);
      } catch { setTimeout(checkModel, 3000); }
    };
    checkModel();
  }, []);

  const startCamera = async () => {
    setIsCameraOpen(true);
    setPreview(null);
    setResults([]);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: 1280, height: 720 } 
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error("Camera error:", err);
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
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
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setPreview(dataUrl);
    stopCamera();
    
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], "snapshot.jpg", { type: "image/jpeg" });
    uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${API_URL}/vocabulary/detect`, { method: 'POST', body: formData });
      const data = await res.json();
      setResults(data.items || []);
      if (data.image_url) {
        setPreview(`${API_URL}${data.image_url}`);
      }
    } catch (err) { console.error(err); }
    finally { setIsUploading(false); }
  };

  return (
    <div className="flex flex-col h-full bg-[#FAFAFA] rounded-[3rem] overflow-hidden">
      {/* Header with Bear Mascot */}
      <div className="p-8 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
           <motion.div 
             animate={{ rotate: [0, 5, -5, 0] }}
             transition={{ duration: 4, repeat: Infinity }}
             className="w-16 h-16 bg-white rounded-2xl shadow-md p-2 border-2 border-matcha-primary"
           >
              <img src="/logoweb.png" alt="Bear" className="w-full h-full object-contain" />
           </motion.div>
           <div>
              <h2 className="text-2xl font-black text-latte-brown leading-tight">Matcha Lens:</h2>
              <p className="text-sm font-bold text-matcha-primary uppercase tracking-widest">Scan Your World</p>
           </div>
        </div>
        <div className="flex gap-3">
           <button onClick={() => fileInputRef.current?.click()} className="p-4 bg-white rounded-2xl shadow-sm text-matcha-primary hover:bg-matcha-soft transition-all border-2 border-matcha-primary/10">
              <Upload />
           </button>
           <input type="file" ref={fileInputRef} onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0])} className="hidden" />
        </div>
      </div>

      <div className="relative flex-1 m-8 mt-2 rounded-[2.5rem] overflow-hidden border-8 border-white shadow-2xl bg-matcha-soft/20 min-h-[300px]">
        {modelStatus === 'loading' && (
           <div className="absolute inset-0 bg-white/90 backdrop-blur-md z-50 flex flex-col items-center justify-center text-matcha-primary">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="mb-4">
                 <img src="/logoweb.png" className="w-16 h-16 opacity-50" alt="loading" />
              </motion.div>
              <span className="text-xs font-black uppercase tracking-widest">Matcha AI is waking up...</span>
           </div>
        )}

        {isCameraOpen ? (
          <>
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <div className="absolute inset-0 border-[20px] border-white/20 pointer-events-none" />
            <button 
              onClick={takeSnapshot} 
              className="absolute bottom-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-white rounded-full border-8 border-matcha-primary shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center group"
            >
               <Leaf className="text-matcha-primary w-8 h-8 group-hover:rotate-45 transition-transform" />
            </button>
          </>
        ) : preview ? (
          <div className="relative w-full h-full group">
             <img src={preview} className="w-full h-full object-cover" alt="Preview" />
             
             {/* Sticker Overlays */}
             <div className="absolute inset-0">
                {results.map((item, idx) => item.box && (
                  <motion.div 
                    key={idx}
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: Math.random() * 10 - 5 }}
                    whileHover={{ scale: 1.2, zIndex: 100 }}
                    className="yolo-sticker"
                    style={{ left: `${item.box[0] * 100}%`, top: `${item.box[1] * 100}%` }}
                    onClick={() => onAdd(item)}
                  >
                     <div className="flex flex-col items-center">
                        <span className="text-[10px] opacity-80 mb-0.5">{item.word.toUpperCase()}</span>
                        <div className="h-px w-full bg-white/30 my-1" />
                        <span className="text-xs font-black">{item.meaning}</span>
                     </div>
                  </motion.div>
                ))}
             </div>

             <button onClick={() => setIsCameraOpen(true)} className="absolute top-6 left-6 bg-white/90 px-6 py-3 rounded-2xl font-black text-xs uppercase text-matcha-primary shadow-xl opacity-0 group-hover:opacity-100 transition-opacity">
                Retake Photo
             </button>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-white cursor-pointer group" onClick={() => setIsCameraOpen(true)}>
             <motion.div 
               animate={{ y: [0, -10, 0] }}
               transition={{ duration: 3, repeat: Infinity }}
               className="mb-6"
             >
                <img src="/logoweb.png" className="w-32 h-32" alt="Mascot" />
             </motion.div>
             <button className="matcha-btn">Open Lens 🍵</button>
             <p className="mt-4 text-[10px] font-black text-matcha-primary/40 uppercase tracking-[0.3em]">Local YOLO Object Detection</p>
          </div>
        )}

        {isUploading && (
           <div className="absolute inset-0 bg-matcha-primary/30 backdrop-blur-sm flex flex-col items-center justify-center z-[60]">
              <div className="w-24 h-24 bg-white rounded-3xl p-4 shadow-2xl animate-bounce">
                 <img src="/logoweb.png" alt="Analyzing" />
              </div>
              <span className="mt-6 text-white font-black uppercase tracking-widest animate-pulse">Analyzing...</span>
           </div>
        )}
      </div>

      <div className="px-8 pb-8 flex gap-4">
         <button onClick={() => setIsCameraOpen(true)} className="flex-1 bg-white border-4 border-matcha-primary text-matcha-primary font-black py-4 rounded-3xl shadow-lg hover:bg-matcha-soft transition-all">
            OPEN LENS
         </button>
         <button className="flex-1 bg-white border-4 border-latte-brown text-latte-brown font-black py-4 rounded-3xl shadow-lg hover:bg-cream-yellow transition-all">
            VIEW STORIES
         </button>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default MatchaLens;
