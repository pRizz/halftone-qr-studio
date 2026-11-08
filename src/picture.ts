import type { Settings } from './types';

export function rgb(hex: string): number[] {
  return [1, 3, 5].map(i => Number.parseInt(hex.slice(i, i + 2), 16));
}

export function adjustPicture(rgba: Uint8ClampedArray, settings: Settings, mode: 'grayscale' | 'color'): Uint8ClampedArray {
  const pixels = new Uint8ClampedArray(rgba.length);
  const dark = rgb(settings.dark), light = rgb(settings.light);
  const adjust = (value: number) => {
    const tone = Math.max(0, Math.min(1, (value / 255 - 0.5) * settings.contrast + 0.5 + settings.brightness));
    return settings.invert ? 1 - tone : tone;
  };
  for (let i = 0; i < rgba.length; i += 4) {
    const gray = adjust(rgba[i] * 0.2126 + rgba[i + 1] * 0.7152 + rgba[i + 2] * 0.0722);
    for (let channel = 0; channel < 3; channel++) {
      pixels[i + channel] = mode === 'color'
        ? adjust(rgba[i + channel]) * 255
        : dark[channel] + gray * (light[channel] - dark[channel]);
    }
    pixels[i + 3] = 255;
  }
  return pixels;
}
