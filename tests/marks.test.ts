import { describe, expect, it } from 'vitest';
import { compose, pictureFraction } from '../src/halftone';
import { containsMark } from '../src/marks';
import { makeQr, isFinderRegion, isFunctionModule } from '../src/qr';
import { toSvg } from '../src/export';
import type { MarkProtection, Settings } from '../src/types';

const settings: Settings = {
  text: 'https://example.com/', contrast: 1, brightness: 0, zoom: 1,
  invert: false, dither: 'threshold', grid: 6, center: 2, centerShape: 'circle',
  errorLevel: 'H', minVersion: 1, protect: 'all', fitMask: false,
  dark: '#000000', light: '#ffffff',
};

describe('QR center shapes', () => {
  it.each([[6, 2], [3, 1], [5, 1], [5, 3]])('centers circles on the QR sampling points for grid %i and center %i', (grid, center) => {
    // Arrange
    const qr = makeQr(settings.text, settings.errorLevel, 1);
    // Act
    const result = compose({ ...settings, grid, center }, new Float32Array((qr.size * grid) ** 2).fill(0.5));
    // Assert
    expect(result.marks).toHaveLength(qr.size ** 2);
    for (let y = 0; y < qr.size; y++) for (let x = 0; x < qr.size; x++) {
      const mark = result.marks[y * qr.size + x];
      expect(mark.bit).toBe(Number(qr.getModule(x, y)));
      expect(mark.x + mark.size / 2).toBe((x + 4.5) * grid);
      expect(mark.y + mark.size / 2).toBe((y + 4.5) * grid);
      expect(containsMark(mark, mark.x + mark.size / 2, mark.y + mark.size / 2)).toBe(true);
      if (isFunctionModule(x, y, qr.version)) {
        expect(mark.shape).toBe('square');
        expect(mark.size).toBe(grid);
        continue;
      }
      expect(mark.shape).toBe('circle');
      expect(mark.size).toBe(center);
      expect(containsMark(mark, mark.x + 0.01, mark.y + 0.01)).toBe(false);
    }
  });

  it.each(['all', 'finders', 'none'] as MarkProtection[])('respects the %s reference protection setting', protect => {
    // Arrange
    const qr = makeQr(settings.text, settings.errorLevel, 7);
    // Act
    const result = compose({ ...settings, minVersion: 7, protect }, new Float32Array((qr.size * settings.grid) ** 2).fill(1));
    // Assert
    for (let y = 0; y < qr.size; y++) for (let x = 0; x < qr.size; x++) {
      const solid = protect === 'all' && isFunctionModule(x, y, qr.version)
        || protect === 'finders' && isFinderRegion(x, y, qr.size);
      expect(result.marks[y * qr.size + x].shape).toBe(solid ? 'square' : 'circle');
    }
  });

  it('exports separate vector circles and square reference marks in both QR colors', () => {
    // Arrange
    const qr = makeQr(settings.text, settings.errorLevel, 1);
    const result = compose(settings, new Float32Array((qr.size * settings.grid) ** 2).fill(1));
    // Act
    const svg = toSvg(result);
    // Assert
    expect(svg.match(/<circle /g)).toHaveLength(result.marks.filter(mark => mark.shape === 'circle').length);
    for (const bit of [0, 1]) {
      const circle = result.marks.find(mark => mark.shape === 'circle' && mark.bit === bit)!;
      expect(svg).toContain(`<circle cx="${circle.x + circle.size / 2}" cy="${circle.y + circle.size / 2}" r="${circle.size / 2}" fill="${bit ? settings.dark : settings.light}"/>`);
    }
    expect(svg).toContain('shape-rendering="crispEdges"');
  });

  it('keeps square centers available and includes square corners', () => {
    // Arrange
    const qr = makeQr(settings.text, settings.errorLevel, 1);
    // Act
    const result = compose({ ...settings, centerShape: 'square' }, new Float32Array((qr.size * settings.grid) ** 2).fill(1));
    // Assert
    expect(toSvg(result)).not.toContain('<circle');
    expect(result.marks.every(mark => mark.shape === 'square')).toBe(true);
    expect(containsMark(result.marks[0], result.marks[0].x + 0.01, result.marks[0].y + 0.01)).toBe(true);
    expect(containsMark(result.marks[0], result.marks[0].x - 0.01, result.marks[0].y)).toBe(false);
  });

  it('accounts for the smaller protected area of circles in the picture-area estimate', () => {
    // Arrange
    const qr = makeQr(settings.text, settings.errorLevel, 1);
    const samples = new Float32Array((qr.size * settings.grid) ** 2).fill(1);
    // Act
    const circle = pictureFraction(compose(settings, samples));
    const square = pictureFraction(compose({ ...settings, centerShape: 'square' }, samples));
    // Assert
    expect(circle).toBeCloseTo(1 - Math.PI / 36);
    expect(square).toBeCloseTo(1 - 4 / 36);
    expect(circle).toBeGreaterThan(square);
  });
});
