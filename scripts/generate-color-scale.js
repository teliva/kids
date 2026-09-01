#!/usr/bin/env node
/**
 * Generates a --kd-color-{name}-05..95 OKLCH tint scale from a single hex
 * color, in the same style as the hand-built red/yellow/green/gray scales
 * in css/design-tokens.css.
 *
 * Usage:
 *   node scripts/generate-color-scale.js <hex> <name> [--mode=vivid|muted] [--write[=path]]
 *
 * --mode=vivid (default): chroma follows the sRGB gamut boundary for the
 *   color's hue (0.95x max in-gamut chroma per step), like red/yellow/green.
 *   The -key tint is whichever step reaches the highest chroma.
 *
 * --mode=muted: chroma is capped at the source color's own chroma, only
 *   tapering where gamut forces it near white/black. The input hex is
 *   reproduced exactly at its nearest lightness rung, which becomes -key.
 *
 * --write[=path]: instead of printing the CSS block, patch it directly into
 *   the target file (default css/design-tokens.css) — updates the 11 tint
 *   declarations, the -key line, and the --kd-color-{name}: reference line
 *   in place if a scale for that name already exists, or appends a new
 *   block (matching the existing indentation) if it doesn't.
 *
 * Examples:
 *   node scripts/generate-color-scale.js "#ADEBB3" brand --mode=muted
 *   node scripts/generate-color-scale.js "#3366FF" brand --mode=muted --write
 *   node scripts/generate-color-scale.js "#004739" brand --mode=muted --write
 */

const fs = require("fs");
const path = require("path");

const TINTS = ["95", "90", "80", "70", "60", "50", "40", "30", "20", "10", "05"];

// Shared lightness ladder (average of the existing red/yellow/green scales
// in css/design-tokens.css), so any new hue lines up visually with them.
const LADDER = {
  95: 96.332,
  90: 92.202,
  80: 83.811,
  70: 75.435,
  60: 67.26,
  50: 57.024,
  40: 47.02,
  30: 39.723,
  20: 32.23,
  10: 23.647,
  "05": 18.48,
};

function hexToSrgb(hex) {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
}

function srgbToLinear(c) {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(c) {
  const clamped = Math.min(1, Math.max(0, c));
  return clamped <= 0.0031308
    ? clamped * 12.92
    : 1.055 * clamped ** (1 / 2.4) - 0.055;
}

function srgbToOklab([r, g, b]) {
  const [lr, lg, lb] = [r, g, b].map(srgbToLinear);
  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;
  const [l_, m_, s_] = [l, m, s].map((v) => Math.cbrt(v));
  return [
    0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  ];
}

function oklabToOklch([L, a, b]) {
  const C = Math.hypot(a, b);
  let H = (Math.atan2(b, a) * 180) / Math.PI;
  if (H < 0) H += 360;
  return { L, C, H };
}

function oklchToLinearRgb(L, C, hDeg) {
  const a = C * Math.cos((hDeg * Math.PI) / 180);
  const b = C * Math.sin((hDeg * Math.PI) / 180);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

function inGamut(L, C, H, eps = 1e-4) {
  return oklchToLinearRgb(L, C, H).every((v) => v >= -eps && v <= 1 + eps);
}

function maxChroma(L, H) {
  let lo = 0;
  let hi = 0.5;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (inGamut(L, mid, H)) lo = mid;
    else hi = mid;
  }
  return lo;
}

function oklchToHex(L, C, H) {
  const [r, g, b] = oklchToLinearRgb(L, C, H).map(linearToSrgb);
  const toByte = (v) => Math.round(v * 255).toString(16).padStart(2, "0");
  return `#${toByte(r)}${toByte(g)}${toByte(b)}`;
}

function generateScale(hex, { mode }) {
  const srgb = hexToSrgb(hex);
  const source = oklabToOklch(srgbToOklab(srgb));

  // Nearest ladder rung to the source lightness — used to anchor the input
  // color exactly in muted mode, and as a tiebreak reference otherwise.
  const nearestTint = TINTS.reduce((best, t) =>
    Math.abs(LADDER[t] - source.L * 100) <
    Math.abs(LADDER[best] - source.L * 100)
      ? t
      : best
  );

  const stops = TINTS.map((tint) => {
    if (mode === "muted" && tint === nearestTint) {
      return { tint, L: source.L, C: source.C, H: source.H, anchored: true };
    }
    const L = LADDER[tint] / 100;
    const gamutMax = maxChroma(L, source.H);
    const C =
      mode === "muted"
        ? Math.min(source.C, gamutMax * 0.95)
        : gamutMax * 0.95;
    return { tint, L, C, H: source.H, anchored: false };
  });

  const keyTint =
    mode === "muted"
      ? nearestTint
      : stops.reduce((best, s) => (s.C > best.C ? s : best)).tint;

  return { stops, keyTint };
}

function stopLine(name, tint, { L, C, H }, indent) {
  const hex = oklchToHex(L, C, H);
  return (
    `${indent}--kd-color-${name}-${tint}: ${hex}\n` +
    `${indent}  /* oklch(${(L * 100).toFixed(3)}% ${C.toFixed(5)} ${H.toFixed(2)}) */\n` +
    `${indent};`
  );
}

function formatCss(name, { stops, keyTint }, indent = "") {
  const lines = stops.map((s) => stopLine(name, s.tint, s, indent));
  lines.push(`${indent}--kd-color-${name}: var(--kd-color-${name}-${keyTint});`);
  lines.push(`${indent}--kd-color-${name}-key: ${keyTint};`);
  return lines.join("\n");
}

function printCss(name, scale) {
  console.log(formatCss(name, scale));
}

// Matches --kd-color-{name}-{tint}: ...; whether it's a single-line
// declaration (gray-style) or spread across a value + comment line.
function stopPattern(name, tint) {
  return new RegExp(`[ \\t]*--kd-color-${name}-${tint}:[\\s\\S]*?;`);
}

function refPattern(name) {
  return new RegExp(`[ \\t]*--kd-color-${name}:\\s*[^;]+;`);
}

function keyPattern(name) {
  return new RegExp(`[ \\t]*--kd-color-${name}-key:\\s*\\d+;`);
}

function writeToFile(name, scale, filePath) {
  const original = fs.readFileSync(filePath, "utf8");
  let css = original;

  const existingKeyMatch = css.match(keyPattern(name));
  const blockExists = Boolean(existingKeyMatch);
  // Match the file's existing indentation (falls back to the convention
  // used by every other scale in design-tokens.css).
  const indentMatch = css.match(/^([ \t]*)--kd-color-\w+-95:/m);
  const indent = indentMatch ? indentMatch[1] : "  ";

  if (blockExists) {
    for (const stop of scale.stops) {
      const pattern = stopPattern(name, stop.tint);
      if (!pattern.test(css)) {
        throw new Error(
          `Expected to find --kd-color-${name}-${stop.tint} in ${filePath} but it's missing.`
        );
      }
      css = css.replace(pattern, stopLine(name, stop.tint, stop, indent));
    }
    css = css.replace(keyPattern(name), `${indent}--kd-color-${name}-key: ${scale.keyTint};`);

    const newRef = `${indent}--kd-color-${name}: var(--kd-color-${name}-${scale.keyTint});`;
    css = refPattern(name).test(css)
      ? css.replace(refPattern(name), newRef)
      : css.replace(keyPattern(name), (m) => `${newRef}\n${m}`);
  } else {
    const block = formatCss(name, scale, indent);
    const lastKeyLine = [...css.matchAll(/[ \t]*--kd-color-\w+-key:\s*\d+;\n/g)].pop();
    css = lastKeyLine
      ? css.slice(0, lastKeyLine.index + lastKeyLine[0].length) +
        "\n" +
        block +
        "\n" +
        css.slice(lastKeyLine.index + lastKeyLine[0].length)
      : css.replace(/}\s*$/, `${block}\n}\n`);
  }

  if (css === original) {
    console.log(`No changes — ${filePath} already matches this scale.`);
    return;
  }
  fs.writeFileSync(filePath, css);
  console.log(
    `${blockExists ? "Updated" : "Added"} --kd-color-${name}-* (${scale.stops.length} stops) in ${filePath}`
  );
}

function main() {
  const rawArgs = process.argv.slice(2);
  const writeArg = rawArgs.find((a) => a === "--write" || a.startsWith("--write="));
  const modeArg = rawArgs.find((a) => a.startsWith("--mode="));
  const mode = modeArg ? modeArg.split("=")[1] : "vivid";
  const [hex, name] = rawArgs.filter((a) => !a.startsWith("--"));

  if (!hex || !name) {
    console.error(
      "Usage: node scripts/generate-color-scale.js <hex> <name> [--mode=vivid|muted] [--write[=path]]"
    );
    process.exit(1);
  }
  if (mode !== "vivid" && mode !== "muted") {
    console.error(`Unknown mode "${mode}", expected "vivid" or "muted".`);
    process.exit(1);
  }

  const scale = generateScale(hex, { mode });

  if (writeArg) {
    const filePath = writeArg.includes("=")
      ? path.resolve(writeArg.split("=")[1])
      : path.resolve(__dirname, "..", "css", "design-tokens.css");
    writeToFile(name, scale, filePath);
  } else {
    printCss(name, scale);
  }
}

main();
