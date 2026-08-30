// Geracao de protocolo e simulacao de leitura de documento (OCR), portadas do
// prototipo prototipo-jornada-familia/inscricao-creche-prototipo.html
// (hashStr, simulaOCR). A leitura de documento continua simulada por decisao
// de escopo: nenhum arquivo real e armazenado, so metadados + confianca.

function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function gerarProtocolo(anoLetivo, idInscricao) {
  const sequencial = String(idInscricao).padStart(6, '0');
  return `${anoLetivo}-${sequencial}`;
}

// nomeArquivo/tamanho vem do metadado enviado pelo client (sem armazenar o
// arquivo em si); confianca deterministica no intervalo [0.60, 0.98].
function simularConfiancaOcr(nomeArquivo, tamanho, criterioChave) {
  const h = hashStr(`${nomeArquivo}${tamanho}${criterioChave}`);
  const confianca = 0.6 + (h % 39) / 100;
  return Number(confianca.toFixed(2));
}

module.exports = { hashStr, gerarProtocolo, simularConfiancaOcr };
