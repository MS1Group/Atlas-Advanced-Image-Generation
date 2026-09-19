# Atlas - Advanced Image Generation

A pro-grade generative AI image studio and visual design suite powered by Google Gemini models via the `@google/genai` SDK. Built with modern React 19, TypeScript, Tailwind CSS v4, and Vite.

---

## 🌟 Highlights & Core Modes

Atlas is engineered for creators, marketers, educators, and visual designers who demand granular control over composition, prompt engineering, and visual style.

### 1. 🎨 Studio Mode (Pro-Grade Image Generation & Editing)
- **Advanced Composition Controls**: Granular control over camera angles (wide, close-up, drone, low/high angle), studio lighting presets, aspect ratios (1:1, 16:9, 9:16, 4:3, 3:4, etc.), and depth of field.
- **Resolution & Quality Settings**: Native support for standard, 1K, 2K, and 4K output resolutions on compatible Gemini image models.
- **Inpainting & Masking**: Canvas-based brush masking tool for precise localized image editing and prompt-directed inpainting.
- **Face Reference & Likeness Preservation**: Upload face reference images for seamless subject identity blending and face swaps.
- **AI Prompt Enhancer**: One-click prompt expansion and cinematic prompt rewriting powered by `gemini-3.1-flash-lite`.
- **Search-Grounded Generation**: Real-time Google Search grounding to accurately depict recent trends, real-world entities, and memes.

### 2. ⚡ Viral Engine (YouTube Thumbnail & High-CTR Generator)
- **High-CTR Visual Architecture**: Automatic composition optimized for mobile feeds and YouTube recommended cards.
- **Catchy Power-Phrasing**: AI-driven headline rewriter that condenses topics into 3–5 high-impact visual power words.
- **Expression & Sticker Badges**: Configurable facial emotion emphasis (shock, curiosity, intensity) and visual overlay stickers.
- **Variant Generation**: Generate multiple thumbnail variations with estimated CTR potential scores.

### 3. 📊 Infographic Maker (Visual Style Design Engine)
- **Visual Hierarchy & Depth**: Produces multi-panel educational infographics inspired by premium notebook aesthetics (soft shadows, structured cards, harmonious spacing).
- **Style Preset System**:
  - **Auto-Select**: Automatically analyzes topic, audience level, and density to choose the optimal style.
  - **Sketch Note**: Hand-drawn notebook aesthetic with imperfect lines and doodle icons.
  - **Kawaii**: Soft pastel palette, rounded geometry, friendly typography.
  - **Professional**: Clean corporate layout with neutral palettes and balanced margins.
  - **Scientific**: High-precision diagrams, clean charts, and technical annotations.
  - **Anime, Clay, Editorial, Instructional, Bento Grid, Brick**: Specialized aesthetic presets for diverse communication needs.
- **Explain Then Visualize**: Multi-stage concept compression that synthesizes complex topics or uploaded documents before rendering.
- **Multi-Format Source Input**: Accepts text topics, pasted notes, PDFs, and presentation materials.

---

## 🤖 Supported Gemini Models

Atlas provides a built-in model selector with dynamic configuration:

| Model ID | Display Name | Best For |
| :--- | :--- | :--- |
| `gemini-3.1-flash-image` | Gemini 3.1 Flash Image | High-quality balanced generation, multi-resolution editing *(Recommended)* |
| `gemini-3-pro-image` | Gemini 3 Pro Image | Ultra-high visual fidelity, complex scene rendering, and fine typography |
| `gemini-3.1-flash-lite-image` | Gemini 3.1 Flash Lite Image | Rapid, lightweight prototyping and budget-conscious generations |
| `gemini-2.5-flash-image` | Gemini 2.5 Flash Image | Fast generation and legacy workflow compatibility |

> **Note on Prompt Enhancements**: The built-in prompt enhancement feature is powered by `gemini-3.1-flash-lite` for ultra-fast, low-latency prompt rewrites.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler**: [Vite 6](https://vitejs.dev/)
- **AI SDK**: [@google/genai](https://www.npmjs.com/package/@google/genai)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Animations**: [Motion](https://motion.dev/)

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- [npm](https://www.npmjs.com/) or [bun](https://bun.sh/)
- A [Google Gemini API Key](https://aistudio.google.com/app/apikey)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/atlas-advanced-image-generation.git
   cd atlas-advanced-image-generation
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create a `.env` file in the root directory (or copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and provide your Gemini API key:
   ```env
   GEMINI_API_KEY="your_gemini_api_key_here"
   ```
   *(Alternatively, you can launch the app and input your API key directly through the in-app modal.)*

4. **Start the development server**:
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:3000`.

---

## 📜 Available Scripts

- `npm run dev`: Starts the Vite development server on port 3000.
- `npm run build`: Type-checks and compiles production static assets into `dist/`.
- `npm run preview`: Locally previews the production build.
- `npm run lint`: Runs TypeScript validation (`tsc --noEmit`).
- `npm run clean`: Removes the `dist/` directory.

---

## 📂 Project Structure

```
├── index.html               # Main HTML entry point
├── metadata.json            # Application metadata & capabilities configuration
├── package.json             # Package configuration & scripts
├── tsconfig.json            # TypeScript compiler configuration
├── vite.config.ts           # Vite build configuration
├── src/
│   ├── main.tsx             # Application bootstrap
│   ├── App.tsx              # Root shell, mode routing, and global nav
│   ├── api.ts               # Gemini API SDK interface & prompt engineering pipelines
│   ├── store.tsx            # Global state context and persistent storage
│   ├── types.ts             # TypeScript interfaces and model definitions
│   ├── index.css            # Tailwind CSS styling and theme setup
│   └── components/
│       ├── ApiKeyModal.tsx        # In-app Gemini API key and model manager
│       ├── Sidebar.tsx            # Studio Mode parameters & generation controls
│       ├── ThumbnailSidebar.tsx   # Viral Engine parameters & CTR controls
│       ├── InfographicSidebar.tsx # Infographic Maker parameters & presets
│       ├── MainArea.tsx           # Canvas viewer, prompt bar, and outputs gallery
│       ├── MaskingTool.tsx        # Canvas inpainting and brush masking interface
│       └── ErrorAlert.tsx         # User-friendly diagnostic error displays
```

---

## 🔒 API Key Safety & In-App Management

- Users can safely store their Gemini API key in `localStorage` directly inside the browser using the in-app **API Key Modal** (accessed via the top-right header pill or the sidebar).
- If an API key or quota issue occurs, Atlas provides descriptive diagnostics explaining the root cause (e.g., authentication failure, quota exhaustion, safety filter triggered) with actionable steps to resolve it.

---

## 📄 License

This project is licensed under the Apache-2.0 License.
