import type { Picture, Result } from './types';
import { rgb } from './picture';
import { markSvg } from './marks';

function pictureCanvas(picture: Exclude<Picture, { mode: 'halftone' }>): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = picture.size;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is unavailable');
  const image = context.createImageData(picture.size, picture.size);
  image.data.set(picture.pixels);
  context.putImageData(image, 0, 0);
  return canvas;
}

export function paint(canvas: HTMLCanvasElement, result: Result, pixels: number): void {
  canvas.width = canvas.height = pixels;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is unavailable');
  context.fillStyle = result.light;
  context.fillRect(0, 0, pixels, pixels);
  if (result.picture.mode === 'halftone') {
    const source = document.createElement('canvas');
    source.width = source.height = result.size;
    const sourceContext = source.getContext('2d');
    if (!sourceContext) throw new Error('Canvas is unavailable');
    const image = sourceContext.createImageData(result.size, result.size);
    const dark = rgb(result.dark), light = rgb(result.light);
    for (let i = 0; i < result.background.length; i++) {
      const color = result.background[i] ? dark : light;
      image.data.set([color[0], color[1], color[2], 255], i * 4);
    }
    sourceContext.putImageData(image, 0, 0);
    context.imageSmoothingEnabled = false;
    context.drawImage(source, 0, 0, pixels, pixels);
  } else {
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    const inset = 4 * result.grid * pixels / result.size;
    context.drawImage(pictureCanvas(result.picture), inset, inset, pixels - 2 * inset, pixels - 2 * inset);
  }
  const scale = pixels / result.size;
  for (const mark of result.marks) {
    context.fillStyle = mark.bit ? result.dark : result.light;
    if (mark.shape === 'circle') {
      context.beginPath();
      context.arc((mark.x + mark.size / 2) * scale, (mark.y + mark.size / 2) * scale, mark.size / 2 * scale, 0, Math.PI * 2);
      context.fill();
      continue;
    }
    const x = Math.round(mark.x * scale), y = Math.round(mark.y * scale);
    context.fillRect(x, y, Math.round((mark.x + mark.size) * scale) - x, Math.round((mark.y + mark.size) * scale) - y);
  }
}

function backgroundPaths(result: Result): string {
  const paths: string[] = [];
  for (let y = 0; y < result.size; y++) {
    let x = 0;
    while (x < result.size) {
      if (!result.background[y * result.size + x]) { x++; continue; }
      const start = x;
      while (x < result.size && result.background[y * result.size + x]) x++;
      paths.push(`M${start} ${y}h${x - start}v1H${start}z`);
    }
  }
  return paths.join('');
}

export function toSvg(result: Result): string {
  const dimensions = result.picture.mode === 'halftone' ? '' : ` width="${result.picture.size}" height="${result.picture.size}"`;
  const inset = 4 * result.grid;
  const picture = result.picture.mode === 'halftone'
    ? `<path shape-rendering="crispEdges" fill="${result.dark}" d="${backgroundPaths(result)}"/>`
    : `<image x="${inset}" y="${inset}" width="${result.modules * result.grid}" height="${result.modules * result.grid}" href="${pictureCanvas(result.picture).toDataURL('image/png')}"/>`;
  const marks = result.marks.map(mark => markSvg(mark, mark.bit ? result.dark : result.light)).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg"${dimensions} viewBox="0 0 ${result.size} ${result.size}"><rect width="${result.size}" height="${result.size}" fill="${result.light}"/>${picture}${marks}</svg>`;
}

export function download(name: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
