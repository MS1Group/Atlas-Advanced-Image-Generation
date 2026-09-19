import React, { useRef, useEffect, useState } from 'react';
import { useAppContext } from '../store';
import { X, Eraser, Paintbrush, Undo, Save, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function MaskingTool() {
  const { settings, updateSetting, isMaskingToolOpen, setMaskingToolOpen } = useAppContext();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mode, setMode] = useState<'draw' | 'erase'>('draw');
  const [brushSize, setBrushSize] = useState(30);

  useEffect(() => {
    if (!isMaskingToolOpen || !settings.referenceImage) return;

    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const handleLoad = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        if (settings.maskImage) {
          const mask = new Image();
          mask.src = settings.maskImage;
          mask.onload = () => {
            ctx.drawImage(mask, 0, 0);
          };
        }
      }
    };

    if (img.complete) {
      handleLoad();
    } else {
      img.addEventListener('load', handleLoad);
    }
    return () => img.removeEventListener('load', handleLoad);
  }, [isMaskingToolOpen, settings.referenceImage]);

  if (!isMaskingToolOpen) return null;

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    let clientX, clientY;
    if ('touches' in e) {
      clientX = (e as React.TouchEvent).touches[0].clientX;
      clientY = (e as React.TouchEvent).touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const coords = getCoordinates(e);
    if (!coords) return;
    setIsDrawing(true);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
      // For immediate dot painting
      ctx.lineWidth = brushSize;
      if (mode === 'erase') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = 'rgba(239, 255, 0, 0.7)';
      }
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const coords = getCoordinates(e);
    if (!coords || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.lineWidth = brushSize;
      if (mode === 'erase') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = 'rgba(239, 255, 0, 0.7)';
      }
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.closePath();
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const saveMask = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      // Check if it's completely empty
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const hasContent = imgData.data.some(c => c !== 0);
        if (!hasContent) {
           updateSetting("maskImage", null);
        } else {
           updateSetting("maskImage", canvas.toDataURL('image/png'));
        }
      }
    }
    setMaskingToolOpen(false);
  };

  return (
    <AnimatePresence>
      {isMaskingToolOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-[#050505]/95 flex flex-col items-center justify-center p-4 backdrop-blur-sm"
        >
          {/* Header Toolbar */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between bg-zinc-900 border border-zinc-800 p-2 rounded-xl shadow-2xl">
             <div className="flex items-center gap-4">
                <div className="flex bg-black rounded-lg p-1 border border-zinc-800">
                   <button 
                     onClick={() => setMode('draw')}
                     className={`p-2 rounded-md transition-colors ${mode === 'draw' ? 'bg-[#EFFF00] text-black' : 'text-zinc-500 hover:text-white'}`}
                   >
                      <Paintbrush className="w-4 h-4" />
                   </button>
                   <button 
                     onClick={() => setMode('erase')}
                     className={`p-2 rounded-md transition-colors ${mode === 'erase' ? 'bg-red-500 text-white' : 'text-zinc-500 hover:text-white'}`}
                   >
                      <Eraser className="w-4 h-4" />
                   </button>
                </div>
                
                <div className="flex items-center gap-2 pl-4 border-l border-zinc-800">
                   <span className="text-xs text-zinc-500 uppercase tracking-widest font-semibold flex items-center gap-2">Size <span className="text-[#EFFF00] font-mono">{brushSize}</span></span>
                   <input 
                     type="range" min="5" max="150" value={brushSize} 
                     onChange={(e) => setBrushSize(parseInt(e.target.value))}
                     className="w-32 accent-[#EFFF00]" 
                   />
                </div>

                <div className="border-l border-zinc-800 pl-4">
                  <button onClick={clearCanvas} className="text-xs text-zinc-400 hover:text-red-500 uppercase tracking-widest font-bold transition-colors">Clear All</button>
                </div>
             </div>

             <div className="flex items-center gap-2">
                <button 
                  onClick={() => setMaskingToolOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold uppercase tracking-widest rounded-lg transition-colors border border-transparent"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveMask}
                  className="px-4 py-2 bg-[#EFFF00] hover:bg-[#d8e600] text-black text-xs font-bold uppercase tracking-widest rounded-lg transition-colors border border-transparent flex items-center gap-2"
                >
                  <Check className="w-4 h-4" /> Save Mask
                </button>
             </div>
          </div>

          <div className="relative inline-block max-w-full max-h-[80vh] bg-black/50 border border-zinc-800 rounded-lg overflow-hidden shadow-2xl select-none" style={{ touchAction: 'none' }}>
            <img 
              ref={imgRef} 
              src={settings.referenceImage!} 
              alt="Workspace" 
              className="max-w-[90vw] max-h-[80vh] object-contain pointer-events-none" 
              draggable={false} 
            />
            <canvas
              ref={canvasRef}
              className={`absolute inset-0 w-full h-full touch-none ${mode === 'draw' ? 'cursor-crosshair' : 'cursor-cell'}`}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              style={{ touchAction: 'none' }}
            />
          </div>

          <div className="absolute bottom-6 text-zinc-500 text-[10px] uppercase tracking-widest">
             Highlight the areas you want to explicitly modify or restrict.
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
