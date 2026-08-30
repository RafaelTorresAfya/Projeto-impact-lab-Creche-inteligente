// Validacoes portadas 1:1 do prototipo prototipo-jornada-familia/inscricao-creche-prototipo.html
// (cpfValido, etapaPor/idadeNoCorte). Aqui elas rodam no servidor, que e a
// unica fonte confiavel: o client pode validar de novo so para UX.

const ETAPAS = [
  { chave: 'bercario1', min: 0 },
  { chave: 'bercario2', min: 1 },
  { chave: 'maternal1', min: 2 },
  { chave: 'maternal2', min: 3 },
];

const ARROBA_REGEX = /^@[a-zA-Z0-9_.]{3,30}$/;
const EMAIL_REGEX = /.+@.+\..+/;

function apenasDigitos(v) {
  return String(v || '').replace(/\D/g, '');
}

function cpfValido(valor) {
  const c = apenasDigitos(valor);
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

function idadeNoCorte(nascimentoISO, dataCorte) {
  const nasc = new Date(`${nascimentoISO}T00:00:00`);
  if (Number.isNaN(nasc.getTime())) return null;

  let anos = dataCorte.getFullYear() - nasc.getFullYear();
  const diffMes = dataCorte.getMonth() - nasc.getMonth();
  if (diffMes < 0 || (diffMes === 0 && dataCorte.getDate() < nasc.getDate())) anos--;

  return { anos };
}

function calcularEtapa(nascimentoISO, dataCorte) {
  const idade = idadeNoCorte(nascimentoISO, dataCorte);
  if (!idade) return null;
  if (idade.anos < 0) return 'futuro';
  if (idade.anos >= 4) return 'pre';
  const etapa = ETAPAS.find((e) => e.min === idade.anos);
  return etapa ? etapa.chave : null;
}

function telefoneValido(valor) {
  return apenasDigitos(valor).length >= 10;
}

function arrobaValido(valor) {
  return ARROBA_REGEX.test(String(valor || '').trim());
}

function emailValido(valor) {
  return EMAIL_REGEX.test(String(valor || ''));
}

// Indice de alcance de contato (0-100), portado de alcance() no prototipo.
// Nao vale ponto de classificacao — e so um indicador operacional de quao
// facil e a familia ser encontrada na hora da convocacao.
function calcularIndiceAlcance(contato = {}) {
  const itens = [
    { pontos: 25, ok: telefoneValido(contato.telefone) },
    { pontos: 15, ok: !!contato.whatsapp_ativo && telefoneValido(contato.telefone) },
    { pontos: 25, ok: arrobaValido(contato.arroba_whatsapp) && contato.arroba_status === 'verificado' },
    { pontos: 5, ok: arrobaValido(contato.arroba_whatsapp) && contato.arroba_status === 'nao_verificado' },
    { pontos: 10, ok: emailValido(contato.email) },
    { pontos: 20, ok: telefoneValido(contato.telefone2) },
    { pontos: 10, ok: arrobaValido(contato.arroba2) },
    { pontos: 10, ok: !!contato.assistido },
  ];

  const total = Math.min(100, itens.filter((i) => i.ok).reduce((acc, i) => acc + i.pontos, 0));
  const faixa = total >= 70 ? 'resiliente' : total >= 40 ? 'razoavel' : 'fragil';
  return { total, faixa };
}

module.exports = {
  apenasDigitos,
  cpfValido,
  idadeNoCorte,
  calcularEtapa,
  telefoneValido,
  arrobaValido,
  emailValido,
  calcularIndiceAlcance,
};
