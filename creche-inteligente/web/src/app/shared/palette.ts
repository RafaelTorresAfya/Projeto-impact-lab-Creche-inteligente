// Paleta de dados compartilhada (dataviz skill) — usar sempre a mesma ordem de cores
// categóricas e a mesma rampa sequencial para manter consistência visual.
export const CATEGORICAL = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#4a3aa7'];

export const SEQUENTIAL_BLUE = ['#cde2fb', '#9ec5f4', '#6da7ec', '#3987e5', '#256abf', '#184f95', '#0d366b'];

export const STATUS = {
  good: '#0ca30c',
  warning: '#fab219',
  serious: '#ec835a',
  critical: '#d03b3b',
};

export const INK = {
  primary: '#0b0b0b',
  secondary: '#52514e',
  muted: '#898781',
  grid: '#e1e0d9',
  baseline: '#c3c2b7',
};

/** Retorna uma cor da rampa sequencial azul (0 a 1) para o valor normalizado informado. */
export function corSequencial(valorNormalizado: number): string {
  const v = Math.min(1, Math.max(0, valorNormalizado));
  const idx = Math.round(v * (SEQUENTIAL_BLUE.length - 1));
  return SEQUENTIAL_BLUE[idx];
}
