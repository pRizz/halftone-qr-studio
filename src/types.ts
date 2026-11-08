export type ErrorLevel = 'L' | 'M' | 'Q' | 'H';
export type DitherMode = 'floyd' | 'atkinson' | 'bayer' | 'threshold';
export type MarkProtection = 'all' | 'finders' | 'none';
export type CenterShape = 'circle' | 'square';
export interface QrMark {
  x: number;
  y: number;
  size: number;
  shape: CenterShape;
  bit: 0 | 1;
}
export type PictureMode = 'halftone' | 'grayscale' | 'color';
export type Picture = { mode: 'halftone' } | {
  mode: 'grayscale' | 'color';
  pixels: Uint8ClampedArray;
  size: number;
};

export interface Settings {
  text: string;
  contrast: number;
  brightness: number;
  zoom: number;
  invert: boolean;
  dither: DitherMode;
  grid: number;
  center: number;
  centerShape: CenterShape;
  errorLevel: ErrorLevel;
  minVersion: number;
  protect: MarkProtection;
  fitMask: boolean;
  dark: string;
  light: string;
}

export interface Result {
  // Subcell samples of the composite and protection mask; marks retain exact geometry.
  bits: Uint8Array;
  protected: Uint8Array;
  background: Uint8Array;
  marks: QrMark[];
  picture: Picture;
  size: number;
  grid: number;
  center: number;
  centerShape: CenterShape;
  modules: number;
  version: number;
  mask: number;
  dark: string;
  light: string;
}
