import React from "react";
import { useAppContext } from "../store";
import { AlertTriangle, X, Key, RotateCw, ExternalLink, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function ErrorAlert() {
  const { lastError, clearError, setApiKeyModalOpen, setSelectedModel } = useAppContext();

  if (!lastError) return null;

  const isApiKeyIssue = lastError.type === "api_key";
  const isQuotaIssue = lastError.type === "quota";
  const isModelIssue = lastError.type === "model";

  return (
    <AnimatePresence>
      <motion.div
        id="app-error-alert"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="w-full mb-4 bg-red-950/40 border border-red-800/80 rounded-xl p-4 text-zinc-100 shadow-lg backdrop-blur-sm"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-red-200">{lastError.title}</h4>
                {lastError.type && (
                  <span className="px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded bg-red-900/60 border border-red-700/60 text-red-300">
                    {lastError.type}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-200 leading-relaxed font-medium">{lastError.message}</p>
              {lastError.details && (
                <p className="text-xs text-zinc-400 leading-relaxed pt-0.5">{lastError.details}</p>
              )}
            </div>
          </div>

          <button
            id="dismiss-error-button"
            onClick={clearError}
            className="text-zinc-400 hover:text-zinc-200 p-1 rounded hover:bg-zinc-800/60 transition-colors flex-shrink-0"
            title="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action recommendations based on error */}
        <div className="mt-3 pt-3 border-t border-red-900/40 flex flex-wrap items-center gap-2">
          {isApiKeyIssue && (
            <button
              id="error-configure-api-key-button"
              onClick={() => {
                clearError();
                setApiKeyModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-black text-xs font-semibold rounded-lg transition-colors"
            >
              <Key className="w-3.5 h-3.5" />
              Configure Gemini API Key
            </button>
          )}

          {isQuotaIssue && (
            <button
              id="error-switch-to-lite-button"
              onClick={() => {
                setSelectedModel("gemini-3.1-flash-lite-image");
                clearError();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-medium rounded-lg transition-colors"
            >
              Switch to Gemini 3.1 Flash Lite Image
            </button>
          )}

          {isModelIssue && (
            <button
              id="error-switch-to-default-model-button"
              onClick={() => {
                setSelectedModel("gemini-3.1-flash-image");
                clearError();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-medium rounded-lg transition-colors"
            >
              Reset to Recommended Model (Gemini 3.1 Flash Image)
            </button>
          )}

          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-red-300 hover:text-red-200 hover:underline ml-auto"
          >
            <HelpCircle className="w-3.5 h-3.5" /> Check Key Quota & Permissions <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
