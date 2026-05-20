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

const themeSelect = document.querySelector("#themeSelect");
const iconPreview = document.querySelector("#iconPreview");
const previewGlyph = document.querySelector("#previewGlyph");
const assetInput = document.querySelector("#assetInput");
const dropZone = document.querySelector(".drop-zone");
const commandText = document.querySelector("#commandText");
const assetName = document.querySelector("#assetName");
const jobStatus = document.querySelector("#jobStatus");
const generateButton = document.querySelector("#generateButton");
const downloadAllButton = document.querySelector("#downloadAllButton");
const assetList = document.querySelector("#assetList");
const assetScale = document.querySelector("#assetScale");
const assetScaleValue = document.querySelector("#assetScaleValue");

let currentAsset;
let generatedAssets = [];
let hasManualAssetScale = false;

themeSelect.addEventListener("change", () => {
  applyRecommendedScale();
  applyTheme(themeSelect.value);
  updateCommand();
  invalidateGeneratedAssets("Theme updated");
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

dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropZone.classList.add("is-dragging");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("is-dragging");
});

dropZone.addEventListener("drop", async (event) => {
  event.preventDefault();
  dropZone.classList.remove("is-dragging");
  const [file] = event.dataTransfer.files;
  await loadAssetFile(file);
});

generateButton.addEventListener("click", generateAssets);
downloadAllButton.addEventListener("click", downloadZip);

applyTheme("liquid-glass");
applyAssetScale();
loadDefaultIcon();
updateCommand();
renderEmptyAssets();

function applyTheme(name) {
  const theme = THEMES[name];
  iconPreview.dataset.renderer = theme.renderer;
  iconPreview.style.setProperty("--preview-bg", `linear-gradient(135deg, ${theme.bg.join(", ")})`);
  iconPreview.style.setProperty("--preview-glass", theme.glass);
  iconPreview.style.setProperty("--preview-edge", theme.edge);
  iconPreview.style.setProperty("--preview-shadow", theme.shadow);
}

function applyRecommendedScale() {
  if (hasManualAssetScale) return;
  const scale = THEMES[themeSelect.value]?.defaultScale ?? 0.56;
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
  renderEmptyAssets();
  setStatus("Ready to generate");
}

async function generateAssets() {
  const sizes = getSelectedValues("size").map(Number);
  const formats = getSelectedValues("format");
  const scale = getAssetScale();

  if (!currentAsset || !sizes.length || !formats.length) {
    setStatus("Choose a source, size, and format");
    return;
  }

  generatedAssets = [];
  assetList.innerHTML = "";
  generateButton.disabled = true;
  downloadAllButton.disabled = true;
  setStatus("Generating...");

  try {
    const image = await loadImage(currentAsset.dataUri);
    const theme = THEMES[themeSelect.value];

    for (const size of sizes) {
      if (formats.includes("png")) {
        const blob = await renderPng({ size, image, theme, assetScale: scale });
        generatedAssets.push(createGeneratedAsset(`${currentAsset.name}-${themeSelect.value}-${size}.png`, blob));
      }

      if (formats.includes("svg")) {
        const svg = renderSvg({ size, asset: currentAsset, theme, assetScale: scale });
        const blob = new Blob([svg], { type: "image/svg+xml" });
        generatedAssets.push(createGeneratedAsset(`${currentAsset.name}-${themeSelect.value}-${size}.svg`, blob));
      }
    }

    renderGeneratedAssets();
    setStatus(`${generatedAssets.length} assets ready`);
    downloadAllButton.disabled = generatedAssets.length === 0;
  } catch (error) {
    console.error(error);
    setStatus("Generation failed");
  } finally {
    generateButton.disabled = false;
  }
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

function drawGlassIcon(ctx, { size, image, theme, assetScale }) {
  const radius = size * 0.218;
  roundRect(ctx, 0, 0, size, size, radius);
  ctx.clip();

  const bg = ctx.createLinearGradient(0, 0, size, size);
  theme.bg.forEach((color, index) => bg.addColorStop(index / (theme.bg.length - 1), color));
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  const bloom = ctx.createRadialGradient(size * 0.35, size * 0.25, 0, size * 0.35, size * 0.25, size * 0.58);
  bloom.addColorStop(0, "rgba(255,255,255,.72)");
  bloom.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = bloom;
  ctx.fillRect(0, 0, size, size);

  ctx.save();
  ctx.shadowColor = theme.shadow;
  ctx.shadowBlur = size * 0.07;
  ctx.shadowOffsetY = size * 0.032;
  roundRect(ctx, size * 0.058, size * 0.058, size * 0.884, size * 0.884, radius * 0.72);
  ctx.fillStyle = theme.glass;
  ctx.fill();
  ctx.restore();

  roundRect(ctx, size * 0.058, size * 0.058, size * 0.884, size * 0.884, radius * 0.72);
  ctx.lineWidth = Math.max(1, size * 0.004);
  ctx.strokeStyle = theme.edge;
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
  const stops = theme.bg.map((color, index) => `<stop offset="${index / (theme.bg.length - 1)}" stop-color="${color}"/>`).join("");

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
    <rect x="${glassInset}" y="${glassInset}" width="${glassSize}" height="${glassSize}" rx="${Math.round(radius * 0.72)}" fill="${theme.glass}" filter="url(#softShadow)"/>
    <rect x="${glassInset}" y="${glassInset}" width="${glassSize}" height="${glassSize}" rx="${Math.round(radius * 0.72)}" fill="none" stroke="${theme.edge}" stroke-width="${Math.max(1, Math.round(size * 0.004))}"/>
    <image href="${asset.dataUri}" x="${glyphX}" y="${glyphX}" width="${glyph}" height="${glyph}" preserveAspectRatio="xMidYMid meet"/>
    <path d="M ${size * 0.12} ${size * 0.2} C ${size * 0.26} ${size * 0.06}, ${size * 0.62} ${size * 0.08}, ${size * 0.82} ${size * 0.22}" fill="none" stroke="#fff" stroke-opacity=".38" stroke-width="${Math.max(2, size * 0.035)}" stroke-linecap="round"/>
  </g>
</svg>`;
}

function drawDiscoIcon(ctx, { size, image, theme, assetScale }) {
  const radius = size * 0.218;
  roundRect(ctx, 0, 0, size, size, radius);
  ctx.clip();

  const bg = ctx.createLinearGradient(0, 0, size, size);
  theme.bg.forEach((color, index) => bg.addColorStop(index / (theme.bg.length - 1), color));
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  drawGlow(ctx, size * 0.18, size * 0.74, size * 0.42, theme.lights[0], 0.42);
  drawGlow(ctx, size * 0.84, size * 0.2, size * 0.34, theme.lights[1], 0.38);
  drawGlow(ctx, size * 0.52, size * 0.08, size * 0.3, theme.lights[2], 0.28);

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
      const light = theme.lights[(x + y) % theme.lights.length];
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

  drawStar(ctx, size * 0.82, size * 0.14, size * 0.052, theme.lights[1], 0.82);
  drawStar(ctx, size * 0.18, size * 0.45, size * 0.032, theme.lights[0], 0.48);
  drawStar(ctx, size * 0.62, size * 0.77, size * 0.028, theme.lights[2], 0.38);

  ctx.lineWidth = Math.max(2, size * 0.007);
  const rim = ctx.createLinearGradient(0, 0, size, size);
  rim.addColorStop(0, "#3b67c8");
  rim.addColorStop(0.52, "#7dd8c5");
  rim.addColorStop(1, "#b9a7ff");
  ctx.strokeStyle = rim;
  roundRect(ctx, size * 0.003, size * 0.003, size * 0.994, size * 0.994, radius);
  ctx.stroke();
}

function drawChromeIcon(ctx, { size, image, theme, assetScale }) {
  const radius = size * 0.218;
  roundRect(ctx, 0, 0, size, size, radius);
  ctx.clip();

  const bg = ctx.createLinearGradient(0, 0, size, size);
  theme.bg.forEach((color, index) => bg.addColorStop(index / (theme.bg.length - 1), color));
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  drawGlow(ctx, size * 0.52, size * 0.75, size * 0.42, theme.accent, 0.42);

  roundRect(ctx, size * 0.05, size * 0.05, size * 0.9, size * 0.9, radius * 0.78);
  ctx.fillStyle = "rgba(255,255,255,.035)";
  ctx.fill();

  const mask = createMaskCanvas(size, image, assetScale);
  const metalCanvas = document.createElement("canvas");
  metalCanvas.width = size;
  metalCanvas.height = size;
  const metalCtx = metalCanvas.getContext("2d");

  const metal = metalCtx.createLinearGradient(size * 0.14, size * 0.05, size * 0.88, size * 0.96);
  theme.metal.forEach((color, index) => metal.addColorStop(index / (theme.metal.length - 1), color));
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

  drawStar(ctx, size * 0.68, size * 0.2, size * 0.04, "#ffffff", 0.88);
  drawStar(ctx, size * 0.67, size * 0.73, size * 0.035, theme.accent, 0.82);
}

function renderDiscoSvg({ size, asset, theme, assetScale }) {
  const radius = Math.round(size * 0.218);
  const glyph = Math.round(size * assetScale);
  const glyphX = Math.round((size - glyph) / 2);
  const bgStops = theme.bg.map((color, index) => `<stop offset="${index / (theme.bg.length - 1)}" stop-color="${color}"/>`).join("");
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
    <circle cx="${size * 0.18}" cy="${size * 0.74}" r="${size * 0.42}" fill="${theme.lights[0]}" opacity=".22"/>
    <circle cx="${size * 0.84}" cy="${size * 0.2}" r="${size * 0.34}" fill="${theme.lights[1]}" opacity=".2"/>
    <image href="${asset.dataUri}" x="${glyphX}" y="${glyphX}" width="${glyph}" height="${glyph}" preserveAspectRatio="xMidYMid meet"/>
    <rect x="${glyphX}" y="${glyphX}" width="${glyph}" height="${glyph}" fill="url(#tiles)" opacity=".72" style="mix-blend-mode:screen"/>
    <rect x="2" y="2" width="${size - 4}" height="${size - 4}" rx="${radius}" fill="none" stroke="#7dd8c5" stroke-width="${Math.max(2, size * 0.007)}" opacity=".9"/>
  </g>
</svg>`;
}

function renderChromeSvg({ size, asset, theme, assetScale }) {
  const radius = Math.round(size * 0.218);
  const glyph = Math.round(size * assetScale);
  const glyphX = Math.round((size - glyph) / 2);
  const bgStops = theme.bg.map((color, index) => `<stop offset="${index / (theme.bg.length - 1)}" stop-color="${color}"/>`).join("");
  const metalStops = theme.metal.map((color, index) => `<stop offset="${index / (theme.metal.length - 1)}" stop-color="${color}"/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">${bgStops}</linearGradient>
    <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1">${metalStops}</linearGradient>
    <clipPath id="iconClip"><rect width="${size}" height="${size}" rx="${radius}"/></clipPath>
  </defs>
  <g clip-path="url(#iconClip)">
    <rect width="${size}" height="${size}" fill="url(#bg)"/>
    <circle cx="${size * 0.52}" cy="${size * 0.76}" r="${size * 0.38}" fill="${theme.accent}" opacity=".28"/>
    <image href="${asset.dataUri}" x="${glyphX}" y="${glyphX}" width="${glyph}" height="${glyph}" preserveAspectRatio="xMidYMid meet" opacity=".38"/>
    <image href="${asset.dataUri}" x="${glyphX}" y="${glyphX}" width="${glyph}" height="${glyph}" preserveAspectRatio="xMidYMid meet" opacity=".78" style="filter:saturate(0) contrast(1.6)"/>
    <path d="M ${size * 0.22} ${size * 0.32} C ${size * 0.42} ${size * 0.1}, ${size * 0.62} ${size * 0.18}, ${size * 0.82} ${size * 0.3}" stroke="#fff" stroke-width="${Math.max(2, size * 0.025)}" stroke-linecap="round" opacity=".62"/>
    <circle cx="${size * 0.68}" cy="${size * 0.2}" r="${size * 0.015}" fill="#fff"/>
  </g>
</svg>`;
}

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
    row.innerHTML = `<span>${asset.filename}<br>${formatBytes(asset.bytes)}</span>`;

    const link = document.createElement("a");
    link.href = asset.url;
    link.download = asset.filename;
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
  renderEmptyAssets();
  setStatus(message);
}

async function downloadZip() {
  if (!generatedAssets.length) return;

  const zip = new JSZip();
  for (const asset of generatedAssets) {
    zip.file(asset.filename, asset.blob);
  }

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${currentAsset.name}-${themeSelect.value}-assets.zip`;
  link.click();
  URL.revokeObjectURL(url);
}

function getSelectedValues(name) {
  return [...document.querySelectorAll(`input[name='${name}']:checked`)].map((input) => input.value);
}

function updateCommand() {
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

function getAssetScale() {
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
  const clean = hex.replace("#", "");
  return [
    Number.parseInt(clean.slice(0, 2), 16),
    Number.parseInt(clean.slice(2, 4), 16),
    Number.parseInt(clean.slice(4, 6), 16)
  ];
}

function withAlpha(color, alpha) {
  if (color.startsWith("#")) {
    const [r, g, b] = hexToRgb(color);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  return color.replace(/rgba?\(([^)]+)\)/, (_, values) => `rgba(${values.split(",").slice(0, 3).join(",")},${alpha})`);
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
