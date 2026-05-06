/* ────────────────────────────────────────────────
   AdGen AI — Multimodal Advertisement Generator
   app.js — Main application logic
   ──────────────────────────────────────────────── */

// ── State ──────────────────────────────────────
const state = {
  imageBase64: null,
  imageMime:   null,
  platform:    'Instagram',
  tone:        'Inspiring',
  bannerHTML:  null,
};

// ── DOM refs ────────────────────────────────────
const uploadZone     = document.getElementById('upload-zone');
const fileInput      = document.getElementById('file-input');
const imgPreview     = document.getElementById('img-preview');
const uploadBody     = document.getElementById('upload-body');
const imgRemove      = document.getElementById('img-remove');
const genBtn         = document.getElementById('gen-btn');
const emptyState     = document.getElementById('empty-state');
const loadingState   = document.getElementById('loading-state');
const resultsEl      = document.getElementById('results');
const loaderMsg      = document.getElementById('loader-msg');

// ── Image upload ────────────────────────────────
uploadZone.addEventListener('click', (e) => {
  if (e.target === imgRemove) return;
  fileInput.click();
});

fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (ev) => {
    const dataUrl = ev.target.result;
    const comma   = dataUrl.indexOf(',');
    state.imageBase64 = dataUrl.slice(comma + 1);
    const mimeMatch   = dataUrl.match(/data:([^;]+);/);
    state.imageMime   = mimeMatch ? mimeMatch[1] : 'image/jpeg';

    imgPreview.src = dataUrl;
    imgPreview.hidden = false;
    uploadBody.hidden  = true;
    imgRemove.hidden   = false;
  };
  reader.readAsDataURL(file);
});

imgRemove.addEventListener('click', (e) => {
  e.stopPropagation();
  state.imageBase64 = null;
  state.imageMime   = null;
  imgPreview.hidden  = true;
  imgPreview.src     = '';
  uploadBody.hidden  = false;
  imgRemove.hidden   = true;
  fileInput.value    = '';
});

// Drag-and-drop support
uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.style.borderColor = '#111'; });
uploadZone.addEventListener('dragleave', () => { uploadZone.style.borderColor = ''; });
uploadZone.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadZone.style.borderColor = '';
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) {
    fileInput.files = e.dataTransfer.files;
    fileInput.dispatchEvent(new Event('change'));
  }
});

// ── Chip selectors ─────────────────────────────
document.getElementById('platform-group').addEventListener('click', (e) => {
  if (!e.target.classList.contains('chip')) return;
  document.querySelectorAll('#platform-group .chip').forEach(c => c.classList.remove('active'));
  e.target.classList.add('active');
  state.platform = e.target.dataset.val;
});

document.getElementById('tone-group').addEventListener('click', (e) => {
  if (!e.target.classList.contains('chip')) return;
  document.querySelectorAll('#tone-group .chip').forEach(c => c.classList.remove('active'));
  e.target.classList.add('active');
  state.tone = e.target.dataset.val;
});

// ── Copy buttons ────────────────────────────────
document.addEventListener('click', async (e) => {
  if (!e.target.classList.contains('copy-btn')) return;

  const targetId = e.target.dataset.target;
  let text = '';

  if (targetId === 'out-tagline' || targetId === 'out-adcopy') {
    text = document.getElementById(targetId).textContent;
  } else if (e.target.id === 'copy-banner-btn') {
    text = state.bannerHTML || '';
  }

  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    e.target.textContent = '✓ Copied';
    e.target.classList.add('copied');
    setTimeout(() => {
      e.target.textContent = e.target.id === 'copy-banner-btn' ? 'Copy HTML' : 'Copy';
      e.target.classList.remove('copied');
    }, 2000);
  } catch (_) {}
});

// ── Pipeline UI helpers ────────────────────────
function setPipeline(step) {
  // steps 0-4; 0 = all idle
  for (let i = 1; i <= 4; i++) {
    const el = document.getElementById('ps-' + i);
    el.classList.remove('active', 'done');
    if (i < step)  el.classList.add('done');
    if (i === step) el.classList.add('active');
  }
}

const loaderStepEls = [null,
  document.getElementById('lst-1'),
  document.getElementById('lst-2'),
  document.getElementById('lst-3'),
  document.getElementById('lst-4'),
];
function setLoaderStep(step) {
  loaderStepEls.forEach((el, i) => {
    if (!el) return;
    el.classList.remove('active', 'done');
    if (i < step)  el.classList.add('done');
    if (i === step) el.classList.add('active');
  });
}

// ── Generate ────────────────────────────────────
genBtn.addEventListener('click', generateAd);

async function generateAd() {
  const name     = document.getElementById('p-name').value.trim();
  const desc     = document.getElementById('p-desc').value.trim();
  const industry = document.getElementById('industry').value;

  if (!name && !desc && !state.imageBase64) {
    alert('Please enter a product name, description, or upload an image.');
    return;
  }

  // Show loading
  emptyState.hidden   = true;
  resultsEl.hidden    = true;
  loadingState.hidden = false;
  genBtn.disabled     = true;
  setPipeline(1);
  setLoaderStep(1);

  const loadingCycle = [
    [1, 1, 'Analysing product image with vision AI…'],
    [2, 2, 'Profiling target audience…'],
    [3, 3, 'Generating ad copy and tagline…'],
    [4, 4, 'Rendering HTML banner…'],
  ];
  let cycleIdx = 0;
  const cycleInterval = setInterval(() => {
    cycleIdx = Math.min(cycleIdx + 1, 3);
    const [ps, ls, msg] = loadingCycle[cycleIdx];
    setPipeline(ps);
    setLoaderStep(ls);
    loaderMsg.textContent = msg;
  }, 1600);

  // ── Build prompt ──
  const imageNote = state.imageBase64
    ? 'A product image has been provided — perform visual analysis as part of your multimodal understanding of the product.'
    : 'No image uploaded — rely entirely on the text description.';

  const systemPrompt = `You are a world-class AI advertising strategist and copywriter specialising in multimodal product advertisement generation. You receive product images and/or text descriptions and produce precise, platform-optimised ad assets. Respond ONLY with valid minified JSON — no markdown, no backticks, no prose.`;

  const userPrompt = `Create a complete advertisement for this product:

Product name: ${name || '(not specified)'}
Description / features: ${desc || '(not specified)'}
Target platform: ${state.platform}
Tone: ${state.tone}
Industry: ${industry}
${imageNote}

Return exactly this JSON structure (no extra fields, no markdown):
{
  "tagline": "compelling tagline max 8 words",
  "adCopy": "2–3 sentence platform-optimised ad copy for ${state.platform}. Use the tone: ${state.tone}.",
  "hashtags": ["tag1","tag2","tag3","tag4","tag5","tag6"],
  "audience": {
    "summary": "1–2 sentence description of ideal target audience and why they need this product",
    "chips": ["Demographic 1","Age group","Interest","Behaviour","Platform habit"],
    "ageRange": "e.g. 25–40",
    "gender": "e.g. All / Female / Male",
    "interest": "e.g. Home Cooking"
  },
  "banner": {
    "headline": "short punchy headline for banner",
    "subheadline": "supporting line 5–8 words",
    "cta": "2–3 word call-to-action",
    "palette": "one of: midnight, warm-terra, slate-sage, ocean-deep, charcoal-gold"
  }
}`;

  const messages = [{ role: 'user', content: userPrompt }];
  if (state.imageBase64) {
    messages[0].content = [
      { type: 'image', source: { type: 'base64', media_type: state.imageMime, data: state.imageBase64 } },
      { type: 'text', text: userPrompt },
    ];
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: systemPrompt,
        messages,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `HTTP ${res.status}`);
    }

    const data   = await res.json();
    const raw    = (data.content || []).map(c => c.text || '').join('');
    const clean  = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    clearInterval(cycleInterval);
    setPipeline(5);
    setLoaderStep(5);

    renderResults(parsed, name, desc);

  } catch (err) {
    clearInterval(cycleInterval);
    setPipeline(0);
    setLoaderStep(0);
    loadingState.hidden = true;
    emptyState.hidden   = false;
    emptyState.innerHTML = `
      <div class="empty-icon" style="color:#b5440f; opacity:1;">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      </div>
      <p class="empty-title" style="color:#b5440f;">Generation failed</p>
      <p class="empty-sub">${err.message || 'Unknown error. Please check your API key and try again.'}</p>
      <button onclick="location.reload()" style="margin-top:8px; font-size:0.8rem; padding:6px 16px; border:1px solid #e0ddd6; border-radius:20px; background:transparent; cursor:pointer; color:#6b6b68;">Reload</button>
    `;
    console.error('AdGen error:', err);
  }

  genBtn.disabled = false;
}

// ── Render results ─────────────────────────────
function renderResults(d, productName, productDesc) {
  // Tagline
  document.getElementById('out-tagline').textContent = d.tagline || '—';

  // Ad copy
  document.getElementById('out-adcopy').textContent = d.adCopy || '—';

  // Hashtags
  const hashtagsEl = document.getElementById('out-hashtags');
  hashtagsEl.innerHTML = '';
  (d.hashtags || []).forEach(tag => {
    const span = document.createElement('span');
    span.className = 'hashtag';
    span.textContent = tag.startsWith('#') ? tag : '#' + tag;
    hashtagsEl.appendChild(span);
  });

  // Audience
  const aud = d.audience || {};
  document.getElementById('out-audience-summary').textContent = aud.summary || '—';

  const chipsEl = document.getElementById('out-audience-chips');
  chipsEl.innerHTML = '';
  (aud.chips || []).forEach(chip => {
    const span = document.createElement('span');
    span.className = 'aud-chip';
    span.textContent = chip;
    chipsEl.appendChild(span);
  });

  const statsEl = document.getElementById('out-audience-stats');
  statsEl.innerHTML = `
    <div class="aud-stat">
      <span class="aud-stat-val">${aud.ageRange || '—'}</span>
      <span class="aud-stat-key">Age range</span>
    </div>
    <div class="aud-stat">
      <span class="aud-stat-val">${aud.gender || '—'}</span>
      <span class="aud-stat-key">Gender</span>
    </div>
    <div class="aud-stat">
      <span class="aud-stat-val">${aud.interest || '—'}</span>
      <span class="aud-stat-key">Top interest</span>
    </div>
  `;

  // Banner
  const banner  = d.banner || {};
  const palette = PALETTES[banner.palette] || PALETTES['midnight'];
  const html = buildBannerHTML({
    platform:     state.platform,
    headline:     banner.headline || d.tagline || productName || 'Your Product',
    subheadline:  banner.subheadline || productDesc || '',
    cta:          banner.cta || 'Learn More',
    palette,
    productName:  productName,
  });

  state.bannerHTML = html;

  const frame = document.getElementById('banner-frame');
  frame.contentDocument.open();
  frame.contentDocument.write(html);
  frame.contentDocument.close();

  // Show results
  loadingState.hidden = true;
  resultsEl.hidden    = false;
}

// ── Colour palettes for banner ─────────────────
const PALETTES = {
  'midnight': {
    bg:      '#0d0d12',
    accent:  '#e8e4f0',
    text:    '#ffffff',
    sub:     'rgba(255,255,255,0.6)',
    cta_bg:  '#ffffff',
    cta_txt: '#0d0d12',
    tag_bg:  'rgba(255,255,255,0.1)',
  },
  'warm-terra': {
    bg:      '#2c1810',
    accent:  '#e8a87c',
    text:    '#fdf6f0',
    sub:     'rgba(253,246,240,0.65)',
    cta_bg:  '#e8a87c',
    cta_txt: '#2c1810',
    tag_bg:  'rgba(232,168,124,0.15)',
  },
  'slate-sage': {
    bg:      '#1e2a2a',
    accent:  '#7cbf9e',
    text:    '#f0f4f2',
    sub:     'rgba(240,244,242,0.6)',
    cta_bg:  '#7cbf9e',
    cta_txt: '#1e2a2a',
    tag_bg:  'rgba(124,191,158,0.12)',
  },
  'ocean-deep': {
    bg:      '#0a1628',
    accent:  '#4db6f0',
    text:    '#e8f4fd',
    sub:     'rgba(232,244,253,0.6)',
    cta_bg:  '#4db6f0',
    cta_txt: '#0a1628',
    tag_bg:  'rgba(77,182,240,0.12)',
  },
  'charcoal-gold': {
    bg:      '#1a1a18',
    accent:  '#c9a84c',
    text:    '#f5f1e8',
    sub:     'rgba(245,241,232,0.6)',
    cta_bg:  '#c9a84c',
    cta_txt: '#1a1a18',
    tag_bg:  'rgba(201,168,76,0.12)',
  },
};

// ── Build self-contained banner HTML ───────────
function buildBannerHTML({ platform, headline, subheadline, cta, palette: p, productName }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{width:100%;height:280px;font-family:'DM Sans',sans-serif;background:${p.bg};display:flex;align-items:stretch;overflow:hidden}
.banner{width:100%;display:grid;grid-template-columns:1fr 260px;position:relative}
.left{padding:2.5rem 2rem 2rem;display:flex;flex-direction:column;justify-content:space-between;z-index:2}
.tag{display:inline-flex;align-items:center;gap:6px;font-size:0.65rem;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;color:${p.accent};background:${p.tag_bg};border:1px solid ${p.accent}22;border-radius:20px;padding:4px 12px;width:fit-content;margin-bottom:0.75rem}
.tag-dot{width:5px;height:5px;border-radius:50%;background:${p.accent};animation:pulse 2s ease infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
h1{font-family:'DM Serif Display',serif;font-size:1.6rem;font-weight:400;line-height:1.15;letter-spacing:-0.02em;color:${p.text};margin-bottom:0.5rem}
h1 em{font-style:italic;color:${p.accent}}
.sub{font-size:0.82rem;color:${p.sub};line-height:1.55;max-width:340px;margin-bottom:1.25rem}
.cta-wrap{display:flex;align-items:center;gap:14px}
.cta{display:inline-flex;align-items:center;gap:8px;background:${p.cta_bg};color:${p.cta_txt};font-family:'DM Sans',sans-serif;font-size:0.8rem;font-weight:500;padding:10px 20px;border-radius:4px;text-decoration:none;letter-spacing:0.02em}
.cta-arr{transition:transform 0.2s}
.platform-label{font-size:0.65rem;color:${p.sub};letter-spacing:0.06em;text-transform:uppercase}
.right{display:flex;align-items:center;justify-content:center;padding:2rem;position:relative;overflow:hidden}
.geo-circle{position:absolute;width:260px;height:260px;border-radius:50%;border:1px solid ${p.accent}18;right:-60px;top:50%;transform:translateY(-50%)}
.geo-circle-inner{position:absolute;width:180px;height:180px;border-radius:50%;border:1px solid ${p.accent}26;right:-20px;top:50%;transform:translateY(-50%)}
.product-name-display{font-family:'DM Serif Display',serif;font-size:0.95rem;font-style:italic;color:${p.accent};text-align:center;position:relative;z-index:2;line-height:1.4;max-width:180px}
.powered{position:absolute;bottom:14px;right:16px;font-size:0.58rem;color:${p.sub};letter-spacing:0.06em;text-transform:uppercase;opacity:0.6}
</style>
</head>
<body>
<div class="banner">
  <div class="left">
    <div>
      <div class="tag"><span class="tag-dot"></span>${platform} Ad</div>
      <h1>${escHtml(headline)}</h1>
      <p class="sub">${escHtml(subheadline)}</p>
    </div>
    <div class="cta-wrap">
      <a class="cta" href="#">${escHtml(cta)} <span class="cta-arr">→</span></a>
      <span class="platform-label">${escHtml(platform)}</span>
    </div>
  </div>
  <div class="right">
    <div class="geo-circle"></div>
    <div class="geo-circle-inner"></div>
    <div class="product-name-display">${escHtml(productName || 'Your Product')}</div>
  </div>
  <span class="powered">Generated by AdGen AI</span>
</div>
</body>
</html>`;
}

function escHtml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
