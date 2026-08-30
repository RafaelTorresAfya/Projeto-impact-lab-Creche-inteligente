// Coordenadas aproximadas de bairros do Rio, portadas do protótipo
// prototipo-jornada-familia/inscricao-creche-prototipo.html (const BAIRROS).
// Usadas para geocodificar enderecos de referencia da familia e, quando uma
// unidade real do GeoJSON nao tem lat/lng, como aproximacao pelo bairro/CRE.
const BAIRROS = [
  ['Bangu', -22.8756, -43.4653],
  ['Realengo', -22.8800, -43.4300],
  ['Padre Miguel', -22.8760, -43.4470],
  ['Campo Grande', -22.9035, -43.5590],
  ['Santa Cruz', -22.9170, -43.6850],
  ['Guaratiba', -23.0000, -43.5900],
  ['Jacarepaguá', -22.9500, -43.3700],
  ['Barra da Tijuca', -23.0000, -43.3650],
  ['Recreio dos Bandeirantes', -23.0200, -43.4650],
  ['Madureira', -22.8730, -43.3400],
  ['Cascadura', -22.8850, -43.3300],
  ['Irajá', -22.8320, -43.3290],
  ['Anchieta', -22.8280, -43.3970],
  ['Penha', -22.8420, -43.2790],
  ['Bonsucesso', -22.8600, -43.2540],
  ['Ilha do Governador', -22.8100, -43.2000],
  ['Méier', -22.9020, -43.2790],
  ['Del Castilho', -22.8760, -43.2740],
  ['Vila Isabel', -22.9150, -43.2470],
  ['Tijuca', -22.9250, -43.2320],
  ['São Cristóvão', -22.8970, -43.2220],
  ['Centro', -22.9068, -43.1729],
  ['Cidade Nova', -22.9110, -43.1990],
  ['Botafogo', -22.9500, -43.1840],
  ['Copacabana', -22.9700, -43.1860],
  ['Santa Teresa', -22.9260, -43.1900],
];

const DIACRITICOS = new RegExp('[̀-ͯ]', 'g');

function normalizar(nome) {
  return String(nome || '')
    .normalize('NFD')
    .replace(DIACRITICOS, '')
    .trim()
    .toLowerCase();
}

const INDICE = new Map(BAIRROS.map(([nome, lat, lng]) => [normalizar(nome), { nome, lat, lng }]));

function buscarBairro(nome) {
  return INDICE.get(normalizar(nome)) || null;
}

function centroideCre(cre) {
  // Sem malha oficial de CRE no repo: aproxima pelo bairro mais associado
  // a cada CRE nas unidades ficticias do prototipo, so como ultimo fallback.
  const porCre = {
    '1ª CRE': 'Centro',
    '2ª CRE': 'Tijuca',
    '3ª CRE': 'Penha',
    '4ª CRE': 'Irajá',
    '5ª CRE': 'Madureira',
    '6ª CRE': 'Méier',
    '7ª CRE': 'Jacarepaguá',
    '8ª CRE': 'Bangu',
    '9ª CRE': 'Campo Grande',
    '10ª CRE': 'Santa Cruz',
  };
  const bairro = porCre[cre];
  return bairro ? buscarBairro(bairro) : null;
}

module.exports = { BAIRROS, buscarBairro, centroideCre };
