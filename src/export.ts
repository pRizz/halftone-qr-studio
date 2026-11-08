import type { Picture, Result } from './types';
import { rgb } from './picture';

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
  const source = document.createElement('canvas');
  source.width = source.height = result.size;
  const sourceContext = source.getContext('2d');
  if (!sourceContext) throw new Error('Canvas is unavailable');
  const image = sourceContext.createImageData(result.size, result.size);
  const dark = rgb(result.dark), light = rgb(result.light);
  for (let i = 0; i < result.bits.length; i++) {
    if (result.picture.mode !== 'halftone' && !result.protected[i]) continue;
    const color = result.bits[i] ? dark : light;
    image.data.set([color[0], color[1], color[2], 255], i * 4);
  }
  sourceContext.putImageData(image, 0, 0);
  if (result.picture.mode !== 'halftone') {
    context.fillStyle = result.light;
    context.fillRect(0, 0, pixels, pixels);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    const inset = 4 * result.grid * pixels / result.size;
    context.drawImage(pictureCanvas(result.picture), inset, inset, pixels - 2 * inset, pixels - 2 * inset);
  }
  context.imageSmoothingEnabled = false;
  context.drawImage(source, 0, 0, pixels, pixels);
}

function pathsFor(result: Result, bit: number, protectedOnly: boolean): string {
  const paths: string[] = [];
  const matches = (index: number) => result.bits[index] === bit && (!protectedOnly || result.protected[index] === 1);
  for (let y = 0; y < result.size; y++) {
    let x = 0;
    while (x < result.size) {
      if (!matches(y * result.size + x)) { x++; continue; }
      const start = x;
      while (x < result.size && matches(y * result.size + x)) x++;
      paths.push(`M${start} ${y}h${x - start}v1H${start}z`);
    }
  }
  return paths.join('');
}

export function toSvg(result: Result): string {
  const smooth = result.picture.mode !== 'halftone';
  const dimensions = result.picture.mode === 'halftone' ? '' : ` width="${result.picture.size}" height="${result.picture.size}"`;
  const inset = 4 * result.grid;
  const picture = result.picture.mode === 'halftone' ? ''
    : `<image x="${inset}" y="${inset}" width="${result.modules * result.grid}" height="${result.modules * result.grid}" href="${pictureCanvas(result.picture).toDataURL('image/png')}"/>`;
  const light = smooth ? `<path fill="${result.light}" d="${pathsFor(result, 0, true)}"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg"${dimensions} viewBox="0 0 ${result.size} ${result.size}"><rect width="${result.size}" height="${result.size}" fill="${result.light}"/>${picture}<g shape-rendering="crispEdges">${light}<path fill="${result.dark}" d="${pathsFor(result, 1, smooth)}"/></g></svg>`;
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
