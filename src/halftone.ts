import { ditherImage } from './image';
import { isFinderRegion, isFunctionModule, makeQr } from './qr';
import type { Picture, Result, Settings } from './types';

export function compose(settings: Settings, grays: Float32Array, pictureLayer: Picture = { mode: 'halftone' }): Result {
  if (!settings.text) throw new Error('Enter text or a link to encode.');
  const qrSize = makeQr(settings.text, settings.errorLevel, settings.minVersion).size;
  const grid = settings.grid;
  if (grays.length !== (qrSize * grid) ** 2) throw new Error('Image sample size does not match the QR grid.');
  let qr = makeQr(settings.text, settings.errorLevel, settings.minVersion);
  if (settings.fitMask) {
    let bestScore = Infinity;
    for (let mask = 0; mask < 8; mask++) {
      const candidate = makeQr(settings.text, settings.errorLevel, settings.minVersion, mask);
      let score = 0;
      for (let y = 0; y < qrSize; y++) for (let x = 0; x < qrSize; x++) {
        if (isFunctionModule(x, y, candidate.version)) continue;
        let sum = 0;
        for (let dy = 0; dy < grid; dy++) for (let dx = 0; dx < grid; dx++) {
          sum += grays[(y * grid + dy) * qrSize * grid + x * grid + dx];
        }
        if (candidate.getModule(x, y) !== (sum / (grid * grid) < 0.5)) score++;
      }
      if (score < bestScore) { bestScore = score; qr = candidate; }
    }
  }
  const picture = ditherImage(grays, qrSize * grid, settings.dither);
  const size = (qrSize + 8) * grid;
  const bits = new Uint8Array(size * size);
  const protectedCells = new Uint8Array(size * size);
  const inset = (grid - settings.center) / 2;
  for (let y = 0; y < qrSize; y++) for (let x = 0; x < qrSize; x++) {
    const qrBit = qr.getModule(x, y) ? 1 : 0;
    const solid = settings.protect === 'all' && isFunctionModule(x, y, qr.version)
      || settings.protect === 'finders' && isFinderRegion(x, y, qrSize);
    for (let dy = 0; dy < grid; dy++) for (let dx = 0; dx < grid; dx++) {
      const center = dx >= inset && dx < inset + settings.center && dy >= inset && dy < inset + settings.center;
      const index = ((y + 4) * grid + dy) * size + (x + 4) * grid + dx;
      protectedCells[index] = Number(solid || center);
      bits[index] = solid || center
        ? qrBit : picture[(y * grid + dy) * qrSize * grid + x * grid + dx];
    }
  }
  return { bits, protected: protectedCells, picture: pictureLayer, size, grid, center: settings.center, modules: qrSize,
    version: qr.version, mask: qr.mask, dark: settings.dark, light: settings.light };
}

export function pictureFraction(result: Result): number {
  return 1 - result.center ** 2 / result.grid ** 2;
}
