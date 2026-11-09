import { ditherImage } from './image';
import { isFinderRegion, isFunctionModule, makeQr } from './qr';
import { containsMark } from './marks';
import type { Picture, QrMark, Result, Settings } from './types';

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
  const background = new Uint8Array(size * size);
  const marks: QrMark[] = [];
  const protectedCells = new Uint8Array(size * size);
  const inset = (grid - settings.center) / 2;
  for (let y = 0; y < qrSize; y++) for (let x = 0; x < qrSize; x++) {
    const qrBit = qr.getModule(x, y) ? 1 : 0;
    const solid = settings.protect === 'all' && isFunctionModule(x, y, qr.version)
      || settings.protect === 'finders' && isFinderRegion(x, y, qrSize);
    const mark: QrMark = {
      x: (x + 4) * grid + (solid ? 0 : inset),
      y: (y + 4) * grid + (solid ? 0 : inset),
      size: solid ? grid : settings.center,
      shape: solid ? 'square' : settings.centerShape,
      bit: qrBit,
      softness: solid ? 0 : settings.edgeSoftness,
    };
    marks.push(mark);
    for (let dy = 0; dy < grid; dy++) for (let dx = 0; dx < grid; dx++) {
      const index = ((y + 4) * grid + dy) * size + (x + 4) * grid + dx;
      const protectedCell = containsMark(mark, (x + 4) * grid + dx + 0.5, (y + 4) * grid + dy + 0.5);
      background[index] = picture[(y * grid + dy) * qrSize * grid + x * grid + dx];
      protectedCells[index] = Number(protectedCell);
      bits[index] = protectedCell ? qrBit : background[index];
    }
  }
  return { bits, background, marks, protected: protectedCells, picture: pictureLayer, size, grid,
    center: settings.center, centerShape: settings.centerShape, modules: qrSize,
    version: qr.version, mask: qr.mask, dark: settings.dark, light: settings.light };
}

export function pictureFraction(result: Result): number {
  const area = result.center ** 2 * (result.centerShape === 'circle' ? Math.PI / 4 : 1);
  return 1 - area / result.grid ** 2;
}
