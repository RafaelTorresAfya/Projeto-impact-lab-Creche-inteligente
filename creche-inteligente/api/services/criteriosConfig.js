// Tabela de criterios de vulnerabilidade, portada do prototipo
// prototipo-jornada-familia/inscricao-creche-prototipo.html (const CRITERIOS).
// Fonte unica da verdade da pontuacao: o valor de pontos nunca vem do client,
// so a informacao de qual criterio esta marcado e qual documento foi anexado.

const CRITERIOS = [
  { chave: 'violencia', pontos: 100, fonte: 'documento', label: 'Criança em situação de violência ou com medida protetiva' },
  { chave: 'acolhimento', pontos: 50, fonte: 'documento', label: 'Criança em acolhimento institucional ou sob guarda' },
  { chave: 'deficiencia', pontos: 60, fonte: 'documento', label: 'Deficiência, TEA ou atraso global do desenvolvimento' },
  { chave: 'cadunico', pontos: 40, fonte: 'automatica', label: 'CadÚnico ativo' },
  { chave: 'bolsa', pontos: 30, fonte: 'automatica', label: 'Bolsa Família' },
  { chave: 'renda', pontos: 25, fonte: 'declarada', label: 'Renda per capita de até meio salário mínimo' },
  { chave: 'monoparental', pontos: 15, fonte: 'declarada', label: 'Família monoparental' },
  { chave: 'trabalho', pontos: 10, fonte: 'documento', label: 'Responsável em trabalho formal, estudo ou qualificação' },
  { chave: 'irmao', pontos: 10, fonte: 'automatica', label: 'Irmão já matriculado na unidade pretendida' },
];

const CONFIANCA_OCR_MINIMA = 0.8;

const POR_CHAVE = new Map(CRITERIOS.map((c) => [c.chave, c]));

function buscarCriterio(chave) {
  return POR_CHAVE.get(chave) || null;
}

// Deriva status/pontos a partir do que foi enviado, espelhando linhasPontuacao()
// do prototipo: automatica precisa de verificacao de base OU documento com boa
// confianca; documento precisa so de boa confianca; declarada pontua na hora.
function avaliarCriterio(chave, { verificado, confiancaOcr, temDocumento } = {}) {
  const criterio = buscarCriterio(chave);
  if (!criterio) return null;

  const docOk = temDocumento && Number(confiancaOcr) >= CONFIANCA_OCR_MINIMA;
  const docPendente = temDocumento && !docOk;

  if (criterio.fonte === 'automatica') {
    if (verificado) return { status: 'verificado', pontos: criterio.pontos };
    if (docOk) return { status: 'documento_lido', pontos: criterio.pontos };
    if (docPendente) return { status: 'em_revisao_humana', pontos: 0 };
    return { status: 'aguardando_consulta', pontos: 0 };
  }

  if (criterio.fonte === 'documento') {
    if (docOk) return { status: 'documento_lido', pontos: criterio.pontos };
    if (docPendente) return { status: 'em_revisao_humana', pontos: 0 };
    return { status: 'pendente', pontos: 0 };
  }

  // declarada: pontua imediatamente ao marcar, documento e so reforco opcional
  return { status: 'declarado', pontos: criterio.pontos };
}

module.exports = { CRITERIOS, CONFIANCA_OCR_MINIMA, buscarCriterio, avaliarCriterio };
