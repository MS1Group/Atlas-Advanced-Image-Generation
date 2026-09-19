import React, { useState } from "react";
import { useAppContext } from "../store";
import { Key, Check, AlertCircle, Eye, EyeOff, X, ExternalLink, Loader2, ShieldCheck, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getGenAI, parseGeminiError } from "../api";

export function ApiKeyModal() {
  const { apiKey, setApiKey, isApiKeyModalOpen, setApiKeyModalOpen, clearError } = useAppContext();
  const [inputVal, setInputVal] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [testFeedback, setTestFeedback] = useState<string>("");

  if (!isApiKeyModalOpen) return null;

  const handleSave = () => {
    setApiKey(inputVal.trim());
    clearError();
    setTestStatus("idle");
    setApiKeyModalOpen(false);
  };

  const handleClear = () => {
    setInputVal("");
    setApiKey("");
    setTestStatus("idle");
    setTestFeedback("");
  };

  const handleTestConnection = async () => {
    const keyToTest = inputVal.trim() || apiKey.trim();
    if (!keyToTest) {
      setTestStatus("error");
      setTestFeedback("Please enter a Gemini API key first.");
      return;
    }

    setTestStatus("testing");
    setTestFeedback("");

    try {
      const ai = getGenAI(keyToTest);
      // Quick lightweight verification call with gemini-3.1-flash-lite
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: "Respond with single word: OK",
      });
      if (response.text) {
        setTestStatus("success");
        setTestFeedback("API key is valid and connected to Google Gemini successfully!");
        setApiKey(keyToTest);
        clearError();
      } else {
        throw new Error("Empty response received from Gemini.");
      }
    } catch (err: any) {
      const parsed = parseGeminiError(err);
      setTestStatus("error");
      setTestFeedback(`${parsed.title}: ${parsed.message} ${parsed.details || ""}`);
    }
  };

  return (
    <AnimatePresence>
      <div 
        id="api-key-modal-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
        onClick={() => setApiKeyModalOpen(false)}
      >
        <motion.div
          id="api-key-modal-content"
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg bg-[#0d0d0f] border border-zinc-800 rounded-xl shadow-2xl p-6 text-zinc-100 flex flex-col gap-5"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-zinc-100 leading-tight">Gemini API Key</h2>
                <p className="text-xs text-zinc-400">Configure your personal Google AI key</p>
              </div>
            </div>
            <button
              id="close-api-key-modal-button"
              onClick={() => setApiKeyModalOpen(false)}
              className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Explanation Banner */}
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-lg p-3.5 flex flex-col gap-2 text-xs text-zinc-300">
            <div className="flex items-center gap-1.5 font-medium text-amber-300">
              <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>Direct Client Authentication</span>
            </div>
            <p className="text-zinc-400 leading-relaxed">
              Your API key powers prompt enhancement and image generation directly with Google Gemini. 
              It is stored only in your local browser storage.
            </p>
            <div className="mt-1 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-zinc-400">
              <span>Need a key? Free keys at Google AI Studio:</span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-amber-400 hover:underline font-medium"
              >
                Get API Key <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Model & Feature Notice */}
          <div className="bg-blue-950/25 border border-blue-800/40 rounded-lg p-3 text-xs text-blue-200">
            <p className="leading-relaxed">
              <strong className="text-blue-300">Enhance Feature:</strong> Uses <span className="font-mono bg-blue-900/50 px-1 py-0.5 rounded text-blue-200">gemini-3.1-flash-lite</span> with your personal API key for rapid, intelligent prompt expansion.
            </p>
          </div>

          {/* Input field */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-zinc-300">Enter Your Gemini API Key</label>
            <div className="relative flex items-center">
              <input
                id="gemini-api-key-input"
                type={showKey ? "text" : "password"}
                value={inputVal}
                onChange={(e) => {
                  setInputVal(e.target.value);
                  if (testStatus !== "idle") setTestStatus("idle");
                }}
                placeholder="AIzaSy..."
                className="w-full bg-zinc-950 border border-zinc-700/80 rounded-lg px-3.5 py-2.5 pr-20 text-sm font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
              <div className="absolute right-2 flex items-center gap-1">
                <button
                  type="button"
                  id="toggle-api-key-visibility-button"
                  onClick={() => setShowKey(!showKey)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded hover:bg-zinc-800 transition-colors"
                  title={showKey ? "Hide key" : "Show key"}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Test Status feedback */}
          {testStatus !== "idle" && (
            <div
              id="api-key-test-feedback"
              className={`p-3 rounded-lg text-xs flex items-start gap-2.5 ${
                testStatus === "testing"
                  ? "bg-zinc-900 border border-zinc-700 text-zinc-300"
                  : testStatus === "success"
                  ? "bg-emerald-950/40 border border-emerald-800/60 text-emerald-300"
                  : "bg-red-950/40 border border-red-800/60 text-red-300"
              }`}
            >
              {testStatus === "testing" ? (
                <Loader2 className="w-4 h-4 animate-spin flex-shrink-0 text-zinc-400 mt-0.5" />
              ) : testStatus === "success" ? (
                <Check className="w-4 h-4 flex-shrink-0 text-emerald-400 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400 mt-0.5" />
              )}
              <div className="leading-relaxed">
                {testStatus === "testing" ? "Testing connection with gemini-3.1-flash-lite..." : testFeedback}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 mt-1">
            <div>
              {apiKey && (
                <button
                  id="clear-api-key-button"
                  onClick={handleClear}
                  type="button"
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear Key
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                id="test-api-key-button"
                onClick={handleTestConnection}
                disabled={testStatus === "testing" || !inputVal.trim()}
                type="button"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg border border-zinc-700 transition-colors"
              >
                {testStatus === "testing" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Test Connection
              </button>
              <button
                id="save-api-key-button"
                onClick={handleSave}
                type="button"
                className="px-4 py-2 text-xs font-semibold text-black bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-sm"
              >
                Save & Apply
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
