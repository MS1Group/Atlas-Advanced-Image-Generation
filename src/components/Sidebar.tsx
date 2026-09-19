import React, { useState, useRef } from "react";
import { useAppContext } from "../store";
import { ChevronDown, SlidersHorizontal, Image as ImageIcon, Sparkles, Layers, History, Settings2, Download, RotateCw, X, Camera, UserSearch, ImagePlus, Key, Cpu, ShieldCheck, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CustomPreset, AVAILABLE_MODELS } from "../types";
import { MultiImageUpload } from "./MultiImageUpload";

export function Sidebar() {
  const { settings, updateSetting, customPresets, addCustomPreset, loadCustomPreset, removeCustomPreset, updateComposition } = useAppContext();
  const [toast, setToast] = useState<string | null>(null);
  const timeoutRef = useRef<any>(null);
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");
  
  const handleShowToast = (msg: string) => {
    setToast(msg);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setToast(null), 2500);
  };
  
  const applyStandardPreset = (preset: "Default" | "Portrait" | "Landscape Concept") => {
    if (preset === "Portrait") {
      updateSetting("aspectRatio", "3:4");
      updateSetting("presetStyle", "Photorealistic");
      updateSetting("resolution", "1K");
    } else if (preset === "Landscape Concept") {
      updateSetting("aspectRatio", "16:9");
      updateSetting("presetStyle", "Cinematic");
      updateSetting("resolution", "2K");
    } else {
      updateSetting("aspectRatio", "1:1");
      updateSetting("presetStyle", "Photorealistic");
      updateSetting("resolution", "1K");
      updateSetting("cfgScale", 7.0);
      updateSetting("creativity", 50);
      updateComposition("lighting", "Studio");
    }
    handleShowToast(`${preset} preset loaded`);
  };
  
  const applyCustomPreset = (preset: CustomPreset) => {
    loadCustomPreset(preset);
    handleShowToast(`'${preset.name}' preset loaded`);
  };

  const handleSavePreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPresetName.trim()) {
      addCustomPreset(newPresetName.trim());
      handleShowToast(`Preset '${newPresetName.trim()}' saved`);
      setNewPresetName("");
      setIsSavingPreset(false);
    }
  };

  return (
    <div className="w-[320px] bg-[#0D0D0D] border-r border-zinc-800 flex flex-col shrink-0 overflow-hidden font-sans relative z-10">
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className="absolute top-4 left-1/2 bg-[#EFFF00] text-black px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(239,255,0,0.3)] z-50 pointer-events-none whitespace-nowrap"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#EFFF00] rounded flex items-center justify-center">
            <div className="w-3 h-3 bg-black rounded-full"></div>
          </div>
          <span className="font-bold tracking-tight text-white uppercase text-xs">NANO BANANA <span className="text-[10px] text-zinc-500 font-mono">v1.2-PRO</span></span>
        </div>
        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
      </div>
      
      <div className="p-4 border-b border-zinc-800 bg-zinc-900/30">
        <div className="flex justify-between items-center mb-2">
           <div className="uppercase text-[10px] tracking-widest text-zinc-500 font-semibold">Presets</div>
           {!isSavingPreset && (
              <button onClick={() => setIsSavingPreset(true)} className="text-[9px] uppercase tracking-widest text-[#EFFF00] hover:underline">
                 Save Current
              </button>
           )}
        </div>
        
        {isSavingPreset ? (
           <form onSubmit={handleSavePreset} className="flex gap-2 mb-2">
             <input 
               type="text" 
               autoFocus
               value={newPresetName}
               onChange={(e) => setNewPresetName(e.target.value)}
               placeholder="Preset name..."
               className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white outline-none focus:border-[#EFFF00]"
             />
             <button type="submit" className="bg-[#EFFF00] text-black px-2 py-1 rounded text-xs font-bold">Save</button>
             <button type="button" onClick={() => setIsSavingPreset(false)} className="bg-zinc-800 text-zinc-300 px-2 py-1 rounded text-xs">Cancel</button>
           </form>
        ) : null}

        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar items-center">
          {["Default", "Portrait", "Landscape Concept"].map(p => (
            <button 
              key={p} 
              onClick={() => applyStandardPreset(p as any)}
              className="px-2 py-1 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded text-[10px] text-zinc-300 whitespace-nowrap transition-colors uppercase flex-shrink-0"
            >
              {p}
            </button>
          ))}
          
          {customPresets.map(p => (
            <div key={p.id} className="relative group flex-shrink-0 flex items-center">
              <button 
                onClick={() => applyCustomPreset(p)}
                className="px-2 py-1 bg-zinc-800 border border-zinc-700 hover:border-[#EFFF00] rounded text-[10px] text-zinc-100 whitespace-nowrap transition-colors uppercase pr-6"
              >
                {p.name}
              </button>
              <button 
                onClick={() => removeCustomPreset(p.id)}
                className="absolute right-1 text-zinc-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 p-4 pb-32">
        <Section title="AI Model & API Key" icon={<Cpu className="w-4 h-4 text-amber-400" />} defaultOpen>
          <AiModelConfig />
        </Section>

        <Section title="Generation Config" icon={<Settings2 className="w-4 h-4" />} defaultOpen>
          <ConfigSettings />
        </Section>
        
        <Section title="Format Controls" icon={<ImageIcon className="w-4 h-4" />}>
          <FormatControls />
        </Section>

        <Section title="Camera Controls" icon={<Camera className="w-4 h-4" />}>
          <CameraControls />
        </Section>

        <Section title="Image Input" icon={<Layers className="w-4 h-4" />}>
          <ImageInput />
        </Section>

        <Section title="Style Controls" icon={<Sparkles className="w-4 h-4" />}>
          <StyleControls />
        </Section>
      </div>
    </div>
  );
}

function Section({ title, icon, defaultOpen = false, children }: { title: string, icon: React.ReactNode, defaultOpen?: boolean, children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-2 relative hover:z-50">
      <button 
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-2 hover:text-white transition-colors"
      >
        <div className="flex items-center gap-2 font-semibold text-[10px] uppercase tracking-widest text-zinc-500">
          {icon} <span>{title}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div 
            initial="collapsed"
            animate="open"
            exit="collapsed"
            variants={{
              open: { height: "auto", opacity: 1, transitionEnd: { overflow: "visible" } },
              collapsed: { height: 0, opacity: 0, overflow: "hidden" }
            }}
            transition={{ duration: 0.25, ease: "easeOut" }}
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

function SliderControl({ label, tooltip, value, min, max, step, onChange, format = "number", tooltipPosition = "bottom" }: any) {
  return (
    <div className="space-y-2 relative group hover:z-[60]">
      <div className="flex justify-between items-center text-xs text-zinc-300">
        <div className="flex items-center gap-1">
           <label className="cursor-help">{label}</label>
           {tooltip && (
             <div className="w-3 h-3 rounded-full border border-zinc-700 flex items-center justify-center text-[8px] text-zinc-500 group-hover:border-[#EFFF00] group-hover:text-[#EFFF00] transition-colors pointer-events-none">i</div>
           )}
        </div>
        <span className="text-[#EFFF00] font-mono">{format === "number" ? value : `${Math.round(value * 100)}%`}</span>
      </div>
      <input 
        type="range" min={min} max={max} step={step} value={value} 
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#EFFF00]"
      />
      {tooltip && (
        <div className={`hidden group-hover:block absolute ${tooltipPosition === 'top' ? 'bottom-[100%] mb-2' : 'top-[80%] mt-2'} left-0 z-[100] w-[calc(100%+16px)] -ml-2 bg-[#050505] border border-zinc-800 rounded shadow-[0_10px_30px_rgba(0,0,0,0.8)] p-3 text-[10px] text-zinc-400 normal-case tracking-normal font-normal leading-relaxed break-words pointer-events-none`}>
          {tooltip}
        </div>
      )}
    </div>
  );
}

function SelectControl({ label, tooltip, value, options, onChange, tooltipPosition = "bottom" }: any) {
  return (
    <div className="p-2 bg-zinc-900 border border-zinc-800 rounded relative group hover:z-[60]">
      <div className="flex justify-between items-center mb-1">
        <p className="text-[9px] uppercase text-zinc-500 cursor-help">{label}</p>
        {tooltip && (
            <div className="w-3 h-3 rounded-full border border-zinc-700 flex items-center justify-center text-[8px] text-zinc-500 group-hover:border-[#EFFF00] group-hover:text-[#EFFF00] transition-colors pointer-events-none">i</div>
        )}
      </div>
      <select 
        value={value} onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-xs text-white w-full outline-none focus:text-[#EFFF00] cursor-pointer"
      >
        {options.map((opt: string) => <option key={opt} value={opt} className="bg-zinc-900 text-white">{opt}</option>)}
      </select>
      {tooltip && (
        <div className={`hidden group-hover:block absolute ${tooltipPosition === 'top' ? 'bottom-[100%] mb-2' : 'top-[80%] mt-2'} left-0 z-[100] w-[calc(100%+16px)] -ml-2 bg-[#050505] border border-zinc-800 rounded shadow-[0_10px_30px_rgba(0,0,0,0.8)] p-3 text-[10px] text-zinc-400 normal-case tracking-normal font-normal leading-relaxed break-words pointer-events-none`}>
          {tooltip}
        </div>
      )}
    </div>
  );
}

function ConfigSettings() {
  const { settings, updateSetting } = useAppContext();
  
  return (
    <div className="space-y-4">
      <SliderControl label="Temperature" tooltip="Controls the randomness and variation in prompt interpretation. Higher values yield more unpredictable results." value={settings.temperature} min={0} max={1.5} step={0.1} onChange={(v: number) => updateSetting("temperature", v)} />
      <SliderControl label="CFG Scale" tooltip="Classifier Free Guidance. Determines how strictly the AI follows your prompt. A higher scale forces strict adherence." value={settings.cfgScale} min={1} max={20} step={0.5} onChange={(v: number) => updateSetting("cfgScale", v)} />
      
      <div className="grid grid-cols-2 gap-2 mt-4">
        <div className="p-2 bg-zinc-900 border border-zinc-800 rounded relative group hover:z-[60]">
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-1 cursor-help">
               <p className="text-[9px] uppercase text-zinc-500">Seed</p>
               <div className="w-3 h-3 rounded-full border border-zinc-700 flex items-center justify-center text-[8px] text-zinc-500 group-hover:border-[#EFFF00] group-hover:text-[#EFFF00] transition-colors pointer-events-none">i</div>
            </div>
            <button 
              className={`text-[8px] px-1 rounded ${settings.useRandomSeed ? 'bg-[#EFFF00] text-black font-bold' : 'bg-zinc-800 text-zinc-400'}`}
              onClick={() => updateSetting("useRandomSeed", !settings.useRandomSeed)}
            >
              RND
            </button>
          </div>
          <input 
            type="number" 
            value={settings.seed} 
            disabled={settings.useRandomSeed}
            onChange={(e) => updateSetting("seed", parseInt(e.target.value))}
            className="bg-transparent text-xs text-white w-full outline-none font-mono disabled:opacity-50"
          />
          <div className="hidden group-hover:block absolute bottom-[100%] left-0 z-[100] mb-2 w-[200px] bg-[#050505] border border-zinc-800 rounded shadow-[0_10px_30px_rgba(0,0,0,0.8)] p-3 text-[10px] text-zinc-400 normal-case tracking-normal font-normal leading-relaxed break-words pointer-events-none">
            A specific number that initializes generation. Using the exact same seed produces identical results.
          </div>
        </div>
        <div className="p-2 bg-zinc-900 border border-zinc-800 rounded relative group hover:z-[60]">
          <div className="flex items-center gap-1 mb-1 cursor-help">
             <p className="text-[9px] uppercase text-zinc-500">Outputs</p>
             <div className="w-3 h-3 rounded-full border border-zinc-700 flex items-center justify-center text-[8px] text-zinc-500 group-hover:border-[#EFFF00] group-hover:text-[#EFFF00] transition-colors pointer-events-none">i</div>
          </div>
          <input 
            type="number" min={1} max={4} step={1}
            value={settings.numOutputs}
            onChange={(e) => updateSetting("numOutputs", parseInt(e.target.value))}
            className="bg-transparent text-xs text-white w-full outline-none font-mono"
          />
          <div className="hidden group-hover:block absolute bottom-[100%] right-0 z-[100] mb-2 w-[180px] bg-[#050505] border border-zinc-800 rounded shadow-[0_10px_30px_rgba(0,0,0,0.8)] p-3 text-[10px] text-zinc-400 normal-case tracking-normal font-normal leading-relaxed break-words pointer-events-none">
            Number of image variations generated simultaneously in one go.
          </div>
        </div>
      </div>
    </div>
  );
}

function FormatControls() {
  const { settings, updateSetting } = useAppContext();
  return (
    <div className="space-y-4">
      <SelectControl label="Aspect Ratio" tooltip="Proportional relationship between width and height (e.g., 16:9 for cinematic landscape)." value={settings.aspectRatio} options={["1:1", "16:9", "9:16", "4:3", "3:4"]} onChange={(v: string) => updateSetting("aspectRatio", v)} />
      <SelectControl label="Resolution" tooltip="Overall pixel density and size. 1K provides a strong baseline, 2K is much slower but highly detailed." value={settings.resolution} options={["512px", "1K", "2K"]} onChange={(v: string) => updateSetting("resolution", v)} tooltipPosition="top" />
    </div>
  );
}

function ImageInput() {
  const { settings, updateSetting, setMaskingToolOpen } = useAppContext();
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        updateSetting("referenceImage", ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <MultiImageUpload 
        label="Faces (Max 3)" 
        icon={<UserSearch className="w-3 h-3" />}
        images={settings.faceImages || []} 
        onChange={(imgs) => updateSetting("faceImages", imgs)} 
        maxImages={3} 
      />

      {(settings.faceImages?.length ?? 0) > 0 && (
        <label className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer pl-1 mt-2">
          <input 
            type="checkbox" 
            checked={settings.enableFaceSwap} 
            onChange={(e) => updateSetting("enableFaceSwap", e.target.checked)}
            className="rounded bg-zinc-900 border-zinc-800 text-[#EFFF00] focus:ring-[#EFFF00] cursor-pointer"
          />
          <span className={settings.enableFaceSwap ? "text-[#EFFF00] font-bold" : ""}>Enable Face Swap (Preserve Identity)</span>
        </label>
      )}

      <div className="w-full h-px bg-zinc-800 mt-4"></div>

      <MultiImageUpload 
        label="Other References (Max 3)" 
        icon={<ImagePlus className="w-3 h-3" />}
        images={settings.otherImages || []} 
        onChange={(imgs) => updateSetting("otherImages", imgs)} 
        maxImages={3} 
      />

      <div className="w-full h-px bg-zinc-800"></div>

      <div className="space-y-2">
        <div className="flex justify-between items-center text-[9px] uppercase tracking-widest text-zinc-500 font-semibold mb-2">
          <div className="flex items-center gap-1">
            <ImageIcon className="w-3 h-3" />
            <span>Legacy Masking Ref</span>
          </div>
        </div>
        <div className="border border-dashed border-zinc-700 bg-zinc-900/50 rounded-xl p-6 flex flex-col items-center justify-center text-zinc-500 cursor-pointer hover:border-[#EFFF00] hover:text-[#EFFF00] transition-colors relative overflow-hidden">
          {settings.referenceImage ? (
            <img src={settings.referenceImage} alt="Ref" className="absolute inset-0 w-full h-full object-cover opacity-30" />
          ) : null}
          <ImageIcon className="w-6 h-6 mb-2 relative z-10" />
          <span className="text-center text-[10px] uppercase font-semibold relative z-10">{settings.referenceImage ? "Image Uploaded - Click to change" : "Drop reference image"}</span>
          <input type="file" className="opacity-0 absolute inset-0 cursor-pointer z-20" accept="image/*" onChange={handleFileChange} />
        </div>
        
        <SliderControl label="Reference Strength" tooltip="Determines how heavily the reference image guides the final output. 100% forces strict adherence." value={settings.referenceStrength} min={0} max={100} step={1} format="percent" onChange={(v: number) => updateSetting("referenceStrength", v)} />
        
        <div className="pt-2">
          <button 
             onClick={() => setMaskingToolOpen(true)}
             className="w-full py-2 bg-zinc-900 border border-zinc-800 hover:border-[#EFFF00] rounded text-[10px] font-semibold tracking-widest text-[#EFFF00] transition-colors disabled:opacity-50 disabled:border-zinc-800 disabled:text-zinc-600 uppercase" 
             disabled={!settings.referenceImage}
          >
            {settings.maskImage ? "EDIT MASKING LAYER" : "OPEN MASKING TOOL"}
          </button>
          
          {settings.maskImage && (
             <div className="flex justify-between items-center mt-2 px-2">
               <span className="text-[9px] text-[#EFFF00] font-bold uppercase tracking-widest">Mask Active</span>
               <button 
                  onClick={() => updateSetting("maskImage", null)}
                  className="text-[9px] text-red-500 hover:text-white uppercase tracking-widest font-bold transition-colors"
               >
                 Clear
               </button>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CameraControls() {
  const { settings, updateComposition } = useAppContext();
  return (
    <div className="space-y-4">
      <SelectControl label="Camera Angle" tooltip="Defines the virtual camera position relative to the subject." value={settings.composition.angle} options={["Eye level", "Top-down", "Portrait", "Wide", "Macro", "Low angle"]} onChange={(v: string) => updateComposition("angle", v)} />
      <SelectControl label="Lighting" tooltip="Simulates specific lighting setups affecting mood and volume (e.g. Studio, Cinematic, Neon)." value={settings.composition.lighting} options={["Studio", "Natural", "Neon", "Dramatic", "Cinematic", "Ambient"]} onChange={(v: string) => updateComposition("lighting", v)} tooltipPosition="top" />
      
      <label className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer mt-2 relative group w-max hover:z-[60]">
        <input 
          type="checkbox" 
          checked={settings.composition.dof} 
          onChange={(e) => updateComposition("dof", e.target.checked)}
          className="rounded bg-zinc-900 border-zinc-800 text-[#EFFF00] focus:ring-[#EFFF00] cursor-pointer"
        />
        <span>Depth of Field (Blur BG)</span>
        <div className="w-3 h-3 rounded-full border border-zinc-700 flex items-center justify-center text-[8px] text-zinc-500 group-hover:border-[#EFFF00] group-hover:text-[#EFFF00] transition-colors pointer-events-none ml-1">i</div>
        <div className="hidden group-hover:block absolute bottom-[100%] left-0 z-[100] mb-2 w-[220px] bg-[#050505] border border-zinc-800 rounded shadow-[0_10px_30px_rgba(0,0,0,0.8)] p-3 text-[10px] text-zinc-400 normal-case tracking-normal font-normal leading-relaxed break-words pointer-events-none">
          Simulates a camera lens effect keeping the subject in sharp focus while artistically blurring the background.
        </div>
      </label>
    </div>
  );
}

function StyleControls() {
  const { settings, updateSetting } = useAppContext();
  return (
    <div className="space-y-4">
      <SelectControl label="Thinking Level" tooltip="Allocates processing time to interpret prompt complexity. Higher levels follow dense descriptions better." value={settings.thinkingLevel} options={["Minimal", "Balanced", "Deep"]} onChange={(v: any) => updateSetting("thinkingLevel", v)} />
      <SelectControl label="Preset Style" tooltip="Applies an overarching aesthetic filter to guide the artistic direction heavily." value={settings.presetStyle} options={["Photorealistic", "Anime", "Cinematic", "3D Render", "Sketch", "Abstract"]} onChange={(v: string) => updateSetting("presetStyle", v)} />
      <SliderControl label="Creativity" tooltip="Influences deviation from basic structural logic. High values generate surreal interpretations." value={settings.creativity} min={0} max={100} step={1} onChange={(v: number) => updateSetting("creativity", v)} tooltipPosition="top" />
    </div>
  );
}

function AiModelConfig() {
  const { apiKey, selectedModel, setSelectedModel, setApiKeyModalOpen } = useAppContext();
  const currentModel = AVAILABLE_MODELS.find(m => m.id === selectedModel) || AVAILABLE_MODELS[0];

  return (
    <div className="space-y-3">
      {/* API Key Status */}
      <div className="p-3 bg-zinc-900 border border-zinc-800 rounded space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-zinc-400 font-semibold">
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span>Gemini API Key</span>
          </div>
          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${apiKey ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800/50" : "bg-zinc-800 text-zinc-400 border border-zinc-700/50"}`}>
            {apiKey ? "Custom Key Active" : "Default Key"}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs pt-0.5">
          <span className="font-mono text-zinc-400 text-[11px] truncate max-w-[140px]">
            {apiKey ? `${apiKey.slice(0, 6)}••••••••` : "No custom key entered"}
          </span>
          <button
            id="sidebar-configure-api-key-button"
            onClick={() => setApiKeyModalOpen(true)}
            className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold uppercase tracking-wider hover:underline"
          >
            {apiKey ? "Edit Key" : "Set API Key"}
          </button>
        </div>
      </div>

      {/* Model Selection Dropdown */}
      <div className="p-2.5 bg-zinc-900 border border-zinc-800 rounded relative group hover:z-[60]">
        <div className="flex justify-between items-center mb-1.5">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-amber-400" />
            <p className="text-[9px] uppercase tracking-wider text-zinc-400 font-semibold">Model</p>
          </div>
          {currentModel.badge && (
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300">
              {currentModel.badge}
            </span>
          )}
        </div>
        <select
          id="sidebar-model-select"
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-xs text-white w-full outline-none focus:border-amber-400 cursor-pointer"
        >
          {AVAILABLE_MODELS.map(m => (
            <option key={m.id} value={m.id} className="bg-zinc-900 text-white">
              {m.name} {m.badge ? `(${m.badge})` : ""}
            </option>
          ))}
        </select>
        <p className="text-[10px] text-zinc-400 mt-1.5 leading-relaxed">
          {currentModel.description}
        </p>
      </div>

      {/* Model info notes */}
      <div className="p-2 bg-blue-950/20 border border-blue-900/30 rounded text-[10px] text-blue-200/90 leading-relaxed">
        <strong className="text-blue-300 font-medium">Prompt Enhance:</strong> Uses <span className="font-mono text-blue-200">gemini-3.1-flash-lite</span> with your provided key for fast creative expansion.
      </div>
    </div>
  );
}
