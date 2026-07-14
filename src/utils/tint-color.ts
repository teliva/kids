import { getRelativeLuminance } from "./color";

/**
 * Builds a hover-tint color-mix() expression for a base color CSS variable,
 * darkening light colors and lightening dark colors so the hover state never
 * washes out toward white or muddies toward black.
 */
export function getHoverTintColor(
  baseColor: string,
  baseColorVar: string,
  { lightenAmount = 10, darkenAmount = 10 } = {},
): string {
  const luminance = getRelativeLuminance(baseColor);

  return luminance > 0.5
    ? `color-mix(in srgb, ${baseColorVar}, #000 ${darkenAmount}%)`
    : `color-mix(in srgb, ${baseColorVar}, #fff ${lightenAmount}%)`;
}
