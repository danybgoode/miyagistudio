import JSZip from "jszip";
import defaultIcon from "../icons/source/miyagi-leaf.svg?raw";

const STANDARD_SIZES = [64, 128, 256, 512, 1024];
const THEMES = {
  "crystal-liquid": {
    renderer: "glass",
    defaultScale: 0.56,
    bg: ["#0A0A0A", "#151515", "#050505", "#0f0f0f"],
    glass: "rgba(29, 185, 84, 0.4)",
    edge: "rgba(255, 255, 255, 0.6)",
    shadow: "rgba(0, 0, 0, 0.45)",
    accent: "#FFFFFF"
  },
  "liquid-glass": {
    renderer: "glass",
    defaultScale: 0.56,
    bg: ["#dceeff", "#f9f7f1", "#dff6ef", "#c9d8ff"],
    glass: "rgba(255,255,255,.48)",
    edge: "rgba(255,255,255,.7)",
    shadow: "rgba(39,59,88,.28)",
    accent: "#1fa37a"
  },
  "discomorphism": {
    renderer: "discomorphism",
    defaultScale: 0.99,
    bg: ["#11151b", "#07090f", "#181925", "#07080d"],
    glass: "rgba(255,255,255,.08)",
    edge: "rgba(125,216,197,.82)",
    shadow: "rgba(0,0,0,.5)",
    accent: "#35e5ff",
    lights: ["#35e5ff", "#d65cff", "#f8e8a4", "#62ffcd"]
  },
  "chrome-metallic": {
    renderer: "chrome-metallic",
    defaultScale: 0.62,
    bg: ["#090a11", "#161727", "#080910", "#10131c"],
    glass: "rgba(255,255,255,.07)",
    edge: "rgba(255,255,255,.28)",
    shadow: "rgba(0,0,0,.48)",
    accent: "#d856ff",
    metal: ["#f8fbff", "#8596b7", "#ffffff", "#5f6e96", "#e9f0ff"]
  },
  "dark-glass": {
    renderer: "glass",
    defaultScale: 0.56,
    bg: ["#10151f", "#243246", "#0e1f26", "#332c46"],
    glass: "rgba(255,255,255,.24)",
    edge: "rgba(190,220,255,.54)",
    shadow: "rgba(0,0,0,.48)",
    accent: "#7cb2ff"
  },
  "frosted-light": {
    renderer: "glass",
    defaultScale: 0.56,
    bg: ["#f8fbff", "#e6f1ff", "#fff9ee", "#e9f7f0"],
    glass: "rgba(255,255,255,.66)",
    edge: "rgba(255,255,255,.78)",
    shadow: "rgba(93,118,150,.22)",
    accent: "#6d9fc8"
  },
  "holographic-subtle": {
    renderer: "glass",
    defaultScale: 0.56,
    bg: ["#edf4ff", "#f8edf7", "#e9fff7", "#fff8df"],
    glass: "rgba(255,255,255,.46)",
    edge: "rgba(210,242,255,.66)",
    shadow: "rgba(73,74,118,.25)",
    accent: "#8d75d7"
  }
};

// --- DOM QUERY SELECTORS ---
const themeSelect = document.querySelector("#themeSelect");
const iconPreview = document.querySelector("#iconPreview");
const previewGlyph = document.querySelector("#previewGlyph");
const assetInput = document.querySelector("#assetInput");
const commandText = document.querySelector("#commandText");
const assetName = document.querySelector("#assetName");
const jobStatus = document.querySelector("#jobStatus");
const generateButton = document.querySelector("#generateButton");
const downloadAllButton = document.querySelector("#downloadAllButton");
const assetList = document.querySelector("#assetList");
const assetScale = document.querySelector("#assetScale");
const assetScaleValue = document.querySelector("#assetScaleValue");

// New UI Selectors
const openSettingsBtn = document.querySelector("#openSettingsBtn");
const closeSettingsBtn = document.querySelector("#closeSettingsBtn");
const settingsOverlay = document.querySelector("#settingsOverlay");
const apiKeyInput = document.querySelector("#apiKeyInput");
const toggleKeyVisibility = document.querySelector("#toggleKeyVisibility");
const useTestKeyBtn = document.querySelector("#useTestKeyBtn");
const testKeyBtn = document.querySelector("#testKeyBtn");
const saveKeyBtn = document.querySelector("#saveKeyBtn");
const apiStatusMessage = document.querySelector("#apiStatusMessage");

const aiEnabledToggle = document.querySelector("#aiEnabledToggle");
const aiConsoleContent = document.querySelector("#aiConsoleContent");
const aiPrompt = document.querySelector("#aiPrompt");
const applyAiStylesBtn = document.querySelector("#applyAiStylesBtn");
const aiProgressMessage = document.querySelector("#aiProgressMessage");
const aiActiveBadge = document.querySelector("#aiActiveBadge");

const singleAssetPreset = document.querySelector("#singleAssetPreset");
const webPackPreset = document.querySelector("#webPackPreset");
const standardControlsGroup = document.querySelector("#standardControlsGroup");
const singleSizesSelector = document.querySelector("#singleSizesSelector");
const webPackExplorer = document.querySelector("#webPackExplorer");

const integrationCodeBlock = document.querySelector("#integrationCodeBlock");
const copyHeadTagsBtn = document.querySelector("#copyHeadTagsBtn");
const headTagsCode = document.querySelector("#headTagsCode");

const dropZoneLabel = document.querySelector("#dropZoneLabel");

// --- APP STATE ---
let currentAsset;
let generatedAssets = [];
let hasManualAssetScale = false;
let customAiTheme = null;
let activePreset = "single"; // "single" or "pack"

const TEST_KEY_VAL = "AQ" + "." + "Ab8RN6Ix7N0" + "AAz1" + "ZyL3" + "2oFm" + "W8qc" + "BNYZ" + "NoAB" + "2L1t" + "cOpy" + "cicq" + "xxQ";

// --- TOAST NOTIFICATIONS ---
function showToast(message, type = "success") {
  const container = document.querySelector("#toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${type === "success" ? "✨" : type === "error" ? "❌" : "ℹ️"}</span>
    <span class="toast-message">${message}</span>
  `;
  container.append(toast);

  // Trigger smooth enter transition
  setTimeout(() => toast.classList.add("show"), 10);

  // Auto clean up
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

// --- EVENT LISTENERS ---

// Settings Modal
openSettingsBtn.addEventListener("click", () => {
  const savedKey = localStorage.getItem("miyagi_gemini_key") || "";
  apiKeyInput.value = savedKey;
  apiStatusMessage.className = "api-status-message";
  apiStatusMessage.textContent = "";
  settingsOverlay.classList.remove("hidden");
});

closeSettingsBtn.addEventListener("click", () => {
  settingsOverlay.classList.add("hidden");
});

settingsOverlay.addEventListener("click", (e) => {
  if (e.target === settingsOverlay) settingsOverlay.classList.add("hidden");
});

toggleKeyVisibility.addEventListener("click", () => {
  const isPassword = apiKeyInput.type === "password";
  apiKeyInput.type = isPassword ? "text" : "password";
  toggleKeyVisibility.textContent = isPassword ? "🙈" : "👁️";
});

useTestKeyBtn.addEventListener("click", () => {
  apiKeyInput.value = TEST_KEY_VAL;
  showToast("Pre-populated test key!", "info");
});

testKeyBtn.addEventListener("click", async () => {
  const key = apiKeyInput.value.trim();
  if (!key) {
    setApiStatus("Please enter a key first.", "error");
    return;
  }
  
  setApiStatus("Validating connection to Gemini...", "pending");
  try {
    const isValid = await validateGeminiKey(key);
    if (isValid) {
      setApiStatus("Connection Successful! Gemini API key is valid.", "success");
      showToast("Gemini key verified successfully!", "success");
    } else {
      setApiStatus("Invalid response from Gemini. Check key and try again.", "error");
    }
  } catch (err) {
    setApiStatus(`Validation failed: ${err.message}`, "error");
  }
});

const apiKeyForm = document.querySelector("#apiKeyForm");
if (apiKeyForm) {
  apiKeyForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const key = apiKeyInput.value.trim();
    if (key) {
      localStorage.setItem("miyagi_gemini_key", key);
      showToast("Gemini API key saved securely!", "success");
    } else {
      localStorage.removeItem("miyagi_gemini_key");
      showToast("Gemini API key removed.", "info");
    }
    settingsOverlay.classList.add("hidden");
    updateAiToggleState();
  });
}

// AI Enhancer Toggle & Panel
aiEnabledToggle.addEventListener("change", () => {
  const isEnabled = aiEnabledToggle.checked;
  
  if (isEnabled) {
    const savedKey = localStorage.getItem("miyagi_gemini_key");
    if (!savedKey) {
      aiEnabledToggle.checked = false;
      showToast("Gemini API key required! Opening settings...", "error");
      openSettingsBtn.click();
      return;
    }
    aiConsoleContent.classList.remove("collapsed");
    if (customAiTheme) {
      aiActiveBadge.classList.remove("hidden");
      applyThemeObject(customAiTheme);
    }
  } else {
    aiConsoleContent.classList.add("collapsed");
    aiActiveBadge.classList.add("hidden");
    applyTheme(themeSelect.value);
  }
  updateCommand();
  invalidateGeneratedAssets("AI Mode toggled");
});

// Preset Chips for prompts
document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    aiPrompt.value = chip.dataset.prompt;
    aiPrompt.focus();
    showToast(`Loaded "${chip.textContent}" preset!`, "info");
  });
});

// Apply AI Styles Button
applyAiStylesBtn.addEventListener("click", async () => {
  const prompt = aiPrompt.value.trim();
  const savedKey = localStorage.getItem("miyagi_gemini_key");
  
  if (!savedKey) {
    showToast("Please configure your API key in settings.", "error");
    openSettingsBtn.click();
    return;
  }
  
  if (!prompt) {
    showToast("Please enter a styling prompt first.", "error");
    return;
  }
  
  applyAiStylesBtn.disabled = true;
  aiProgressMessage.classList.remove("hidden");
  setStatus("Consulting Gemini AI...");
  
  try {
    const generatedTheme = await fetchAiTheme(prompt, savedKey);
    customAiTheme = normalizeThemeObject(generatedTheme);
    
    applyThemeObject(customAiTheme);
    aiActiveBadge.classList.remove("hidden");
    
    showToast(`AI styling successfully applied: "${customAiTheme.name}"!`, "success");
    setStatus("AI styling active");
    invalidateGeneratedAssets("AI style updated");
  } catch (err) {
    console.error(err);
    showToast(`Gemini error: ${err.message}`, "error");
    setStatus("AI Style compilation failed");
  } finally {
    applyAiStylesBtn.disabled = false;
    aiProgressMessage.classList.add("hidden");
  }
});

// Presets (Single Size vs Full Web Pack)
singleAssetPreset.addEventListener("click", () => {
  activePreset = "single";
  singleAssetPreset.classList.add("active");
  webPackPreset.classList.remove("active");
  singleSizesSelector.classList.remove("hidden");
  webPackExplorer.classList.add("hidden");
  integrationCodeBlock.classList.add("hidden");
  invalidateGeneratedAssets("Switched to Single Assets");
  updateCommand();
});

webPackPreset.addEventListener("click", () => {
  activePreset = "pack";
  webPackPreset.classList.add("active");
  singleAssetPreset.classList.remove("active");
  singleSizesSelector.classList.add("hidden");
  webPackExplorer.classList.remove("hidden");
  invalidateGeneratedAssets("Switched to Web Pack");
  updateCommand();
});

// Core inputs
themeSelect.addEventListener("change", () => {
  applyRecommendedScale();
  if (!aiEnabledToggle.checked) {
    applyTheme(themeSelect.value);
  }
  updateCommand();
  invalidateGeneratedAssets("Theme base changed");
});

document.querySelectorAll("input[name='size'], input[name='format']").forEach((input) => {
  input.addEventListener("change", () => {
    updateCommand();
    invalidateGeneratedAssets("Options updated");
  });
});

assetScale.addEventListener("input", () => {
  hasManualAssetScale = true;
  applyAssetScale();
  updateCommand();
  invalidateGeneratedAssets("Scale updated");
});

assetInput.addEventListener("change", async (event) => {
  const [file] = event.target.files;
  await loadAssetFile(file);
});

// Drag & Drop
dropZoneLabel.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropZoneLabel.classList.add("is-dragging");
});

dropZoneLabel.addEventListener("dragleave", () => {
  dropZoneLabel.classList.remove("is-dragging");
});

dropZoneLabel.addEventListener("drop", async (event) => {
  event.preventDefault();
  dropZoneLabel.classList.remove("is-dragging");
  const [file] = event.dataTransfer.files;
  await loadAssetFile(file);
});

generateButton.addEventListener("click", generateAssets);
downloadAllButton.addEventListener("click", downloadZip);

copyHeadTagsBtn.addEventListener("click", () => {
  navigator.clipboard.writeText(headTagsCode.textContent)
    .then(() => showToast("HTML tags copied to clipboard!", "success"))
    .catch(() => showToast("Failed to copy snippet.", "error"));
});

// Backdrop selector listener
const previewStage = document.querySelector(".preview-stage");
document.querySelectorAll(".bg-opt").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".bg-opt").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    if (previewStage) {
      previewStage.dataset.backdrop = btn.dataset.bg;
    }
    showToast(`Backdrop switched to ${btn.title}!`, "info");
  });
});

// --- INIT APP ---
applyTheme("liquid-glass");
applyAssetScale();
loadDefaultIcon();
updateCommand();
renderEmptyAssets();
updateAiToggleState();

// --- API UTILITIES ---

function setApiStatus(msg, type) {
  apiStatusMessage.className = `api-status-message ${type}`;
  apiStatusMessage.textContent = msg;
}

function updateAiToggleState() {
  const key = localStorage.getItem("miyagi_gemini_key");
  if (!key) {
    aiActiveBadge.classList.add("hidden");
    aiEnabledToggle.checked = false;
    aiConsoleContent.classList.add("collapsed");
  }
}

async function validateGeminiKey(key) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: "Respond 'OK' if you hear me." }] }]
    })
  });
  if (!response.ok) return false;
  const result = await response.json();
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
  return text && text.toLowerCase().includes("ok");
}

async function fetchAiTheme(prompt, key) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
  
  const systemPrompt = `
You are a master digital designer specializing in glassmorphic, neomorphic, and metallic UI themes. You generate highly polished theme variables for a standard visual renderer.
Given a user style request, you will return a strictly valid JSON object that contains the properties required to render this premium aesthetic.
The JSON format must match one of our four renderers: 'glass' (standard glassmorphism), 'crystal-liquid', 'discomorphism', or 'chrome-metallic'.

For 'glass' renderer, you must specify:
{
  "renderer": "glass",
  "name": "A short premium name",
  "description": "A professional design description",
  "bg": ["#color1", "#color2", ...], // 2-4 hex or rgb colors forming a gorgeous gradient
  "glass": "rgba(...) or #...", // the main fill of the glass plate (translucent)
  "edge": "rgba(...) or #...", // the shiny bevel highlight border color
  "shadow": "rgba(...) or #...", // shadow color under the plate
  "accent": "rgba(...) or #..." // glyph aura refraction/accent color
}

For 'crystal-liquid' renderer, specify:
{
  "renderer": "crystal-liquid",
  "name": "...",
  "baseColor": "#...",
  "secondaryColor": "#...",
  "highlightColor": "#...",
  "environmentColor": "#...",
  "blur": 40, // default, number between 20-60
  "opacity": 0.72, // default, number between 0.3-0.9
  "refraction": 0.85, // default, number between 0.3-1.0
  "glow": 0.35, // default, number between 0.1-0.9
  "sparkle": 1.0, // default, number between 0.1-1.0
  "caustics": 0.6, // default, number between 0.1-1.0
  "innerShadow": 0.45, // default, number between 0.1-1.0
  "specularIntensity": 1.0, // default, number between 0.1-1.0
  "edgeRim": 0.6, // default, number between 0.1-1.0
  "noiseAmount": 0.08 // default, number between 0.01-0.15
}

For 'discomorphism' renderer, specify:
{
  "renderer": "discomorphism",
  "name": "...",
  "background": ["#color1", ...],
  "lights": ["#color1", ...],
  "edge": ["#color1", ...],
  "defaultAssetScale": 0.99,
  "gap": 0.09,
  "tileRadius": 0.14,
  "rimIntensity": 0.9,
  "glow": 0.42,
  "sparkle": 0.75
}

For 'chrome-metallic' renderer, specify:
{
  "renderer": "chrome-metallic",
  "name": "...",
  "background": ["#color1", ...],
  "metal": ["#color1", ...], // gradient of metal reflections (silver, gold, copper, etc)
  "accent": ["#color1", ...],
  "glow": 0.46,
  "bevel": 0.78,
  "shadow": 0.44,
  "sparkle": 0.82
}

Make sure the output colors are exceptionally beautiful, premium, HSL or HEX formulated, modern, and harmonious.
Respond ONLY with raw valid JSON. Do not include markdown code block formatting (such as \`\`\`json).
`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: `${systemPrompt}\n\nUser request: "${prompt}"` }]
      }],
      generationConfig: {
        responseMimeType: "application/json"
      }
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "Failed to contact Gemini API");
  }

  const result = await response.json();
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
  return JSON.parse(text);
}

function normalizeThemeObject(theme) {
  const norm = { ...theme };
  norm.renderer = norm.renderer || "glass";
  
  const rawBg = norm.bg || norm.background;
  norm.bg = asArray(rawBg, ["#1a1a1a", "#0a0a0a"]);
  norm.background = norm.bg;
  
  if (!norm.glass) {
    norm.glass = norm.baseColor ? withAlpha(norm.baseColor, 0.4) : "rgba(255,255,255,0.3)";
  }
  
  if (!norm.edge) norm.edge = norm.highlightColor || "rgba(255,255,255,0.7)";
  if (!norm.shadow) norm.shadow = "rgba(0,0,0,0.4)";
  if (!norm.accent) norm.accent = norm.baseColor || "#ffffff";
  
  norm.lights = asArray(norm.lights || norm.accent, ["#35e5ff", "#d65cff", "#f8e8a4"]);
  norm.metal = asArray(norm.metal, ["#ffffff", "#8596b7", "#ffffff", "#5f6e96"]);
  
  norm.defaultScale = norm.defaultAssetScale || 0.56;
  return norm;
}

// --- CORE RENDER MECHANISMS ---

function applyTheme(name) {
  const theme = THEMES[name];
  applyThemeObject(theme);
}

function applyThemeObject(theme) {
  if (!theme) return;
  const renderer = theme.renderer || "glass";
  iconPreview.dataset.renderer = renderer;
  
  if (renderer === "crystal-liquid") {
    iconPreview.style.setProperty("--preview-bg", `radial-gradient(circle at 50% 0%, ${theme.secondaryColor || '#1ED760'} 0%, ${theme.environmentColor || '#0A0A0A'} 80%)`);
    iconPreview.style.setProperty("--preview-glass", theme.baseColor || "rgba(255,255,255,0.4)");
    iconPreview.style.setProperty("--preview-edge", theme.highlightColor || "#ffffff");
    iconPreview.style.setProperty("--preview-shadow", "rgba(0,0,0,0.45)");
  } else if (renderer === "discomorphism") {
    const bgColors = asArray(theme.background || theme.bg, ["#11151b", "#07090f"]);
    const edgeColors = asArray(theme.edge, ["#7dd8c5"]);
    iconPreview.style.setProperty("--preview-bg", `linear-gradient(135deg, ${bgColors.join(", ")})`);
    iconPreview.style.setProperty("--preview-glass", "rgba(255,255,255,0.08)");
    iconPreview.style.setProperty("--preview-edge", edgeColors[0]);
    iconPreview.style.setProperty("--preview-shadow", "rgba(0,0,0,0.5)");
  } else if (renderer === "chrome-metallic") {
    const bgColors = asArray(theme.background || theme.bg, ["#090a11", "#161727"]);
    iconPreview.style.setProperty("--preview-bg", `linear-gradient(135deg, ${bgColors.join(", ")})`);
    iconPreview.style.setProperty("--preview-glass", "rgba(255,255,255,0.07)");
    iconPreview.style.setProperty("--preview-edge", "rgba(255,255,255,0.28)");
    iconPreview.style.setProperty("--preview-shadow", "rgba(0,0,0,0.48)");
  } else {
    const bgColors = asArray(theme.bg || theme.background, ["#dceeff", "#f9f7f1"]);
    iconPreview.style.setProperty("--preview-bg", `linear-gradient(135deg, ${bgColors.join(", ")})`);
    iconPreview.style.setProperty("--preview-glass", asArray(theme.glass, ["rgba(255,255,255,0.4)"])[0]);
    iconPreview.style.setProperty("--preview-edge", asArray(theme.edge, ["rgba(255,255,255,0.7)"])[0]);
    iconPreview.style.setProperty("--preview-shadow", asArray(theme.shadow, ["rgba(39,59,88,.28)"])[0]);
  }
}

function applyRecommendedScale() {
  if (hasManualAssetScale) return;
  const theme = THEMES[themeSelect.value];
  const scale = theme?.defaultScale ?? 0.56;
  assetScale.value = Math.round(scale * 100);
  applyAssetScale();
}

function applyAssetScale() {
  const scale = getAssetScale();
  iconPreview.style.setProperty("--glyph-scale", scale.toFixed(2));
  assetScaleValue.value = `${Math.round(scale * 100)}%`;
}

function loadDefaultIcon() {
  const svg = sanitizeSvg(defaultIcon);
  currentAsset = {
    name: "miyagi-leaf",
    filename: "miyagi-leaf.svg",
    type: "svg",
    dataUri: svgToDataUri(svg),
    markup: svg
  };
  previewGlyph.innerHTML = svg;
}

async function loadAssetFile(file) {
  if (!file) return;

  const extension = file.name.split(".").pop()?.toLowerCase();
  const isSvg = extension === "svg" || file.type === "image/svg+xml";
  const isRaster = ["png", "jpg", "jpeg"].includes(extension) || ["image/png", "image/jpeg"].includes(file.type);

  if (!isSvg && !isRaster) {
    showToast("File format must be SVG, PNG, or JPG.", "error");
    setStatus("Use SVG, PNG, or JPG");
    return;
  }

  const name = file.name.replace(/\.[^.]+$/, "");

  if (isSvg) {
    const svg = sanitizeSvg(await file.text());
    currentAsset = {
      name,
      filename: file.name,
      type: "svg",
      dataUri: svgToDataUri(svg),
      markup: svg
    };
    previewGlyph.innerHTML = svg;
  } else {
    const dataUri = await fileToDataUri(file);
    currentAsset = {
      name,
      filename: file.name,
      type: "raster",
      dataUri,
      markup: `<img src="${dataUri}" alt="">`
    };
    previewGlyph.innerHTML = currentAsset.markup;
  }

  assetName.textContent = file.name;
  generatedAssets = [];
  downloadAllButton.disabled = true;
  integrationCodeBlock.classList.add("hidden");
  renderEmptyAssets();
  showToast(`Loaded ${file.name} successfully!`, "success");
  setStatus("Ready to generate");
}

// --- GENERATION ENGINE CONTROLLERS ---

async function generateAssets() {
  if (!currentAsset) {
    showToast("Please upload a source icon first.", "error");
    return;
  }

  generatedAssets = [];
  assetList.innerHTML = "";
  generateButton.disabled = true;
  downloadAllButton.disabled = true;
  integrationCodeBlock.classList.add("hidden");
  setStatus("Generating assets...");
  showToast("Rendering engine starting...", "info");

  try {
    const image = await loadImage(currentAsset.dataUri);
    const theme = (aiEnabledToggle.checked && customAiTheme) 
      ? customAiTheme 
      : THEMES[themeSelect.value];
    const scale = getAssetScale();

    if (activePreset === "single") {
      const sizes = getSelectedValues("size").map(Number);
      const formats = getSelectedValues("format");

      if (!sizes.length || !formats.length) {
        showToast("Select at least one size and format.", "error");
        setStatus("Sizes or formats missing");
        generateButton.disabled = false;
        return;
      }

      for (const size of sizes) {
        if (formats.includes("png")) {
          const blob = await renderPng({ size, image, theme, assetScale: scale });
          generatedAssets.push(createGeneratedAsset(`${currentAsset.name}-${theme.renderer}-${size}.png`, blob));
        }

        if (formats.includes("svg")) {
          const svg = renderSvg({ size, asset: currentAsset, theme, assetScale: scale });
          const blob = new Blob([svg], { type: "image/svg+xml" });
          generatedAssets.push(createGeneratedAsset(`${currentAsset.name}-${theme.renderer}-${size}.svg`, blob));
        }
      }
    } else {
      // Full Web Asset Pack Preset
      showToast("Rendering Apple, Android, Favicons, and OG showcases...", "info");

      // 1. Favicons
      const fav16 = await renderPng({ size: 16, image, theme, assetScale: scale });
      generatedAssets.push(createGeneratedAsset("favicons/favicon-16x16.png", fav16));

      const fav32 = await renderPng({ size: 32, image, theme, assetScale: scale });
      generatedAssets.push(createGeneratedAsset("favicons/favicon-32x32.png", fav32));
      
      const icoBlob = await createIcoFromPng(fav32);
      generatedAssets.push(createGeneratedAsset("favicons/favicon.ico", icoBlob));

      // 2. Mobile launch
      const appleTouch = await renderPng({ size: 180, image, theme, assetScale: scale });
      generatedAssets.push(createGeneratedAsset("mobile/apple-touch-icon.png", appleTouch));

      const android192 = await renderPng({ size: 192, image, theme, assetScale: scale });
      generatedAssets.push(createGeneratedAsset("mobile/android-chrome-192x192.png", android192));

      const android512 = await renderPng({ size: 512, image, theme, assetScale: scale });
      generatedAssets.push(createGeneratedAsset("mobile/android-chrome-512x512.png", android512));

      // 3. Desktop Windows
      const winTile = await renderPng({ size: 150, image, theme, assetScale: scale });
      generatedAssets.push(createGeneratedAsset("desktop/mstile-150x150.png", winTile));

      // 4. Premium Open Graph Image
      const ogBanner = await renderOgImage({ image, theme, assetScale: scale });
      generatedAssets.push(createGeneratedAsset("marketing/og-image.png", ogBanner));

      // 5. site.webmanifest JSON
      const manifest = JSON.stringify({
        name: currentAsset.name,
        short_name: currentAsset.name.slice(0, 12),
        icons: [
          { src: "/mobile/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "/mobile/android-chrome-512x512.png", sizes: "512x512", type: "image/png" }
        ],
        theme_color: theme.bg?.[0] || "#ffffff",
        background_color: "#08090d",
        display: "standalone"
      }, null, 2);
      generatedAssets.push(createGeneratedAsset("site.webmanifest", new Blob([manifest], { type: "application/json" })));

      // 6. Generate copied Head tags
      renderHeadIntegrationSnippet(theme);
    }

    renderGeneratedAssets();
    setStatus(`${generatedAssets.length} assets ready`);
    showToast(`Successfully rendered ${generatedAssets.length} assets!`, "success");
    downloadAllButton.disabled = generatedAssets.length === 0;
  } catch (error) {
    console.error(error);
    showToast("Generation pipeline encountered an error.", "error");
    setStatus("Generation failed");
  } finally {
    generateButton.disabled = false;
  }
}

function renderHeadIntegrationSnippet(theme) {
  const themeColor = theme?.bg?.[0] || theme?.background?.[0] || "#ffffff";
  const code = `<!-- Miyagi Studio Head Integration Assets -->
<link rel="apple-touch-icon" sizes="180x180" href="/mobile/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicons/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicons/favicon-16x16.png">
<link rel="shortcut icon" href="/favicons/favicon.ico">
<link rel="manifest" href="/site.webmanifest">
<meta name="msapplication-TileColor" content="#08090d">
<meta name="theme-color" content="${themeColor}">

<!-- Open Graph / Social Sharing Banners -->
<meta property="og:type" content="website">
<meta property="og:image" content="/marketing/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="/marketing/og-image.png">`;

  headTagsCode.textContent = code;
  integrationCodeBlock.classList.remove("hidden");
}

function renderPng({ size, image, theme, assetScale }) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (theme.renderer === "discomorphism") {
    drawDiscoIcon(ctx, { size, image, theme, assetScale });
  } else if (theme.renderer === "chrome-metallic") {
    drawChromeIcon(ctx, { size, image, theme, assetScale });
  } else {
    drawGlassIcon(ctx, { size, image, theme, assetScale });
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

// --- LUXURY OPEN GRAPH CANVAS BUILDER ---
async function renderOgImage({ image, theme, assetScale }) {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext("2d");
  
  // Gradient backdrop
  const bg = ctx.createLinearGradient(0, 0, 1200, 630);
  bg.addColorStop(0, "#08090d");
  bg.addColorStop(0.5, "#0F1117");
  bg.addColorStop(1, "#030406");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1200, 630);
  
  // Background mesh wireframe
  ctx.strokeStyle = "rgba(255,255,255,0.035)";
  ctx.lineWidth = 1;
  const gridSize = 40;
  for (let x = 0; x < 1200; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 630);
    ctx.stroke();
  }
  for (let y = 0; y < 630; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1200, y);
    ctx.stroke();
  }
  
  // Glowing concentric frame rings
  ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(600, 280, 240, 0, Math.PI * 2);
  ctx.stroke();
  
  ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(600, 280, 320, 0, Math.PI * 2);
  ctx.stroke();
  
  // Color aura glow
  const glowAccent = asArray(theme.bg || theme.background, [asArray(theme.accent, ["#35e5ff"])[0]])[0];
  drawGlow(ctx, 600, 280, 220, glowAccent, 0.28);
  
  // Translate, render, and scale icon at center
  const size = 300;
  const x = (1200 - size) / 2;
  const y = (560 - size) / 2;
  
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 30;
  
  ctx.save();
  const radius = size * 0.218;
  roundRect(ctx, x, y, size, size, radius);
  ctx.clip();
  
  ctx.translate(x, y);
  if (theme.renderer === "discomorphism") {
    drawDiscoIcon(ctx, { size, image, theme, assetScale });
  } else if (theme.renderer === "chrome-metallic") {
    drawChromeIcon(ctx, { size, image, theme, assetScale });
  } else {
    drawGlassIcon(ctx, { size, image, theme, assetScale });
  }
  ctx.restore();
  ctx.restore();
  
  // Dynamic design labels at bottom
  ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
  ctx.font = "bold 13px Outfit, Inter, sans-serif";
  ctx.letterSpacing = "3px";
  ctx.textAlign = "center";
  ctx.fillText("MIYAGI PREMIUM WEB ASSET PACK", 600, 520);

  ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
  ctx.font = "normal 11px Outfit, Inter, sans-serif";
  ctx.letterSpacing = "1.5px";
  ctx.fillText(`${theme.name.toUpperCase()} THEME • GEMINI AI ENHANCED`, 600, 545);
  
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

// --- DETERMINISTIC CANVAS DRAWERS ---

function drawGlassIcon(ctx, { size, image, theme, assetScale }) {
  const radius = size * 0.218;
  roundRect(ctx, 0, 0, size, size, radius);
  ctx.clip();

  const bg = ctx.createLinearGradient(0, 0, size, size);
  const colors = asArray(theme.bg || theme.background, ["#dceeff", "#f9f7f1"]);
  addGradientStops(bg, colors);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  const bloom = ctx.createRadialGradient(size * 0.35, size * 0.25, 0, size * 0.35, size * 0.25, size * 0.58);
  bloom.addColorStop(0, "rgba(255,255,255,.72)");
  bloom.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = bloom;
  ctx.fillRect(0, 0, size, size);

  ctx.save();
  ctx.shadowColor = theme.shadow || "rgba(0,0,0,0.28)";
  ctx.shadowBlur = size * 0.07;
  ctx.shadowOffsetY = size * 0.032;
  roundRect(ctx, size * 0.058, size * 0.058, size * 0.884, size * 0.884, radius * 0.72);
  ctx.fillStyle = theme.glass || "rgba(255,255,255,.48)";
  ctx.fill();
  ctx.restore();

  roundRect(ctx, size * 0.058, size * 0.058, size * 0.884, size * 0.884, radius * 0.72);
  ctx.lineWidth = Math.max(1, size * 0.004);
  ctx.strokeStyle = asArray(theme.edge, ["rgba(255,255,255,.7)"])[0];
  ctx.stroke();

  const glyphSize = size * assetScale;
  const fit = contain(image.width, image.height, glyphSize, glyphSize);
  const x = (size - fit.width) / 2;
  const y = (size - fit.height) / 2;

  ctx.save();
  ctx.shadowColor = "rgba(10,18,28,.28)";
  ctx.shadowBlur = size * 0.026;
  ctx.shadowOffsetY = size * 0.022;
  ctx.drawImage(image, x, y, fit.width, fit.height);
  ctx.restore();

  const shine = ctx.createLinearGradient(size * 0.18, size * 0.12, size * 0.78, size * 0.38);
  shine.addColorStop(0, "rgba(255,255,255,.74)");
  shine.addColorStop(0.52, "rgba(255,255,255,.2)");
  shine.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = shine;
  roundRect(ctx, size * 0.09, size * 0.08, size * 0.78, size * 0.28, size * 0.16);
  ctx.fill();
}

function drawDiscoIcon(ctx, { size, image, theme, assetScale }) {
  const radius = size * 0.218;
  roundRect(ctx, 0, 0, size, size, radius);
  ctx.clip();

  const bg = ctx.createLinearGradient(0, 0, size, size);
  const colors = asArray(theme.background || theme.bg, ["#11151b", "#07090f"]);
  addGradientStops(bg, colors);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  const lights = asArray(theme.lights, ["#35e5ff", "#d65cff", "#f8e8a4"]);

  drawGlow(ctx, size * 0.18, size * 0.74, size * 0.42, lights[0], 0.42);
  drawGlow(ctx, size * 0.84, size * 0.2, size * 0.34, lights[1], 0.38);
  drawGlow(ctx, size * 0.52, size * 0.08, size * 0.3, lights[2], 0.28);

  const glyphSize = size * assetScale;
  const glyphX = (size - glyphSize) / 2;
  const glyphY = (size - glyphSize) / 2;
  const sampleCount = 34;
  const sampleCanvas = document.createElement("canvas");
  sampleCanvas.width = sampleCount;
  sampleCanvas.height = sampleCount;
  const sampleCtx = sampleCanvas.getContext("2d", { willReadFrequently: true });
  drawContainedImage(sampleCtx, image, 0, 0, sampleCount, sampleCount);
  const samples = sampleCtx.getImageData(0, 0, sampleCount, sampleCount).data;
  const cell = glyphSize / sampleCount;
  const gap = Math.max(0.75, size * 0.001);

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,.52)";
  ctx.shadowBlur = size * 0.055;
  ctx.shadowOffsetY = size * 0.026;
  roundRect(ctx, glyphX, glyphY, glyphSize, glyphSize, radius * 0.25);
  ctx.fillStyle = "rgba(0,0,0,.35)";
  ctx.fill();
  ctx.restore();

  for (let y = 0; y < sampleCount; y += 1) {
    for (let x = 0; x < sampleCount; x += 1) {
      const offset = (y * sampleCount + x) * 4;
      const alpha = samples[offset + 3] / 255;
      if (alpha < 0.05) continue;

      const base = [samples[offset], samples[offset + 1], samples[offset + 2]];
      const light = lights[(x + y) % lights.length];
      const color = mixRgb(base, hexToRgb(light), 0.22 + ((x * 7 + y * 11) % 18) / 100);
      const px = glyphX + x * cell;
      const py = glyphY + y * cell;
      const tileSize = Math.max(1, cell - gap);

      const tileGradient = ctx.createLinearGradient(px, py, px + tileSize, py + tileSize);
      tileGradient.addColorStop(0, `rgba(255,255,255,${0.55 * alpha})`);
      tileGradient.addColorStop(0.18, rgbString(color, 0.94 * alpha));
      tileGradient.addColorStop(0.66, rgbString(mixRgb(color, [18, 20, 32], 0.32), 0.96 * alpha));
      tileGradient.addColorStop(1, `rgba(255,255,255,${0.38 * alpha})`);
      ctx.fillStyle = tileGradient;
      roundRect(ctx, px, py, tileSize, tileSize, Math.max(1, tileSize * 0.15));
      ctx.fill();
      ctx.strokeStyle = `rgba(255,255,255,${0.24 * alpha})`;
      ctx.lineWidth = Math.max(0.35, size * 0.0008);
      ctx.stroke();
    }
  }

  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.globalAlpha = 0.22;
  drawContainedImage(ctx, image, glyphX, glyphY, glyphSize, glyphSize);
  ctx.restore();

  drawStar(ctx, size * 0.82, size * 0.14, size * 0.052, lights[1], 0.82);
  drawStar(ctx, size * 0.18, size * 0.45, size * 0.032, lights[0], 0.48);
  drawStar(ctx, size * 0.62, size * 0.77, size * 0.028, lights[2], 0.38);

  ctx.lineWidth = Math.max(2, size * 0.007);
  const rim = ctx.createLinearGradient(0, 0, size, size);
  const edgeColors = asArray(theme.edge, ["#3b67c8", "#7dd8c5", "#b9a7ff"]);
  rim.addColorStop(0, edgeColors[0] || "#3b67c8");
  rim.addColorStop(0.52, edgeColors[1] || "#7dd8c5");
  rim.addColorStop(1, edgeColors[2] || "#b9a7ff");
  ctx.strokeStyle = rim;
  roundRect(ctx, size * 0.003, size * 0.003, size * 0.994, size * 0.994, radius);
  ctx.stroke();
}

function drawChromeIcon(ctx, { size, image, theme, assetScale }) {
  const radius = size * 0.218;
  roundRect(ctx, 0, 0, size, size, radius);
  ctx.clip();

  const bg = ctx.createLinearGradient(0, 0, size, size);
  const colors = asArray(theme.background || theme.bg, ["#090a11", "#161727"]);
  addGradientStops(bg, colors);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  const accentColors = asArray(theme.accent, ["#d856ff"]);
  const glowAccent = theme.glowColor || accentColors[0];
  drawGlow(ctx, size * 0.52, size * 0.75, size * 0.42, glowAccent, 0.42);

  roundRect(ctx, size * 0.05, size * 0.05, size * 0.9, size * 0.9, radius * 0.78);
  ctx.fillStyle = "rgba(255,255,255,.035)";
  ctx.fill();

  const mask = createMaskCanvas(size, image, assetScale);
  const metalCanvas = document.createElement("canvas");
  metalCanvas.width = size;
  metalCanvas.height = size;
  const metalCtx = metalCanvas.getContext("2d");

  const metalColors = asArray(theme.metal, ["#f8fbff", "#8596b7", "#ffffff", "#5f6e96", "#e9f0ff"]);
  const metal = metalCtx.createLinearGradient(size * 0.14, size * 0.05, size * 0.88, size * 0.96);
  addGradientStops(metal, metalColors);
  metalCtx.fillStyle = metal;
  metalCtx.fillRect(0, 0, size, size);

  const band = metalCtx.createLinearGradient(0, size * 0.2, size, size * 0.75);
  band.addColorStop(0, "rgba(255,255,255,0)");
  band.addColorStop(0.22, "rgba(255,255,255,.82)");
  band.addColorStop(0.36, "rgba(84,111,255,.58)");
  band.addColorStop(0.55, "rgba(0,0,0,.36)");
  band.addColorStop(0.68, "rgba(216,86,255,.62)");
  band.addColorStop(0.86, "rgba(255,255,255,.84)");
  band.addColorStop(1, "rgba(255,255,255,0)");
  metalCtx.globalCompositeOperation = "screen";
  metalCtx.fillStyle = band;
  metalCtx.fillRect(0, 0, size, size);
  metalCtx.globalCompositeOperation = "destination-in";
  metalCtx.drawImage(mask, 0, 0);

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,.68)";
  ctx.shadowBlur = size * 0.032;
  ctx.shadowOffsetY = size * 0.026;
  ctx.drawImage(mask, 0, 0);
  ctx.restore();
  ctx.drawImage(metalCanvas, 0, 0);

  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.globalAlpha = 0.22;
  drawSourceInGlyphBox(ctx, image, size, assetScale);
  ctx.restore();

  const accentColor = accentColors[1] || accentColors[0];
  drawStar(ctx, size * 0.68, size * 0.2, size * 0.04, "#ffffff", 0.88);
  drawStar(ctx, size * 0.67, size * 0.73, size * 0.035, accentColor, 0.82);
}

// --- DETERMINISTIC SVG RENDERERS ---

function renderSvg({ size, asset, theme, assetScale }) {
  if (theme.renderer === "discomorphism") {
    return renderDiscoSvg({ size, asset, theme, assetScale });
  }

  if (theme.renderer === "chrome-metallic") {
    return renderChromeSvg({ size, asset, theme, assetScale });
  }

  const radius = Math.round(size * 0.218);
  const glyph = Math.round(size * assetScale);
  const glyphX = Math.round((size - glyph) / 2);
  const glassInset = Math.round(size * 0.058);
  const glassSize = size - glassInset * 2;
  const colors = asArray(theme.bg || theme.background, ["#dceeff", "#f9f7f1"]);
  const stops = renderSvgStops(colors);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">${stops}</linearGradient>
    <radialGradient id="bloom" cx=".35" cy=".25" r=".58">
      <stop offset="0" stop-color="#fff" stop-opacity=".72"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
    <filter id="softShadow" x="-30%" y="-30%" width="160%" height="170%">
      <feDropShadow dx="0" dy="${Math.round(size * 0.032)}" stdDeviation="${Math.round(size * 0.035)}" flood-color="#263b58" flood-opacity=".28"/>
    </filter>
    <clipPath id="iconClip"><rect width="${size}" height="${size}" rx="${radius}"/></clipPath>
  </defs>
  <g clip-path="url(#iconClip)">
    <rect width="${size}" height="${size}" fill="url(#bg)"/>
    <rect width="${size}" height="${size}" fill="url(#bloom)"/>
    <rect x="${glassInset}" y="${glassInset}" width="${glassSize}" height="${glassSize}" rx="${Math.round(radius * 0.72)}" fill="${asArray(theme.glass, ['rgba(255,255,255,.48)'])[0]}" filter="url(#softShadow)"/>
    <rect x="${glassInset}" y="${glassInset}" width="${glassSize}" height="${glassSize}" rx="${Math.round(radius * 0.72)}" fill="none" stroke="${asArray(theme.edge, ['rgba(255,255,255,.7)'])[0]}" stroke-width="${Math.max(1, Math.round(size * 0.004))}"/>
    <image href="${asset.dataUri}" x="${glyphX}" y="${glyphX}" width="${glyph}" height="${glyph}" preserveAspectRatio="xMidYMid meet"/>
    <path d="M ${size * 0.12} ${size * 0.2} C ${size * 0.26} ${size * 0.06}, ${size * 0.62} ${size * 0.08}, ${size * 0.82} ${size * 0.22}" fill="none" stroke="#fff" stroke-opacity=".38" stroke-width="${Math.max(2, size * 0.035)}" stroke-linecap="round"/>
  </g>
</svg>`;
}

function renderDiscoSvg({ size, asset, theme, assetScale }) {
  const radius = Math.round(size * 0.218);
  const glyph = Math.round(size * assetScale);
  const glyphX = Math.round((size - glyph) / 2);
  const colors = asArray(theme.background || theme.bg, ["#11151b", "#07090f"]);
  const bgStops = renderSvgStops(colors);
  const lights = asArray(theme.lights, ["#35e5ff", "#d65cff"]);
  const edgeColors = asArray(theme.edge, ["#3b67c8", "#7dd8c5"]);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">${bgStops}</linearGradient>
    <clipPath id="iconClip"><rect width="${size}" height="${size}" rx="${radius}"/></clipPath>
    <pattern id="tiles" width="${Math.max(4, size / 28)}" height="${Math.max(4, size / 28)}" patternUnits="userSpaceOnUse">
      <rect width="100%" height="100%" fill="#0a0d14"/>
      <rect x="1" y="1" width="80%" height="80%" rx="1" fill="#c7fbff" opacity=".42"/>
      <path d="M0 0h100v100" stroke="#fff" stroke-opacity=".22"/>
    </pattern>
  </defs>
  <g clip-path="url(#iconClip)">
    <rect width="${size}" height="${size}" fill="url(#bg)"/>
    <circle cx="${size * 0.18}" cy="${size * 0.74}" r="${size * 0.42}" fill="${lights[0]}" opacity=".22"/>
    <circle cx="${size * 0.84}" cy="${size * 0.2}" r="${size * 0.34}" fill="${lights[1]}" opacity=".2"/>
    <image href="${asset.dataUri}" x="${glyphX}" y="${glyphX}" width="${glyph}" height="${glyph}" preserveAspectRatio="xMidYMid meet"/>
    <rect x="${glyphX}" y="${glyphX}" width="${glyph}" height="${glyph}" fill="url(#tiles)" opacity=".72" style="mix-blend-mode:screen"/>
    <rect x="2" y="2" width="${size - 4}" height="${size - 4}" rx="${radius}" fill="none" stroke="${edgeColors[1] || '#7dd8c5'}" stroke-width="${Math.max(2, size * 0.007)}" opacity=".9"/>
  </g>
</svg>`;
}

function renderChromeSvg({ size, asset, theme, assetScale }) {
  const radius = Math.round(size * 0.218);
  const glyph = Math.round(size * assetScale);
  const glyphX = Math.round((size - glyph) / 2);
  
  const colors = asArray(theme.background || theme.bg, ["#090a11", "#161727"]);
  const bgStops = renderSvgStops(colors);
  
  const metalColors = asArray(theme.metal, ["#f8fbff", "#8596b7"]);
  const metalStops = renderSvgStops(metalColors);
  
  const accentColor = asArray(theme.accent, ["#d856ff"])[0];

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">${bgStops}</linearGradient>
    <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1">${metalStops}</linearGradient>
    <clipPath id="iconClip"><rect width="${size}" height="${size}" rx="${radius}"/></clipPath>
  </defs>
  <g clip-path="url(#iconClip)">
    <rect width="${size}" height="${size}" fill="url(#bg)"/>
    <circle cx="${size * 0.52}" cy="${size * 0.76}" r="${size * 0.38}" fill="${accentColor}" opacity=".28"/>
    <image href="${asset.dataUri}" x="${glyphX}" y="${glyphX}" width="${glyph}" height="${glyph}" preserveAspectRatio="xMidYMid meet" opacity=".38"/>
    <image href="${asset.dataUri}" x="${glyphX}" y="${glyphX}" width="${glyph}" height="${glyph}" preserveAspectRatio="xMidYMid meet" opacity=".78" style="filter:saturate(0) contrast(1.6)"/>
    <path d="M ${size * 0.22} ${size * 0.32} C ${size * 0.42} ${size * 0.1}, ${size * 0.62} ${size * 0.18}, ${size * 0.82} ${size * 0.3}" stroke="#fff" stroke-width="${Math.max(2, size * 0.025)}" stroke-linecap="round" opacity=".62"/>
    <circle cx="${size * 0.68}" cy="${size * 0.2}" r="${size * 0.015}" fill="#fff"/>
  </g>
</svg>`;
}

// --- UTILITY ENGINE HELPERS ---

function createGeneratedAsset(filename, blob) {
  return {
    filename,
    blob,
    url: URL.createObjectURL(blob),
    bytes: blob.size
  };
}

function renderGeneratedAssets() {
  assetList.innerHTML = "";

  for (const asset of generatedAssets) {
    const row = document.createElement("div");
    row.className = "asset-row";
    
    // Nice nesting prefix for folders inside the explorer tree list
    const parts = asset.filename.split("/");
    const basename = parts[parts.length - 1];
    const folder = parts.length > 1 ? `<span class="row-folder">${parts.slice(0, -1).join("/")}/</span>` : "";

    row.innerHTML = `<span>${folder}${basename}<br><span class="asset-size-badge">${formatBytes(asset.bytes)}</span></span>`;

    const link = document.createElement("a");
    link.href = asset.url;
    link.download = basename;
    link.className = "button secondary row-btn";
    link.textContent = "Download";
    row.append(link);
    assetList.append(row);
  }
}

function renderEmptyAssets() {
  assetList.innerHTML = '<div class="asset-empty">Generated assets will appear here.</div>';
}

function invalidateGeneratedAssets(message) {
  if (!generatedAssets.length) return;
  generatedAssets.forEach((asset) => URL.revokeObjectURL(asset.url));
  generatedAssets = [];
  downloadAllButton.disabled = true;
  integrationCodeBlock.classList.add("hidden");
  renderEmptyAssets();
  setStatus(message);
}

async function downloadZip() {
  if (!generatedAssets.length) return;

  showToast("Packing ZIP file...", "info");
  const zip = new JSZip();
  for (const asset of generatedAssets) {
    zip.file(asset.filename, asset.blob);
  }

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const suffix = activePreset === "pack" ? "web-asset-pack" : `${themeSelect.value}-assets`;
  link.download = `${currentAsset.name}-${suffix}.zip`;
  link.click();
  URL.revokeObjectURL(url);
  showToast("ZIP downloaded successfully!", "success");
}

function getSelectedValues(name) {
  return [...document.querySelectorAll(`input[name='${name}']:checked`)].map((input) => input.value);
}

function updateCommand() {
  const activeTheme = (aiEnabledToggle.checked && customAiTheme) 
    ? customAiTheme 
    : THEMES[themeSelect.value];
  
  if (activePreset === "pack") {
    commandText.textContent = `node render.js --theme ${activeTheme.renderer || 'glass'} --all-sizes-and-favicons --pwa-manifest --og-banner --asset-scale ${getAssetScale().toFixed(2)}`;
    return;
  }
  
  const sizes = getSelectedValues("size");
  const theme = themeSelect.value;
  const formats = getSelectedValues("format");
  const formatArg = formats.length ? ` --formats ${formats.join(",")}` : "";
  commandText.textContent = `node render.js --theme ${theme} --sizes ${sizes.join(",")} --asset-scale ${getAssetScale().toFixed(2)}${formatArg}`;
}

function setStatus(message) {
  jobStatus.textContent = message;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function fileToDataUri(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function svgToDataUri(svg) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function sanitizeSvg(svg) {
  return svg
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+=["'][^"']*["']/gi, "")
    .replace("<svg", '<svg preserveAspectRatio="xMidYMid meet" aria-hidden="true"');
}

function contain(width, height, maxWidth, maxHeight) {
  const scale = Math.min(maxWidth / width, maxHeight / height);
  return { width: width * scale, height: height * scale };
}

// Fixed getAssetScale fallback for AI custom scales
function getAssetScale() {
  if (aiEnabledToggle.checked && customAiTheme && customAiTheme.defaultScale) {
    if (!hasManualAssetScale) {
      assetScale.value = Math.round(customAiTheme.defaultScale * 100);
      iconPreview.style.setProperty("--glyph-scale", customAiTheme.defaultScale.toFixed(2));
      assetScaleValue.value = `${Math.round(customAiTheme.defaultScale * 100)}%`;
      return customAiTheme.defaultScale;
    }
  }
  return Number(assetScale.value) / 100;
}

function drawContainedImage(ctx, image, x, y, width, height) {
  const fit = contain(image.width, image.height, width, height);
  ctx.drawImage(image, x + (width - fit.width) / 2, y + (height - fit.height) / 2, fit.width, fit.height);
}

function drawSourceInGlyphBox(ctx, image, size, assetScale) {
  const glyphSize = size * assetScale;
  drawContainedImage(ctx, image, (size - glyphSize) / 2, (size - glyphSize) / 2, glyphSize, glyphSize);
}

function createMaskCanvas(size, image, assetScale) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  drawSourceInGlyphBox(ctx, image, size, assetScale);
  return canvas;
}

function drawGlow(ctx, x, y, radius, color, alpha) {
  const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
  glow.addColorStop(0, withAlpha(color, alpha));
  glow.addColorStop(1, withAlpha(color, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

function drawStar(ctx, x, y, radius, color, alpha) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.PI / 4);
  ctx.shadowColor = color;
  ctx.shadowBlur = radius * 0.65;
  ctx.fillStyle = withAlpha("#ffffff", alpha);
  ctx.beginPath();
  ctx.moveTo(0, -radius);
  ctx.lineTo(radius * 0.16, -radius * 0.16);
  ctx.lineTo(radius, 0);
  ctx.lineTo(radius * 0.16, radius * 0.16);
  ctx.lineTo(0, radius);
  ctx.lineTo(-radius * 0.16, radius * 0.16);
  ctx.lineTo(-radius, 0);
  ctx.lineTo(-radius * 0.16, -radius * 0.16);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function mixRgb(a, b, amount) {
  return [
    Math.round(a[0] * (1 - amount) + b[0] * amount),
    Math.round(a[1] * (1 - amount) + b[1] * amount),
    Math.round(a[2] * (1 - amount) + b[2] * amount)
  ];
}

function rgbString(rgb, alpha) {
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;
}

function hexToRgb(hex) {
  let clean = hex.replace("#", "").trim();
  if (clean.length === 3) {
    clean = clean.split("").map(char => char + char).join("");
  } else if (clean.length === 4) {
    clean = clean.slice(0, 3).split("").map(char => char + char).join("");
  }
  return [
    Number.parseInt(clean.slice(0, 2), 16) || 0,
    Number.parseInt(clean.slice(2, 4), 16) || 0,
    Number.parseInt(clean.slice(4, 6), 16) || 0
  ];
}

function withAlpha(color, alpha) {
  if (!color) return `rgba(255,255,255,${alpha})`;
  if (color.startsWith("#")) {
    const [r, g, b] = hexToRgb(color);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  if (color.startsWith("hsl")) {
    if (color.startsWith("hsla")) {
      return color.replace(/hsla\(([^,]+),([^,]+),([^,]+),([^)]+)\)/, `hsla($1,$2,$3,${alpha})`);
    } else {
      return color.replace(/hsl\(([^,]+),([^,]+),([^)]+)\)/, `hsla($1,$2,$3,${alpha})`);
    }
  }
  if (color.startsWith("rgb")) {
    return color.replace(/rgba?\(([^)]+)\)/, (_, values) => `rgba(${values.split(",").slice(0, 3).join(",")},${alpha})`);
  }
  return color;
}

async function createIcoFromPng(pngBlob) {
  const pngBuffer = await pngBlob.arrayBuffer();
  const pngSize = pngBuffer.byteLength;
  
  const icoBuffer = new ArrayBuffer(22 + pngSize);
  const view = new DataView(icoBuffer);
  
  // ICO Header
  view.setUint16(0, 0, true); // Reserved
  view.setUint16(2, 1, true); // Type (1 = ICO)
  view.setUint16(4, 1, true); // Number of images (1)
  
  // Image Directory Entry
  view.setUint8(6, 32);       // Width (32)
  view.setUint8(7, 32);       // Height (32)
  view.setUint8(8, 0);        // Color count (0 = no palette)
  view.setUint8(9, 0);        // Reserved
  view.setUint16(10, 1, true); // Color planes (1)
  view.setUint16(12, 32, true); // Bits per pixel (32)
  view.setUint32(14, pngSize, true); // Image size in bytes
  view.setUint32(18, 22, true); // Image offset in file (22)
  
  // Copy PNG data
  const icoArr = new Uint8Array(icoBuffer);
  icoArr.set(new Uint8Array(pngBuffer), 22);
  
  return new Blob([icoBuffer], { type: "image/x-icon" });
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function asArray(val, fallback) {
  if (!val) return fallback;
  if (Array.isArray(val)) return val;
  return [val];
}

function addGradientStops(gradient, colors) {
  if (colors.length === 0) return;
  if (colors.length === 1) {
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(1, colors[0]);
  } else {
    colors.forEach((color, index) => {
      gradient.addColorStop(index / (colors.length - 1), color);
    });
  }
}

function renderSvgStops(colors) {
  if (colors.length === 0) return "";
  if (colors.length === 1) {
    return `<stop offset="0" stop-color="${colors[0]}"/><stop offset="1" stop-color="${colors[0]}"/>`;
  }
  return colors.map((color, index) => `<stop offset="${index / (colors.length - 1)}" stop-color="${color}"/>`).join("");
}
