import type { QrMark } from './types';
import { rgb } from './picture';

function edgeGradient(context: CanvasRenderingContext2D, size: number, color: string, softness: number, vertical: boolean): CanvasGradient {
  const gradient = context.createLinearGradient(0, 0, vertical ? 0 : size, vertical ? size : 0);
  const transparent = `rgba(${rgb(color).join(',')},0)`;
  gradient.addColorStop(0, transparent);
  gradient.addColorStop(softness / 2, color);
  gradient.addColorStop(1 - softness / 2, color);
  gradient.addColorStop(1, transparent);
  return gradient;
}

function softSquare(size: number, color: string, softness: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = Math.max(16, Math.ceil(size));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is unavailable');
  context.fillStyle = edgeGradient(context, canvas.width, color, softness, false);
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.globalCompositeOperation = 'destination-in';
  context.fillStyle = edgeGradient(context, canvas.width, '#ffffff', softness, true);
  context.fillRect(0, 0, canvas.width, canvas.height);
  return canvas;
}

export function paintMarks(context: CanvasRenderingContext2D, marks: QrMark[], scale: number, dark: string, light: string): void {
  const squares = new Map<string, HTMLCanvasElement>();
  for (const mark of marks) {
    const color = mark.bit ? dark : light;
    context.fillStyle = color;
    const x = mark.x * scale, y = mark.y * scale, size = mark.size * scale;
    if (mark.shape === 'circle') {
      const radius = size / 2, cx = x + radius, cy = y + radius;
      if (mark.softness > 0) {
        const gradient = context.createRadialGradient(cx, cy, radius * (1 - mark.softness), cx, cy, radius);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, `rgba(${rgb(color).join(',')},0)`);
        context.fillStyle = gradient;
      }
      context.beginPath();
      context.arc(cx, cy, radius, 0, Math.PI * 2);
      context.fill();
      continue;
    }
    if (mark.softness > 0) {
      const key = `${size}-${mark.softness}-${color}`;
      if (!squares.has(key)) squares.set(key, softSquare(size, color, mark.softness));
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      context.drawImage(squares.get(key)!, x, y, size, size);
      continue;
    }
    const left = Math.round(x), top = Math.round(y);
    context.fillRect(left, top, Math.round(x + size) - left, Math.round(y + size) - top);
  }
}
