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
    background: ["#0b0c10", "#12131c", "#07080b", "#141520"],
    bg: ["#0b0c10", "#12131c", "#07080b", "#141520"],
    glass: "rgba(255,255,255,.08)",
    edge: ["#475eff", "#d85cff", "#5df2ff"],
    shadow: "rgba(0,0,0,.5)",
    accent: "#d856ff",
    lights: ["#d856ff", "#546fff", "#ffffff", "#5cffd3", "#f8e8a4"],
    gap: 0.12,
    tileRadius: 0.18,
    rimIntensity: 0.95,
    glow: 0.48,
    sparkle: 0.85
  },
  "chrome-metallic": {
    renderer: "chrome-metallic",
    defaultScale: 0.62,
    background: ["#030407", "#090b14", "#040509", "#0c0d18"],
    bg: ["#030407", "#090b14", "#040509", "#0c0d18"],
    glass: "rgba(255,255,255,.07)",
    edge: "rgba(255,255,255,.28)",
    shadow: "rgba(0,0,0,.48)",
    accent: ["#30e2ff", "#d856ff", "#ffffff"],
    metal: ["#ffffff", "#555d70", "#ffffff", "#12141a", "#b0bbd4", "#ffffff", "#303647", "#ffffff"],
    glow: 0.54,
    bevel: 0.85,
    sparkle: 0.88
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
const frameEnabledToggle = document.querySelector("#frameEnabledToggle");
const installAppBtn = document.querySelector("#installAppBtn");
const classicWorkflowBtn = document.querySelector("#classicWorkflowBtn");
const aiWorkflowBtn = document.querySelector("#aiWorkflowBtn");
const batchQueue = document.querySelector("#batchQueue");
const prepTrim = document.querySelector("#prepTrim");
const prepRemoveBg = document.querySelector("#prepRemoveBg");
const prepFitMode = document.querySelector("#prepFitMode");
const prepPadding = document.querySelector("#prepPadding");
const prepPaddingValue = document.querySelector("#prepPaddingValue");
const applyPrepBtn = document.querySelector("#applyPrepBtn");
const resetPrepBtn = document.querySelector("#resetPrepBtn");

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
const aiShapeLock = document.querySelector("#aiShapeLock");
const aiColorMode = document.querySelector("#aiColorMode");
const transformAssetBtn = document.querySelector("#transformAssetBtn");
const applyAiStylesBtn = document.querySelector("#applyAiStylesBtn");
const aiProgressMessage = document.querySelector("#aiProgressMessage");
const aiActiveBadge = document.querySelector("#aiActiveBadge");
const aiValidationPanel = document.querySelector("#aiValidationPanel");

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
let assetQueue = [];
let activeAssetIndex = 0;
let generatedAssets = [];
let hasManualAssetScale = false;
let customAiTheme = null;
let activePreset = "single"; // "single" or "pack"
let previewRenderToken = 0;
let deferredInstallPrompt = null;

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

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.warn("Service worker registration failed.", err);
    });
  });
}

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  installAppBtn?.classList.remove("hidden");
});

installAppBtn?.addEventListener("click", async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice.catch(() => undefined);
  deferredInstallPrompt = null;
  installAppBtn.classList.add("hidden");
});

classicWorkflowBtn?.addEventListener("click", () => setWorkflow("classic"));
aiWorkflowBtn?.addEventListener("click", () => setWorkflow("ai"));

// Background Frame Toggle
if (frameEnabledToggle) {
  frameEnabledToggle.addEventListener("change", () => {
    const useFrame = frameEnabledToggle.checked;
    if (useFrame) {
      iconPreview.classList.remove("no-frame");
    } else {
      iconPreview.classList.add("no-frame");
    }
    updateCommand();
    updatePreviewGlyph();
    invalidateGeneratedAssets("Background Frame state changed");
  });
}

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
    document.body.dataset.workflow = "ai";
    classicWorkflowBtn?.classList.remove("active");
    aiWorkflowBtn?.classList.add("active");
    const savedKey = localStorage.getItem("miyagi_gemini_key");
    if (!savedKey) {
      showToast("Gemini API key required! Opening settings...", "error");
      openSettingsBtn.click();
    }
    aiConsoleContent.classList.remove("collapsed");
    if (customAiTheme) {
      aiActiveBadge.classList.remove("hidden");
      applyThemeObject(customAiTheme);
    }
  } else {
    document.body.dataset.workflow = "classic";
    classicWorkflowBtn?.classList.add("active");
    aiWorkflowBtn?.classList.remove("active");
    aiConsoleContent.classList.add("collapsed");
    aiActiveBadge.classList.add("hidden");
    applyTheme(themeSelect.value);
  }
  updateCommand();
  updatePreviewGlyph();
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

transformAssetBtn?.addEventListener("click", transformCurrentAssetWithAi);

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

  const progressText = aiProgressMessage.querySelector("span:not(.spinner)");
  const stages = [
    "Analyzing base styles...",
    "Consulting Gemini AI...",
    "Synthesizing specular highlight gradients...",
    "Refining metallic specular reflections...",
    "Calculating color chromatic harmony...",
    "Finalizing luxury theme compilation..."
  ];
  let stageIdx = 0;
  if (progressText) progressText.textContent = stages[0];
  setStatus(stages[0]);

  const stageInterval = setInterval(() => {
    stageIdx = (stageIdx + 1) % stages.length;
    if (progressText) progressText.textContent = stages[stageIdx];
    setStatus(stages[stageIdx]);
  }, 2200);

  try {
    const generatedTheme = await fetchAiTheme(prompt, themeSelect.value, savedKey);
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
    clearInterval(stageInterval);
    if (progressText) progressText.textContent = "Consulting Gemini...";
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
  updatePreviewGlyph();
  invalidateGeneratedAssets("Scale updated");
});

assetInput.addEventListener("change", async (event) => {
  await loadAssetFiles([...event.target.files]);
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
  await loadAssetFiles([...event.dataTransfer.files]);
});

prepPadding?.addEventListener("input", () => {
  prepPaddingValue.textContent = `${prepPadding.value}%`;
});

applyPrepBtn?.addEventListener("click", applySourcePrepToCurrentAsset);
resetPrepBtn?.addEventListener("click", resetCurrentAssetSource);

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
document.body.dataset.workflow = "classic";
applyTheme("liquid-glass");
applyAssetScale();
loadDefaultIcon();
updateCommand();
renderEmptyAssets();
updateAiToggleState();
if (frameEnabledToggle) {
  if (frameEnabledToggle.checked) {
    iconPreview.classList.remove("no-frame");
  } else {
    iconPreview.classList.add("no-frame");
  }
}

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

async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(`Connection timed out after ${timeoutMs / 1000} seconds. Please verify your API key or try again.`);
    }
    throw error;
  } finally {
    clearTimeout(id);
  }
}

async function validateGeminiKey(key) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
  const response = await fetchWithTimeout(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: "Respond 'OK' if you hear me." }] }]
    })
  }, 10000); // 10s timeout for quick connection check

  if (!response.ok) return false;
  const result = await response.json();
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
  return text && text.toLowerCase().includes("ok");
}

async function fetchAiTheme(prompt, baseThemeKey, key) {
  const baseTheme = THEMES[baseThemeKey] || THEMES["liquid-glass"];
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;

  const systemPrompt = `
You are a master digital designer specializing in glassmorphic, neomorphic, and metallic UI themes. You generate highly polished theme variables for a standard visual renderer.
Given a user style request and a "Core Theme Base" context, you will return a strictly valid JSON object that contains the properties required to render this premium aesthetic.

Your task is to refine, enhance, or transform the provided Core Theme Base according to the user's styling request. The output JSON format must match one of our four renderers: 'glass' (standard glassmorphism), 'crystal-liquid', 'discomorphism', or 'chrome-metallic'.

Here is our complete professional visual design themes library for inspiration and reference design tokens:
${JSON.stringify(THEMES, null, 2)}

The active Core Theme Base is of type '${baseTheme.renderer}' with name '${baseThemeKey}'. Its current values are:
${JSON.stringify(baseTheme, null, 2)}

You can decide to keep the same renderer type or switch to a different renderer ('glass', 'crystal-liquid', 'discomorphism', or 'chrome-metallic') if the user's request warrants it.

For 'glass' renderer, you must specify:
{
  "renderer": "glass",
  "name": "A short premium name",
  "description": "A professional design description explaining the design choices",
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

  const response = await fetchWithTimeout(url, {
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
  }, 15000); // 15s timeout for AI theme generation

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "Failed to contact Gemini API");
  }

  const result = await response.json();
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
  return JSON.parse(text);
}

async function transformCurrentAssetWithAi() {
  if (!currentAsset) {
    showToast("Upload a source asset first.", "error");
    return;
  }

  const key = localStorage.getItem("miyagi_gemini_key");
  if (!key) {
    showToast("Please configure your Gemini API key first.", "error");
    openSettingsBtn.click();
    return;
  }

  transformAssetBtn.disabled = true;
  aiProgressMessage.classList.remove("hidden");
  aiValidationPanel.classList.add("hidden");
  setStatus("Transforming source asset with AI...");

  try {
    const prompt = buildAiTransformPrompt();
    const imageDataUri = await ensurePngDataUri(currentAsset.dataUri);
    const transformed = await fetchAiImageTransform({
      key,
      imageDataUri,
      prompt
    });
    const validation = await validateTransformedAsset(transformed);

    currentAsset = {
      ...currentAsset,
      filename: `${currentAsset.name}-ai-transform.png`,
      type: "raster",
      dataUri: transformed,
      markup: `<img src="${transformed}" alt="">`,
      prepared: true
    };
    assetQueue[activeAssetIndex] = currentAsset;
    setCurrentAsset(currentAsset, activeAssetIndex);
    renderAiValidation(validation);
    invalidateGeneratedAssets("AI transform changed source");
    aiActiveBadge.classList.remove("hidden");
    showToast("AI source transform applied.", "success");
    setStatus("AI transformed source ready");
  } catch (err) {
    console.error(err);
    renderAiValidation({ ok: false, notes: [err.message] });
    showToast(`AI transform failed: ${err.message}`, "error");
    setStatus("AI transform failed");
  } finally {
    transformAssetBtn.disabled = false;
    aiProgressMessage.classList.add("hidden");
  }
}

function buildAiTransformPrompt() {
  const theme = getActiveTheme();
  const renderer = theme?.renderer || "glass";
  const shapeLock = aiShapeLock?.value || "strict";
  const colorMode = aiColorMode?.value || "preserve";
  const userPrompt = aiPrompt.value.trim() || "Polish the input as a premium application icon source asset.";
  const recipes = {
    "chrome-metallic": "Create a brave-browser-quality chrome object: liquid silver volume, contour-wrapped reflection bands, cyan/magenta iridescent rim light, embedded glints that look reflected from the shape, transparent background, no extra objects.",
    "discomorphism": "Create a premium mirrored disco-tile source: rounded convex mosaic facets, cohesive environment reflections, lavender/cyan/rose iridescence, transparent background, no unrelated background scene.",
    "crystal-liquid": "Create a polished liquid crystal source: translucent emerald body, caustic highlights, soft edge refraction, clean transparent background.",
    "glass": "Create a clean luxury glass-ready source: crisp alpha, refined edges, subtle dimensional polish, transparent background."
  };

  return [
    "Edit the provided source asset, do not create a new unrelated logo.",
    recipes[renderer] || recipes.glass,
    `Shape lock: ${shapeLock}. ${shapeLock === "strict" ? "Preserve silhouette, proportions, and core mark identity." : shapeLock === "balanced" ? "Allow small material-driven changes while keeping the mark recognizable." : "Allow expressive material interpretation while keeping the mark readable."}`,
    `Color mode: ${colorMode}.`,
    "Output one centered square PNG with a transparent background. Avoid text, mockups, UI frames, watermarking, or background scenery.",
    `User direction: ${userPrompt}`
  ].join("\n");
}

async function fetchAiImageTransform({ key, imageDataUri, prompt }) {
  const { mimeType, data } = splitDataUri(imageDataUri);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${key}`;
  const response = await fetchWithTimeout(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        role: "user",
        parts: [
          { inlineData: { mimeType, data } },
          { text: prompt }
        ]
      }],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"]
      }
    })
  }, 45000);

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || "Gemini image transform failed.");
  }

  const result = await response.json();
  const imagePart = result.candidates
    ?.flatMap((candidate) => candidate.content?.parts || [])
    .find((part) => part.inlineData?.data);

  if (!imagePart) {
    const text = result.candidates?.[0]?.content?.parts?.map((part) => part.text).filter(Boolean).join(" ");
    throw new Error(text || "Gemini returned no image. Try a stricter, clearer transform prompt.");
  }

  return `data:${imagePart.inlineData.mimeType || "image/png"};base64,${imagePart.inlineData.data}`;
}

async function ensurePngDataUri(dataUri) {
  if (dataUri.startsWith("data:image/png")) return dataUri;
  const image = await loadImage(dataUri);
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  drawContainedImage(ctx, image, 0, 0, 1024, 1024);
  return canvas.toDataURL("image/png");
}

async function validateTransformedAsset(dataUri) {
  const image = await loadImage(dataUri);
  const square = Math.abs(image.width - image.height) <= 2;
  return {
    ok: square,
    notes: [
      `${image.width}x${image.height}px output`,
      square ? "Square source confirmed" : "Output is not square; Source Prep can square it",
      "Transparent-background quality depends on model response; use Source Prep if needed"
    ]
  };
}

function renderAiValidation(result) {
  if (!aiValidationPanel) return;
  aiValidationPanel.classList.remove("hidden");
  aiValidationPanel.innerHTML = `
    <div class="mini-panel-header">
      <span>${result.ok ? "AI validation passed" : "AI validation needs review"}</span>
      <small>${result.ok ? "ready for renderer" : "retry or prep source"}</small>
    </div>
    <ul>${result.notes.map((note) => `<li>${note}</li>`).join("")}</ul>
  `;
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

function getActiveTheme() {
  return (aiEnabledToggle.checked && customAiTheme)
    ? customAiTheme
    : THEMES[themeSelect.value];
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
    const lights = asArray(theme.lights, ["#35e5ff", "#d65cff", "#f8e8a4"]);
    iconPreview.style.setProperty("--preview-bg", `linear-gradient(135deg, ${bgColors.join(", ")})`);
    iconPreview.style.setProperty("--preview-glass", "rgba(255,255,255,0.08)");
    iconPreview.style.setProperty("--preview-edge", edgeColors[0]);
    iconPreview.style.setProperty("--preview-shadow", "rgba(0,0,0,0.5)");
    iconPreview.style.setProperty("--light-0", lights[0]);
    iconPreview.style.setProperty("--light-1", lights[1] || lights[0]);
    iconPreview.style.setProperty("--light-2", lights[2] || lights[1] || lights[0]);
    iconPreview.style.setProperty("--edge-0", edgeColors[0]);
    iconPreview.style.setProperty("--edge-1", edgeColors[1] || edgeColors[0]);
    iconPreview.style.setProperty("--edge-2", edgeColors[2] || edgeColors[1] || edgeColors[0]);
    iconPreview.style.setProperty("--glow-intensity", theme.glow ?? 0.48);
  } else if (renderer === "chrome-metallic") {
    const bgColors = asArray(theme.background || theme.bg, ["#090a11", "#161727"]);
    const metalColors = asArray(theme.metal, ["#ffffff", "#555d70", "#ffffff"]);
    const accentColors = asArray(theme.accent, ["#30e2ff", "#d856ff"]);
    iconPreview.style.setProperty("--preview-bg", `linear-gradient(135deg, ${bgColors.join(", ")})`);
    iconPreview.style.setProperty("--preview-glass", "rgba(255,255,255,0.07)");
    iconPreview.style.setProperty("--preview-edge", "rgba(255,255,255,0.28)");
    iconPreview.style.setProperty("--preview-shadow", "rgba(0,0,0,0.48)");
    iconPreview.style.setProperty("--metal-0", metalColors[0]);
    iconPreview.style.setProperty("--metal-1", metalColors[1]);
    iconPreview.style.setProperty("--metal-2", metalColors[2] || metalColors[0]);
    iconPreview.style.setProperty("--accent-0", accentColors[0]);
    iconPreview.style.setProperty("--accent-1", accentColors[1] || accentColors[0]);
  } else {
    const bgColors = asArray(theme.bg || theme.background, ["#dceeff", "#f9f7f1"]);
    iconPreview.style.setProperty("--preview-bg", `linear-gradient(135deg, ${bgColors.join(", ")})`);
    iconPreview.style.setProperty("--preview-glass", asArray(theme.glass, ["rgba(255,255,255,0.4)"])[0]);
    iconPreview.style.setProperty("--preview-edge", asArray(theme.edge, ["rgba(255,255,255,0.7)"])[0]);
    iconPreview.style.setProperty("--preview-shadow", asArray(theme.shadow, ["rgba(39,59,88,.28)"])[0]);
  }

  updatePreviewGlyph(theme);
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

function setWorkflow(workflow) {
  const next = workflow === "ai" ? "ai" : "classic";
  document.body.dataset.workflow = next;
  classicWorkflowBtn?.classList.toggle("active", next === "classic");
  aiWorkflowBtn?.classList.toggle("active", next === "ai");

  if (next === "ai") {
    if (!aiEnabledToggle.checked) {
      aiEnabledToggle.checked = true;
      aiConsoleContent.classList.remove("collapsed");
    }
    showToast("AI Transform Lab enabled.", "info");
  } else {
    aiEnabledToggle.checked = false;
    aiConsoleContent.classList.add("collapsed");
    aiActiveBadge.classList.add("hidden");
    customAiTheme = null;
    applyTheme(themeSelect.value);
    showToast("Classic deterministic renderer enabled.", "info");
  }

  updateCommand();
  updatePreviewGlyph();
}

function setLayeredPreviewGlyph() {
  iconPreview.dataset.materialPreview = "layers";
  previewGlyph.innerHTML = currentAsset?.markup || "";
}

async function updatePreviewGlyph(theme = getActiveTheme()) {
  if (!currentAsset || !theme) return;

  const renderer = theme.renderer || "glass";
  if (renderer !== "discomorphism" && renderer !== "chrome-metallic") {
    previewRenderToken += 1;
    setLayeredPreviewGlyph();
    return;
  }

  const token = previewRenderToken + 1;
  previewRenderToken = token;
  iconPreview.dataset.materialPreview = "raster";

  try {
    const image = await loadImage(currentAsset.dataUri);
    if (token !== previewRenderToken) return;

    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    const useFrame = frameEnabledToggle ? frameEnabledToggle.checked : true;

    if (renderer === "discomorphism") {
      drawDiscoIcon(ctx, { size, image, theme, assetScale: getAssetScale(), useFrame });
    } else {
      drawChromeIcon(ctx, { size, image, theme, assetScale: getAssetScale(), useFrame });
    }

    if (token !== previewRenderToken) return;
    previewGlyph.innerHTML = `<img src="${canvas.toDataURL("image/png")}" alt="">`;
  } catch (err) {
    console.warn("Preview render failed; falling back to source glyph.", err);
    if (token === previewRenderToken) setLayeredPreviewGlyph();
  }
}

function loadDefaultIcon() {
  const svg = sanitizeSvg(defaultIcon);
  currentAsset = {
    name: "miyagi-leaf",
    filename: "miyagi-leaf.svg",
    type: "svg",
    dataUri: svgToDataUri(svg),
    markup: svg,
    originalDataUri: svgToDataUri(svg),
    originalMarkup: svg,
    originalType: "svg",
    prepared: false
  };
  assetQueue = [currentAsset];
  activeAssetIndex = 0;
  renderBatchQueue();
  updatePreviewGlyph();
}

async function loadAssetFiles(files) {
  const assets = [];
  for (const file of files) {
    const asset = await createAssetFromFile(file);
    if (asset) assets.push(asset);
  }

  if (!assets.length) return;

  assetQueue = assets;
  activeAssetIndex = 0;
  setCurrentAsset(assetQueue[0]);
  renderBatchQueue();

  generatedAssets = [];
  downloadAllButton.disabled = true;
  integrationCodeBlock.classList.add("hidden");
  renderEmptyAssets();
  showToast(`Loaded ${assets.length} source asset${assets.length === 1 ? "" : "s"}.`, "success");
  setStatus(assets.length > 1 ? `${assets.length} assets queued` : "Ready to generate");
}

async function createAssetFromFile(file) {
  if (!file) return null;

  const extension = file.name.split(".").pop()?.toLowerCase();
  const isSvg = extension === "svg" || file.type === "image/svg+xml";
  const isRaster = ["png", "jpg", "jpeg"].includes(extension) || ["image/png", "image/jpeg"].includes(file.type);

  if (!isSvg && !isRaster) {
    showToast("File format must be SVG, PNG, or JPG.", "error");
    setStatus("Use SVG, PNG, or JPG");
    return null;
  }

  const name = file.name.replace(/\.[^.]+$/, "");

  if (isSvg) {
    const svg = sanitizeSvg(await file.text());
    const dataUri = svgToDataUri(svg);
    return {
      name,
      filename: file.name,
      type: "svg",
      dataUri,
      markup: svg,
      originalDataUri: dataUri,
      originalMarkup: svg,
      originalType: "svg",
      prepared: false
    };
  }

  const dataUri = await fileToDataUri(file);
  return {
    name,
    filename: file.name,
    type: "raster",
    dataUri,
    markup: `<img src="${dataUri}" alt="">`,
    originalDataUri: dataUri,
    originalMarkup: `<img src="${dataUri}" alt="">`,
    originalType: "raster",
    prepared: false
  };
}

function setCurrentAsset(asset, index = activeAssetIndex) {
  currentAsset = asset;
  activeAssetIndex = index;
  assetName.textContent = asset.filename;
  updatePreviewGlyph();
  renderBatchQueue();
}

function renderBatchQueue() {
  if (!batchQueue) return;
  batchQueue.innerHTML = "";

  if (assetQueue.length <= 1) {
    batchQueue.classList.add("hidden");
    return;
  }

  batchQueue.classList.remove("hidden");
  assetQueue.forEach((asset, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `batch-item${index === activeAssetIndex ? " active" : ""}`;
    button.innerHTML = `
      <span class="batch-item-name">${asset.filename}</span>
      <span class="batch-item-meta">${asset.prepared ? "prepped" : asset.type}</span>
    `;
    button.addEventListener("click", () => setCurrentAsset(asset, index));
    batchQueue.append(button);
  });
}

async function applySourcePrepToCurrentAsset() {
  if (!currentAsset) return;

  try {
    setStatus("Preparing source asset...");
    const source = currentAsset.originalDataUri || currentAsset.dataUri;
    const preparedDataUri = await prepareAssetDataUri(source, {
      trim: prepTrim?.checked ?? true,
      removeBg: prepRemoveBg?.checked ?? false,
      fitMode: prepFitMode?.value || "contain",
      padding: Number(prepPadding?.value || 12) / 100
    });

    currentAsset = {
      ...currentAsset,
      type: "raster",
      dataUri: preparedDataUri,
      markup: `<img src="${preparedDataUri}" alt="">`,
      prepared: true
    };
    assetQueue[activeAssetIndex] = currentAsset;
    setCurrentAsset(currentAsset, activeAssetIndex);
    invalidateGeneratedAssets("Source prep changed");
    showToast("Source prep applied.", "success");
    setStatus("Source prepared");
  } catch (err) {
    console.error(err);
    showToast(`Source prep failed: ${err.message}`, "error");
    setStatus("Source prep failed");
  }
}

function resetCurrentAssetSource() {
  if (!currentAsset?.originalDataUri) return;
  currentAsset = {
    ...currentAsset,
    type: currentAsset.originalType || "raster",
    dataUri: currentAsset.originalDataUri,
    markup: currentAsset.originalMarkup,
    prepared: false
  };
  assetQueue[activeAssetIndex] = currentAsset;
  setCurrentAsset(currentAsset, activeAssetIndex);
  invalidateGeneratedAssets("Source reset");
  showToast("Source reset to original.", "info");
}

async function prepareAssetDataUri(source, options) {
  const image = await loadImage(source);
  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = image.naturalWidth || image.width;
  sourceCanvas.height = image.naturalHeight || image.height;
  const sourceCtx = sourceCanvas.getContext("2d", { willReadFrequently: true });
  sourceCtx.drawImage(image, 0, 0);

  let imageData = sourceCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
  if (options.removeBg) {
    imageData = removeFlatBackground(imageData);
    sourceCtx.putImageData(imageData, 0, 0);
  }

  const bounds = options.trim ? findAlphaBounds(imageData) : {
    x: 0,
    y: 0,
    width: sourceCanvas.width,
    height: sourceCanvas.height
  };

  const outputSize = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const safe = outputSize * clampNumber(options.padding, 0, 0.28);
  const drawBox = outputSize - safe * 2;
  const scale = options.fitMode === "cover"
    ? Math.max(drawBox / bounds.width, drawBox / bounds.height)
    : Math.min(drawBox / bounds.width, drawBox / bounds.height);
  const drawWidth = bounds.width * scale;
  const drawHeight = bounds.height * scale;
  const dx = (outputSize - drawWidth) / 2;
  const dy = (outputSize - drawHeight) / 2;

  ctx.drawImage(
    sourceCanvas,
    bounds.x,
    bounds.y,
    bounds.width,
    bounds.height,
    dx,
    dy,
    drawWidth,
    drawHeight
  );

  return canvas.toDataURL("image/png");
}

function removeFlatBackground(imageData) {
  const { data, width, height } = imageData;
  const sample = [
    getPixel(data, width, 0, 0),
    getPixel(data, width, width - 1, 0),
    getPixel(data, width, 0, height - 1),
    getPixel(data, width, width - 1, height - 1)
  ];
  const bg = sample.reduce((acc, pixel) => {
    acc[0] += pixel[0];
    acc[1] += pixel[1];
    acc[2] += pixel[2];
    return acc;
  }, [0, 0, 0]).map((value) => value / sample.length);

  for (let i = 0; i < data.length; i += 4) {
    const dist = Math.hypot(data[i] - bg[0], data[i + 1] - bg[1], data[i + 2] - bg[2]);
    if (dist < 42) {
      data[i + 3] = 0;
    } else if (dist < 88) {
      data[i + 3] = Math.round(data[i + 3] * ((dist - 42) / 46));
    }
  }

  return imageData;
}

function getPixel(data, width, x, y) {
  const i = (y * width + x) * 4;
  return [data[i], data[i + 1], data[i + 2], data[i + 3]];
}

function findAlphaBounds(imageData) {
  const { data, width, height } = imageData;
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > 10) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (minX > maxX || minY > maxY) {
    return { x: 0, y: 0, width, height };
  }

  return {
    x: minX,
    y: minY,
    width: Math.max(1, maxX - minX + 1),
    height: Math.max(1, maxY - minY + 1)
  };
}

// --- GENERATION ENGINE CONTROLLERS ---

async function generateAssets() {
  if (!currentAsset) {
    showToast("Please upload a source icon first.", "error");
    return;
  }

  const progressContainer = document.querySelector("#generationProgressContainer");
  const progressBar = document.querySelector("#progressBar");
  const progressPercentage = document.querySelector("#progressPercentage");
  const progressStepsList = document.querySelector("#progressStepsList");

  if (!progressContainer || !progressBar || !progressPercentage || !progressStepsList) {
    console.error("Progress console elements are missing in HTML.");
    return;
  }

  generatedAssets = [];
  assetList.innerHTML = "";
  generateButton.disabled = true;
  downloadAllButton.disabled = true;
  integrationCodeBlock.classList.add("hidden");
  setStatus("Generating assets...");
  showToast("Rendering engine starting...", "info");

  // Show progress widget
  progressContainer.classList.remove("hidden");
  progressBar.style.width = "0%";
  progressPercentage.textContent = "0%";
  progressStepsList.innerHTML = "";

  let currentRunningIndex = 0;
  const steps = [];

  try {
    const theme = (aiEnabledToggle.checked && customAiTheme)
      ? customAiTheme
      : THEMES[themeSelect.value];
    const scale = getAssetScale();
    const renderItems = assetQueue.length ? assetQueue : [currentAsset];
    const isBatch = renderItems.length > 1;

    if (activePreset === "single") {
      const sizes = getSelectedValues("size").map(Number);
      const formats = getSelectedValues("format");

      if (!sizes.length || !formats.length) {
        showToast("Select at least one size and format.", "error");
        setStatus("Sizes or formats missing");
        generateButton.disabled = false;
        progressContainer.classList.add("hidden");
        return;
      }

      for (const item of renderItems) {
        for (const size of sizes) {
          if (formats.includes("png")) {
            steps.push({
              label: `Render ${item.name} PNG (${size}x${size})`,
              run: async () => {
                const image = await loadImage(item.dataUri);
                const blob = await renderPng({ size, image, theme, assetScale: scale });
                const prefix = isBatch ? `${item.name}/` : "";
                generatedAssets.push(createGeneratedAsset(`${prefix}${item.name}-${theme.renderer}-${size}.png`, blob));
              }
            });
          }

          if (formats.includes("svg")) {
            steps.push({
              label: `Render ${item.name} SVG (${size}x${size})`,
              run: async () => {
                const svg = renderSvg({ size, asset: item, theme, assetScale: scale });
                const blob = new Blob([svg], { type: "image/svg+xml" });
                const prefix = isBatch ? `${item.name}/` : "";
                generatedAssets.push(createGeneratedAsset(`${prefix}${item.name}-${theme.renderer}-${size}.svg`, blob));
              }
            });
          }
        }
      }
    } else {
      for (const item of renderItems) {
        const root = isBatch ? `${item.name}/` : "";
        steps.push({
          label: `Render ${item.name} favicons`,
          run: async () => {
            const image = await loadImage(item.dataUri);
            const fav16 = await renderPng({ size: 16, image, theme, assetScale: scale });
            generatedAssets.push(createGeneratedAsset(`${root}favicons/favicon-16x16.png`, fav16));

            const fav32 = await renderPng({ size: 32, image, theme, assetScale: scale });
            generatedAssets.push(createGeneratedAsset(`${root}favicons/favicon-32x32.png`, fav32));

            const icoBlob = await createIcoFromPng(fav32);
            generatedAssets.push(createGeneratedAsset(`${root}favicons/favicon.ico`, icoBlob));
          }
        });

        steps.push({
          label: `Render ${item.name} launcher icons`,
          run: async () => {
            const image = await loadImage(item.dataUri);
            const appleTouch = await renderPng({ size: 180, image, theme, assetScale: scale });
            generatedAssets.push(createGeneratedAsset(`${root}mobile/apple-touch-icon.png`, appleTouch));

            const android192 = await renderPng({ size: 192, image, theme, assetScale: scale });
            generatedAssets.push(createGeneratedAsset(`${root}mobile/android-chrome-192x192.png`, android192));

            const android512 = await renderPng({ size: 512, image, theme, assetScale: scale });
            generatedAssets.push(createGeneratedAsset(`${root}mobile/android-chrome-512x512.png`, android512));
          }
        });

        steps.push({
          label: `Render ${item.name} desktop/vector/marketing pack`,
          run: async () => {
            const image = await loadImage(item.dataUri);
            const winTile = await renderPng({ size: 150, image, theme, assetScale: scale });
            generatedAssets.push(createGeneratedAsset(`${root}desktop/mstile-150x150.png`, winTile));

            const highResPng = await renderPng({ size: 1024, image, theme, assetScale: scale });
            generatedAssets.push(createGeneratedAsset(`${root}desktop/app-icon-1024x1024.png`, highResPng));

            const vectorSvg = renderSvg({ size: 512, asset: item, theme, assetScale: scale });
            generatedAssets.push(createGeneratedAsset(`${root}vector/vector-icon.svg`, new Blob([vectorSvg], { type: "image/svg+xml" })));

            const ogBanner = await renderOgImage({ image, theme, assetScale: scale, assetName: item.name });
            generatedAssets.push(createGeneratedAsset(`${root}marketing/og-image.png`, ogBanner));
          }
        });

        steps.push({
          label: `Generate ${item.name} manifest and HTML tags`,
          run: async () => {
            const themeColor = theme.bg?.[0] || theme.background?.[0] || "#ffffff";
            const manifest = JSON.stringify({
              name: item.name,
              short_name: item.name.slice(0, 12),
              start_url: ".",
              scope: ".",
              icons: [
                { src: "/mobile/android-chrome-192x192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
                { src: "/mobile/android-chrome-512x512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }
              ],
              theme_color: themeColor,
              background_color: "#08090d",
              display: "standalone"
            }, null, 2);
            generatedAssets.push(createGeneratedAsset(`${root}site.webmanifest`, new Blob([manifest], { type: "application/json" })));
            if (!isBatch || item === currentAsset) renderHeadIntegrationSnippet(theme);
          }
        });
      }
    }

    // Add a final step to finalize the bundle and update UI
    steps.push({
      label: "Compile and Ready Output Pack",
      run: async () => {
        renderGeneratedAssets();
      }
    });

    // Populate steps list in HTML
    steps.forEach((step, index) => {
      const li = document.createElement("li");
      li.className = "progress-step-item pending";
      li.id = `progress-step-${index}`;
      li.innerHTML = `
        <span class="step-icon">⏳</span>
        <span class="step-label">${step.label}</span>
      `;
      progressStepsList.append(li);
    });

    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    // Run steps sequentially with a small delay so browser paints
    for (let i = 0; i < steps.length; i++) {
      currentRunningIndex = i;
      const stepElement = document.querySelector(`#progress-step-${i}`);
      if (stepElement) {
        stepElement.className = "progress-step-item active";
        stepElement.querySelector(".step-icon").textContent = "⚙️";
      }

      // Give browser time to paint "active" state
      await delay(120);

      // Run the step action
      await steps[i].run();

      if (stepElement) {
        stepElement.className = "progress-step-item success";
        stepElement.querySelector(".step-icon").textContent = "✅";
      }

      // Calculate and update progress percentage & progress bar
      const percent = Math.round(((i + 1) / steps.length) * 100);
      progressBar.style.width = `${percent}%`;
      progressPercentage.textContent = `${percent}%`;

      // Set status message
      setStatus(`Processed ${i + 1}/${steps.length} milestones`);
    }

    setStatus(`${generatedAssets.length} assets ready`);
    showToast(`Successfully rendered ${generatedAssets.length} assets!`, "success");
    downloadAllButton.disabled = generatedAssets.length === 0;

  } catch (error) {
    console.error(error);
    const failedElement = document.querySelector(`#progress-step-${currentRunningIndex}`);
    if (failedElement) {
      failedElement.className = "progress-step-item error";
      failedElement.querySelector(".step-icon").textContent = "❌";
    }
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

function renderPng({ size, image, theme, assetScale, useFrame }) {
  if (useFrame === undefined) {
    const frameToggle = document.querySelector("#frameEnabledToggle");
    useFrame = frameToggle ? frameToggle.checked : true;
  }
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (theme.renderer === "discomorphism") {
    drawDiscoIcon(ctx, { size, image, theme, assetScale, useFrame });
  } else if (theme.renderer === "chrome-metallic") {
    drawChromeIcon(ctx, { size, image, theme, assetScale, useFrame });
  } else {
    drawGlassIcon(ctx, { size, image, theme, assetScale, useFrame });
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

// --- LUXURY OPEN GRAPH CANVAS BUILDER ---
async function renderOgImage({ image, theme, assetScale, assetName }) {
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
    drawDiscoIcon(ctx, { size, image, theme, assetScale, useFrame: true });
  } else if (theme.renderer === "chrome-metallic") {
    drawChromeIcon(ctx, { size, image, theme, assetScale, useFrame: true });
  } else {
    drawGlassIcon(ctx, { size, image, theme, assetScale, useFrame: true });
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
  const label = theme.name || theme.renderer || assetName || "MIYAGI";
  ctx.fillText(`${label.toUpperCase()} THEME • MIYAGI STUDIO`, 600, 545);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

// --- DETERMINISTIC CANVAS DRAWERS ---

function drawGlassIcon(ctx, { size, image, theme, assetScale, useFrame }) {
  if (useFrame === undefined) {
    const frameToggle = document.querySelector("#frameEnabledToggle");
    useFrame = frameToggle ? frameToggle.checked : true;
  }
  const radius = size * 0.218;

  if (!useFrame) {
    const finalScale = Math.min(0.92, assetScale * 1.35);
    const glyphSize = size * finalScale;
    const fit = contain(image.width, image.height, glyphSize, glyphSize);
    const x = (size - fit.width) / 2;
    const y = (size - fit.height) / 2;

    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
    ctx.shadowBlur = size * 0.055;
    ctx.shadowOffsetY = size * 0.026;
    ctx.drawImage(image, x, y, fit.width, fit.height);
    ctx.restore();
    return;
  }

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

function drawDiscoIcon(ctx, { size, image, theme, assetScale, useFrame }) {
  if (useFrame === undefined) {
    const frameToggle = document.querySelector("#frameEnabledToggle");
    useFrame = frameToggle ? frameToggle.checked : true;
  }
  const radius = size * 0.218;

  if (useFrame) {
    roundRect(ctx, 0, 0, size, size, radius);
    ctx.clip();

    const bg = ctx.createLinearGradient(0, 0, size, size);
    const colors = asArray(theme.background || theme.bg, ["#11151b", "#07090f"]);
    addGradientStops(bg, colors);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, size, size);
  }

  const lights = asArray(theme.lights, ["#35e5ff", "#d65cff", "#f8e8a4"]);

  if (useFrame) {
    drawGlow(ctx, size * 0.18, size * 0.74, size * 0.42, lights[0], 0.42);
    drawGlow(ctx, size * 0.84, size * 0.2, size * 0.34, lights[1], 0.38);
    drawGlow(ctx, size * 0.52, size * 0.08, size * 0.3, lights[2], 0.28);
  }

  const finalScale = useFrame ? assetScale : Math.min(0.92, assetScale * 1.35);
  const glyphSize = size * finalScale;
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

  if (useFrame) {
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,.52)";
    ctx.shadowBlur = size * 0.055;
    ctx.shadowOffsetY = size * 0.026;
    roundRect(ctx, glyphX, glyphY, glyphSize, glyphSize, radius * 0.25);
    ctx.fillStyle = "rgba(0,0,0,.35)";
    ctx.fill();
    ctx.restore();
  }

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

      const u = sampleCount > 1 ? x / (sampleCount - 1) : 0.5;
      const v = sampleCount > 1 ? y / (sampleCount - 1) : 0.5;

      let shineX = 15 + u * 70;
      let shineY = 15 + v * 70;

      const tileHash = (x * 127 + y * 313) % 100;
      if (tileHash < 10) {
        shineX = (shineX + (tileHash % 5) * 8 - 16 + 100) % 100;
        shineY = (shineY + (tileHash % 3) * 12 - 18 + 100) % 100;
      }

      const tileRad = Math.max(1, tileSize * 0.18);
      roundRect(ctx, px, py, tileSize, tileSize, tileRad);

      const linear = ctx.createLinearGradient(px, py, px + tileSize, py + tileSize);
      linear.addColorStop(0, `rgba(255,255,255,${0.45 * alpha})`);
      linear.addColorStop(0.4, rgbString(color, 0.94 * alpha));
      linear.addColorStop(1, rgbString(mixRgb(color, [0, 0, 0], 0.55), 0.96 * alpha));
      ctx.fillStyle = linear;
      ctx.fill();

      const envX = px + ((100 - shineX) / 100) * tileSize;
      const envY = py + ((100 - shineY) / 100) * tileSize;
      const envRadial = ctx.createRadialGradient(envX, envY, 0, envX, envY, tileSize * 0.8);
      envRadial.addColorStop(0, `rgba(255,255,255,${0.15 * alpha})`);
      envRadial.addColorStop(1, `rgba(255,255,255,0)`);
      ctx.fillStyle = envRadial;
      ctx.fill();

      const sxPx = px + (shineX / 100) * tileSize;
      const syPy = py + (shineY / 100) * tileSize;
      const radial = ctx.createRadialGradient(sxPx, syPy, 0, sxPx, syPy, tileSize * 0.75);
      radial.addColorStop(0, `rgba(255,255,255,${0.95 * alpha})`);
      radial.addColorStop(0.2, `rgba(255,255,255,${0.3 * alpha})`);
      radial.addColorStop(0.6, `rgba(255,255,255,0)`);
      ctx.fillStyle = radial;
      ctx.fill();

      ctx.strokeStyle = `rgba(255,255,255,${0.35 * alpha})`;
      ctx.lineWidth = Math.max(0.35, size * 0.0008);
      ctx.stroke();
    }
  }

  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.globalAlpha = 0.22;
  drawContainedImage(ctx, image, glyphX, glyphY, glyphSize, glyphSize);
  ctx.restore();

  if (useFrame) {
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
}

function drawChromeIcon(ctx, { size, image, theme, assetScale, useFrame }) {
  if (useFrame === undefined) {
    const frameToggle = document.querySelector("#frameEnabledToggle");
    useFrame = frameToggle ? frameToggle.checked : true;
  }
  const radius = size * 0.218;

  if (useFrame) {
    roundRect(ctx, 0, 0, size, size, radius);
    ctx.clip();

    const bg = ctx.createLinearGradient(0, 0, size, size);
    const colors = asArray(theme.background || theme.bg, ["#090a11", "#161727"]);
    addGradientStops(bg, colors);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, size, size);
  }

  const accentColors = asArray(theme.accent, ["#d856ff"]);

  if (useFrame) {
    const glowAccent = theme.glowColor || accentColors[0];
    drawGlow(ctx, size * 0.52, size * 0.75, size * 0.42, glowAccent, 0.42);

    roundRect(ctx, size * 0.05, size * 0.05, size * 0.9, size * 0.9, radius * 0.78);
    ctx.fillStyle = "rgba(255,255,255,.035)";
    ctx.fill();
  }

  const finalScale = useFrame ? assetScale : Math.min(0.92, assetScale * 1.35);

  const mask = createMaskCanvas(size, image, finalScale);
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

  const bevelSize = Math.max(1.2, size * 0.004);

  const lightBevel = document.createElement("canvas");
  lightBevel.width = size;
  lightBevel.height = size;
  const lbCtx = lightBevel.getContext("2d");
  lbCtx.drawImage(mask, 0, 0);
  lbCtx.globalCompositeOperation = "source-in";
  lbCtx.fillStyle = "rgba(255, 255, 255, 0.85)";
  lbCtx.fillRect(0, 0, size, size);
  lbCtx.globalCompositeOperation = "destination-out";
  lbCtx.drawImage(mask, bevelSize, bevelSize);

  const darkBevel = document.createElement("canvas");
  darkBevel.width = size;
  darkBevel.height = size;
  const dbCtx = darkBevel.getContext("2d");
  dbCtx.drawImage(mask, 0, 0);
  dbCtx.globalCompositeOperation = "source-in";
  dbCtx.fillStyle = "rgba(0, 0, 0, 0.75)";
  dbCtx.fillRect(0, 0, size, size);
  dbCtx.globalCompositeOperation = "destination-out";
  dbCtx.drawImage(mask, -bevelSize, -bevelSize);

  const edgeCanvas = document.createElement("canvas");
  edgeCanvas.width = size;
  edgeCanvas.height = size;
  const edgeCtx = edgeCanvas.getContext("2d");
  edgeCtx.drawImage(mask, 0, 0);
  edgeCtx.globalCompositeOperation = "source-in";
  const edgeGrad = edgeCtx.createLinearGradient(0, 0, size, size);
  edgeGrad.addColorStop(0, "#00f3ff");
  edgeGrad.addColorStop(1, "#ff00ea");
  edgeCtx.fillStyle = edgeGrad;
  edgeCtx.fillRect(0, 0, size, size);
  edgeCtx.globalCompositeOperation = "destination-out";
  edgeCtx.drawImage(mask, bevelSize, 0);
  edgeCtx.drawImage(mask, -bevelSize, 0);
  edgeCtx.drawImage(mask, 0, bevelSize);
  edgeCtx.drawImage(mask, 0, -bevelSize);

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,.68)";
  ctx.shadowBlur = size * 0.032;
  ctx.shadowOffsetY = size * 0.026;
  ctx.drawImage(mask, 0, 0);
  ctx.restore();

  ctx.drawImage(metalCanvas, 0, 0);
  ctx.drawImage(lightBevel, 0, 0);
  ctx.drawImage(darkBevel, 0, 0);

  ctx.save();
  ctx.globalAlpha = theme.bevel ?? 0.85;
  ctx.drawImage(edgeCanvas, 0, 0);
  ctx.restore();

  drawEmbeddedChromeGlints(ctx, mask, size, accentColors);

  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.globalAlpha = 0.22;
  drawSourceInGlyphBox(ctx, image, size, finalScale);
  ctx.restore();

  if (useFrame) {
    const accentColor = accentColors[1] || accentColors[0];
    drawStar(ctx, size * 0.68, size * 0.2, size * 0.032, "#ffffff", 0.62);
    drawStar(ctx, size * 0.67, size * 0.73, size * 0.026, accentColor, 0.54);
  }
}

function drawEmbeddedChromeGlints(ctx, mask, size, accentColors) {
  const points = findMaskEdgeGlints(mask, size);
  if (!points.length) return;

  const glintCanvas = document.createElement("canvas");
  glintCanvas.width = size;
  glintCanvas.height = size;
  const glintCtx = glintCanvas.getContext("2d");
  glintCtx.drawImage(mask, 0, 0);
  glintCtx.globalCompositeOperation = "source-in";

  points.forEach((point, index) => {
    const color = accentColors[index % accentColors.length] || "#ffffff";
    drawStar(glintCtx, point.x, point.y, point.r, color, point.alpha);
    const streak = glintCtx.createLinearGradient(point.x - point.r * 4, point.y, point.x + point.r * 4, point.y);
    streak.addColorStop(0, "rgba(255,255,255,0)");
    streak.addColorStop(0.5, withAlpha(color, point.alpha * 0.5));
    streak.addColorStop(1, "rgba(255,255,255,0)");
    glintCtx.save();
    glintCtx.translate(point.x, point.y);
    glintCtx.rotate(point.angle);
    glintCtx.fillStyle = streak;
    glintCtx.fillRect(-point.r * 4, -point.r * 0.18, point.r * 8, point.r * 0.36);
    glintCtx.restore();
  });

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.drawImage(glintCanvas, 0, 0);
  ctx.restore();
}

function findMaskEdgeGlints(mask, size) {
  const probe = document.createElement("canvas");
  const sample = 96;
  probe.width = sample;
  probe.height = sample;
  const probeCtx = probe.getContext("2d", { willReadFrequently: true });
  probeCtx.drawImage(mask, 0, 0, sample, sample);
  const { data } = probeCtx.getImageData(0, 0, sample, sample);
  const candidates = [];

  for (let y = 2; y < sample - 2; y += 2) {
    for (let x = 2; x < sample - 2; x += 2) {
      const alpha = data[(y * sample + x) * 4 + 3];
      if (alpha < 100) continue;

      const right = data[(y * sample + x + 1) * 4 + 3];
      const left = data[(y * sample + x - 1) * 4 + 3];
      const down = data[((y + 1) * sample + x) * 4 + 3];
      const up = data[((y - 1) * sample + x) * 4 + 3];
      const edgeEnergy = Math.abs(right - left) + Math.abs(down - up);
      const bias = (x / sample) * 0.7 + (1 - y / sample) * 0.3;
      if (edgeEnergy > 80) candidates.push({ x, y, score: edgeEnergy + bias * 160 });
    }
  }

  return candidates
    .sort((a, b) => b.score - a.score)
    .filter((point, index, list) => list.slice(0, index).every((other) => Math.hypot(point.x - other.x, point.y - other.y) > 18))
    .slice(0, 3)
    .map((point, index) => ({
      x: (point.x / sample) * size,
      y: (point.y / sample) * size,
      r: size * (index === 0 ? 0.032 : 0.022),
      alpha: index === 0 ? 0.62 : 0.42,
      angle: index % 2 ? -0.75 : 0.55
    }));
}

// --- DETERMINISTIC SVG RENDERERS ---

function renderSvg({ size, asset, theme, assetScale, useFrame }) {
  if (useFrame === undefined) {
    const frameToggle = document.querySelector("#frameEnabledToggle");
    useFrame = frameToggle ? frameToggle.checked : true;
  }

  if (theme.renderer === "discomorphism") {
    return renderDiscoSvg({ size, asset, theme, assetScale, useFrame });
  }

  if (theme.renderer === "chrome-metallic") {
    return renderChromeSvg({ size, asset, theme, assetScale, useFrame });
  }

  if (!useFrame) {
    const finalScale = Math.min(0.92, assetScale * 1.35);
    const glyph = Math.round(size * finalScale);
    const glyphX = Math.round((size - glyph) / 2);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <filter id="softShadow" x="-30%" y="-30%" width="160%" height="170%">
      <feDropShadow dx="0" dy="${Math.round(size * 0.032)}" stdDeviation="${Math.round(size * 0.035)}" flood-color="#000000" flood-opacity=".32"/>
    </filter>
  </defs>
  <image href="${asset.dataUri}" x="${glyphX}" y="${glyphX}" width="${glyph}" height="${glyph}" preserveAspectRatio="xMidYMid meet" filter="url(#softShadow)"/>
</svg>`;
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

function renderDiscoSvg({ size, asset, theme, assetScale, useFrame }) {
  if (useFrame === undefined) {
    const frameToggle = document.querySelector("#frameEnabledToggle");
    useFrame = frameToggle ? frameToggle.checked : true;
  }
  const radius = Math.round(size * 0.218);
  const finalScale = useFrame ? assetScale : Math.min(0.92, assetScale * 1.35);
  const glyph = Math.round(size * finalScale);
  const glyphX = Math.round((size - glyph) / 2);
  const colors = asArray(theme.background || theme.bg, ["#11151b", "#07090f"]);
  const bgStops = renderSvgStops(colors);
  const lights = asArray(theme.lights, ["#35e5ff", "#d65cff"]);
  const edgeColors = asArray(theme.edge, ["#3b67c8", "#7dd8c5"]);

  const patternDefs = `
    <pattern id="tiles" width="${Math.max(4, size / 28)}" height="${Math.max(4, size / 28)}" patternUnits="userSpaceOnUse">
      <rect width="100%" height="100%" fill="#020306"/>
      <rect x="0.8" y="0.8" width="82%" height="82%" rx="${Math.max(1, size * 0.001)}" fill="url(#tileGrad)"/>
    </pattern>
    <linearGradient id="tileGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.45"/>
      <stop offset="0.4" stop-color="${lights[0]}"/>
      <stop offset="1" stop-color="${lights[1] || '#d65cff'}"/>
    </linearGradient>
  `;

  if (!useFrame) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <filter id="softShadow" x="-30%" y="-30%" width="160%" height="170%">
      <feDropShadow dx="0" dy="${Math.round(size * 0.032)}" stdDeviation="${Math.round(size * 0.035)}" flood-color="#000000" flood-opacity=".45"/>
    </filter>
    ${patternDefs}
    <mask id="glyphMask">
      <image href="${asset.dataUri}" x="${glyphX}" y="${glyphX}" width="${glyph}" height="${glyph}" preserveAspectRatio="xMidYMid meet"/>
    </mask>
  </defs>
  <g filter="url(#softShadow)">
    <g mask="url(#glyphMask)">
      <rect x="${glyphX}" y="${glyphX}" width="${glyph}" height="${glyph}" fill="url(#tiles)" opacity=".85"/>
      <image href="${asset.dataUri}" x="${glyphX}" y="${glyphX}" width="${glyph}" height="${glyph}" preserveAspectRatio="xMidYMid meet" opacity=".22" style="mix-blend-mode:multiply"/>
    </g>
  </g>
</svg>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">${bgStops}</linearGradient>
    <clipPath id="iconClip"><rect width="${size}" height="${size}" rx="${radius}"/></clipPath>
    ${patternDefs}
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

function renderChromeSvg({ size, asset, theme, assetScale, useFrame }) {
  if (useFrame === undefined) {
    const frameToggle = document.querySelector("#frameEnabledToggle");
    useFrame = frameToggle ? frameToggle.checked : true;
  }
  const radius = Math.round(size * 0.218);
  const finalScale = useFrame ? assetScale : Math.min(0.92, assetScale * 1.35);
  const glyph = Math.round(size * finalScale);
  const glyphX = Math.round((size - glyph) / 2);

  const colors = asArray(theme.background || theme.bg, ["#090a11", "#161727"]);
  const bgStops = renderSvgStops(colors);

  const metalColors = asArray(theme.metal, ["#f8fbff", "#8596b7", "#ffffff", "#5f6e96", "#e9f0ff"]);
  const metalStops = renderSvgStops(metalColors);

  const accentColor = asArray(theme.accent, ["#d856ff"])[0];

  const commonDefs = `
    <linearGradient id="metalGrad" x1="0.14" y1="0.05" x2="0.88" y2="0.96">${metalStops}</linearGradient>
    <linearGradient id="metalBands" x1="0" y1="0.2" x2="1" y2="0.75">
      <stop offset="0" stop-color="#fff" stop-opacity="0"/>
      <stop offset="0.22" stop-color="#fff" stop-opacity="0.82"/>
      <stop offset="0.36" stop-color="#4658ff" stop-opacity="0.58"/>
      <stop offset="0.55" stop-color="#000" stop-opacity="0.36"/>
      <stop offset="0.68" stop-color="#ff56e2" stop-opacity="0.62"/>
      <stop offset="0.86" stop-color="#fff" stop-opacity="0.84"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="metalEdgeGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#00f3ff"/>
      <stop offset="1" stop-color="#ff00ea"/>
    </linearGradient>

    <filter id="chromeMetalFilter" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur1"/>
      <feDisplacementMap in="SourceGraphic" in2="blur1" scale="28" xChannelSelector="R" yChannelSelector="G" result="displaced"/>
      <feSpecularLighting in="blur1" surfaceScale="5" specularConstant="1.6" specularExponent="35" lighting-color="#ffffff" result="specular">
        <feDistantLight azimuth="135" elevation="50"/>
      </feSpecularLighting>
      <feComposite in="specular" in2="SourceGraphic" operator="in" result="specularClipped"/>
      <feBlend in="displaced" in2="specularClipped" mode="screen" result="litMetal"/>
      <feDiffuseLighting in="blur1" surfaceScale="5" diffuseConstant="0.95" lighting-color="#ffffff" result="diffuse">
        <feDistantLight azimuth="135" elevation="50"/>
      </feDiffuseLighting>
      <feBlend in="litMetal" in2="diffuse" mode="multiply" result="shadedMetal"/>
      <feComposite in="shadedMetal" in2="SourceGraphic" operator="in"/>
    </filter>

    <filter id="chromeEdgeFilter" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="out" result="edge"/>
      <feComponentTransfer in="edge" result="sharpEdge">
        <feFuncA type="linear" slope="3.5"/>
      </feComponentTransfer>
      <feComposite in="SourceGraphic" in2="sharpEdge" operator="in"/>
    </filter>

    <filter id="softShadow" x="-30%" y="-30%" width="160%" height="170%">
      <feDropShadow dx="0" dy="${Math.round(size * 0.026)}" stdDeviation="${Math.round(size * 0.032)}" flood-color="#000000" flood-opacity=".68"/>
    </filter>

    <mask id="chromeMask">
      <image href="${asset.dataUri}" x="${glyphX}" y="${glyphX}" width="${glyph}" height="${glyph}" preserveAspectRatio="xMidYMid meet"/>
    </mask>
  `;

  if (!useFrame) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>${commonDefs}</defs>
  <g filter="url(#softShadow)">
    <g mask="url(#chromeMask)">
      <rect x="${glyphX}" y="${glyphX}" width="${glyph}" height="${glyph}" fill="url(#metalGrad)" filter="url(#chromeMetalFilter)"/>
      <rect x="${glyphX}" y="${glyphX}" width="${glyph}" height="${glyph}" fill="url(#metalBands)" filter="url(#chromeMetalFilter)" style="mix-blend-mode:screen; opacity:0.86;"/>
      <rect x="${glyphX}" y="${glyphX}" width="${glyph}" height="${glyph}" fill="url(#metalEdgeGrad)" filter="url(#chromeEdgeFilter)" opacity="${theme.bevel ?? 0.85}"/>
    </g>
  </g>
</svg>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">${bgStops}</linearGradient>
    <clipPath id="iconClip"><rect width="${size}" height="${size}" rx="${radius}"/></clipPath>
    ${commonDefs}
  </defs>
  <g clip-path="url(#iconClip)">
    <rect width="${size}" height="${size}" fill="url(#bg)"/>
    <circle cx="${size * 0.52}" cy="${size * 0.76}" r="${size * 0.38}" fill="${accentColor}" opacity=".28"/>

    <g filter="url(#softShadow)">
      <g mask="url(#chromeMask)">
        <rect x="${glyphX}" y="${glyphX}" width="${glyph}" height="${glyph}" fill="url(#metalGrad)" filter="url(#chromeMetalFilter)"/>
        <rect x="${glyphX}" y="${glyphX}" width="${glyph}" height="${glyph}" fill="url(#metalBands)" filter="url(#chromeMetalFilter)" style="mix-blend-mode:screen; opacity:0.86;"/>
        <rect x="${glyphX}" y="${glyphX}" width="${glyph}" height="${glyph}" fill="url(#metalEdgeGrad)" filter="url(#chromeEdgeFilter)" opacity="${theme.bevel ?? 0.85}"/>
      </g>
    </g>

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

  const frameToggle = document.querySelector("#frameEnabledToggle");
  const frameArg = (frameToggle && !frameToggle.checked) ? " --no-frame" : "";

  if (activePreset === "pack") {
    commandText.textContent = `node render.js --theme ${activeTheme.renderer || 'glass'} --all-sizes-and-favicons --pwa-manifest --og-banner --asset-scale ${getAssetScale().toFixed(2)}${frameArg}`;
    return;
  }

  const sizes = getSelectedValues("size");
  const theme = themeSelect.value;
  const formats = getSelectedValues("format");
  const formatArg = formats.length ? ` --formats ${formats.join(",")}` : "";
  commandText.textContent = `node render.js --theme ${theme} --sizes ${sizes.join(",")} --asset-scale ${getAssetScale().toFixed(2)}${formatArg}${frameArg}`;
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

function splitDataUri(dataUri) {
  const match = dataUri.match(/^data:([^;,]+);base64,(.*)$/);
  if (match) return { mimeType: match[1], data: match[2] };

  const encoded = dataUri.split(",")[1] || "";
  return {
    mimeType: dataUri.match(/^data:([^;,]+)/)?.[1] || "image/png",
    data: btoa(decodeURIComponent(encoded))
  };
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

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
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
