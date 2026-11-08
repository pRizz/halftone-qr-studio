import jsQR from 'jsqr';
import { paint, toSvg, download } from './export';
import { compose, pictureFraction } from './halftone';
import { sampleImage, samplePicture } from './image';
import { makeQr } from './qr';
import type { DitherMode, ErrorLevel, MarkProtection, PictureMode, Result, Settings } from './types';
import sampleUrl from './sample.svg?url';
import './style.css';

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <header class="site-header"><div class="shell header-inner"><div class="brand-mark" aria-hidden="true">▦</div><div><div class="eyebrow">IMAGE + CODE</div><h1>Halftone QR Studio</h1></div><a class="source-link" href="https://lucerojc.github.io/halftone-qr/" target="_blank" rel="noopener">Original inspiration ↗</a></div></header>
  <main class="shell layout">
    <section class="card controls" aria-label="QR settings">
      <div class="section-title"><span>01</span><div><h2>Content</h2><p>What should the code open?</p></div></div>
      <label for="text">Text or link</label><textarea id="text" rows="3" spellcheck="false">https://github.com/pRizz/halftone-qr-studio</textarea><div class="small right" id="count"></div>
      <div class="section-title spaced"><span>02</span><div><h2>Picture</h2><p>Choose an image to weave into the modules.</p></div></div>
      <label class="drop" id="drop" for="file" tabindex="0"><img id="thumb" alt="Selected picture preview"/><span><strong id="drop-title">Choose or drop a picture</strong><small>Paste an image anywhere on the page, too</small></span></label><input id="file" type="file" accept="image/*" hidden/>
      <div class="sliders"><label for="contrast">Contrast <output id="contrast-out"></output></label><input id="contrast" type="range" min="0.4" max="3" step="0.05" value="1.3"/>
      <label for="brightness">Brightness <output id="brightness-out"></output></label><input id="brightness" type="range" min="-0.5" max="0.5" step="0.01" value="0"/>
      <label for="zoom">Zoom <output id="zoom-out"></output></label><input id="zoom" type="range" min="1" max="3" step="0.05" value="1"/></div>
      <label for="pictureMode">Picture mode</label><select id="pictureMode" aria-describedby="picture-mode-hint"><option value="halftone">Halftone · black and white</option><option value="grayscale">Smooth grayscale</option><option value="color">Smooth color</option></select>
      <p class="small" id="picture-mode-hint">Dithered cells surround each protected QR center.</p>
      <div class="two-col"><div><label for="dither">Dithering</label><select id="dither"><option value="floyd">Floyd–Steinberg</option><option value="atkinson">Atkinson</option><option value="bayer">Ordered Bayer</option><option value="threshold">Threshold</option></select></div><div><label for="grid">Module grid</label><select id="grid"><option value="6,2">6 × 6 · center 2 × 2</option><option value="3,1">3 × 3 · center 1 × 1</option><option value="5,1">5 × 5 · center 1 × 1</option><option value="5,3">5 × 5 · center 3 × 3</option></select></div></div>
      <label class="check"><input id="invert" type="checkbox"/> Invert picture tones</label>
      <div class="section-title spaced"><span>03</span><div><h2>QR code</h2><p>Balance the picture with scan reliability.</p></div></div>
      <div class="two-col"><div><label for="errorLevel">Error correction</label><select id="errorLevel"><option value="H">High · 30%</option><option value="Q">Quartile · 25%</option><option value="M">Medium · 15%</option><option value="L">Low · 7%</option></select></div><div><label for="minVersion">Minimum version</label><select id="minVersion"><option value="1">Automatic</option></select></div></div>
      <div class="small" id="photo-hint" hidden></div>
      <label for="protect">Reference marks</label><select id="protect"><option value="all">All solid · most reliable</option><option value="finders">Corner squares only</option><option value="none">None · most picture</option></select>
      <label class="check"><input id="fitMask" type="checkbox" checked/> Fit QR mask to picture</label>
      <div class="two-col colors"><label for="dark">Dark color <input id="dark" type="color" value="#000000"/></label><label for="light">Light color <input id="light" type="color" value="#ffffff"/></label></div>
    </section>
    <section class="card output" aria-label="Generated QR code">
      <div class="output-top"><div><div class="eyebrow">LIVE PREVIEW</div><h2>Your code</h2></div><span class="local-badge">● Local processing</span></div>
      <div class="canvas-wrap"><canvas id="preview" aria-label="Generated QR code preview"></canvas></div>
      <p id="error" class="error" role="alert" hidden></p><p id="scan" class="scan" role="status">Generating code…</p>
      <div class="stats"><div><b id="version-stat">–</b><span>Version</span></div><div><b id="module-stat">–</b><span>Modules</span></div><div><b id="picture-stat">–</b><span>Picture area</span></div><div><b id="mask-stat">–</b><span>Mask</span></div></div>
      <div class="export"><label for="exportSize">Image resolution</label><select id="exportSize" aria-describedby="resolution-hint"><option value="1024">1024 px</option><option value="2048" selected>2048 px</option><option value="4096">4096 px</option></select><button id="downloadPng" class="primary">Download PNG</button><button id="downloadSvg">Download SVG</button><button id="copySvg">Copy SVG</button></div>
      <p class="small" id="resolution-hint">Sets PNG size and embedded picture detail in smooth SVG exports.</p>
      <details><summary>How does it work?</summary><p>Each QR module's center keeps its required QR bit. Halftone fills the surroundings with dithered cells; smooth modes keep a detailed grayscale or color picture underneath crisp QR centers and protected reference marks. The quiet border stays clear. Smooth SVGs embed the picture and keep the QR marks as vector shapes. Scan the exported file with a phone before printing.</p></details>
    </section>
  </main>
  <footer class="shell footer">An independent implementation inspired by <a href="https://lucerojc.github.io/halftone-qr/">Jorge C. Lucero’s Halftone QR</a>. The underlying approach also appears in <a href="https://erikdemaine.org/prints/QR/">Erik and Martin Demaine’s QR prints</a>. Your pictures stay in this browser. <a href="https://github.com/pRizz/halftone-qr-studio">Source code</a>.</footer>`;

function el<T extends HTMLElement>(id: string): T { return document.getElementById(id) as T; }
const preview = el<HTMLCanvasElement>('preview');
const image = new Image();
let currentImage: HTMLImageElement | null = null;
let result: Result | null = null;
let imageUrl: string | null = null;
let timer: number | undefined;
let scanGeneration = 0;
let versionTouched = false;

for (let version = 2; version <= 40; version++) {
  const option = document.createElement('option'); option.value = String(version);
  option.textContent = `Version ${version} · ${version * 4 + 17} modules`;
  el<HTMLSelectElement>('minVersion').append(option);
}

function settings(): Settings {
  const [grid, center] = el<HTMLSelectElement>('grid').value.split(',').map(Number);
  return {
    text: el<HTMLTextAreaElement>('text').value,
    contrast: Number(el<HTMLInputElement>('contrast').value),
    brightness: Number(el<HTMLInputElement>('brightness').value),
    zoom: Number(el<HTMLInputElement>('zoom').value),
    invert: el<HTMLInputElement>('invert').checked,
    dither: el<HTMLSelectElement>('dither').value as DitherMode,
    grid, center,
    errorLevel: el<HTMLSelectElement>('errorLevel').value as ErrorLevel,
    minVersion: Number(el<HTMLSelectElement>('minVersion').value),
    protect: el<HTMLSelectElement>('protect').value as MarkProtection,
    fitMask: el<HTMLInputElement>('fitMask').checked,
    dark: el<HTMLInputElement>('dark').value,
    light: el<HTMLInputElement>('light').value,
  };
}

async function checkScan(generation: number, expected: string): Promise<void> {
  const status = el<HTMLParagraphElement>('scan');
  try {
    type Detector = { detect(source: HTMLCanvasElement): Promise<Array<{rawValue: string}>> };
    type DetectorConstructor = { new(options: {formats: string[]}): Detector; getSupportedFormats(): Promise<string[]> };
    const detectorType = (window as Window & { BarcodeDetector?: DetectorConstructor }).BarcodeDetector;
    if (detectorType && (await detectorType.getSupportedFormats()).includes('qr_code')) {
      const matches = await new detectorType({ formats: ['qr_code'] }).detect(preview);
      if (generation !== scanGeneration) return;
      if (matches.some(item => item.rawValue === expected)) { status.textContent = '✓ Browser scanner decoded the preview.'; status.className = 'scan success'; return; }
    }
    const context = preview.getContext('2d', { willReadFrequently: true });
    if (!context) return;
    const pixels = context.getImageData(0, 0, preview.width, preview.height);
    const decoded = jsQR(pixels.data, pixels.width, pixels.height, { inversionAttempts: 'attemptBoth' });
    if (generation !== scanGeneration) return;
    status.textContent = decoded?.data === expected ? '✓ Built-in scanner decoded the preview.' : 'Preview could not be verified. Test the exported code with your phone.';
    status.className = decoded?.data === expected ? 'scan success' : 'scan warning';
  } catch {
    if (generation === scanGeneration) { status.textContent = 'Scan check unavailable. Test the exported code with your phone.'; status.className = 'scan warning'; }
  }
}

function render(): void {
  const s = settings();
  const pictureMode = el<HTMLSelectElement>('pictureMode').value as PictureMode;
  const smooth = pictureMode !== 'halftone';
  el<HTMLSelectElement>('dither').disabled = smooth;
  preview.classList.toggle('smooth-picture', smooth);
  el<HTMLElement>('picture-mode-hint').textContent = smooth
    ? 'Keeps image detail between crisp QR centers. Scan-check your export; more detail can affect readability.'
    : 'Dithered cells surround each protected QR center.';
  el<HTMLElement>('count').textContent = `${new TextEncoder().encode(s.text).length} bytes`;
  for (const id of ['contrast', 'brightness', 'zoom']) el<HTMLOutputElement>(`${id}-out`).value = Number(el<HTMLInputElement>(id).value).toFixed(2) + (id === 'zoom' ? '×' : '');
  const error = el<HTMLParagraphElement>('error'); error.hidden = true;
  try {
    const qr = makeQr(s.text, s.errorLevel, s.minVersion);
    const resolution = Number(el<HTMLSelectElement>('exportSize').value);
    const picture = samplePicture(currentImage, resolution, s, pictureMode);
    result = compose(s, sampleImage(currentImage, qr.size * s.grid, s), picture);
    paint(preview, result, 1024);
    el<HTMLElement>('version-stat').textContent = `${result.version} · ${s.errorLevel}`;
    el<HTMLElement>('module-stat').textContent = `${result.modules} × ${result.modules}`;
    el<HTMLElement>('picture-stat').textContent = `${Math.round(100 * pictureFraction(result))}%`;
    el<HTMLElement>('mask-stat').textContent = String(result.mask) + (s.fitMask ? ' fitted' : '');
    const generation = ++scanGeneration;
    el<HTMLElement>('scan').textContent = 'Checking whether the code scans…';
    el<HTMLElement>('scan').className = 'scan';
    window.setTimeout(() => checkScan(generation, s.text), 250);
  } catch (cause) {
    result = null;
    error.textContent = cause instanceof Error ? cause.message : 'Could not generate this code.';
    error.hidden = false;
    el<HTMLElement>('scan').textContent = 'Adjust the settings to generate a code.';
  }
}

function queueRender(): void { clearTimeout(timer); timer = window.setTimeout(render, 100); }

function loadFile(file?: File): void {
  if (!file) return;
  if (!file.type.startsWith('image/')) { el<HTMLElement>('error').textContent = 'Choose an image file.'; el<HTMLElement>('error').hidden = false; return; }
  const url = URL.createObjectURL(file);
  const next = new Image();
  next.onload = () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    imageUrl = url; currentImage = next;
    el<HTMLImageElement>('thumb').src = url;
    el<HTMLElement>('drop-title').textContent = file.name;
    if (!versionTouched) {
      const small = sampleImage(next, 64, { ...settings(), contrast: 1, brightness: 0 });
      const midtones = small.filter(value => value > 0.2 && value < 0.8).length / small.length;
      const photo = midtones > 0.3;
      el<HTMLSelectElement>('minVersion').value = photo ? '12' : '1';
      const hint = el<HTMLElement>('photo-hint');
      hint.hidden = !photo;
      hint.textContent = photo ? 'Photo detected: starting at version 12 for more picture detail. You can change this.' : '';
    }
    render();
  };
  next.onerror = () => { URL.revokeObjectURL(url); el<HTMLElement>('error').textContent = 'Could not read that picture.'; el<HTMLElement>('error').hidden = false; };
  next.src = url;
}

el<HTMLInputElement>('file').addEventListener('change', event => loadFile((event.target as HTMLInputElement).files?.[0]));
el<HTMLElement>('drop').addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); el<HTMLInputElement>('file').click(); } });
el<HTMLElement>('drop').addEventListener('dragover', event => { event.preventDefault(); el<HTMLElement>('drop').classList.add('dragging'); });
el<HTMLElement>('drop').addEventListener('dragleave', () => el<HTMLElement>('drop').classList.remove('dragging'));
el<HTMLElement>('drop').addEventListener('drop', event => { event.preventDefault(); el<HTMLElement>('drop').classList.remove('dragging'); loadFile(event.dataTransfer?.files[0]); });
document.addEventListener('paste', event => { const item = Array.from(event.clipboardData?.items ?? []).find(entry => entry.type.startsWith('image/')); if (item) loadFile(item.getAsFile() ?? undefined); });
el<HTMLSelectElement>('minVersion').addEventListener('change', () => { versionTouched = true; el<HTMLElement>('photo-hint').hidden = true; });
for (const id of ['text', 'contrast', 'brightness', 'zoom', 'invert', 'pictureMode', 'exportSize', 'dither', 'grid', 'errorLevel', 'minVersion', 'protect', 'fitMask', 'dark', 'light']) el<HTMLElement>(id).addEventListener('input', queueRender);
el<HTMLButtonElement>('downloadSvg').addEventListener('click', () => { if (result) download(`halftone-qr-v${result.version}.svg`, new Blob([toSvg(result)], { type: 'image/svg+xml' })); });
el<HTMLButtonElement>('downloadPng').addEventListener('click', () => { if (!result) return; const canvas = document.createElement('canvas'); paint(canvas, result, Number(el<HTMLSelectElement>('exportSize').value)); canvas.toBlob(blob => { if (blob) download(`halftone-qr-v${result!.version}.png`, blob); }, 'image/png'); });
el<HTMLButtonElement>('copySvg').addEventListener('click', async () => { if (!result) return; const button = el<HTMLButtonElement>('copySvg'); try { await navigator.clipboard.writeText(toSvg(result)); button.textContent = 'Copied!'; } catch { button.textContent = 'Copy failed'; } window.setTimeout(() => button.textContent = 'Copy SVG', 1600); });
image.onload = () => { currentImage = image; el<HTMLImageElement>('thumb').src = sampleUrl; el<HTMLElement>('drop-title').textContent = 'Sample landscape · replace it'; render(); };
image.src = sampleUrl;
render();
