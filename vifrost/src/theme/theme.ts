import { palette as light } from './colors';
import { palette as dark } from './colorsDark';

export const palette = window.matchMedia('(prefers-color-scheme: dark)').matches ? dark : light;
