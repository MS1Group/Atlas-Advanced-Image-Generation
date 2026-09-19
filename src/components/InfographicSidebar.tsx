import React, { useState, useRef } from "react";
import { useAppContext } from "../store";
import { Settings2, Upload, FileText, CheckCircle2, ChevronDown, Info, UploadCloud } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { UploadedFile } from "../types";

function InfoTooltip({ text }: { text: React.ReactNode }) {
  return (
    <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 p-2 bg-zinc-800 text-zinc-200 text-[10px] rounded shadow-xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-[9999] leading-relaxed font-sans normal-case text-center flex flex-col">
      {text}
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-zinc-800"></span>
    </span>
  );
}

function Section({ title, icon, defaultOpen = false, children }: { title: string, icon: React.ReactNode, defaultOpen?: boolean, children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  const [isAnimating, setIsAnimating] = useState(false);

  return (
    <div className="mb-2 relative hover:z-50">
      <button 
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-2 hover:text-white transition-colors relative z-20"
      >
        <div className="flex items-center gap-2 font-semibold text-[10px] uppercase tracking-widest text-zinc-500">
          {icon} <span>{title}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div 
            initial="collapsed"
            animate="open"
            exit="collapsed"
            onAnimationStart={() => setIsAnimating(true)}
            onAnimationComplete={() => setIsAnimating(false)}
            variants={{
              open: { height: "auto", opacity: 1 },
              collapsed: { height: 0, opacity: 0 }
            }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            style={{ overflow: isAnimating ? "hidden" : "visible" }}
            className="relative z-10"
          >
            <div className="pt-2 space-y-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function InfographicSidebar() {
  const { infographicSettings: settings, updateInfographicSetting, setPrompt } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files: File[] = e.target.files ? Array.from(e.target.files) : [];
    if (!files.length) return;

    files.forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        const base64Data = result.split(",")[1]; // remove data:mime/type;base64,
        let mimeType = file.type;
        
        if (file.name.endsWith('.pptx')) {
            // Gemini API currently does not support pptx natively via base64 inlineData.
            // We will alert the user to convert to PDF for now.
            alert(`File ${file.name} is a PowerPoint presentation. Please convert it to a PDF before uploading, as the current AI model does not support raw .pptx files directly.`);
            return;
        }

        if (file.name.endsWith('.txt') && !mimeType) {
            mimeType = 'text/plain';
        }

        const newFile: UploadedFile = {
            name: file.name,
            mimeType: mimeType || 'application/octet-stream',
            data: base64Data
        };

        updateInfographicSetting("files", [...settings.files, newFile]);
      };
      
      reader.readAsDataURL(file);
    });
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    const newFiles = [...settings.files];
    newFiles.splice(index, 1);
    updateInfographicSetting("files", newFiles);
  };

  return (
    <div className="w-[320px] bg-[#0D0D0D] border-r border-zinc-800 flex flex-col shrink-0 font-sans relative z-30">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-emerald-500/10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-emerald-500 rounded flex items-center justify-center">
            <Settings2 className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold tracking-tight text-white uppercase text-xs">INFOGRAPHIC MAKER</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 p-4 pb-32">
        <Section title="Educational Input" icon={<UploadCloud className="w-4 h-4" />} defaultOpen>
            <div className="space-y-4">
               <div 
                 onClick={() => fileInputRef.current?.click()}
                 className="w-full flex-col gap-2 p-4 border-2 border-dashed border-zinc-800 rounded-lg hover:border-emerald-500/50 hover:bg-emerald-500/5 cursor-pointer transition-colors flex items-center justify-center text-center"
               >
                 <UploadCloud className="w-6 h-6 text-emerald-500 opacity-80" />
                 <div className="text-xs text-zinc-300 font-medium">Click to Upload Files</div>
                 <div className="text-[10px] text-zinc-500">.pdf, .txt limits applied</div>
                 <input 
                   ref={fileInputRef} 
                   type="file" 
                   multiple 
                   accept=".pdf,.txt" 
                   onChange={handleFileUpload} 
                   className="hidden" 
                 />
               </div>

               {settings.files.length > 0 && (
                   <div className="space-y-2">
                       {settings.files.map((file, i) => (
                           <div key={i} className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-zinc-300">
                               <div className="flex items-center gap-2 overflow-hidden">
                                   <FileText className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                                   <span className="truncate max-w-[200px]">{file.name}</span>
                               </div>
                               <button onClick={() => removeFile(i)} className="text-zinc-500 hover:text-red-500 px-1">&times;</button>
                           </div>
                       ))}
                   </div>
               )}
            </div>
        </Section>

        <Section title="Style & Layout" icon={<Settings2 className="w-4 h-4" />} defaultOpen>
          <div className="space-y-4">
            <div className="p-2 bg-zinc-900 border border-zinc-800 rounded relative z-10 hover:z-50">
              <div className="flex items-center gap-1 text-[9px] uppercase text-zinc-500 mb-1">
                <span>Style Preset</span>
              </div>
              <select 
                value={settings.stylePreset} 
                onChange={(e) => updateInfographicSetting("stylePreset", e.target.value as any)}
                className="bg-transparent text-xs text-white w-full outline-none focus:text-emerald-500 cursor-pointer"
              >
                {[
                  "Auto-Select",
                  "Sketch Note",
                  "Kawaii",
                  "Professional",
                  "Scientific",
                  "Anime",
                  "Clay",
                  "Editorial",
                  "Instructional",
                  "Bento Grid",
                  "Brick"
                ].map(opt => <option key={opt} value={opt} className="bg-zinc-900 text-white">{opt}</option>)}
              </select>
            </div>

            <div className="p-2 bg-zinc-900 border border-zinc-800 rounded relative z-10 hover:z-50">
              <div className="flex items-center gap-1 text-[9px] uppercase text-zinc-500 mb-1">
                <span>Aspect Ratio</span>
              </div>
              <select 
                value={settings.aspectRatio} 
                onChange={(e) => updateInfographicSetting("aspectRatio", e.target.value as any)}
                className="bg-transparent text-xs text-white w-full outline-none focus:text-emerald-500 cursor-pointer"
              >
                {["3:4", "4:3", "16:9", "9:16", "1:1"].map(opt => <option key={opt} value={opt} className="bg-zinc-900 text-white">{opt}</option>)}
              </select>
            </div>

            <div className="pt-2 px-1 relative z-10 hover:z-50 border-t border-zinc-800">
               <label className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer group">
                 <input 
                   type="checkbox" 
                   checked={settings.designQualityMode} 
                   onChange={(e) => updateInfographicSetting("designQualityMode", e.target.checked)}
                   className="rounded bg-zinc-900 border-zinc-800 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                 />
                 <span className={settings.designQualityMode ? "text-emerald-500 font-bold" : ""}>Design Quality Mode</span>
                 <Info className="w-3 h-3 text-zinc-500" />
                 <InfoTooltip text="Forces a premium layout with soft shadows, consistent iconography, and visually layered components. Rejects basic boxed layouts." />
               </label>
            </div>
          </div>
        </Section>

        <Section title="Content Controls" icon={<CheckCircle2 className="w-4 h-4" />}>
           <div className="space-y-4">
             <div className="p-2 bg-zinc-900 border border-zinc-800 rounded">
               <div className="text-[9px] uppercase text-zinc-500 mb-1">Density</div>
               <div className="flex justify-between gap-1 text-xs">
                   {["Low", "Medium", "High"].map(level => (
                       <button
                           key={level}
                           onClick={() => updateInfographicSetting("contentDensity", level as any)}
                           className={`flex-1 py-1 rounded text-center transition-colors ${settings.contentDensity === level ? "bg-emerald-500/20 text-emerald-500 font-bold" : "text-zinc-400 hover:bg-zinc-800"}`}
                       >{level}</button>
                   ))}
               </div>
             </div>

             <div className="p-2 bg-zinc-900 border border-zinc-800 rounded">
               <div className="text-[9px] uppercase text-zinc-500 mb-1">Visual Ratio</div>
               <div className="flex justify-between gap-1 text-[10px]">
                   {["Text-heavy", "Balanced", "Visual-heavy"].map(level => (
                       <button
                           key={level}
                           onClick={() => updateInfographicSetting("visualRatio", level as any)}
                           className={`flex-1 py-1.5 px-0.5 rounded text-center transition-colors ${settings.visualRatio === level ? "bg-emerald-500/20 text-emerald-500 font-bold" : "text-zinc-500 hover:bg-zinc-800"}`}
                       >{level}</button>
                   ))}
               </div>
             </div>

             <div className="p-2 bg-zinc-900 border border-zinc-800 rounded">
               <div className="text-[9px] uppercase text-zinc-500 mb-1">Audience</div>
               <div className="flex flex-col gap-1 text-xs">
                   {["Beginner", "Intermediate", "Exam-ready"].map(level => (
                       <button
                           key={level}
                           onClick={() => updateInfographicSetting("audienceLevel", level as any)}
                           className={`w-full py-1.5 px-2 text-left rounded transition-colors ${settings.audienceLevel === level ? "bg-emerald-500/20 text-emerald-500 font-bold border border-emerald-500/30" : "text-zinc-400 border border-transparent hover:border-zinc-700"}`}
                       >{level}</button>
                   ))}
               </div>
             </div>
           </div>
        </Section>

        <div className="pt-4 px-2 relative z-10 hover:z-50 border-t border-zinc-800">
           <label className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer">
             <input 
               type="checkbox" 
               checked={settings.explainThenVisualize} 
               onChange={(e) => updateInfographicSetting("explainThenVisualize", e.target.checked)}
               className="rounded bg-zinc-900 border-zinc-800 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
             />
             <span className={settings.explainThenVisualize ? "text-emerald-500 font-bold" : ""}>"Explain then Visualize" Engine</span>
           </label>
           <p className="text-[9px] text-zinc-500 ml-6 mt-1">First rewrite inputs for high-clarity before mapping structure to the image model. Enhances quality, increases wait time.</p>
        </div>

      </div>
    </div>
  );
}
