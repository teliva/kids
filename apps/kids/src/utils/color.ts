/**
 * Resolves any valid CSS color (hex, rgb, hsl, named, color-mix, ...) to RGB
 * by letting the browser's canvas paint it, rather than hand-parsing formats.
 */
export function toRgb(cssColor: string): [number, number, number] | null {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = cssColor;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return [r, g, b];
}

// WCAG relative luminance: https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
export function getRelativeLuminance(cssColor: string): number {
  const rgb = toRgb(cssColor);
  if (!rgb) return 0;

  const toLinear = (channel: number) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };

  const [r, g, b] = rgb;
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}
