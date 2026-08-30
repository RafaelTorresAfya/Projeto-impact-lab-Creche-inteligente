// Formulas de distancia e recomendacao geografica, portadas 1:1 do prototipo
// prototipo-jornada-familia/inscricao-creche-prototipo.html (haversine, pesoRef,
// ranquear). Score geografico e so um criterio de recomendacao/ordenacao de
// unidades: nunca entra na pontuacao de classificacao da fila (ver criteriosConfig.js).

const PRIORIDADE_PESO = { alta: 1, media: 0.6, baixa: 0.3 };

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const rad = (x) => (x * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function pesoReferencia(prioridade, diasSemana) {
  const p = PRIORIDADE_PESO[prioridade] ?? 0.6;
  const dias = Math.min(7, Number(diasSemana) || 5);
  return p * (0.55 + 0.45 * (dias / 7));
}

function nivelPressao(pressao) {
  if (pressao >= 8) return 'alta';
  if (pressao >= 4) return 'media';
  return 'baixa';
}

// referencias: [{ lat, lng, prioridade, dias_semana }]
// unidade: { vagas, fila, lat, lng }
function calcularScore(referencias, unidade) {
  if (!referencias.length) return null;

  const distancias = referencias
    .map((ref) => {
      const d = haversineKm(ref.lat, ref.lng, unidade.lat, unidade.lng);
      const peso = pesoReferencia(ref.prioridade, ref.dias_semana);
      return { ref, d, peso, prox: Math.exp(-d / 3.5) };
    })
    .sort((a, b) => a.d - b.d);

  const pesoTotal = referencias.reduce(
    (acc, ref) => acc + pesoReferencia(ref.prioridade, ref.dias_semana),
    0
  );
  const acesso = distancias.reduce((acc, x) => acc + x.peso * x.prox, 0) / pesoTotal;

  const vagas = Number(unidade.vagas) || 0;
  const fila = Number(unidade.fila) || 0;
  const oferta = Math.min(1, vagas / 30);
  const pressao = fila / Math.max(1, vagas);
  const score = acesso * 100 * (1 + 0.25 * oferta) - Math.min(10, pressao * 0.7) * acesso;

  return { score, acesso, pressao, nivelPressao: nivelPressao(pressao), maisProxima: distancias[0] };
}

function ranquearUnidades(referencias, unidades) {
  return unidades
    .map((unidade) => {
      const resultado = calcularScore(referencias, unidade);
      return resultado ? { unidade, ...resultado } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);
}

module.exports = { haversineKm, pesoReferencia, calcularScore, ranquearUnidades, nivelPressao };
