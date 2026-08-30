import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// Mesma logica mod-11 usada no servidor (services/validacaoService.js) e no
// prototipo original. So para feedback imediato na UI: o servidor sempre
// revalida antes de persistir.
export function cpfValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    return cpfValido(control.value) ? null : { cpfInvalido: true };
  };
}

export function cpfValido(valor: string): boolean {
  const c = String(valor || '').replace(/\D/g, '');
  if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) soma += Number(c[i]) * (10 - i);
  let d1 = (soma * 10) % 11;
  if (d1 === 10) d1 = 0;
  if (d1 !== Number(c[9])) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) soma += Number(c[i]) * (11 - i);
  let d2 = (soma * 10) % 11;
  if (d2 === 10) d2 = 0;

  return d2 === Number(c[10]);
}

export function apenasDigitos(valor: string | null | undefined): string {
  return String(valor || '').replace(/\D/g, '');
}
