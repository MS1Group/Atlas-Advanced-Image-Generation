import React, { useState } from "react";
import { useAppContext } from "../store";
import { generateImage, enhancePrompt, generateViralThumbnails, generateInfographic, parseGeminiError } from "../api";
import { Wand2, ImagePlus, Download, RefreshCw, Layers, History, X, Sparkles, Maximize2, Flame, Key, Cpu, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ImageRecord, GenerationSettings, AVAILABLE_MODELS } from "../types";
import { ErrorAlert } from "./ErrorAlert";

export function MainArea() {
  const { 
    appMode, setAppMode,
    prompt, setPrompt, 
    negativePrompt, setNegativePrompt, 
    isGenerating, setGenerating,
    settings, thumbnailSettings, infographicSettings,
    addHistory, currentImage, setCurrentImage, history,
    apiKey, selectedModel, setLastError, clearError, setApiKeyModalOpen
  } = useAppContext();

  const [promptMode, setPromptMode] = useState<"basic" | "advanced">("basic");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [proposedPrompt, setProposedPrompt] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viralResults, setViralResults] = useState<ImageRecord[]>([]);

  const activeModelObj = AVAILABLE_MODELS.find(m => m.id === selectedModel) || AVAILABLE_MODELS[0];

  const [learnedNegativeTerms, setLearnedNegativeTerms] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("learnedNegativeTerms");
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
  });

  const learnNegativeTerms = (prompt: string) => {
    if (!prompt) return;
    const terms = prompt.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
    setLearnedNegativeTerms(prev => {
      const updated = Array.from(new Set([...terms, ...prev])).slice(0, 20);
      localStorage.setItem("learnedNegativeTerms", JSON.stringify(updated));
      return updated;
    });
  };

  const addNegativeTerm = (term: string) => {
    const terms = negativePrompt ? negativePrompt.split(',').map(t => t.trim()).filter(Boolean) : [];
    if (!terms.map(t => t.toLowerCase()).includes(term.toLowerCase())) {
      terms.push(term);
      setNegativePrompt(terms.join(', '));
    }
  };

  const defaultNegativeTerms = ['blurry', 'ugly', 'deformed', 'watermark', 'bad anatomy', 'extra limbs', 'low resolution'];
  const currentNegativeTerms = negativePrompt.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
  const suggestedTerms = Array.from(new Set([...learnedNegativeTerms, ...defaultNegativeTerms]))
    .filter(t => !currentNegativeTerms.includes(t))
    .slice(0, 8);

  const filteredHistory = history.filter(h => h.mode === appMode);
  const displayImage = currentImage?.mode === appMode ? currentImage : filteredHistory[0];

  const handleEnhance = async () => {
    if (!prompt) return;
    clearError();
    setIsEnhancing(true);
    setProposedPrompt(null);
    try {
      const enhanced = await enhancePrompt(prompt, settings, apiKey);
      setProposedPrompt(enhanced);
    } catch (e: any) {
      console.error("Enhance error:", e);
      setLastError(parseGeminiError(e));
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt && appMode === "standard" && !settings.referenceImage) return;
    clearError();
    setGenerating(true);
    setViralResults([]);
    
    // Learn negative prompt terms whenever the user generates something manually
    if (negativePrompt) {
      learnNegativeTerms(negativePrompt);
    }
    
    if (appMode === "viral") {
      try {
        const results = await generateViralThumbnails(prompt, thumbnailSettings, selectedModel, apiKey);
        const newRecords: ImageRecord[] = results.map(r => ({
           id: Math.random().toString(36).substr(2, 9),
           url: r.url,
           prompt: r.prompt,
           settings: { ...thumbnailSettings },
           timestamp: Date.now(),
           ctrScore: r.ctrScore,
           mode: "viral"
        }));
        
        // Add to history and set results
        newRecords.reverse().forEach(record => addHistory(record)); // .reverse() so the best is first in history
        setViralResults(newRecords);
        setCurrentImage(newRecords[0]); // Best image is displayed centrally to not break backwards compatibility
      } catch (e: any) {
        console.error("Viral Gen failed", e);
        setLastError(parseGeminiError(e));
      } finally {
        setGenerating(false);
      }
      return;
    }

    if (appMode === "infographic") {
      try {
        const url = await generateInfographic(prompt, infographicSettings, selectedModel, apiKey);
        addHistory({
            id: Math.random().toString(36).substr(2, 9),
            url,
            prompt,
            settings: { ...infographicSettings },
            timestamp: Date.now(),
            mode: "infographic"
        });
      } catch (e: any) {
        console.error("Infographic Gen failed", e);
        setLastError(parseGeminiError(e));
      } finally {
        setGenerating(false);
      }
      return;
    }

    // Standard mode logic
    const promises = [];
    for(let i = 0; i < settings.numOutputs; i++) {
        promises.push(generateImage(
          prompt, 
          negativePrompt, 
          { ...settings, seed: settings.useRandomSeed ? Math.floor(Math.random() * 1000000) : settings.seed + i },
          selectedModel,
          apiKey
        ));
    }

    try {
      const results = await Promise.all(promises);
      results.forEach(url => {
        addHistory({
            id: Math.random().toString(36).substr(2, 9),
            url,
            prompt,
            settings: { ...settings },
            timestamp: Date.now(),
            mode: "standard"
        });
      });
    } catch (e: any) {
      console.error("Gen failed", e);
      setLastError(parseGeminiError(e));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center bg-[#050505] relative overflow-hidden h-full">
      {/* Gallery Top */}
      {/* Top right history trigger */}
      <div className="absolute top-6 right-6 z-40">
          <button 
             onClick={() => setIsHistoryOpen(true)}
             className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-300 hover:text-white hover:border-zinc-600 transition-colors shadow-lg"
          >
             <History className="w-4 h-4" /> 
             <span className="text-[10px] uppercase tracking-widest font-bold">History ({filteredHistory.length})</span>
          </button>
      </div>

      {/* History Side Panel */}
      <AnimatePresence>
        {isHistoryOpen && (
           <motion.div 
             initial={{ x: "100%" }} 
             animate={{ x: 0 }} 
             exit={{ x: "100%" }} 
             transition={{ type: "spring", damping: 25, stiffness: 200 }}
             className="absolute top-0 right-0 w-[320px] md:w-[400px] h-full bg-[#0D0D0D] border-l border-zinc-800 shadow-2xl z-50 flex flex-col"
           >
              <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-[#0D0D0D] shrink-0">
                  <div className="flex items-center gap-2 text-zinc-300">
                      <History className="w-5 h-5 text-[#EFFF00]" />
                      <span className="font-bold tracking-widest uppercase text-sm">Generations</span>
                  </div>
                  <button onClick={() => setIsHistoryOpen(false)} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors">
                      <X className="w-5 h-5" />
                  </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                 {filteredHistory.length === 0 ? (
                     <div className="text-zinc-600 text-center text-xs uppercase tracking-widest font-mono mt-10">No History yet</div>
                 ) : (
                     filteredHistory.map(record => (
                         <div key={record.id} className="group relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900/50 shadow-lg">
                             <img 
                                src={record.url} 
                                className="w-full h-auto cursor-pointer opacity-90 group-hover:opacity-100 transition-opacity" 
                                onClick={() => {
                                  setCurrentImage(record);
                                  setIsHistoryOpen(false);
                                }} 
                             />
                             <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button className="p-2 bg-black/80 hover:bg-[#EFFF00] hover:text-black text-white rounded-full transition-colors backdrop-blur" title="Download">
                                     <a href={record.url} download={`nanobanana_${record.id}.png`}>
                                         <Download className="w-4 h-4" />
                                     </a>
                                 </button>
                             </div>
                             <div className="p-4 bg-zinc-900/80 backdrop-blur-sm border-t border-zinc-800/50">
                                 <p className="text-[11px] text-zinc-300 leading-relaxed line-clamp-2 italic">"{record.prompt}"</p>
                                 <div className="flex justify-between items-center mt-3">
                                     <p className="text-[9px] text-zinc-500 font-mono uppercase bg-black/30 px-2 py-1 rounded inline-block">
                                        {new Date(record.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}{record.ctrScore ? ` • CTR ${record.ctrScore}` : ` • Seed ${(record.settings as GenerationSettings).seed || 'N/A'}`}
                                     </p>
                                     <button 
                                        onClick={() => {
                                            setPrompt(record.prompt);
                                            setIsHistoryOpen(false);
                                        }}
                                        className="text-[9px] uppercase tracking-widest text-[#EFFF00] hover:underline"
                                     >
                                         REMIX
                                     </button>
                                 </div>
                             </div>
                         </div>
                     ))
                 )}
              </div>
           </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 w-full flex items-center justify-center p-8 relative overflow-hidden">
        {appMode === "viral" && viralResults.length > 0 ? (
          <div className="w-full h-full flex flex-col pt-12 items-center overflow-y-auto px-4 pb-32">
             <div className="mb-6 text-center">
                 <h2 className="text-xl font-bold tracking-tight text-white uppercase"><Flame className="w-5 h-5 inline text-red-500 mr-2" /> CTR-Optimized Results</h2>
                 <p className="text-xs text-zinc-500 mt-1">AI generated & evaluated {thumbnailSettings.abTestMode ? '6 variations' : '2 variations'}, filtering for maximum CTR.</p>
             </div>
             <div className="flex flex-col gap-8 w-full max-w-5xl">
                {viralResults.map((result, idx) => (
                  <motion.div 
                     key={result.id}
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: idx * 0.2 }}
                     className={`w-full relative rounded-2xl overflow-hidden bg-zinc-900 border ${idx === 0 ? 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)]' : 'border-zinc-800'} p-2 flex flex-col`}
                  >
                     {idx === 0 && (
                        <div className="absolute top-4 left-4 z-10 bg-red-500 text-white text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full shadow-lg">
                           #1 Ranked CTR
                        </div>
                     )}
                     <div className="absolute top-4 right-4 z-10 bg-black/80 backdrop-blur text-white text-[10px] uppercase font-mono px-3 py-1 rounded-full border border-zinc-700">
                        Score: <span className="text-[#EFFF00] font-bold">{result.ctrScore}</span>/100
                     </div>
                     <div className="relative group cursor-zoom-in" onClick={() => { setCurrentImage(result); setIsFullscreen(true); }}>
                        <img src={result.url} className="w-full h-auto object-contain rounded-xl transition-transform duration-500 group-hover:scale-[1.02]" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-xl">
                            <div className="bg-black/80 backdrop-blur text-white px-4 py-2 rounded-full uppercase tracking-widest text-[10px] font-bold border border-zinc-700 shadow-xl flex items-center gap-2">
                                <Maximize2 className="w-3 h-3" /> View Fullscreen
                            </div>
                        </div>
                     </div>
                     <div className="mt-4 flex flex-wrap justify-center gap-3">
                         <button onClick={() => { setPrompt(prompt); handleGenerate(); }} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold uppercase rounded transition-colors text-white">Regenerate Similar</button>
                         <button onClick={() => { 
                             setPrompt(prompt); 
                             setAppMode("standard"); 
                             setCurrentImage({ ...result, mode: "standard" });
                         }} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold uppercase rounded transition-colors text-white">Remix in Studio</button>
                         <button className="px-4 py-2 bg-white hover:bg-zinc-200 text-black text-xs font-bold uppercase rounded transition-colors">
                            <a href={result.url} download={`ctr_thumb_${result.id}.png`} className="flex items-center gap-2"><Download className="w-4 h-4"/> Download</a>
                         </button>
                     </div>
                  </motion.div>
                ))}
             </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {displayImage && (appMode === "standard" || appMode === "infographic") ? (
              <motion.div 
                key={displayImage.id}
                initial={{ opacity: 0, filter: "blur(20px)", scale: 0.95 }}
                animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative max-h-full max-w-full rounded-2xl overflow-hidden bg-zinc-900/30 border border-zinc-800 shadow-2xl flex items-center justify-center p-2"
                style={{ aspectRatio: displayImage.settings && 'aspectRatio' in displayImage.settings ? (displayImage.settings.aspectRatio as string).replace(":", "/") : "16/9" }}
              >
                <img src={displayImage.url} alt="Generated" className="w-full h-full object-contain rounded-xl" />
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md border border-zinc-700 p-1.5 rounded-full flex gap-2 opacity-0 hover:opacity-100 transition-opacity">
                   <button 
                     onClick={() => { setCurrentImage(displayImage); setIsFullscreen(true); }}
                     className="px-4 py-1.5 text-[11px] hover:bg-zinc-800 rounded-full transition-colors text-white uppercase font-semibold"
                     title="View Fullscreen"
                   >
                     <Maximize2 className="w-3 h-3 inline mr-1" /> View
                   </button>
                   <button 
                     onClick={() => {
                       setPrompt(displayImage.prompt);
                       handleEnhance().then(() => handleGenerate());
                     }}
                     className="px-4 py-1.5 text-[11px] hover:bg-zinc-800 rounded-full transition-colors text-white uppercase font-semibold"
                     title="Generate a slight variation"
                   >
                     <RefreshCw className="w-3 h-3 inline mr-1" /> Remix
                   </button>
                   <button className="px-4 py-1.5 text-[11px] bg-white text-black hover:bg-zinc-200 rounded-full font-semibold uppercase" title="Download">
                      <a href={displayImage.url} download={`nanobanana_${displayImage.id}.png`} className="flex items-center gap-1">
                          <Download className="w-3 h-3 inline" /> Download
                      </a>
                   </button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-zinc-600 flex flex-col items-center uppercase tracking-widest text-sm space-y-4 font-mono"
              >
                <ImagePlus className="w-12 h-12 opacity-20 mb-2" />
                <span>{appMode === "viral" ? "Set topic & configure viral engine..." : appMode === "infographic" ? "Provide educational content to compress..." : "Awaiting prompt..."}</span>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {isGenerating && (
           <div className="absolute inset-0 bg-[#050505]/80 backdrop-blur-md flex flex-col items-center justify-center z-10 space-y-6">
               <motion.div 
                  initial={{ rotate: 0 }} 
                  animate={{ rotate: 360 }} 
                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  className="w-12 h-12 border-4 border-[#EFFF00]/20 border-t-[#EFFF00] rounded-full"
               />
               <div className="flex flex-col items-center gap-2 text-center">
                 <div className="text-zinc-500 font-mono text-xs uppercase animate-pulse tracking-widest">
                     Synthesizing...
                 </div>
                 {appMode === "infographic" ? (
                      <div className="text-emerald-500/60 font-mono text-[10px] uppercase tracking-wider max-w-xs border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 rounded">
                         Analyzing & Structuring Content<br/>
                         <span className="text-emerald-500">Est. time: {infographicSettings.explainThenVisualize ? '~45' : '~30'} seconds</span>
                      </div>
                  ) : appMode === "viral" ? (
                      <div className="text-[#EFFF00]/60 font-mono text-[10px] uppercase tracking-wider max-w-xs border border-[#EFFF00]/20 bg-[#EFFF00]/5 px-3 py-1.5 rounded">
                         Generating {thumbnailSettings.abTestMode ? '6 variants' : '2 variants'} & Evaluating<br/>
                         <span className="text-[#EFFF00]">Est. time: {thumbnailSettings.abTestMode ? '~30' : '~15'} seconds</span>
                      </div>
                  ) : (
                      <div className="text-[#EFFF00]/60 font-mono text-[10px] uppercase tracking-wider max-w-xs border border-[#EFFF00]/20 bg-[#EFFF00]/5 px-3 py-1.5 rounded">
                         Generating {settings.numOutputs} {settings.numOutputs === 1 ? 'image' : 'images'}<br/>
                         <span className="text-[#EFFF00]">Est. time: ~10 seconds</span>
                      </div>
                  )}
               </div>
           </div>
        )}
      </div>



      {/* Input Area */}
      <div className="w-full max-w-4xl px-8 pb-8 flex-shrink-0 z-20">
        <ErrorAlert />
        
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-[28px] p-4 shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-zinc-500 font-semibold px-2">
                <span className={`font-mono ${appMode === 'infographic' ? 'text-emerald-500' : 'text-[#EFFF00]'}`}>
                    {appMode === "viral" ? "DETAILED PROMPT / TOPIC" : appMode === "infographic" ? "TOPIC / NOTES / EXPLANATION" : "PROMPT"}
                </span>
                
                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-2">
                        <button 
                          id="model-pill-trigger"
                          onClick={() => setApiKeyModalOpen(true)}
                          className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/60 text-[10px] font-mono text-zinc-300 hover:text-white transition-colors"
                          title="Click to view API Key and Model configuration"
                        >
                            <Cpu className="w-3 h-3 text-amber-400" />
                            <span className="truncate max-w-[130px]">{activeModelObj.name}</span>
                        </button>

                        <button 
                          id="api-key-pill-trigger"
                          onClick={() => setApiKeyModalOpen(true)}
                          className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-mono transition-colors ${
                            apiKey 
                              ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/40" 
                              : "bg-amber-950/30 border-amber-800/50 text-amber-300 hover:bg-amber-900/30"
                          }`}
                          title="Click to configure your personal Gemini API key"
                        >
                            <Key className="w-3 h-3" />
                            <span>{apiKey ? "Key Active" : "Add Key"}</span>
                        </button>
                    </div>

                    <div className="flex gap-4">
                        <button onClick={() => setPromptMode("basic")} className={promptMode === "basic" ? "text-zinc-300" : "hover:text-zinc-400"}>Basic</button>
                        <button onClick={() => setPromptMode("advanced")} className={promptMode === "advanced" ? "text-[#EFFF00]" : "hover:text-zinc-400"}>Advanced</button>
                    </div>
                </div>
            </div>
            
            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={appMode === "viral" ? "Enter a detailed prompt or concept (e.g., 'Surprised person holding a glowing blue energy crystal...')" : appMode === "infographic" ? "Paste your notes, or describe a topic..." : "Enter your creative vision..."}
                className="w-full px-2 bg-transparent border-none outline-none resize-y text-white text-sm min-h-[40px] max-h-[250px] font-sans"
                rows={promptMode === "advanced" ? 3 : 1}
            />

            <AnimatePresence>
                {proposedPrompt && (
                    <motion.div initial={{ opacity: 0, y: -10, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, y: -10, height: 0 }} className="overflow-hidden">
                        <div className="bg-zinc-800/80 rounded-xl p-3 border border-[#EFFF00]/30 shadow-[0_0_15px_rgba(239,255,0,0.1)] mt-2">
                            <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] uppercase tracking-widest text-[#EFFF00] font-bold flex items-center gap-1"><Sparkles className="w-3 h-3"/> AI Enhanced Suggestion</span>
                                    <span className="text-[9px] font-mono bg-blue-950/60 border border-blue-800/60 text-blue-300 px-1.5 py-0.5 rounded">Powered by Gemini 3.1 Flash Lite</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setProposedPrompt(null)} className="text-[10px] uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">Reject</button>
                                    <button onClick={() => { setPrompt(proposedPrompt); setProposedPrompt(null); }} className="text-[10px] uppercase tracking-widest text-black bg-[#EFFF00] px-3 py-1 rounded-full font-bold hover:bg-[#d0ea40] transition-colors">Accept</button>
                                </div>
                            </div>
                            <textarea 
                                value={proposedPrompt}
                                onChange={(e) => setProposedPrompt(e.target.value)}
                                className="w-full bg-zinc-900/50 border border-zinc-700 rounded-lg p-2 text-white text-sm outline-none font-sans min-h-[60px] resize-y"
                            />
                            <span className="text-[9px] text-zinc-500 mt-1 block">You can manually edit the enhanced prompt before accepting.</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {promptMode === "advanced" && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="pt-4 border-t border-zinc-800 px-2 mt-2">
                            <span className="text-[10px] uppercase tracking-widest text-red-400 font-mono">Negative Prompt</span>
                            <input 
                                type="text"
                                value={negativePrompt}
                                onChange={(e) => setNegativePrompt(e.target.value)}
                                placeholder="Elements to exclude..."
                                className="w-full bg-transparent border-none outline-none text-zinc-400 text-sm mt-2"
                            />
                            {suggestedTerms.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {suggestedTerms.map(term => (
                                        <button
                                          key={term}
                                          onClick={() => addNegativeTerm(term)}
                                          className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-[10px] uppercase tracking-widest rounded transition-colors border border-zinc-700/50"
                                        >
                                          + {term}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 px-1 pt-1">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <button 
                       id="enhance-prompt-button"
                       onClick={handleEnhance}
                       disabled={isEnhancing || isGenerating || !prompt}
                       className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-[10px] uppercase tracking-widest transition-colors disabled:opacity-50 text-zinc-300 font-medium border border-zinc-700/60"
                       title="Uses Gemini 3.1 Flash Lite with your provided API key"
                    >
                        {isEnhancing ? <RefreshCw className="w-3 h-3 text-[#EFFF00] animate-spin" /> : <Wand2 className="w-3 h-3 text-[#EFFF00]" />} 
                        {isEnhancing ? "Enhancing..." : "Enhance"}
                    </button>
                    <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                      <Info className="w-3 h-3 text-blue-400 inline" />
                      <span>Enhance uses <span className="text-zinc-200 font-mono">gemini-3.1-flash-lite</span> with your key</span>
                    </span>
                  </div>
                </div>
                
                <button 
                   id="main-generate-button"
                   onClick={handleGenerate}
                   disabled={isGenerating || (!prompt && !settings.referenceImage && appMode !== "infographic") || (appMode === "infographic" && !prompt && infographicSettings.files.length === 0)}
                   className={`relative overflow-hidden group flex items-center justify-center gap-2 px-8 py-3 font-bold uppercase rounded-xl transition-all disabled:opacity-50 min-w-[200px] 
                   ${appMode === "viral" ? "bg-red-500 text-white hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]" : 
                     appMode === "infographic" ? "bg-emerald-500 text-black hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]" :
                     "bg-[#EFFF00] text-black hover:shadow-[0_0_20px_rgba(239,255,0,0.4)]"}`}
                >
                    {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>{appMode === "viral" ? "Start Engine" : appMode === "infographic" ? "Create Infographic" : "Generate"}</span>}
                </button>
            </div>
        </div>
      </div>
      <AnimatePresence>
        {isFullscreen && ((appMode === "standard" || appMode === "infographic") ? displayImage : currentImage) && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[100] bg-[#050505]/95 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
            onClick={() => setIsFullscreen(false)}
          >
            <button 
              className="absolute top-6 right-6 p-3 bg-zinc-900/80 hover:bg-[#EFFF00] hover:text-black rounded-full text-white border border-zinc-700 transition-colors z-[110]"
              onClick={(e) => { e.stopPropagation(); setIsFullscreen(false); }}
            >
              <X className="w-6 h-6" />
            </button>
            <motion.img 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }} 
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              src={((appMode === "standard" || appMode === "infographic") ? displayImage : currentImage)!.url} 
              alt="Fullscreen Preview"
              className="max-w-[95vw] max-h-[95vh] object-contain shadow-2xl rounded-sm" 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
