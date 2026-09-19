import React, { createContext, useContext, useState, ReactNode } from "react";
import { AppState, GenerationSettings, ImageRecord, CustomPreset, ThumbnailSettings, InfographicSettings, AppError } from "./types";

const defaultSettings: GenerationSettings = {
  temperature: 0.7,
  cfgScale: 7.0,
  seed: 42,
  useRandomSeed: true,
  numOutputs: 1,
  aspectRatio: "1:1",
  resolution: "1K",
  styleStrength: 50,
  thinkingLevel: "Balanced",
  creativity: 50,
  presetStyle: "Photorealistic",
  composition: {
    angle: "Eye level",
    lighting: "Studio",
    dof: false,
  },
  referenceImage: null,
  referenceStrength: 50,
  enableFaceSwap: false,
  faceImages: [],
  otherImages: [],
  maskImage: null,
};

const defaultThumbnailSettings: ThumbnailSettings = {
  aspectRatio: "16:9",
  scrollStopPower: 8,
  emotionTarget: "Shock",
  emotionIntensity: 8,
  textImpact: "",
  subjectIsolation: true,
  faceAmplifier: true,
  layout: "Left subject + right text",
  stylePreset: "Hyper Viral",
  abTestMode: false,
  enableFaceSwap: false,
  faceImages: [],
  otherImages: [],
};

const defaultInfographicSettings: InfographicSettings = {
  stylePreset: "Auto-Select",
  contentDensity: "Medium",
  visualRatio: "Balanced",
  audienceLevel: "Intermediate",
  explainThenVisualize: false,
  aspectRatio: "3:4",
  files: [],
  designQualityMode: true,
};

interface AppContextType extends AppState {
  setAppMode: (mode: "standard" | "viral" | "infographic") => void;
  setPrompt: (p: string) => void;
  setNegativePrompt: (p: string) => void;
  updateSetting: <K extends keyof GenerationSettings>(key: K, value: GenerationSettings[K]) => void;
  updateThumbnailSetting: <K extends keyof ThumbnailSettings>(key: K, value: ThumbnailSettings[K]) => void;
  updateInfographicSetting: <K extends keyof InfographicSettings>(key: K, value: InfographicSettings[K]) => void;
  updateComposition: (key: keyof GenerationSettings["composition"], value: any) => void;
  addHistory: (record: ImageRecord) => void;
  setGenerating: (generating: boolean) => void;
  setCurrentImage: (record: ImageRecord | null) => void;
  addCustomPreset: (name: string) => void;
  loadCustomPreset: (preset: CustomPreset) => void;
  removeCustomPreset: (id: string) => void;
  isMaskingToolOpen: boolean;
  setMaskingToolOpen: (open: boolean) => void;
  setApiKey: (key: string) => void;
  setSelectedModel: (model: string) => void;
  setLastError: (err: AppError | null) => void;
  clearError: () => void;
  isApiKeyModalOpen: boolean;
  setApiKeyModalOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [appMode, setAppMode] = useState<"standard" | "viral" | "infographic">("standard");
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [isGenerating, setGenerating] = useState(false);
  const [history, setHistory] = useState<ImageRecord[]>([]);
  const [currentImage, setCurrentImage] = useState<ImageRecord | null>(null);
  const [settings, setSettings] = useState<GenerationSettings>(defaultSettings);
  const [thumbnailSettings, setThumbnailSettings] = useState<ThumbnailSettings>(defaultThumbnailSettings);
  const [infographicSettings, setInfographicSettings] = useState<InfographicSettings>(defaultInfographicSettings);
  const [customPresets, setCustomPresets] = useState<CustomPreset[]>([]);
  const [isMaskingToolOpen, setMaskingToolOpen] = useState(false);

  // User Gemini API Key from localStorage or empty
  const [apiKey, setApiKeyState] = useState<string>(() => {
    try {
      return localStorage.getItem("gemini_user_api_key") || "";
    } catch {
      return "";
    }
  });

  const setApiKey = (newKey: string) => {
    setApiKeyState(newKey);
    try {
      if (newKey) {
        localStorage.setItem("gemini_user_api_key", newKey);
      } else {
        localStorage.removeItem("gemini_user_api_key");
      }
    } catch (e) {
      console.warn("Could not save API key to localStorage", e);
    }
  };

  // Selected Image Generation Model from localStorage or default
  const [selectedModel, setSelectedModelState] = useState<string>(() => {
    try {
      return localStorage.getItem("gemini_selected_image_model") || "gemini-3.1-flash-image";
    } catch {
      return "gemini-3.1-flash-image";
    }
  });

  const setSelectedModel = (model: string) => {
    setSelectedModelState(model);
    try {
      localStorage.setItem("gemini_selected_image_model", model);
    } catch (e) {
      console.warn("Could not save selected model to localStorage", e);
    }
  };

  // Error state for detailed error explanations
  const [lastError, setLastError] = useState<AppError | null>(null);
  const clearError = () => setLastError(null);

  // Modal state for entering API key
  const [isApiKeyModalOpen, setApiKeyModalOpen] = useState<boolean>(false);

  const updateSetting = <K extends keyof GenerationSettings>(key: K, value: GenerationSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const updateThumbnailSetting = <K extends keyof ThumbnailSettings>(key: K, value: ThumbnailSettings[K]) => {
    setThumbnailSettings((prev) => ({ ...prev, [key]: value }));
  };

  const updateInfographicSetting = <K extends keyof InfographicSettings>(key: K, value: InfographicSettings[K]) => {
    setInfographicSettings((prev) => ({ ...prev, [key]: value }));
  };

  const updateComposition = (key: keyof GenerationSettings["composition"], value: any) => {
    setSettings((prev) => ({
      ...prev,
      composition: { ...prev.composition, [key]: value },
    }));
  };

  const addHistory = (record: ImageRecord) => {
    setHistory((prev) => [record, ...prev]);
    setCurrentImage(record);
  };
  
  const addCustomPreset = (name: string) => {
    setCustomPresets(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      name,
      settings: { ...settings, referenceImage: null }
    }]);
  };
  
  const loadCustomPreset = (preset: CustomPreset) => {
    setSettings(prev => ({ ...preset.settings, referenceImage: prev.referenceImage }));
  };

  const removeCustomPreset = (id: string) => {
    setCustomPresets(prev => prev.filter(p => p.id !== id));
  };

  return (
    <AppContext.Provider
      value={{
        appMode, setAppMode,
        prompt, setPrompt,
        negativePrompt, setNegativePrompt,
        isGenerating, setGenerating,
        history, currentImage,
        settings, updateSetting, updateComposition, addHistory, setCurrentImage,
        thumbnailSettings, updateThumbnailSetting,
        infographicSettings, updateInfographicSetting,
        customPresets, addCustomPreset, loadCustomPreset, removeCustomPreset,
        isMaskingToolOpen, setMaskingToolOpen,
        apiKey, setApiKey,
        selectedModel, setSelectedModel,
        lastError, setLastError, clearError,
        isApiKeyModalOpen, setApiKeyModalOpen
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
