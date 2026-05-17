#!/usr/bin/env node
import { program } from "commander";
import { renderBatch } from "./scripts/render-engine.js";
import { listThemes } from "./scripts/theme-loader.js";

program
  .name("render")
  .description("Render flat SVG source icons into premium glassmorphism application icons.")
  .option("-t, --theme <name>", "Theme name from /themes", "liquid-glass")
  .option("--all-themes", "Render every theme in /themes", false)
  .option("-i, --input <dir>", "Source SVG directory", "icons/source")
  .option("-o, --output <dir>", "Render output directory", "renders")
  .option("-s, --size <px>", "Base output size in pixels", "1024")
  .option("--scale <factor>", "Retina scale multiplier", "1")
  .option("--formats <list>", "Comma-separated output formats: png,webp", "png,webp")
  .option("--svg", "Also export a self-contained SVG wrapper with foreignObject layers", false)
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

const formats = options.formats
  .split(",")
  .map((format) => format.trim().toLowerCase())
  .filter(Boolean);

await renderBatch({
  inputDir: options.input,
  outputDir: options.output,
  themeName: options.theme,
  allThemes: options.allThemes,
  size: Number.parseInt(options.size, 10),
  scale: Number.parseFloat(options.scale),
  formats,
  exportSvg: options.svg,
  debugHtml: options.debugHtml,
  concurrency: Number.parseInt(options.concurrency, 10)
});
