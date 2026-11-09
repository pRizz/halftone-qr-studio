import { describe, expect, it } from 'vitest';
import { compose } from '../src/halftone';
import { makeQr } from '../src/qr';
import { toSvg } from '../src/export';
import jsQR from 'jsqr';
import type { Settings } from '../src/types';

const settings: Settings = { text: 'https://example.com/', contrast: 1, brightness: 0, zoom: 1,
  invert: false, dither: 'threshold', grid: 6, center: 2, centerShape: 'square', edgeSoftness: 0, errorLevel: 'H',
  minVersion: 1, protect: 'all', fitMask: false, dark: '#000000', light: '#ffffff' };

describe('halftone composition', () => {
  it('keeps every QR bit in each module center and a white quiet border', () => {
    const qr = makeQr(settings.text, settings.errorLevel, 1);
    const result = compose(settings, new Float32Array((qr.size * 6) ** 2).fill(0.8));
    for (let y = 0; y < qr.size; y++) for (let x = 0; x < qr.size; x++) {
      const actual = result.bits[((y + 4) * 6 + 2) * result.size + (x + 4) * 6 + 2];
      expect(actual).toBe(Number(qr.getModule(x, y)));
    }
    for (let x = 0; x < result.size; x++) expect(result.bits[x]).toBe(0);
  });
  it('exports an SVG with the same square dimensions and selected colors', () => {
    const qr = makeQr(settings.text, settings.errorLevel, 1);
    const result = compose({ ...settings, dark: '#123456' }, new Float32Array((qr.size * 6) ** 2).fill(1));
    expect(toSvg(result)).toContain(`viewBox="0 0 ${result.size} ${result.size}"`);
    expect(toSvg(result)).toContain('fill="#123456"');
  });
  it('produces a decodable QR code with a plain picture', () => {
    const qr = makeQr(settings.text, settings.errorLevel, 1);
    const result = compose(settings, new Float32Array((qr.size * 6) ** 2).fill(1));
    const scale = 4;
    const width = result.size * scale;
    const pixels = new Uint8ClampedArray(width * width * 4);
    for (let y = 0; y < width; y++) for (let x = 0; x < width; x++) {
      const value = result.bits[Math.floor(y / scale) * result.size + Math.floor(x / scale)] ? 0 : 255;
      const offset = (y * width + x) * 4;
      pixels.set([value, value, value, 255], offset);
    }
    expect(jsQR(pixels, width, width)?.data).toBe(settings.text);
  });
});
