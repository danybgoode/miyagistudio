import path from "node:path";
import fs from "fs-extra";
import fg from "fast-glob";

const REQUIRED_THEME_KEYS = ["name", "material", "lighting", "shadow", "palette"];

export async function listThemes(themeDir = "themes") {
  const files = await fg("*.json", { cwd: themeDir, absolute: true, onlyFiles: true });
  const themes = [];

  for (const file of files.sort()) {
    const theme = await fs.readJson(file);
    validateTheme(theme, file);
    themes.push({ ...theme, file });
  }

  return themes;
}

export async function loadTheme(name, themeDir = "themes") {
  const file = path.join(themeDir, `${name}.json`);

  if (!(await fs.pathExists(file))) {
    const available = (await listThemes(themeDir)).map((theme) => theme.name).join(", ");
    throw new Error(`Theme "${name}" was not found in ${themeDir}. Available themes: ${available}`);
  }

  const theme = await fs.readJson(file);
  validateTheme(theme, file);
  return { ...theme, file };
}

function validateTheme(theme, file) {
  if (theme.baseColor) {
    // Crystal Liquid schema
    const required = ["name", "baseColor", "secondaryColor", "highlightColor", "environmentColor"];
    for (const key of required) {
      if (theme[key] === undefined) {
        throw new Error(`Theme file ${file} is missing required key "${key}".`);
      }
    }
    return;
  }

  for (const key of REQUIRED_THEME_KEYS) {
    if (!theme[key]) {
      throw new Error(`Theme file ${file} is missing required key "${key}".`);
    }
  }

  if (!Array.isArray(theme.palette?.background) || theme.palette.background.length < 2) {
    throw new Error(`Theme file ${file} must define at least two background colors.`);
  }
}
