import { describe, expect, it } from 'vitest';
import { markDefinitions, markGradientId, markOpacity, markSvg } from '../src/marks';
import { compose } from '../src/halftone';
import { makeQr, isFunctionModule } from '../src/qr';
import { toSvg } from '../src/export';
import type { CenterShape, QrMark, Settings } from '../src/types';

const settings: Settings = {
  text: 'https://example.com/', contrast: 1, brightness: 0, zoom: 1,
  invert: false, dither: 'threshold', grid: 6, center: 2, centerShape: 'circle', edgeSoftness: 0.2,
  errorLevel: 'H', minVersion: 1, protect: 'all', fitMask: false, dark: '#000000', light: '#ffffff',
};

describe('inward edge feathering', () => {
  it.each(['circle', 'square'] as CenterShape[])('keeps the %s core opaque and feathers only inside its boundary', shape => {
    // Arrange
    const mark: QrMark = {x: 10, y: 20, size: 10, shape, bit: 1, softness: 0.2};
    // Act
    const center = markOpacity(mark, 15, 25);
    const coreEdge = markOpacity(mark, 19, 25);
    const middleRim = markOpacity(mark, 19.5, 25);
    const outerEdge = markOpacity(mark, 20, 25);
    const beyondEdge = markOpacity(mark, 20.1, 25);
    // Assert
    expect(center).toBe(1);
    expect(coreEdge).toBe(1);
    expect(middleRim).toBeCloseTo(0.5);
    expect(outerEdge).toBe(0);
    expect(beyondEdge).toBe(0);
  });

  it('multiplies the feathering from both edges at a square corner', () => {
    // Arrange
    const mark: QrMark = {x: 0, y: 0, size: 10, shape: 'square', bit: 0, softness: 0.2};
    // Act
    const corner = markOpacity(mark, 0.5, 0.5);
    // Assert
    expect(corner).toBeCloseTo(0.25);
  });

  it.each(['circle', 'square'] as CenterShape[])('supports sharp %s marks without gradient definitions', shape => {
    // Arrange
    const mark: QrMark = {x: 0, y: 0, size: 10, shape, bit: 1, softness: 0};
    // Act
    const opacity = markOpacity(mark, 9.9, 5);
    const definitions = markDefinitions(mark, '#000000');
    // Assert
    expect(opacity).toBe(1);
    expect(definitions).toBe('');
    expect(markSvg(mark, '#000000')).not.toContain('url(');
  });

  it.each(['circle', 'square'] as CenterShape[])('keeps a solid %s core at maximum softness', shape => {
    // Arrange
    const mark: QrMark = {x: 0, y: 0, size: 10, shape, bit: 0, softness: 0.5};
    // Act
    const center = markOpacity(mark, 5, 5);
    const core = markOpacity(mark, 7.5, 5);
    // Assert
    expect(center).toBe(1);
    expect(core).toBe(1);
  });

  it('leaves every protected reference module sharp while softening both dark and light data centers', () => {
    // Arrange
    const qr = makeQr(settings.text, 'H', 7);
    // Act
    const result = compose({...settings, minVersion: 7}, new Float32Array((qr.size * 6) ** 2).fill(1));
    // Assert
    for (let y = 0; y < qr.size; y++) for (let x = 0; x < qr.size; x++) {
      const mark = result.marks[y * qr.size + x];
      expect(mark.softness).toBe(isFunctionModule(x, y, qr.version) ? 0 : 0.2);
      expect(markOpacity(mark, mark.x + mark.size / 2, mark.y + mark.size / 2)).toBe(1);
    }
    for (const bit of [0, 1]) expect(result.marks.some(mark => mark.bit === bit && mark.softness === 0.2)).toBe(true);
  });

  it.each(['circle', 'square'] as CenterShape[])('shares %s SVG gradients between centers with matching color and softness', centerShape => {
    // Arrange
    const qr = makeQr(settings.text, 'H', 1);
    const result = compose({...settings, centerShape}, new Float32Array((qr.size * 6) ** 2).fill(1));
    // Act
    const svg = toSvg(result);
    // Assert
    for (const color of ['#000000', '#ffffff']) {
      const mark = result.marks.find(mark => mark.softness > 0)!;
      const id = markGradientId(mark, color);
      expect(svg.split(`id="${id}"`)).toHaveLength(2);
      expect(svg).toContain(`fill="url(#${id})"`);
    }
    expect(svg).not.toContain('<filter');
    if (centerShape === 'square') expect(svg).toContain('mask-type:alpha');
  });

  it('distinguishes SVG resources for differing colors and softness levels', () => {
    // Arrange
    const mark: QrMark = {x: 0, y: 0, size: 10, shape: 'circle', bit: 1, softness: 0.2};
    // Act
    const ids = [markGradientId(mark, '#000000'), markGradientId(mark, '#ffffff'), markGradientId({...mark, softness: 0.5}, '#000000')];
    // Assert
    expect(new Set(ids).size).toBe(3);
  });
});
