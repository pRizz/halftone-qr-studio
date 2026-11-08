export type ErrorLevel = 'L' | 'M' | 'Q' | 'H';
export type DitherMode = 'floyd' | 'atkinson' | 'bayer' | 'threshold';
export type MarkProtection = 'all' | 'finders' | 'none';

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
  size: number;
  grid: number;
  center: number;
  modules: number;
  version: number;
  mask: number;
  dark: string;
  light: string;
}
