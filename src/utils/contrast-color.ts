import { getRelativeLuminance } from "./color";

function contrastRatio(luminanceA: number, luminanceB: number): number {
  const lighter = Math.max(luminanceA, luminanceB);
  const darker = Math.min(luminanceA, luminanceB);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Picks whichever of black or white has the higher WCAG contrast ratio
 * against the given background color.
 */
export function getContrastTextColor(
  backgroundColor: string,
): "#000000" | "#ffffff" {
  const bgLuminance = getRelativeLuminance(backgroundColor);
  const contrastWithBlack = contrastRatio(bgLuminance, 0);
  const contrastWithWhite = contrastRatio(bgLuminance, 1);

  return contrastWithBlack >= contrastWithWhite ? "#000000" : "#ffffff";
}
