import type { QrMark } from './types';

export function containsMark(mark: QrMark, x: number, y: number): boolean {
  if (x < mark.x || y < mark.y || x >= mark.x + mark.size || y >= mark.y + mark.size) return false;
  if (mark.shape === 'square') return true;
  const radius = mark.size / 2;
  return (x - mark.x - radius) ** 2 + (y - mark.y - radius) ** 2 <= radius ** 2;
}

export function markSvg(mark: QrMark, color: string): string {
  const id = markGradientId(mark, color);
  const fill = mark.softness > 0 ? `url(#${id})` : color;
  if (mark.shape === 'circle') {
    const radius = mark.size / 2;
    return `<circle cx="${mark.x + radius}" cy="${mark.y + radius}" r="${radius}" fill="${fill}"/>`;
  }
  if (mark.softness > 0) return `<rect x="${mark.x}" y="${mark.y}" width="${mark.size}" height="${mark.size}" fill="${fill}" mask="url(#${id}-mask)"/>`;
  return `<path shape-rendering="crispEdges" fill="${color}" d="M${mark.x} ${mark.y}h${mark.size}v${mark.size}h-${mark.size}z"/>`;
}

export function markOpacity(mark: QrMark, x: number, y: number): number {
  if (!containsMark(mark, x, y)) return 0;
  if (mark.softness <= 0) return 1;
  const radius = mark.size / 2, feather = radius * mark.softness;
  const dx = Math.abs(x - mark.x - radius), dy = Math.abs(y - mark.y - radius);
  if (mark.shape === 'circle') return Math.min(1, Math.max(0, (radius - Math.hypot(dx, dy)) / feather));
  return Math.min(1, (radius - dx) / feather) * Math.min(1, (radius - dy) / feather);
}

export function markGradientId(mark: QrMark, color: string): string {
  return `qr-feather-${mark.shape}-${String(mark.softness).replace('.', '-')}-${color.slice(1)}`;
}

export function markDefinitions(mark: QrMark, color: string): string {
  if (mark.softness <= 0) return '';
  const id = markGradientId(mark, color);
  if (mark.shape === 'circle') {
    return `<radialGradient id="${id}"><stop offset="${1 - mark.softness}" stop-color="${color}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`;
  }
  const edge = mark.softness / 2;
  const stops = (fill: string) => `<stop offset="0" stop-color="${fill}" stop-opacity="0"/><stop offset="${edge}" stop-color="${fill}"/><stop offset="${1 - edge}" stop-color="${fill}"/><stop offset="1" stop-color="${fill}" stop-opacity="0"/>`;
  return `<linearGradient id="${id}">${stops(color)}</linearGradient><linearGradient id="${id}-y" x1="0" y1="0" x2="0" y2="1">${stops('#ffffff')}</linearGradient><mask id="${id}-mask" maskUnits="objectBoundingBox" maskContentUnits="objectBoundingBox" x="0" y="0" width="1" height="1" style="mask-type:alpha"><rect width="1" height="1" fill="url(#${id}-y)"/></mask>`;
}
