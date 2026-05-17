import path from "node:path";
import fs from "fs-extra";
import fg from "fast-glob";
import puppeteer from "puppeteer";
import sharp from "sharp";
import { loadTheme, listThemes } from "./theme-loader.js";
import { loadIconAsset, SUPPORTED_SOURCE_EXTENSIONS } from "./svg-utils.js";
import { composeIconHtml, composeIconSvg } from "./html-composer.js";

const SUPPORTED_FORMATS = new Set(["png", "webp"]);
const DEFAULT_SIZES = [64, 128, 256, 512, 1024];

export async function renderBatch(options) {
  const {
    inputDir,
    outputDir,
    allThemes,
    themeName,
    sizes,
    scale,
    formats,
    exportSvg,
    debugHtml,
    concurrency
  } = normalizeOptions(options);

  const sourceFiles = await fg(`**/*.{${SUPPORTED_SOURCE_EXTENSIONS.join(",")}}`, {
    cwd: inputDir,
    absolute: true,
    onlyFiles: true,
    caseSensitiveMatch: false
  });

  if (!sourceFiles.length) {
    throw new Error(`No SVG, PNG, or JPG files found in ${inputDir}. Add icons to /icons/source and rerun the command.`);
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
        sourceFiles,
        inputDir,
        outputDir,
        sizes,
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

async function renderTheme({ browser, theme, sourceFiles, inputDir, outputDir, sizes, scale, formats, exportSvg, debugHtml, concurrency }) {
  const themeOutputDir = path.join(outputDir, theme.name);
  await fs.ensureDir(themeOutputDir);

  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, sourceFiles.length) }, async () => {
    while (cursor < sourceFiles.length) {
      const file = sourceFiles[cursor];
      cursor += 1;
      await renderOne({ browser, theme, file, inputDir, themeOutputDir, sizes, scale, formats, exportSvg, debugHtml });
    }
  });

  await Promise.all(workers);
}

async function renderOne({ browser, theme, file, inputDir, themeOutputDir, sizes, scale, formats, exportSvg, debugHtml }) {
  const icon = await loadIconAsset(file);
  const relative = path.relative(inputDir, file);
  const nestedDir = path.dirname(relative);
  const basename = path.basename(relative, path.extname(relative));
  const outputName = icon.sourceExtension === "svg" ? basename : `${basename}-${icon.sourceExtension}`;
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(0);

  try {
    for (const logicalSize of sizes) {
      const outputSize = Math.round(logicalSize * scale);
      const sizeDir = `${logicalSize}x${logicalSize}`;
      const outputStem = path.join(themeOutputDir, sizeDir, nestedDir === "." ? "" : nestedDir, outputName);
      const html = composeIconHtml({ icon, theme, outputSize });

      await fs.ensureDir(path.dirname(outputStem));
      await page.setViewport({
        width: outputSize,
        height: outputSize,
        deviceScaleFactor: 1
      });
      await page.setContent(html, { waitUntil: "load" });
      await page.evaluateHandle("document.fonts.ready");
      await page.evaluate(async () => {
        await Promise.all([...document.images].map((image) => image.decode().catch(() => undefined)));
      });

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
    }

    console.log(`Rendered ${theme.name}/${relative} at ${sizes.join(", ")}px`);
  } finally {
    await page.close();
  }
}

function normalizeOptions(options) {
  const sizes = normalizeSizes(options.sizes, options.size);
  const scale = Number.isFinite(options.scale) ? options.scale : 1;
  const concurrency = Number.isFinite(options.concurrency) ? options.concurrency : 2;
  const formats = Array.isArray(options.formats) ? options.formats : ["png", "webp"];

  if (scale <= 0) {
    throw new Error("Scale must be greater than 0.");
  }

  for (const format of formats) {
    if (!SUPPORTED_FORMATS.has(format)) {
      throw new Error(`Unsupported format "${format}". Supported formats: ${[...SUPPORTED_FORMATS].join(", ")}`);
    }
  }

  if (!formats.length && !options.exportSvg) {
    throw new Error("At least one output format is required.");
  }

  return {
    ...options,
    sizes,
    scale,
    concurrency: Math.max(1, concurrency),
    formats
  };
}

function normalizeSizes(sizes, legacySize) {
  const values = sizes?.length
    ? sizes
    : Number.isFinite(legacySize)
      ? [legacySize]
      : DEFAULT_SIZES;

  const parsed = [...new Set(values.map((size) => Number.parseInt(size, 10)))]
    .filter((size) => Number.isFinite(size) && size > 0)
    .sort((a, b) => a - b);

  if (!parsed.length) {
    throw new Error("At least one output size is required.");
  }

  if (Math.max(...parsed) < 1024) {
    throw new Error("At least one output size must be 1024px or larger for production icon assets.");
  }

  return parsed;
}
