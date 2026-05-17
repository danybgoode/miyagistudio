import path from "node:path";
import fs from "fs-extra";
import fg from "fast-glob";
import puppeteer from "puppeteer";
import sharp from "sharp";
import { loadTheme, listThemes } from "./theme-loader.js";
import { loadSvgIcon } from "./svg-utils.js";
import { composeIconHtml, composeIconSvg } from "./html-composer.js";

const SUPPORTED_FORMATS = new Set(["png", "webp"]);

export async function renderBatch(options) {
  const {
    inputDir,
    outputDir,
    allThemes,
    themeName,
    size,
    scale,
    formats,
    exportSvg,
    debugHtml,
    concurrency
  } = normalizeOptions(options);

  const svgFiles = await fg("**/*.svg", { cwd: inputDir, absolute: true, onlyFiles: true });

  if (!svgFiles.length) {
    throw new Error(`No SVG files found in ${inputDir}. Add icons to /icons/source and rerun the command.`);
  }

  const themes = allThemes ? await listThemes("themes") : [await loadTheme(themeName, "themes")];
  await fs.ensureDir(outputDir);

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--font-render-hinting=none"]
  });

  try {
    for (const theme of themes) {
      await renderTheme({
        browser,
        theme,
        svgFiles,
        inputDir,
        outputDir,
        size,
        scale,
        formats,
        exportSvg,
        debugHtml,
        concurrency
      });
    }
  } finally {
    await browser.close();
  }
}

async function renderTheme({ browser, theme, svgFiles, inputDir, outputDir, size, scale, formats, exportSvg, debugHtml, concurrency }) {
  const outputSize = Math.round(size * scale);
  const themeOutputDir = path.join(outputDir, theme.name);
  await fs.ensureDir(themeOutputDir);

  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, svgFiles.length) }, async () => {
    while (cursor < svgFiles.length) {
      const file = svgFiles[cursor];
      cursor += 1;
      await renderOne({ browser, theme, file, inputDir, themeOutputDir, outputSize, formats, exportSvg, debugHtml });
    }
  });

  await Promise.all(workers);
}

async function renderOne({ browser, theme, file, inputDir, themeOutputDir, outputSize, formats, exportSvg, debugHtml }) {
  const icon = await loadSvgIcon(file);
  const relative = path.relative(inputDir, file);
  const nestedDir = path.dirname(relative);
  const basename = path.basename(relative, ".svg");
  const outputStem = path.join(themeOutputDir, nestedDir === "." ? "" : nestedDir, basename);
  const html = composeIconHtml({ icon, theme, outputSize });
  const page = await browser.newPage();

  await fs.ensureDir(path.dirname(outputStem));

  try {
    await page.setViewport({
      width: outputSize,
      height: outputSize,
      deviceScaleFactor: 1
    });
    await page.setContent(html, { waitUntil: ["load", "networkidle0"] });
    await page.evaluateHandle("document.fonts.ready");

    const pngBuffer = await page.screenshot({
      type: "png",
      omitBackground: true,
      clip: { x: 0, y: 0, width: outputSize, height: outputSize }
    });

    if (formats.includes("png")) {
      await sharp(pngBuffer)
        .png({ compressionLevel: 9, adaptiveFiltering: true, palette: false })
        .toFile(`${outputStem}.png`);
    }

    if (formats.includes("webp")) {
      await sharp(pngBuffer)
        .webp({ quality: 94, alphaQuality: 96, effort: 6 })
        .toFile(`${outputStem}.webp`);
    }

    if (exportSvg) {
      await fs.writeFile(`${outputStem}.svg`, composeIconSvg({ icon, theme, outputSize }), "utf8");
    }

    if (debugHtml) {
      await fs.writeFile(`${outputStem}.html`, html, "utf8");
    }

    console.log(`Rendered ${theme.name}/${relative}`);
  } finally {
    await page.close();
  }
}

function normalizeOptions(options) {
  const size = Number.isFinite(options.size) ? options.size : 1024;
  const scale = Number.isFinite(options.scale) ? options.scale : 1;
  const concurrency = Number.isFinite(options.concurrency) ? options.concurrency : 2;
  const formats = options.formats?.length ? options.formats : ["png", "webp"];

  if (size < 1024) {
    throw new Error("Output size must be at least 1024px for production icon assets.");
  }

  if (scale <= 0) {
    throw new Error("Scale must be greater than 0.");
  }

  for (const format of formats) {
    if (!SUPPORTED_FORMATS.has(format)) {
      throw new Error(`Unsupported format "${format}". Supported formats: ${[...SUPPORTED_FORMATS].join(", ")}`);
    }
  }

  return {
    ...options,
    size,
    scale,
    concurrency: Math.max(1, concurrency),
    formats
  };
}
