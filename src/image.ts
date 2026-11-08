import type { DitherMode, Settings } from './types';

export function sampleImage(image: HTMLImageElement | null, size: number, settings: Settings): Float32Array {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Canvas is unavailable');
  context.fillStyle = '#fff';
  context.fillRect(0, 0, size, size);
  if (image) {
    const width = image.naturalWidth;
    const height = image.naturalHeight;
    const scale = Math.max(size / width, size / height) * settings.zoom;
    context.drawImage(image, (size - width * scale) / 2, (size - height * scale) / 2, width * scale, height * scale);
  }
  const rgba = context.getImageData(0, 0, size, size).data;
  const values = new Float32Array(size * size);
  for (let i = 0; i < values.length; i++) {
    const j = i * 4;
    let gray = (rgba[j] * 0.2126 + rgba[j + 1] * 0.7152 + rgba[j + 2] * 0.0722) / 255;
    gray = Math.max(0, Math.min(1, (gray - 0.5) * settings.contrast + 0.5 + settings.brightness));
    values[i] = settings.invert ? 1 - gray : gray;
  }
  return values;
}

const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

export function ditherImage(grays: Float32Array, width: number, mode: DitherMode): Uint8Array {
  const work = new Float32Array(grays);
  const bits = new Uint8Array(work.length);
  const spread = (x: number, y: number, delta: number, weight: number) => {
    if (x >= 0 && x < width && y >= 0 && y < width) work[y * width + x] += delta * weight;
  };
  for (let y = 0; y < width; y++) for (let x = 0; x < width; x++) {
    const i = y * width + x;
    const threshold = mode === 'bayer' ? (bayer[(y % 4) * 4 + x % 4] + 0.5) / 16 : 0.5;
    bits[i] = work[i] < threshold ? 1 : 0;
    if (mode === 'floyd') {
      const error = work[i] - (bits[i] ? 0 : 1);
      spread(x + 1, y, error, 7 / 16);
      spread(x - 1, y + 1, error, 3 / 16);
      spread(x, y + 1, error, 5 / 16);
      spread(x + 1, y + 1, error, 1 / 16);
    } else if (mode === 'atkinson') {
      const error = (work[i] - (bits[i] ? 0 : 1)) / 8;
      for (const [dx, dy] of [[1, 0], [2, 0], [-1, 1], [0, 1], [1, 1], [0, 2]]) spread(x + dx, y + dy, error, 1);
    }
  }
  return bits;
}
