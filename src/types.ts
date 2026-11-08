export type ErrorLevel = 'L' | 'M' | 'Q' | 'H';
export type DitherMode = 'floyd' | 'atkinson' | 'bayer' | 'threshold';
export type MarkProtection = 'all' | 'finders' | 'none';
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
  errorLevel: ErrorLevel;
  minVersion: number;
  protect: MarkProtection;
  fitMask: boolean;
  dark: string;
  light: string;
}

export interface Result {
  bits: Uint8Array;
  protected: Uint8Array;
  picture: Picture;
  size: number;
  grid: number;
  center: number;
  modules: number;
  version: number;
  mask: number;
  dark: string;
  light: string;
}
