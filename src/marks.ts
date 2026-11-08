import type { QrMark } from './types';

export function containsMark(mark: QrMark, x: number, y: number): boolean {
  if (x < mark.x || y < mark.y || x >= mark.x + mark.size || y >= mark.y + mark.size) return false;
  if (mark.shape === 'square') return true;
  const radius = mark.size / 2;
  return (x - mark.x - radius) ** 2 + (y - mark.y - radius) ** 2 <= radius ** 2;
}

export function markSvg(mark: QrMark, color: string): string {
  if (mark.shape === 'circle') {
    const radius = mark.size / 2;
    return `<circle cx="${mark.x + radius}" cy="${mark.y + radius}" r="${radius}" fill="${color}"/>`;
  }
  return `<path shape-rendering="crispEdges" fill="${color}" d="M${mark.x} ${mark.y}h${mark.size}v${mark.size}h-${mark.size}z"/>`;
}
