/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppProvider, useAppContext } from "./store";
import { Sidebar } from "./components/Sidebar";
import { ThumbnailSidebar } from "./components/ThumbnailSidebar";
import { InfographicSidebar } from "./components/InfographicSidebar";
import { MainArea } from "./components/MainArea";
import { MaskingTool } from "./components/MaskingTool";
import { ApiKeyModal } from "./components/ApiKeyModal";
import { Key, Cpu } from "lucide-react";
import { AVAILABLE_MODELS } from "./types";

function AppContent() {
  const { appMode, setAppMode, apiKey, selectedModel, setApiKeyModalOpen } = useAppContext();
  const activeModelObj = AVAILABLE_MODELS.find(m => m.id === selectedModel) || AVAILABLE_MODELS[0];

  return (
    <div className="flex h-screen w-screen overflow-hidden text-zinc-300 selection:bg-[#EFFF00] selection:text-black font-sans leading-relaxed relative flex-col">
       {/* Global Top Nav */}
       <header className="h-12 bg-[#050505] border-b border-zinc-800 flex items-center justify-between px-4 flex-shrink-0 z-50">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-[#EFFF00] rounded flex items-center justify-center">
              <div className="w-2.5 h-2.5 bg-black rounded-full"></div>
            </div>
            <span className="font-bold tracking-tight text-white uppercase text-xs hidden sm:inline">
              Atlas <span className="text-[10px] text-[#EFFF00] font-mono">PRO</span>
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button 
              id="mode-tab-standard"
              onClick={() => setAppMode("standard")}
              className={`px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${appMode === 'standard' ? 'bg-[#EFFF00] text-black' : 'text-zinc-500 hover:text-white'}`}
            >
              Studio Mode
            </button>
            <button 
              id="mode-tab-viral"
              onClick={() => setAppMode("viral")}
              className={`px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${appMode === 'viral' ? 'bg-red-500 text-white' : 'text-zinc-500 hover:text-white'}`}
            >
              Viral Engine
            </button>
            <button 
              id="mode-tab-infographic"
              onClick={() => setAppMode("infographic")}
              className={`px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${appMode === 'infographic' ? 'bg-emerald-500 text-white' : 'text-zinc-500 hover:text-white'}`}
            >
              Infographic Maker
            </button>
          </div>

          {/* Quick Header Config Trigger */}
          <div className="flex items-center gap-2">
            <button
              id="header-api-key-button"
              onClick={() => setApiKeyModalOpen(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono border transition-all ${
                apiKey 
                  ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/50" 
                  : "bg-amber-950/30 border-amber-800/50 text-amber-300 hover:bg-amber-900/40"
              }`}
              title="Click to configure Gemini API Key and Model"
            >
              <Key className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{apiKey ? "Key Active" : "Add API Key"}</span>
              <span className="text-[10px] text-zinc-500 hidden lg:inline">({activeModelObj.name})</span>
            </button>
          </div>
       </header>

       <div className="flex flex-1 overflow-hidden">
         {appMode === "standard" && <Sidebar />}
         {appMode === "viral" && <ThumbnailSidebar />}
         {appMode === "infographic" && <InfographicSidebar />}
         <MainArea />
       </div>

       <MaskingTool />
       <ApiKeyModal />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
       <AppContent />
    </AppProvider>
  );
}

