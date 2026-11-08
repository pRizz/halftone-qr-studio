import { qrcodegen } from './vendor/qrcodegen';
import type { ErrorLevel } from './types';

const levels = {
  L: qrcodegen.QrCode.Ecc.LOW,
  M: qrcodegen.QrCode.Ecc.MEDIUM,
  Q: qrcodegen.QrCode.Ecc.QUARTILE,
  H: qrcodegen.QrCode.Ecc.HIGH,
};

export function makeQr(text: string, level: ErrorLevel, minVersion: number, mask = -1) {
  const bytes = Array.from(new TextEncoder().encode(text));
  return qrcodegen.QrCode.encodeSegments(
    [qrcodegen.QrSegment.makeBytes(bytes)], levels[level], minVersion, 40, mask, false,
  );
}

function alignmentCenters(version: number): number[] {
  if (version === 1) return [];
  const count = Math.floor(version / 7) + 2;
  const step = version === 32 ? 26 : Math.ceil((version * 4 + 4) / (count * 2 - 2)) * 2;
  const centers = [6];
  for (let p = version * 4 + 10; centers.length < count; p -= step) centers.splice(1, 0, p);
  return centers;
}

export function isFinderRegion(x: number, y: number, size: number): boolean {
  return (x < 8 && y < 8) || (x >= size - 8 && y < 8) || (x < 8 && y >= size - 8);
}

export function isFunctionModule(x: number, y: number, version: number): boolean {
  const size = version * 4 + 17;
  if (isFinderRegion(x, y, size) || x === 6 || y === 6) return true;
  if ((y === 8 && (x <= 8 || x >= size - 8)) || (x === 8 && (y <= 8 || y >= size - 8))) return true;
  if (version >= 7 && ((x < 6 && y >= size - 11) || (y < 6 && x >= size - 11))) return true;
  const centers = alignmentCenters(version);
  for (const cy of centers) for (const cx of centers) {
    if ((cx === 6 && cy === 6) || (cx === 6 && cy === size - 7) || (cx === size - 7 && cy === 6)) continue;
    if (Math.abs(x - cx) <= 2 && Math.abs(y - cy) <= 2) return true;
  }
  return false;
}
