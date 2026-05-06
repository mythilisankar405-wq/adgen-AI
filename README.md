# AdGen AI — Multimodal AI System for Product Advertisement Generation

> **College Knowledge Demonstration Project · 2025**

A clean, professional web application demonstrating a **multimodal AI pipeline** that takes product images and text descriptions as input, then generates platform-ready advertisement assets — taglines, ad copy, audience analysis, and a live HTML banner.

---

## Live Demo

Open `index.html` in any modern browser. No build step required.

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    MULTIMODAL INPUT LAYER                    │
│                                                              │
│   ┌─────────────┐          ┌──────────────────────┐         │
│   │ Product     │          │ Text Description     │         │
│   │ Image (PNG/ │  +       │ (Name, features,     │         │
│   │ JPG/WEBP)   │          │  platform, tone)     │         │
│   └──────┬──────┘          └──────────┬───────────┘         │
│          │                            │                      │
│          └────────────┬───────────────┘                      │
│                       ▼                                      │
│         Base64 encoded multimodal prompt                     │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│                   ANTHROPIC CLAUDE API                       │
│              claude-sonnet-4-20250514                        │
│                                                              │
│   Vision understanding  +  Language generation              │
│   (Image analysis)         (Ad copy, taglines)              │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│                   OUTPUT RENDERING LAYER                     │
│                                                              │
│  ┌────────────┐  ┌─────────────────┐  ┌──────────────────┐  │
│  │  Tagline   │  │ Audience        │  │ HTML Ad Banner   │  │
│  │  + Ad Copy │  │ Analysis +      │  │ (self-contained, │  │
│  │  + Hashtags│  │ Demographics    │  │  embeddable)     │  │
│  └────────────┘  └─────────────────┘  └──────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## Features

| Feature | Description |
|---|---|
| **Image upload** | Upload PNG/JPG/WEBP product photos — Claude visually analyses them |
| **Multimodal fusion** | Image + text are combined into a single API call (true multimodal) |
| **Tagline generation** | AI creates a punchy, platform-appropriate tagline |
| **Ad copy** | 2–3 sentences of platform-specific, tone-matched ad copy |
| **Hashtags** | 6 relevant hashtags for discoverability |
| **Audience analysis** | Demographics summary, age range, gender, top interest |
| **HTML banner** | Live-rendered, self-contained HTML/CSS advertisement banner |
| **5 platforms** | Instagram, LinkedIn, Facebook, Google Ads, Twitter/X |
| **5 tones** | Inspiring, Professional, Playful, Luxury, Urgent |
| **Copy to clipboard** | One-click copy for any output |
| **Download banner HTML** | Copy the banner HTML to embed anywhere |

---

## Tech Stack

- **Frontend:** Vanilla HTML5, CSS3, JavaScript (ES2022) — zero dependencies
- **AI:** Anthropic Claude API (`claude-sonnet-4-20250514`) with vision support
- **Fonts:** DM Serif Display + DM Sans (Google Fonts)
- **No build tools required** — runs directly in the browser

---

## Project Structure

```
adgen-ai/
├── index.html          # Main application shell
├── css/
│   └── style.css       # All styles — clean minimal design system
├── js/
│   └── app.js          # Application logic + Anthropic API integration
└── README.md
```

---

## Setup

### Option 1 — Open directly

```bash
# Clone the repo
git clone https://github.com/yourusername/adgen-ai.git
cd adgen-ai

# Open in browser (no server needed for basic use)
open index.html
```

### Option 2 — VS Code Live Server (recommended)

1. Install the **Live Server** extension in VS Code
2. Open the `adgen-ai/` folder
3. Right-click `index.html` → **Open with Live Server**

> **API Key:** The Anthropic API key is handled by claude.ai when running in the demo widget. For local use, you need to add your own key — see `js/app.js` line 103, add `"x-api-key": "YOUR_KEY"` to the fetch headers.

---

## How the Multimodal AI Pipeline Works

### Step 1 — Image Ingestion
The uploaded image is converted to Base64 and stored in memory. No server upload required.

### Step 2 — Vision Analysis
If an image is present, it is sent alongside the text prompt to Claude as a multimodal message. Claude's vision model analyses visual features: product type, colour palette, style, packaging, context.

### Step 3 — Language Generation
Claude generates a structured JSON response containing:
- Tagline, ad copy, hashtags
- Audience profile (demographics, interests, behaviours)
- Banner parameters (headline, subheadline, CTA, colour palette)

### Step 4 — Ad Rendering
The banner parameters are used to render a fully self-contained HTML/CSS advertisement banner inside an `<iframe>`. The banner can be copied and embedded in any webpage.

---

## Concepts Demonstrated

- **Multimodal AI** — combining image and text inputs in a single model call
- **Prompt engineering** — structured JSON output via system + user prompts
- **API integration** — calling a commercial LLM API from the browser
- **Real-time UI updates** — pipeline step visualisation, animated loading states
- **Self-contained output** — generating deployable HTML from AI output

---

## Author

Built for a college knowledge demonstration on Multimodal AI Systems.  
Powered by [Anthropic Claude](https://anthropic.com).
