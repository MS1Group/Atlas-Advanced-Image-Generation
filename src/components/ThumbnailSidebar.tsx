import React, { useState } from "react";
import { useAppContext } from "../store";
import { Zap, Flame, BrainCircuit, Type, Layout, Focus, ChevronDown, CheckSquare, Square, Info, UserSearch, ImagePlus, UserCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { MultiImageUpload } from "./MultiImageUpload";

function InfoTooltip({ text }: { text: React.ReactNode }) {
  return (
    <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 p-2 bg-zinc-800 text-zinc-200 text-[10px] rounded shadow-xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-[9999] leading-relaxed font-sans normal-case text-center flex flex-col">
      {text}
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-zinc-800"></span>
    </span>
  );
}

export function ThumbnailSidebar() {
  const { thumbnailSettings, updateThumbnailSetting } = useAppContext();

  return (
    <div className="w-[320px] bg-[#0D0D0D] border-r border-zinc-800 flex flex-col shrink-0 font-sans relative z-30">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-[#EFFF00]/10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-red-500 rounded flex items-center justify-center">
            <Flame className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold tracking-tight text-white uppercase text-xs">VIRAL ENGINE <span className="text-[10px] text-red-500 font-mono">PRO</span></span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 p-4 pb-32">
        <Section title="Stop Power" icon={<Zap className="w-4 h-4" />} defaultOpen>
          <div className="space-y-4">
            <div className="space-y-2 relative z-10 hover:z-50">
              <div className="flex justify-between text-xs text-zinc-300 items-center w-full">
                <div className="flex items-center gap-1">
                  <label>Scroll Stop Power</label>
                  <div className="relative group/tooltip flex items-center justify-center cursor-help p-1 z-50">
                    <Info className="w-3 h-3 text-zinc-500 hover:text-white transition-colors" />
                    <InfoTooltip text="Limits the aesthetic to pure high-contrast saturation. Higher values enforce aggressive color grading and sharp subject lighting to grab attention instantly." />
                  </div>
                </div>
                <span className="text-red-500 font-mono font-bold">{thumbnailSettings.scrollStopPower}/10</span>
              </div>
              <input 
                type="range" min={1} max={10} step={1} 
                value={thumbnailSettings.scrollStopPower} 
                onChange={(e) => updateThumbnailSetting("scrollStopPower", parseFloat(e.target.value))}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
            </div>

            <div className="p-2 bg-zinc-900 border border-zinc-800 rounded relative z-10 hover:z-50">
              <div className="flex items-center gap-1 text-[9px] uppercase text-zinc-500 mb-1">
                <span>Style Preset</span>
                <div className="relative group/tooltip flex items-center justify-center cursor-help p-1 z-50">
                  <Info className="w-3 h-3 text-zinc-500 hover:text-white transition-colors" />
                  <InfoTooltip text="Strictly enforces overall visual theme. 'Hyper Viral' applies MrBeast-esque saturation, while 'Tech' focuses on neon accents and darker tones." />
                </div>
              </div>
              <select 
                value={thumbnailSettings.stylePreset} 
                onChange={(e) => updateThumbnailSetting("stylePreset", e.target.value as any)}
                className="bg-transparent text-xs text-white w-full outline-none focus:text-red-500 cursor-pointer"
              >
                {["Hyper Viral", "Clean Documentary", "Tech", "Gaming"].map(opt => <option key={opt} value={opt} className="bg-zinc-900 text-white">{opt}</option>)}
              </select>
            </div>
          </div>
        </Section>

        <Section title="Emotion & Face" icon={<BrainCircuit className="w-4 h-4" />}>
           <div className="space-y-4">
             <div className="p-2 bg-zinc-900 border border-zinc-800 rounded relative z-10 hover:z-50">
               <div className="flex items-center gap-1 text-[9px] uppercase text-zinc-500 mb-1">
                 <span>Target Emotion</span>
                 <div className="relative group/tooltip flex items-center justify-center cursor-help p-1 z-50">
                   <Info className="w-3 h-3 text-zinc-500 hover:text-white transition-colors" />
                   <InfoTooltip text="Injects highly expressive keywords into the prompt string. Overrides default facial expressions to trigger immediate human curiosity." />
                 </div>
               </div>
               <select
                 value={thumbnailSettings.emotionTarget} 
                 onChange={(e) => updateThumbnailSetting("emotionTarget", e.target.value as any)}
                 className="bg-transparent text-xs text-white w-full outline-none focus:text-red-500 cursor-pointer"
               >
                 {["Shock", "Curiosity", "Fear", "Excitement", "Confusion"].map(opt => <option key={opt} value={opt} className="bg-zinc-900 text-white">{opt}</option>)}
               </select>

               <div className="mt-4 space-y-2 relative z-10 hover:z-50">
                 <div className="flex justify-between text-[10px] text-zinc-300 items-center w-full">
                   <div className="flex items-center gap-1">
                     <label className="uppercase text-zinc-500 text-[9px]">Intensity</label>
                   </div>
                   <span className="text-red-500 font-mono font-bold">{thumbnailSettings.emotionIntensity}/10</span>
                 </div>
                 <input 
                   type="range" min={1} max={10} step={1} 
                   value={thumbnailSettings.emotionIntensity} 
                   onChange={(e) => updateThumbnailSetting("emotionIntensity", parseFloat(e.target.value))}
                   className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-500"
                 />
               </div>
             </div>
             
             <div className="flex items-center gap-2 relative z-10 hover:z-50">
               <label className="flex items-center gap-2 text-xs text-zinc-300 hover:text-white transition-colors cursor-pointer w-max">
                 <input 
                   type="checkbox" 
                   checked={thumbnailSettings.faceAmplifier} 
                   onChange={(e) => updateThumbnailSetting("faceAmplifier", e.target.checked)}
                   className="hidden"
                 />
                 {thumbnailSettings.faceAmplifier ? <CheckSquare className="w-4 h-4 text-red-500" /> : <Square className="w-4 h-4 text-zinc-600" />}
                 <span>Face Amplifier (Zoom & Exaggerate)</span>
               </label>
               <div className="relative group/tooltip flex items-center justify-center cursor-help p-1 z-50">
                 <Info className="w-3 h-3 text-zinc-500 hover:text-white transition-colors" />
                 <InfoTooltip text="Forces intense focal zoom on the subject's face while artificially exaggerating expressive features like eyes and mouth sizes slightly." />
               </div>
             </div>
           </div>
        </Section>

        <Section title="Composition" icon={<Layout className="w-4 h-4" />}>
           <div className="space-y-4">
             <div className="p-2 bg-zinc-900 border border-zinc-800 rounded relative z-10 hover:z-50">
               <div className="flex items-center gap-1 text-[9px] uppercase text-zinc-500 mb-1">
                 <span>Aspect Ratio</span>
                 <div className="relative group/tooltip flex items-center justify-center cursor-help p-1 z-50">
                   <Info className="w-3 h-3 text-zinc-500 hover:text-white transition-colors" />
                   <InfoTooltip text="Proportional relationship between width and height. Standard YouTube is 16:9, Shorts are 9:16." />
                 </div>
               </div>
               <select 
                 value={thumbnailSettings.aspectRatio} 
                 onChange={(e) => updateThumbnailSetting("aspectRatio", e.target.value as any)}
                 className="bg-transparent text-xs text-white w-full outline-none focus:text-red-500 cursor-pointer"
               >
                 {["16:9", "9:16", "1:1", "4:3", "3:4"].map(opt => <option key={opt} value={opt} className="bg-zinc-900 text-white">{opt}</option>)}
               </select>
             </div>

             <div className="p-2 bg-zinc-900 border border-zinc-800 rounded relative z-10 hover:z-50">
               <div className="flex items-center gap-1 text-[9px] uppercase text-zinc-500 mb-1">
                 <span>Layout Focus</span>
                 <div className="relative group/tooltip flex items-center justify-center cursor-help p-1 z-50">
                   <Info className="w-3 h-3 text-zinc-500 hover:text-white transition-colors" />
                   <InfoTooltip text="Dictates structural arrangement. Example: 'Before/After' splits canvas perfectly in half; 'Center Face' avoids placing text over central eye-lines." />
                 </div>
               </div>
               <select 
                 value={thumbnailSettings.layout} 
                 onChange={(e) => updateThumbnailSetting("layout", e.target.value as any)}
                 className="bg-transparent text-xs text-white w-full outline-none focus:text-red-500 cursor-pointer"
               >
                 {["Left subject + right text", "Center face zoom", "Before/After split", "Object focus"].map(opt => <option key={opt} value={opt} className="bg-zinc-900 text-white">{opt}</option>)}
               </select>
             </div>
             
             <div className="flex items-center gap-2 relative z-10 hover:z-50">
               <label className="flex items-center gap-2 text-xs text-zinc-300 hover:text-white transition-colors cursor-pointer w-max">
                 <input 
                   type="checkbox" 
                   checked={thumbnailSettings.subjectIsolation} 
                   onChange={(e) => updateThumbnailSetting("subjectIsolation", e.target.checked)}
                   className="hidden"
                 />
                 {thumbnailSettings.subjectIsolation ? <CheckSquare className="w-4 h-4 text-red-500" /> : <Square className="w-4 h-4 text-zinc-600" />}
                 <span>Subject Isolation (Edge Glow)</span>
               </label>
               <div className="relative group/tooltip flex items-center justify-center cursor-help p-1 z-50">
                 <Info className="w-3 h-3 text-zinc-500 hover:text-white transition-colors" />
                 <InfoTooltip text="Applies strong rim lighting and background desaturation, causing the primary subject to look artificially cut-out and popping off the canvas." />
               </div>
             </div>
           </div>
        </Section>

        <Section title="Image Subjects" icon={<UserCircle2 className="w-4 h-4" />}>
          <div className="space-y-6">
            <MultiImageUpload 
              label="Faces (Max 3)" 
              icon={<UserSearch className="w-3 h-3 text-red-500" />}
              images={thumbnailSettings.faceImages || []} 
              onChange={(imgs) => updateThumbnailSetting("faceImages", imgs)} 
              maxImages={3} 
            />

            {(thumbnailSettings.faceImages?.length ?? 0) > 0 && (
              <label className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer pl-1 mt-2">
                <input 
                  type="checkbox" 
                  checked={thumbnailSettings.enableFaceSwap} 
                  onChange={(e) => updateThumbnailSetting("enableFaceSwap", e.target.checked)}
                  className="rounded bg-zinc-900 border-zinc-800 text-[#EFFF00] focus:ring-[#EFFF00] cursor-pointer"
                />
                <span className={thumbnailSettings.enableFaceSwap ? "text-red-500 font-bold" : ""}>Enable Face Swap (Preserve Identity)</span>
              </label>
            )}
            
            <div className="w-full h-px bg-zinc-800 mt-4"></div>

            <MultiImageUpload 
              label="Other Assets (Max 3)" 
              icon={<ImagePlus className="w-3 h-3 text-red-500" />}
              images={thumbnailSettings.otherImages || []} 
              onChange={(imgs) => updateThumbnailSetting("otherImages", imgs)} 
              maxImages={3} 
            />
          </div>
        </Section>

        <Section title="Text Impact" icon={<Type className="w-4 h-4" />}>
          <div className="space-y-2 relative z-10 hover:z-50">
            <div className="flex items-center gap-1 text-[9px] uppercase text-zinc-500 tracking-widest">
               <span>Text overlay (Max 5 words)</span>
               <div className="relative group/tooltip flex items-center justify-center cursor-help p-1 z-50">
                 <Info className="w-3 h-3 text-zinc-500 hover:text-white transition-colors" />
                 <InfoTooltip text="The AI will use semantic rewriting to convert your plain text into a catchy 'power phrase' formatted in large bold 3D lettering inside the image." />
               </div>
            </div>
            <input 
              type="text"
              value={thumbnailSettings.textImpact}
              onChange={(e) => updateThumbnailSetting("textImpact", e.target.value)}
              placeholder="e.g. THIS CHANGED EVERYTHING"
              className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-white outline-none focus:border-red-500 placeholder-zinc-600 font-bold uppercase"
            />
            <p className="text-[9px] text-zinc-500">System automatically rewrites into power phrases and styles the text.</p>
          </div>
        </Section>

        <div className="pt-4 px-2 relative z-10 hover:z-50">
           <div className="flex items-center gap-2">
             <label className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer w-max">
               <input 
                 type="checkbox" 
                 checked={thumbnailSettings.abTestMode} 
                 onChange={(e) => updateThumbnailSetting("abTestMode", e.target.checked)}
                 className="hidden"
               />
               {thumbnailSettings.abTestMode ? <CheckSquare className="w-4 h-4 text-red-500" /> : <Square className="w-4 h-4 text-zinc-600" />}
               <span className="font-bold text-[#EFFF00]">Run A/B Test Variants</span>
             </label>
             <div className="relative group/tooltip flex items-center justify-center cursor-help p-1 z-50">
               <Info className="w-3 h-3 text-zinc-500 hover:text-white transition-colors" />
               <InfoTooltip text="Expands inference to 6 variants internally. AI severely restricts passing thumbnails, returning only the top 3 highest calculated CTR images. Expect longer generation times!" />
             </div>
           </div>
           <p className="text-[9px] text-zinc-500 ml-6 mt-1">Generates up to 8 variants and returns the best 3 scored by AI.</p>
        </div>

      </div>
    </div>
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
