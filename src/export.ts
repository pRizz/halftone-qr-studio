import type { Result } from './types';

export function paint(canvas: HTMLCanvasElement, result: Result, pixels: number): void {
  canvas.width = canvas.height = pixels;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is unavailable');
  const source = document.createElement('canvas');
  source.width = source.height = result.size;
  const sourceContext = source.getContext('2d');
  if (!sourceContext) throw new Error('Canvas is unavailable');
  const image = sourceContext.createImageData(result.size, result.size);
  const rgb = (hex: string) => [1, 3, 5].map(i => Number.parseInt(hex.slice(i, i + 2), 16));
  const dark = rgb(result.dark), light = rgb(result.light);
  for (let i = 0; i < result.bits.length; i++) {
    const color = result.bits[i] ? dark : light;
    image.data.set([color[0], color[1], color[2], 255], i * 4);
  }
  sourceContext.putImageData(image, 0, 0);
  context.imageSmoothingEnabled = false;
  context.drawImage(source, 0, 0, pixels, pixels);
}

export function toSvg(result: Result): string {
  const paths: string[] = [];
  for (let y = 0; y < result.size; y++) {
    let x = 0;
    while (x < result.size) {
      if (!result.bits[y * result.size + x]) { x++; continue; }
      const start = x;
      while (x < result.size && result.bits[y * result.size + x]) x++;
      paths.push(`M${start} ${y}h${x - start}v1H${start}z`);
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${result.size} ${result.size}" shape-rendering="crispEdges"><rect width="${result.size}" height="${result.size}" fill="${result.light}"/><path fill="${result.dark}" d="${paths.join('')}"/></svg>`;
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
