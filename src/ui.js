import defaultIcon from "../icons/source/miyagi-leaf.svg?raw";

const THEMES = {
  "liquid-glass": {
    bg: ["#dceeff", "#f9f7f1", "#dff6ef", "#c9d8ff"],
    glass: "rgba(255,255,255,.48)",
    edge: "rgba(255,255,255,.7)",
    shadow: "rgba(39,59,88,.28)"
  },
  "dark-glass": {
    bg: ["#10151f", "#243246", "#0e1f26", "#332c46"],
    glass: "rgba(255,255,255,.24)",
    edge: "rgba(190,220,255,.54)",
    shadow: "rgba(0,0,0,.48)"
  },
  "frosted-light": {
    bg: ["#f8fbff", "#e6f1ff", "#fff9ee", "#e9f7f0"],
    glass: "rgba(255,255,255,.66)",
    edge: "rgba(255,255,255,.78)",
    shadow: "rgba(93,118,150,.22)"
  },
  "holographic-subtle": {
    bg: ["#edf4ff", "#f8edf7", "#e9fff7", "#fff8df"],
    glass: "rgba(255,255,255,.46)",
    edge: "rgba(210,242,255,.66)",
    shadow: "rgba(73,74,118,.25)"
  }
};

const themeSelect = document.querySelector("#themeSelect");
const iconPreview = document.querySelector("#iconPreview");
const previewGlyph = document.querySelector("#previewGlyph");
const svgInput = document.querySelector("#svgInput");
const dropZone = document.querySelector(".drop-zone");
const commandText = document.querySelector("#commandText");

themeSelect.addEventListener("change", () => applyTheme(themeSelect.value));
svgInput.addEventListener("change", async (event) => {
  const [file] = event.target.files;
  await loadSvgFile(file);
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
  await loadSvgFile(file);
});

applyTheme("liquid-glass");

function loadDefaultIcon() {
  previewGlyph.innerHTML = defaultIcon;
}

function applyTheme(name) {
  const theme = THEMES[name];
  iconPreview.style.setProperty("--preview-bg", `linear-gradient(135deg, ${theme.bg.join(", ")})`);
  iconPreview.style.setProperty("--preview-glass", theme.glass);
  iconPreview.style.setProperty("--preview-edge", theme.edge);
  iconPreview.style.setProperty("--preview-shadow", theme.shadow);
  commandText.textContent = `node render.js --theme ${name}`;
}

async function loadSvgFile(file) {
  if (!file || !file.type.includes("svg")) return;
  const svg = await file.text();
  previewGlyph.innerHTML = sanitizeSvg(svg);
}

function sanitizeSvg(svg) {
  return svg
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+=["'][^"']*["']/gi, "")
    .replace("<svg", '<svg preserveAspectRatio="xMidYMid meet" aria-hidden="true"');
}

loadDefaultIcon();
