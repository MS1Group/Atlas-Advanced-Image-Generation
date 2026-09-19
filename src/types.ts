export interface AppError {
  title: string;
  message: string;
  details?: string;
  type?: "api_key" | "quota" | "safety" | "model" | "network" | "unknown";
  timestamp?: number;
}

export interface ModelOption {
  id: string;
  name: string;
  description: string;
  tag?: string;
  badge?: string;
  supportsResolution?: boolean;
}

export const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: "gemini-3.1-flash-image",
    name: "Gemini 3.1 Flash Image",
    description: "Nano Banana 2 - High-quality image generation and editing with configurable resolutions",
    tag: "Recommended",
    badge: "Recommended",
    supportsResolution: true,
  },
  {
    id: "gemini-3.1-flash-lite-image",
    name: "Gemini 3.1 Flash Lite Image",
    description: "Nano Banana Lite - Rapid, cost-effective generation and editing",
    tag: "Fast",
    badge: "Fast",
    supportsResolution: false,
  },
  {
    id: "gemini-3-pro-image",
    name: "Gemini 3 Pro Image",
    description: "Nano Banana Pro - Ultra-high detail & complex visual composition",
    tag: "Pro",
    badge: "Pro Quality",
    supportsResolution: true,
  },
  {
    id: "gemini-2.5-flash-image",
    name: "Gemini 2.5 Flash Image",
    description: "Standard flash image generation model",
    badge: "Legacy",
    supportsResolution: false,
  },
];

export interface AppState {
  appMode: "standard" | "viral" | "infographic";
  prompt: string;
  negativePrompt: string;
  isGenerating: boolean;
  history: ImageRecord[];
  currentImage: ImageRecord | null;
  settings: GenerationSettings;
  thumbnailSettings: ThumbnailSettings;
  infographicSettings: InfographicSettings;
  customPresets: CustomPreset[];
  apiKey: string;
  selectedModel: string;
  lastError: AppError | null;
}

export interface UploadedFile {
  name: string;
  mimeType: string;
  data: string; // base64
}

export interface InfographicSettings {
  stylePreset: "Auto-Select" | "Sketch Note" | "Kawaii" | "Professional" | "Scientific" | "Anime" | "Clay" | "Editorial" | "Instructional" | "Bento Grid" | "Brick";
  contentDensity: "Low" | "Medium" | "High";
  visualRatio: "Text-heavy" | "Balanced" | "Visual-heavy";
  audienceLevel: "Beginner" | "Intermediate" | "Exam-ready";
  explainThenVisualize: boolean;
  aspectRatio: string;
  files: UploadedFile[];
  designQualityMode: boolean;
}

export interface ThumbnailSettings {
  aspectRatio: string; // "1:1", "16:9", "9:16", "4:3", "3:4"
  scrollStopPower: number; // 1-10
  emotionTarget: "Shock" | "Curiosity" | "Fear" | "Excitement" | "Confusion";
  emotionIntensity: number; // 1-10
  textImpact: string; // Max 5 words
  subjectIsolation: boolean;
  faceAmplifier: boolean;
  layout: "Left subject + right text" | "Center face zoom" | "Before/After split" | "Object focus";
  stylePreset: "Hyper Viral" | "Clean Documentary" | "Tech" | "Gaming";
  abTestMode: boolean;
  enableFaceSwap: boolean;
  faceImages: string[];
  otherImages: string[];
}

export interface CustomPreset {
  id: string;
  name: string;
  settings: GenerationSettings;
}

export interface GenerationSettings {
  temperature: number; // 0-1.5 (mapped to prompt enhancer)
  cfgScale: number; // mapped to prompt
  seed: number;
  useRandomSeed: boolean;
  numOutputs: number; // 1-8
  aspectRatio: string; // "1:1", "16:9", "9:16", "4:3", "3:4"
  resolution: string; // "512px", "1K", "2K"
  styleStrength: number;
  thinkingLevel: "Minimal" | "Balanced" | "Deep";
  creativity: number;
  presetStyle: string;
  composition: {
    angle: string;
    lighting: string;
    dof: boolean;
  };
  referenceImage: string | null; // base64
  referenceStrength: number;
  enableFaceSwap: boolean;
  faceImages: string[];
  otherImages: string[];
  maskImage: string | null;
}

export interface ImageRecord {
  id: string;
  url: string;
  prompt: string;
  settings: GenerationSettings | ThumbnailSettings | InfographicSettings; // Allow different setting types depending on mode
  timestamp: number;
  ctrScore?: number;
  mode: "standard" | "viral" | "infographic";
}
