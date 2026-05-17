import JSZip from "jszip";
import defaultIcon from "../icons/source/miyagi-leaf.svg?raw";

const STANDARD_SIZES = [64, 128, 256, 512, 1024];
const THEMES = {
  "crystal-liquid": {
    bg: ["#0A0A0A", "#151515", "#050505", "#0f0f0f"],
    glass: "rgba(29, 185, 84, 0.4)",
    edge: "rgba(255, 255, 255, 0.6)",
    shadow: "rgba(0, 0, 0, 0.45)",
    accent: "#FFFFFF"
  },
  "liquid-glass": {
    bg: ["#dceeff", "#f9f7f1", "#dff6ef", "#c9d8ff"],
    glass: "rgba(255,255,255,.48)",
    edge: "rgba(255,255,255,.7)",
    shadow: "rgba(39,59,88,.28)",
    accent: "#1fa37a"
  },
  "dark-glass": {
    bg: ["#10151f", "#243246", "#0e1f26", "#332c46"],
    glass: "rgba(255,255,255,.24)",
    edge: "rgba(190,220,255,.54)",
    shadow: "rgba(0,0,0,.48)",
    accent: "#7cb2ff"
  },
  "frosted-light": {
    bg: ["#f8fbff", "#e6f1ff", "#fff9ee", "#e9f7f0"],
    glass: "rgba(255,255,255,.66)",
    edge: "rgba(255,255,255,.78)",
    shadow: "rgba(93,118,150,.22)",
    accent: "#6d9fc8"
  },
  "holographic-subtle": {
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

themeSelect.addEventListener("change", () => {
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

applyTheme("crystal-liquid");
applyAssetScale();
loadDefaultIcon();
updateCommand();
renderEmptyAssets();

function applyTheme(name) {
  const theme = THEMES[name];
  iconPreview.style.setProperty("--preview-bg", `linear-gradient(135deg, ${theme.bg.join(", ")})`);
  iconPreview.style.setProperty("--preview-glass", theme.glass);
  iconPreview.style.setProperty("--preview-edge", theme.edge);
  iconPreview.style.setProperty("--preview-shadow", theme.shadow);
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
  drawGlassIcon(ctx, { size, image, theme, assetScale });

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

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
