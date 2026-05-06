// server.js — AdGen AI Backend
// Run: node server.js
// Requires: npm install express cors multer dotenv @anthropic-ai/sdk

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const Anthropic = require("@anthropic-ai/sdk");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // serves index.html, style.css, app.js

// ─── Multer (image upload, stored in memory) ──────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed (jpg, png, webp, avif)"));
    }
  },
});

// ─── Anthropic Client ─────────────────────────────────────────
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ─── POST /generate — Main ad generation endpoint ────────────
app.post("/generate", upload.single("image"), async (req, res) => {
  try {
    // Validate image was uploaded
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded. Please attach a product image." });
    }

    const tone = req.body.tone || "persuasive";
    const extraContext = req.body.context || "";

    const toneGuides = {
      persuasive:  "confident, benefit-focused, trust-building language",
      luxury:      "premium, aspirational, exclusive and refined tone",
      playful:     "fun, energetic, witty with a touch of humour",
      technical:   "spec-driven, precise, highlighting features and performance",
      urgent:      "deal-focused, FOMO-driven, scarcity-aware, action-oriented",
    };

    const toneDescription = toneGuides[tone] || toneGuides.persuasive;

    // Convert image buffer to base64
    const imageBase64 = req.file.buffer.toString("base64");
    const mediaType = req.file.mimetype === "image/avif" ? "image/jpeg" : req.file.mimetype;

    const prompt = `You are an expert advertising copywriter. Carefully analyze this product image and generate compelling ad copy.

Tone: ${toneDescription}
${extraContext ? `Additional context about the product: ${extraContext}` : ""}

Respond ONLY with a valid JSON object — no markdown, no code fences, no extra text.

{
  "productName": "Identified product name (brand + model if visible)",
  "headline1": "First headline (max 10 words, punchy and memorable)",
  "description1": "First ad body copy (1-2 sentences, benefit-focused)",
  "headline2": "Second headline (different angle, max 10 words)",
  "description2": "Second ad body copy (1-2 sentences)",
  "tagline": "Short memorable brand tagline (max 7 words)",
  "callToAction": "A strong CTA button text (3-5 words)"
}`;

    // Call Claude Vision API
    const message = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: imageBase64,
              },
            },
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
    });

    // Extract text from response
    const rawText = message.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");

    // Clean and parse JSON
    const cleaned = rawText.replace(/```json|```/g, "").trim();
    const adData = JSON.parse(cleaned);

    return res.json({
      success: true,
      tone,
      data: adData,
    });
  } catch (err) {
    console.error("❌ Generation error:", err.message);

    if (err.message.includes("JSON")) {
      return res.status(500).json({ error: "AI returned unexpected format. Please try again." });
    }
    if (err.status === 401) {
      return res.status(401).json({ error: "Invalid API key. Check your ANTHROPIC_API_KEY in .env" });
    }
    if (err.status === 429) {
      return res.status(429).json({ error: "Rate limit hit. Please wait a moment and retry." });
    }

    return res.status(500).json({ error: err.message || "Server error during generation." });
  }
});

// ─── GET /health — Simple health check ───────────────────────
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    apiKeySet: !!process.env.ANTHROPIC_API_KEY,
    port: PORT,
  });
});

// ─── Start server ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 AdGen AI server running at http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("⚠️  WARNING: ANTHROPIC_API_KEY not set in .env file!");
  } else {
    console.log("✅  Anthropic API key loaded");
  }
});
