"use strict";
import { GoogleGenAI } from "@google/genai";
import { GenerationSettings, ThumbnailSettings, ImageRecord, InfographicSettings, UploadedFile, AppError } from "./types";

/**
 * Returns an instance of GoogleGenAI using the user's provided API key
 * or falling back to the environment variable.
 */
export function getGenAI(userApiKey?: string): GoogleGenAI {
  const key = (userApiKey && userApiKey.trim()) || process.env.GEMINI_API_KEY || "";
  if (!key) {
    throw new Error("MISSING_API_KEY: No Gemini API key provided. Please enter your Gemini API key in the top navigation bar to generate images.");
  }
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

/**
 * Parses any Gemini SDK or network error into a structured, human-readable
 * error explanation with actionable details.
 */
export function parseGeminiError(err: any): AppError {
  const rawMsg = err?.message || (typeof err === "string" ? err : JSON.stringify(err)) || "Unknown error";
  const str = rawMsg.toLowerCase();

  if (str.includes("missing_api_key") || str.includes("no gemini api key")) {
    return {
      title: "Gemini API Key Required",
      message: "Please provide a Gemini API key using the 'API Key' button in the top navigation bar.",
      details: "An API key is required by Google Gemini to process generation requests.",
      type: "api_key",
      timestamp: Date.now()
    };
  }

  if (str.includes("api_key_invalid") || str.includes("invalid api key") || str.includes("api key not valid") || str.includes("unregistered callers")) {
    return {
      title: "Invalid API Key",
      message: "Google Gemini returned 'API_KEY_INVALID'.",
      details: "Your API key was not recognized by Google AI Studio. Please verify that the key is copied accurately from https://aistudio.google.com/app/apikey and has no extra spaces.",
      type: "api_key",
      timestamp: Date.now()
    };
  }

  if (str.includes("permission_denied") || str.includes("403") || str.includes("permissiondenied")) {
    return {
      title: "Permission Denied (403)",
      message: "The provided API key does not have permissions for the requested model or feature.",
      details: "Paid or preview models (e.g. Gemini 3 Pro Image or 2K/4K resolution) require a project with billing enabled in Google Cloud / AI Studio.",
      type: "api_key",
      timestamp: Date.now()
    };
  }

  if (str.includes("resource_exhausted") || str.includes("429") || str.includes("quota") || str.includes("rate limit")) {
    return {
      title: "Quota / Rate Limit Exceeded (429)",
      message: "Your Gemini API key has exceeded its current request quota or rate limit.",
      details: "Free-tier keys have per-minute request limits. Please wait 30-60 seconds before retrying, or switch to 'Gemini 3.1 Flash Lite Image' for a lower footprint.",
      type: "quota",
      timestamp: Date.now()
    };
  }

  if (str.includes("safety") || str.includes("blocked") || str.includes("finishreason") || str.includes("safetyrating")) {
    return {
      title: "Content Safety Filter Triggered",
      message: "Generation was halted by Gemini's safety guidelines.",
      details: "One or more terms in the prompt, negative prompt, or input images matched sensitive content filters. Try rephrasing or removing sensitive words.",
      type: "safety",
      timestamp: Date.now()
    };
  }

  if (str.includes("not found") || str.includes("404") || str.includes("is not supported") || str.includes("unsupported")) {
    return {
      title: "Model Unavailable (404)",
      message: "The requested model could not be accessed with this API key.",
      details: `The model returned a 404 or unsupported error. Try selecting "Gemini 3.1 Flash Image" or "Gemini 3.1 Flash Lite Image" in the top bar.`,
      type: "model",
      timestamp: Date.now()
    };
  }

  if (str.includes("network") || str.includes("failed to fetch") || str.includes("econnrefused") || str.includes("abort")) {
    return {
      title: "Network Connection Issue",
      message: "Unable to connect to Google Gemini API servers.",
      details: "Please verify your internet connection or check if a browser extension is blocking requests to api.generativeai.google.com.",
      type: "network",
      timestamp: Date.now()
    };
  }

  return {
    title: "Generation Request Failed",
    message: rawMsg.replace(/^Error:\s*/i, ""),
    details: "An unexpected error occurred during model inference. Check the prompt, format settings, or model selection.",
    type: "unknown",
    timestamp: Date.now()
  };
}

/**
 * Enhances a text prompt using the user's API key and Gemini 3.1 Flash Lite.
 */
export async function enhancePrompt(
  prompt: string, 
  settings: GenerationSettings,
  userApiKey?: string
): Promise<string> {
  if (!prompt) return prompt;
  try {
    const ai = getGenAI(userApiKey);
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: `You are an expert visual prompt engineer. Enhance the following text-to-image prompt into a single rich, descriptive paragraph.
Focus on:
- Style: ${settings.presetStyle}
- Lighting: ${settings.composition.lighting}
- Camera Angle: ${settings.composition.angle}
- Depth of Field: ${settings.composition.dof ? "Shallow depth of field with cinematic blurred background" : "Sharp focus throughout"}
- Creativity Level: ${settings.creativity} (0 is strictly faithful to original, 100 is highly creative embellishment)
- Visual Details: rich textural descriptions, atmosphere, color palette, lighting nuances, and clear composition.
Do not output conversational introductory text. Output ONLY the refined visual prompt paragraph.

Original prompt: "${prompt}"`,
      config: {
        temperature: settings.temperature,
      }
    });
    return response.text?.trim() || prompt;
  } catch (e) {
    console.error("Prompt enhancer failed:", e);
    throw e;
  }
}

export async function generateViralThumbnails(
  topicPrompt: string, 
  settings: ThumbnailSettings,
  selectedModel?: string,
  userApiKey?: string
): Promise<{ url: string, ctrScore: number, prompt: string }[]> {
  try {
    const ai = getGenAI(userApiKey);
    const imageModel = selectedModel || "gemini-3.1-flash-image";

    // 0. Search Grounding & Topic Expansion
    const searchRes = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `Analyze the following YouTube video topic. If you are not sure about the topic, or if it involves a meme, recent event, or character that requires external knowledge to depict accurately, use Google Search to find its core visual elements. Then, output an expanded description of what should be visually depicted in the thumbnail. If no search is needed, just refine the topic for an image generator. Topic: "${topicPrompt}"`,
        config: {
            tools: [{ googleSearch: {} }]
        }
    });
    const expandedTopicPrompt = searchRes.text?.trim() || topicPrompt;

    // 1. Text transformation & Prompt Assembly
    const basePrompt = expandedTopicPrompt || "A captivating video topic";
    let textImpactStr = "";
    
    // Auto-rewrite text if provided
    if (settings.textImpact) {
      const textResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Rewrite the following text into a 3-5 word high click-through rate (CTR) YouTube thumbnail power-phrase. Output ONLY the up to 5 words, no quotes: "${settings.textImpact}"`
      });
      const powerPhrase = textResponse.text?.trim() || settings.textImpact;
      textImpactStr = `Include large, bold, high-contrast readable text that says "${powerPhrase}".`;
    }

    const faceModifier = settings.faceAmplifier ? "extreme close up face zoom, highly exaggerated expressive eyes and mouth," : "";
    const isoModifier = settings.subjectIsolation ? "strong edge glow, prominent rim lighting, isolated subject against clean background," : "";
    
    // Face Swap Instruction
    const faceSwapPrompt = settings.enableFaceSwap && settings.faceImages?.length > 0
        ? "CRITICAL MANDATE: Perform a highly accurate FACE SWAP. The primary subject's face MUST be completely replaced with the exact identity, facial features, and likeness of the provided 'face' reference image(s). Ensure seamless blending. "
        : "";

    // Convert 1-10 intensity to descriptive wording
    let intensityWording = "subtle";
    if (settings.emotionIntensity > 3) intensityWording = "moderate";
    if (settings.emotionIntensity > 6) intensityWording = "strong";
    if (settings.emotionIntensity > 8) intensityWording = "extreme, over-the-top";

    const textConstraint = "CRITICAL MANDATE: ALL text, words, labels, and mathematical equations MUST be spelled correctly with absolute 100% precision. Do NOT hallucinate misspelled words or gibberish text. You MUST EXACTLY replicate any text provided in the prompt. ";

    const thumbnailPrompt = `Highly clickable YouTube thumbnail, single dominant subject, expressive ${settings.emotionTarget} at ${intensityWording} intensity, strong contrast, clean background, bold composition, cinematic lighting, ${faceModifier} ${isoModifier} ${textImpactStr} optimized for CTR, ${settings.stylePreset} style, ${settings.layout} layout, visually overwhelming saturation and sharpness. Context: ${basePrompt}. ${faceSwapPrompt}${textConstraint}CRITICAL: Strictly preserve and replicate the exact original colors of any provided reference or asset images.`;

    const numVars = settings.abTestMode ? 6 : 2; // Generating variants
    const promises = [];
    let lastErrorMsg = "";
    
    for (let i = 0; i < numVars; i++) {
        promises.push((async () => {
             const parts: any[] = [{ text: thumbnailPrompt }];
             
             // Append given reference images
             [...(settings.faceImages || []), ...(settings.otherImages || [])].forEach(imgStr => {
                 const matches = imgStr.match(/^data:(.+?);base64,(.+)$/);
                 if (matches && matches.length === 3) {
                     parts.push({
                         inlineData: {
                             mimeType: matches[1],
                             data: matches[2]
                         }
                     });
                 }
             });

             const config: any = {};
             const hasImages = parts.some(p => p.inlineData);
             if (!hasImages || imageModel.includes("3")) {
                 config.imageConfig = { aspectRatio: settings.aspectRatio || "16:9" };
             }

             try {
                 const res = await ai.models.generateContent({
                     model: imageModel,
                     contents: { parts },
                     config
                 });
                 
                 const candidate = res.candidates?.[0];
                 if (candidate?.finishReason && candidate.finishReason !== "STOP") {
                     throw new Error(`Generation blocked by safety filter. Reason: ${candidate.finishReason}`);
                 }

                 let b64 = "";
                 for (const part of candidate?.content?.parts || []) {
                     if (part.inlineData) {
                         b64 = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
                         break;
                     }
                 }
                 if (!b64) throw new Error("API returned success but no image layer was found in payload.");
                 return b64;
             } catch (err: any) {
                 lastErrorMsg = err.message || err.toString();
                 console.error("Viral generation inner error:", err);
                 throw err;
             }
        })());
    }

    const generatedImages = await Promise.allSettled(promises);
    const validImages = generatedImages
      .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
      .map(r => r.value);

    if (validImages.length === 0) {
        throw new Error(`Viral Engine failed to generate variants: ${lastErrorMsg}`);
    }

    // 2. Auto-Validation Scoring
    const scoredImages = await Promise.all(validImages.map(async (img) => {
        try {
            const matches = img.match(/^data:(.+?);base64,(.+)$/);
            if (!matches) return { url: img, score: 50 };
            
            // Score with Flash
            const scoreRes = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [
                    { inlineData: { mimeType: matches[1], data: matches[2] } },
                    { text: "Evaluate this YouTube thumbnail's CTR potential (0-100). Consider: contrast strength (25%), face prominence (25%), text clarity (20%), color intensity (15%), composition (15%). Output a JSON object with exactly one key `score` containing an integer between 0 and 100 representing the total score. Do not wrap with codeblocks." }
                ],
                config: {
                    responseMimeType: "application/json",
                }
            });
            const t = scoreRes.text?.trim() || "{}";
            let score = 50;
            try {
                const j = JSON.parse(t);
                if (j.score) score = j.score;
            } catch (e) { console.error("scoring parse error", t); }
            
            return { url: img, score };
        } catch (e) {
            return { url: img, score: 50 };
        }
    }));

    // Filter and return Top 2
    scoredImages.sort((a, b) => b.score - a.score);
    const top2 = scoredImages.slice(0, settings.abTestMode ? 3 : 2);

    return top2.map(s => ({
        url: s.url,
        ctrScore: s.score,
        prompt: thumbnailPrompt
    }));
  } catch (e) {
    console.error("Viral Engine failed", e);
    throw e;
  }
}

export async function generateInfographic(
  topicPrompt: string,
  settings: InfographicSettings,
  selectedModel?: string,
  userApiKey?: string
): Promise<string> {
  try {
    const ai = getGenAI(userApiKey);
    const imageModel = selectedModel || "gemini-3.1-flash-image";
    let sourceContent = topicPrompt || "General Knowledge";
    
    // Assemble files if uploaded
    const fileParts: any[] = [];
    if (settings.files && settings.files.length > 0) {
        settings.files.forEach(f => {
            fileParts.push({
                inlineData: {
                    mimeType: f.mimeType,
                    data: f.data
                }
            });
        });
        sourceContent += "\\n\\nAttached files contain the primary source material.";
    }

    // Step 1: Optional "Explain then Visualize" Expansion + Verification
    let explanationContext = "";
    if (settings.explainThenVisualize) {
        const explainRes = await ai.models.generateContent({
            model: "gemini-3.1-pro-preview",
            contents: [
                ...fileParts,
                { text: `You are an expert educator. Extract and explain the core concepts from the following topic or source material in clear, simple terms suitable for a ${settings.audienceLevel} audience. Eliminate fluff. If you are not sure about the topic, or if it mentions a new AI model, meme, or concept requiring external knowledge, use Google Search to find current information about it before explaining. CRITICAL MANDATE: Prioritize extreme text accuracy. Ensure all spelling, facts, and any mathematical equations/notation are 100% correct and precisely formatted. Topic: ${sourceContent}` }
            ],
            config: {
                tools: [{ googleSearch: {} }]
            }
        });
        explanationContext = explainRes.text?.trim() || "";
    }

    // Step 2: Content Compression & Structural Mapping
    let maxSections = 5;
    if (settings.contentDensity === "Low") maxSections = 3;
    if (settings.contentDensity === "High") maxSections = 7;

    const structuralPrompt = `
      Act as an Educational Compression Engine.
      Analyze the following topic or content, and generate/compress it into EXACTLY 3 to ${maxSections} key sections about this specific topic.
      CRITICAL: You MUST write about the requested topic. Do not drift or write about something else. If the input is just a short topic (e.g., "photosynthesis"), generate a comprehensive overview of that specific topic!
      Rule 1: Each section MUST have a title of 6 words or less.
      Rule 2: Each section MUST have 1-2 very short bullet points.
      Rule 3: Remove redundant text, filler, and weak examples. Use ${settings.audienceLevel} vocabulary.
      Rule 4: Determine the best visual layout type from: [Process, Comparison, Concept, Data, Mixed]
      ${settings.stylePreset === "Auto-Select" ? `Rule 5: Analyze the topic, audience level, and content density, and determine the BEST fitting visual style from this list: Sketch Note, Kawaii, Professional, Scientific, Anime, Clay, Editorial, Instructional, Bento Grid, Brick.` : ''}
      
      Topic / Content to process:
      ${settings.explainThenVisualize ? explanationContext : sourceContent}
      
      Output ONLY a JSON object exactly like this:
      {
        "layoutType": "Process",
        "title": "Main Infographic Title",
        ${settings.stylePreset === "Auto-Select" ? `"determinedStyle": "Sketch Note",` : ''}
        "sections": [
           { "title": "Section 1", "bullets": ["Point 1"] }
        ]
      }
    `;

    const compressRes = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: [
            ...(settings.explainThenVisualize ? [] : fileParts),
            { text: structuralPrompt + "\nIf you are not sure about the topic or need external knowledge to accurately structure it, use Google Search to find current facts and verify." }
        ],
        config: { 
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json"
        }
    });

    let compressedData: any = {};
    try {
        compressedData = JSON.parse(compressRes.text?.trim() || "{}");
    } catch(e) {
        throw new Error("Failed to parse structural compression.");
    }

    if (!compressedData.sections || !Array.isArray(compressedData.sections)) {
        throw new Error("Compression engine returned invalid structure.");
    }

    // Step 2.5: Clarity Validation System
    // Thorough check of extracted text for accuracy, spelling, and math notation before generating the image.
    const validationPrompt = `
      You are the 'Clarity Validation System'. You must perform a rigorous multi-step validation on the following infographic JSON structure.
      
      Sub-step 1: Analyze the text content for ANY spelling, typographical, or grammatical errors. If significant errors or lack of clarity are found, you MUST completely regenerate and rewrite the afflicted text to be 100% correct and precise.
      Sub-step 2: If any mathematical equations, formulas, or notations are present, strictly validate them for correct mathematical notation, syntax, and logical accuracy. Rewrite them if they are flawed or improperly formatted.
      Sub-step 3: Ensure the text is perfectly tuned for a ${settings.audienceLevel} audience without expanding length.
      
      Return the corrected and verified JSON using the EXACT SAME structure format. Outputs must ONLY contain the JSON.
      
      JSON to validate:
      ${JSON.stringify(compressedData)}
    `;

    try {
        const validationRes = await ai.models.generateContent({
            model: "gemini-3.1-pro-preview",
            contents: [{ text: validationPrompt }],
            config: { responseMimeType: "application/json" }
        });
        
        const validatedData = JSON.parse(validationRes.text?.trim() || "{}");
        if (validatedData.sections && Array.isArray(validatedData.sections)) {
            // Overwrite with validated data if structure is sound
            compressedData = validatedData;
        }
    } catch(e) {
        console.warn("Clarity Validation System failed to parse response, proceeding with original unvalidated data.", e);
    }

    // Step 3: Visual Mapping into standard Image Generation
    
    // Map structural data back into visual instructions
    const visualInstructions = compressedData.sections.map((s: any, i: number) => `Section ${i+1} [${s.title}]: ${s.bullets.join(", ")}`).join(" | ");

    const textHeavyModifier = settings.visualRatio === "Text-heavy" ? "detailed readable text boxes, textbook style, informative text" : "";
    const visualHeavyModifier = settings.visualRatio === "Visual-heavy" ? "highly visual, large icons, minimal text, diagrams, flowcharts, heavy use of bold arrows and visual metaphors" : "";
    
    const activeStyle = settings.stylePreset === "Auto-Select" ? (compressedData.determinedStyle || "Professional") : settings.stylePreset;

    const styleInstructions: Record<string, string> = {
      "Sketch Note": "Hand-drawn look. Slightly imperfect lines. Black/white base with minimal accent colors. Doodle-style icons. Loose layout but readable. Mimics notebook learning. Flat vs 3D vs sketch: sketch.",
      "Kawaii": "Soft pastel colors. Rounded shapes. Cute icons and characters. Friendly typography. High spacing, low density. Beginner-friendly learning. Flat vs 3D vs sketch: flat / soft.",
      "Professional": "Clean, corporate layout. Neutral palette (blue, gray, white). Minimal icons. Strong alignment and spacing. High readability, no visual noise. Flat vs 3D vs sketch: flat.",
      "Scientific": "Precise, structured layout. Grid-based alignment. Thin lines, labeled diagrams. Minimal color usage. Emphasis on clarity and accuracy. Flat vs 3D vs sketch: flat.",
      "Anime": "High contrast colors. Dynamic composition. Stylized illustrations. Bold lighting and shadows. Energetic visual flow. Flat vs 3D vs sketch: stylized/anime.",
      "Clay": "3D soft clay rendering. Rounded objects with depth. Soft shadows and lighting. Playful but clean layout. Flat vs 3D vs sketch: 3D clay.",
      "Editorial": "Magazine-like layout. Strong typography hierarchy. Image + text balance. Clean but visually rich sections. Flat vs 3D vs sketch: flat.",
      "Instructional": "Step-by-step layout. Numbered sections. Arrows and process indicators. High clarity, functional design. Flat vs 3D vs sketch: flat.",
      "Bento Grid": "Modular card-based layout. Uneven grid (like modern UI dashboards). Strong spacing and grouping. Minimal but visually structured. Flat vs 3D vs sketch: flat.",
      "Brick": "Block-based design using interlocking bricks (LEGO INSPIRED). Bright primary colors (red, yellow, blue). 3D plastic texture. Each section = a brick module. Rounded studs on top of blocks. Playful but structured layout. Must maintain readability and hierarchy. Flat vs 3D vs sketch: 3D plastic bricks."
    };
    
    // Fallback if existing/old style preset is somehow retained in state
    const targetStyleInstruction = styleInstructions[activeStyle] || styleInstructions["Professional"];

    let finalVisualPrompt = `Design a high-quality educational infographic.
    Title: "${compressedData.title}".
    Structure layout: ${compressedData.layoutType} layout.
    Style System Name: ${activeStyle}.
    Style Definition (Apply this STRICTLY to control layout, colors, typography, icon type, and depth): ${targetStyleInstruction}
    Contents to map: ${visualInstructions}.
    Visual constraints: ${textHeavyModifier} ${visualHeavyModifier}. Clean hierarchy, highly readable typography, professional graphic design, Ensure strict adherence to the structural outline. DO NOT produce generic meaningless charts without proper textual labels.
    CRITICAL MANDATE: ALL text, words, labels, and mathematical equations MUST be spelled correctly with absolute 100% precision. Do NOT hallucinate misspelled words or gibberish text. You MUST EXACTLY replicate the text provided in the instructions, and NEVER write about a different topic.`;

    if (settings.designQualityMode) {
      finalVisualPrompt = `Create a professional, visually rich infographic about the requested topic with:
- strong visual hierarchy (large dominant title at top, clear section grouping)
- modular sections (e.g. "Modular Panel Layout", "Flow Narrative Layout", or "Cluster Layout")
- consistent iconography (icons must support meaning, not just random decoration)
- soft shadows and depth (layered elements, rounded containers, foreground vs background)
- clean spacing and alignment
- minimal text per section (max 1-2 lines per section)
- color system: 2-3 primary colors, 1 accent color, high contrast, subtle gradient backgrounds (UNLESS overridden by style system below).
Avoid basic boxes. Avoid flat rectangles with plain colors. Avoid long paragraphs and small text. Design like a premium educational infographic.

Title: "${compressedData.title}".
Style System Name: ${activeStyle}.
Style Definition (Apply this STRICTLY to control layout, colors, typography, icon type, and depth): ${targetStyleInstruction}
Contents to map into sections: ${visualInstructions}.
CRITICAL MANDATE: ALL text MUST be spelled correctly with absolute 100% precision. EXACTLY replicate the text provided. NEVER change the topic to something else.`;
    }

    const config: any = {
        imageConfig: { aspectRatio: settings.aspectRatio }
    };

    let maxRetries = settings.designQualityMode ? 3 : 1;
    let b64 = "";

    for (let attempts = 0; attempts < maxRetries; attempts++) {
        const imageRes = await ai.models.generateContent({
             model: imageModel,
             contents: [{ text: finalVisualPrompt }],
             config
        });
        
        const candidate = imageRes.candidates?.[0];
        if (candidate?.finishReason && candidate.finishReason !== "STOP") {
            throw new Error(`Generation blocked by safety filter. Reason: ${candidate.finishReason}`);
        }

        for (const part of candidate?.content?.parts || []) {
            if (part.inlineData) {
                b64 = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
                break;
            }
        }
        if (!b64) throw new Error("API returned success but no image layer was found in payload.");

        if (settings.designQualityMode) {
            try {
                const evalRes = await ai.models.generateContent({
                    model: "gemini-3.1-pro-preview",
                    contents: [
                        { inlineData: { mimeType: 'image/png', data: b64.split(",")[1] } },
                        { text: `Evaluate this infographic against premium design standards AND its assigned style system: "${activeStyle}". 
Reject if ANY of the following are true:
1. It looks like simple flat boxes with generic styling.
2. It lacks visual hierarchy or coherent grouping.
3. It has text overload or unreadable small text.
4. The visual style is inconsistent across sections.
5. It fails to authentically represent the "${activeStyle}" style system.

Output ONLY a JSON object exactly like this: {"passed": true} or {"passed": false}` }
                    ],
                    config: { responseMimeType: "application/json" }
                });
                
                const passed = JSON.parse(evalRes.text?.trim() || "{}").passed;
                if (passed || attempts === maxRetries - 1) {
                    break;
                } else {
                    b64 = ""; // Try again
                    console.log("Quality validation failed, regenerating image...");
                }
            } catch (e) {
                console.warn("Validation parsing failed, accepting image.", e);
                break;
            }
        } else {
            break;
        }
    }

    return b64;
  } catch (e) {
    console.error("Infographic Engine failed:", e);
    throw e;
  }
}

export async function generateImage(
  prompt: string, 
  negativePrompt: string, 
  settings: GenerationSettings,
  selectedModel?: string,
  userApiKey?: string
): Promise<string> {
  const ai = getGenAI(userApiKey);
  const targetModel = selectedModel || "gemini-3.1-flash-image";
  const dofString = settings.composition.dof ? "shallow depth of field, blurred background" : "sharp focus throughout";
  
  // 0. Search Grounding & Topic Expansion
  let resolvedPrompt = prompt;
  if (prompt) {
    try {
        const searchRes = await ai.models.generateContent({
            model: "gemini-3.1-pro-preview",
            contents: `Analyze the following image generation prompt. If you are not sure about how to generate it, or if it mentions a topic, meme, specific visual style, recent trend, or character that requires external knowledge to depict accurately, use Google Search to find its visual characteristics. Output an expanded visual description that can be fed into an image generator to recreate it successfully. If no search is needed, just repeat the prompt. Prompt: "${prompt}"`,
            config: {
                tools: [{ googleSearch: {} }]
            }
        });
        resolvedPrompt = searchRes.text?.trim() || prompt;
    } catch(e) {
        console.warn("Search grounding for Studio Mode failed", e);
    }
  }

  const basePrompt = resolvedPrompt || "A fascinating image";
  
  const faceSwapPrompt = settings.enableFaceSwap && settings.faceImages?.length > 0
        ? "CRITICAL MANDATE: Perform a highly accurate FACE SWAP. The main subject MUST possess the exact identity, facial features, and likeness of the provided face reference image(s). Ensure seamless blending. "
        : "";

  const textConstraint = "CRITICAL MANDATE: If the prompt requests any text, words, titles, or mathematical equations to be written in the image, they MUST be rendered with perfect spelling and exact replication. Do NOT hallucinate misspelled words or gibberish text. ";

  const cfgStrength = `Prompt guidance / CFG strength adherence level: ${settings.cfgScale}/20. `;
  const creativityDesc = `Artistic creativity & embellishment level: ${settings.creativity}%. `;

  const fullPrompt = `${basePrompt}, ${settings.presetStyle} style, ${settings.composition.angle} angle, ${settings.composition.lighting} lighting, ${dofString}. ${faceSwapPrompt}${textConstraint}${cfgStrength}${creativityDesc}CRITICAL: Strictly preserve and replicate the exact original colors of any provided reference or asset images. ${negativePrompt ? `Do NOT include: ${negativePrompt}` : ""}`;

  const parts: any[] = [];
  
  if (settings.referenceImage) {
    const matches = settings.referenceImage.match(/^data:(.+?);base64,(.+)$/);
    if (matches && matches.length === 3) {
      parts.push({
        inlineData: {
          mimeType: matches[1],
          data: matches[2]
        }
      });
      parts.push({ text: `REFERENCE IMAGE INSTRUCTION: Strictly anchor visual composition, style, and structure on this reference image with ${settings.referenceStrength}% reference influence.` });
    }
  }

  [...(settings.faceImages || []), ...(settings.otherImages || [])].forEach(imgStr => {
      const matches = imgStr.match(/^data:(.+?);base64,(.+)$/);
      if (matches && matches.length === 3) {
          parts.push({
              inlineData: {
                  mimeType: matches[1],
                  data: matches[2]
              }
          });
      }
  });

  if (settings.maskImage) {
      const matches = settings.maskImage.match(/^data:(.+?);base64,(.+)$/);
      if (matches && matches.length === 3) {
          parts.push({
              inlineData: {
                  mimeType: matches[1],
                  data: matches[2]
              }
          });
          parts.push({ text: `INPAINTING MASK: White regions must be edited according to prompt instructions, while black regions must remain completely untouched.` });
      }
  }

  parts.push({ text: fullPrompt });

  const config: any = {};
  
  // Format configurations applied and passed to model
  const imageConfig: any = {
      aspectRatio: settings.aspectRatio || "1:1",
  };
  
  // Resolution support for models that support configurable imageSize (Gemini 3.1 Flash Image, Gemini 3 Pro Image)
  if (settings.resolution && (targetModel === "gemini-3.1-flash-image" || targetModel === "gemini-3-pro-image")) {
      imageConfig.imageSize = settings.resolution;
  }

  const hasImages = parts.some(p => p.inlineData);
  if (!hasImages || targetModel.includes("3")) {
      config.imageConfig = imageConfig;
  }

  try {
      const response = await ai.models.generateContent({
        model: targetModel,
        contents: { parts },
        config
      });

      const candidate = response.candidates?.[0];
      if (candidate?.finishReason && candidate.finishReason !== "STOP") {
          throw new Error(`Generation stopped early by safety or system filter: ${candidate.finishReason}`);
      }

      let textOutput = "";
      for (const part of candidate?.content?.parts || []) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
        if (part.text) {
            textOutput += part.text;
        }
      }

      throw new Error(`No image generated by model ${targetModel}. Model response: ${textOutput || "empty"}`);
  } catch (err: any) {
      console.error("Standard generation inner error with model:", targetModel, err);
      throw err;
  }
}
