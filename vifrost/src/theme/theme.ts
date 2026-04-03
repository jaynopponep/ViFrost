// apply stored or system theme preference before first render
const stored = localStorage.getItem('theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
if (stored === 'dark' || (!stored && prefersDark)) {
  document.documentElement.classList.add('dark');
}

export { palette as light } from './colors';
export { palette as dark } from './colorsDark';