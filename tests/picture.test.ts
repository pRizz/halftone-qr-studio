import { describe, expect, it } from 'vitest';
import { adjustPicture } from '../src/picture';
import { compose } from '../src/halftone';
import { isFunctionModule, makeQr } from '../src/qr';
import type { Settings } from '../src/types';

const settings: Settings = {
  text: 'https://example.com/', contrast: 1, brightness: 0, zoom: 1,
  invert: false, dither: 'threshold', grid: 6, center: 2, centerShape: 'square', errorLevel: 'H',
  minVersion: 1, protect: 'all', fitMask: true, dark: '#000000', light: '#ffffff',
};

describe('smooth pictures', () => {
  it('keeps original color values at neutral settings', () => {
    // Arrange
    const source = new Uint8ClampedArray([237, 81, 19, 255, 12, 129, 211, 255]);
    // Act
    const output = adjustPicture(source, settings, 'color');
    // Assert
    expect(output).toEqual(source);
    expect(output).not.toBe(source);
  });

  it('preserves continuous grayscale tones rather than thresholding them', () => {
    // Arrange
    const source = new Uint8ClampedArray([32, 32, 32, 255, 96, 96, 96, 255, 192, 192, 192, 255]);
    // Act
    const output = adjustPicture(source, settings, 'grayscale');
    // Assert
    expect(output).toEqual(source);
  });

  it('maps grayscale luminance to the selected dark and light colors', () => {
    // Arrange
    const source = new Uint8ClampedArray([255, 0, 0, 255]);
    // Act
    const output = adjustPicture(source, { ...settings, dark: '#204060', light: '#e0c0a0' }, 'grayscale');
    // Assert
    expect(output).toEqual(new Uint8ClampedArray([73, 91, 110, 255]));
  });

  it.each(['color', 'grayscale'] as const)('applies tone controls and inversion to %s', mode => {
    // Arrange
    const source = new Uint8ClampedArray([96, 96, 96, 255]);
    // Act
    const output = adjustPicture(source, { ...settings, contrast: 2, brightness: 0.1, invert: true }, mode);
    // Assert
    expect(output).toEqual(new Uint8ClampedArray([165, 165, 165, 255]));
  });

  it.each([[6, 2], [3, 1], [5, 1], [5, 3]])('protects QR centers and full reference modules with grid %i, center %i', (grid, center) => {
    // Arrange
    const config = { ...settings, grid, center };
    const size = makeQr(config.text, config.errorLevel, 1).size;
    const picture = { mode: 'color' as const, size: 2, pixels: new Uint8ClampedArray(16).fill(128) };
    // Act
    const result = compose(config, new Float32Array((size * grid) ** 2).fill(0.4), picture);
    const qr = makeQr(config.text, config.errorLevel, result.version, result.mask);
    // Assert
    expect(result.picture).toBe(picture);
    const inset = (grid - center) / 2;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      for (let dy = 0; dy < grid; dy++) for (let dx = 0; dx < grid; dx++) {
        const index = ((y + 4) * grid + dy) * result.size + (x + 4) * grid + dx;
        const protectedCell = isFunctionModule(x, y, qr.version)
          || dx >= inset && dx < inset + center && dy >= inset && dy < inset + center;
        expect(result.protected[index]).toBe(Number(protectedCell));
        if (protectedCell) expect(result.bits[index]).toBe(Number(qr.getModule(x, y)));
      }
    }
  });
});
