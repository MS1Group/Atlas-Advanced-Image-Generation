import React, { useRef } from "react";
import { Upload, X, UserSearch, ImagePlus } from "lucide-react";

interface MultiImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  label: string;
  icon?: React.ReactNode;
}

export function MultiImageUpload({ images, onChange, maxImages = 3, label, icon }: MultiImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const currentCount = images.length;
    const allowedNewCount = maxImages - currentCount;
    if (allowedNewCount <= 0) return;

    const filesArray: File[] = Array.from(files);
    const filesToRead = filesArray.slice(0, allowedNewCount);
    
    let readCount = 0;
    const newImages: string[] = [];

    filesToRead.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          newImages.push(ev.target.result as string);
        }
        readCount++;
        if (readCount === filesToRead.length) {
          onChange([...images, ...newImages]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    const next = [...images];
    next.splice(index, 1);
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-[9px] uppercase tracking-widest text-zinc-500 font-semibold">
        <div className="flex items-center gap-1">
          {icon}
          <span>{label}</span>
        </div>
        <span>{images.length} / {maxImages}</span>
      </div>
      
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
           {images.map((img, idx) => (
             <div key={idx} className="relative aspect-square rounded-md overflow-hidden bg-zinc-900 border border-zinc-800 group">
               <img src={img} className="w-full h-full object-cover" alt="upload snippet" />
               <button 
                 onClick={() => removeImage(idx)}
                 className="absolute top-1 right-1 bg-black/60 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
               >
                 <X className="w-3 h-3" />
               </button>
             </div>
           ))}
        </div>
      )}

      {images.length < maxImages && (
        <div 
           className="border border-dashed border-zinc-700 bg-zinc-900/50 rounded-lg p-4 flex flex-col items-center justify-center text-zinc-500 cursor-pointer hover:border-[#EFFF00] hover:text-[#EFFF00] transition-colors relative"
           onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-4 h-4 mb-2 relative z-10" />
          <span className="text-center text-[9px] uppercase font-semibold relative z-10">Upload Image(s)</span>
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            accept="image/*" 
            multiple 
            onChange={handleFileChange} 
          />
        </div>
      )}
    </div>
  );
}
