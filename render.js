#!/usr/bin/env node
import { program } from "commander";
import { renderBatch } from "./scripts/render-engine.js";
import { listThemes } from "./scripts/theme-loader.js";

program
  .name("render")
  .description("Render flat SVG source icons into premium glassmorphism application icons.")
  .option("-t, --theme <name>", "Theme name from /themes", "liquid-glass")
  .option("--all-themes", "Render every theme in /themes", false)
  .option("-i, --input <dir>", "Source SVG, PNG, and JPG directory", "icons/source")
  .option("-o, --output <dir>", "Render output directory", "renders")
  .option("-s, --size <px>", "Render one legacy output size in pixels")
  .option("--sizes <list>", "Comma-separated output sizes in pixels", "64,128,256,512,1024")
  .option("--scale <factor>", "Retina scale multiplier", "1")
  .option("--asset-scale <ratio>", "Input asset scale inside the glass canvas, from 0.35 to 0.85")
  .option("--formats <list>", "Comma-separated output formats: png,webp,svg", "png,webp,svg")
  .option("--no-svg", "Disable self-contained SVG output")
  .option("--debug-html", "Keep the intermediate HTML composition beside rendered assets", false)
  .option("--concurrency <count>", "Icons to render in parallel per Chromium browser", "2")
  .option("--list-themes", "Print available themes and exit", false)
  .parse();

const options = program.opts();

if (options.listThemes) {
  const themes = await listThemes();
  for (const theme of themes) {
    console.log(`${theme.name} - ${theme.description ?? "No description"}`);
  }
  process.exit(0);
}

const requestedFormats = options.formats
  .split(",")
  .map((format) => format.trim().toLowerCase())
  .filter(Boolean);
const exportSvg = options.svg && requestedFormats.includes("svg");
const formats = requestedFormats.filter((format) => format !== "svg");

const sizes = options.size
  ? [Number.parseInt(options.size, 10)]
  : options.sizes
    .split(",")
    .map((size) => Number.parseInt(size.trim(), 10))
    .filter((size) => Number.isFinite(size));

await renderBatch({
  inputDir: options.input,
  outputDir: options.output,
  themeName: options.theme,
  allThemes: options.allThemes,
  sizes,
  scale: Number.parseFloat(options.scale),
  assetScale: options.assetScale === undefined ? undefined : Number.parseFloat(options.assetScale),
  formats,
  exportSvg,
  debugHtml: options.debugHtml,
  concurrency: Number.parseInt(options.concurrency, 10)
});
