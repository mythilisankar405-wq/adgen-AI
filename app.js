// app.js — AdGen AI Frontend
// Calls the local server.js backend at /generate

let selectedTone = "persuasive";

// ─── Tone button selection ────────────────────────────────────
document.querySelectorAll(".tone-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tone-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    selectedTone = btn.dataset.tone;
  });
});

// ─── Image preview on file select ────────────────────────────
const fileInput = document.getElementById("fileInput");
const previewImg = document.getElementById("previewImg");
const generateBtn = document.getElementById("generateBtn");

fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const url = URL.createObjectURL(file);
  previewImg.src = url;
  previewImg.style.display = "block";
  generateBtn.disabled = false;
});

// ─── Generate ad copy ─────────────────────────────────────────
generateBtn.addEventListener("click", async () => {
  const file = fileInput.files[0];
  if (!file) {
    showError("Please upload a product image first.");
    return;
  }

  setLoading(true);
  hideError();
  hideResults();

  try {
    // Build multipart form data to send image + tone to server
    const formData = new FormData();
    formData.append("image", file);
    formData.append("tone", selectedTone);

    const extraContext = document.getElementById("extraContext")?.value || "";
    if (extraContext) formData.append("context", extraContext);

    const response = await fetch("/generate", {
      method: "POST",
      body: formData,
      // Do NOT set Content-Type — browser sets it with boundary automatically
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || "Generation failed. Please try again.");
    }

    displayResults(result.data);
  } catch (err) {
    showError(err.message);
  } finally {
    setLoading(false);
  }
});

// ─── Display results ──────────────────────────────────────────
function displayResults(data) {
  document.getElementById("productName").textContent = data.productName || "";
  document.getElementById("headline1").textContent = data.headline1 || "";
  document.getElementById("description1").textContent = data.description1 || "";
  document.getElementById("headline2").textContent = data.headline2 || "";
  document.getElementById("description2").textContent = data.description2 || "";
  document.getElementById("tagline").textContent = data.tagline || "";
  document.getElementById("callToAction").textContent = data.callToAction || "Shop Now";

  document.getElementById("results").style.display = "block";
  document.getElementById("results").scrollIntoView({ behavior: "smooth", block: "start" });
}

// ─── Copy to clipboard ────────────────────────────────────────
function copyText(elementId) {
  const text = document.getElementById(elementId)?.textContent;
  if (!text) return;

  navigator.clipboard.writeText(text).then(() => {
    const btn = document.querySelector(`[onclick="copyText('${elementId}')"]`);
    if (btn) {
      const original = btn.textContent;
      btn.textContent = "✓ Copied!";
      setTimeout(() => (btn.textContent = original), 1500);
    }
  });
}

// ─── UI helpers ───────────────────────────────────────────────
function setLoading(isLoading) {
  generateBtn.disabled = isLoading;
  generateBtn.textContent = isLoading ? "⏳ Generating…" : "✨ Generate Ad Copy";
}

function showError(msg) {
  const el = document.getElementById("errorMsg");
  if (el) {
    el.textContent = msg;
    el.style.display = "block";
  }
}

function hideError() {
  const el = document.getElementById("errorMsg");
  if (el) el.style.display = "none";
}

function hideResults() {
  const el = document.getElementById("results");
  if (el) el.style.display = "none";
}
