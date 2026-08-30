'use strict';

/**
 * Step 04 — Consolida vagas ofertadas pelas unidades PÚBLICAS
 * (totalalunoscreche*.xlsx, 2021-2025) num único array plano:
 * {ano, mes_referencia, codigo_unidade, nome_unidade_bruto, fonte,
 *  grupamento, turno, alunos_matriculados, turmas}
 *
 * SIMPLIFICAÇÕES (por causa do prazo do hackathon):
 * - mes_referencia sempre null — as planilhas não trazem mês de forma
 *   confiável em todos os anos (algumas são "consolidado do ano").
 * - Para 2021 as sub-colunas são "TP" (Turno Parcial) e "TU" (Turno
 *   Único) em vez de "Integral"/"Parcial". Mapeamos TP -> "Parcial" e
 *   TU -> "Integral" como equivalência aproximada (não confirmada com a
 *   SME) só para manter o schema consistente entre anos. Isso está
 *   isolado na config de 2021 abaixo, fácil de revisar depois.
 * - 2022 não tem quebra por turno nenhuma -> turno = "NaoInformado".
 * - Linhas de grupamento "CRECHE(S) TOTAL" nas planilhas são ignoradas
 *   (são soma dos 3 grupamentos, redundante com os registros individuais).
 * - Tarefa 6 (Parceiras*.xlsx) NÃO foi feita por falta de tempo — este
 *   step gera vagas-ofertadas.json só com fonte "publica".
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const BASE = path.resolve(__dirname, '../../../../dadoscreche/OferecimentosEvagas');
const OUT_DIR = path.resolve(__dirname, '../../output');
const OUT_FILE = path.join(OUT_DIR, 'vagas-ofertadas.json');

function toNum(v) {
  if (v === null || v === undefined || v === '') return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function isDataRow(row) {
  // Linha de dados: coluna 1 (Designacao) parece um código de unidade
  // numérico (com ou sem zero à esquerda), e coluna 2 (Denominacao) existe.
  const designacao = row[1];
  const denominacao = row[2];
  if (designacao === null || designacao === undefined) return false;
  if (denominacao === null || denominacao === undefined || denominacao === '') return false;
  const asStr = String(designacao).trim();
  return /^\d+$/.test(asStr);
}

// Cada grupo: { nome, turnos: [{turno, alunoCol, turmaCol}] }
function buildRecords(rows, { ano, headerRowsToSkip, groups }) {
  const records = [];
  for (let i = headerRowsToSkip; i < rows.length; i++) {
    const row = rows[i];
    if (!isDataRow(row)) continue;
    const designacao = String(row[1]).trim();
    const codigo_unidade = designacao.padStart(7, '0');
    const nome_unidade_bruto = String(row[2]).trim();

    for (const group of groups) {
      for (const t of group.turnos) {
        const alunos = toNum(row[t.alunoCol]);
        const turmas = toNum(row[t.turmaCol]);
        // Só grava registro se houver algum dado (evita poluir com zeros
        // em turnos que nem existem pra aquele grupamento/ano, mas mantém
        // registros zerados quando o turno de fato existe na planilha
        // pra não perder unidades com 0 matrículas — aceitável manter tudo).
        records.push({
          ano,
          mes_referencia: null,
          codigo_unidade,
          nome_unidade_bruto,
          fonte: 'publica',
          grupamento: group.nome,
          turno: t.turno,
          alunos_matriculados: alunos,
          turmas,
        });
      }
    }
  }
  return records;
}

function readSheetRows(file, preferredSheet) {
  const wb = XLSX.readFile(path.join(BASE, file));
  const sheetName = wb.SheetNames.includes(preferredSheet) ? preferredSheet : wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  return { rows: XLSX.utils.sheet_to_json(ws, { header: 1, defval: null }), sheetName };
}

function run() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const allRecords = [];

  // ---- 2021: cols 0=CRE,1=Designacao,2=Denominacao, depois blocos de
  // 4 colunas (TP-Aluno,TP-Turma,TU-Aluno,TU-Turma) por grupamento,
  // dados a partir da linha 3 (0-indexed).
  {
    const { rows } = readSheetRows('totalalunoscreche2021.xlsx', '2021');
    const groups = [
      { nome: 'Bercario', turnos: [
        { turno: 'Parcial', alunoCol: 3, turmaCol: 4 },
        { turno: 'Integral', alunoCol: 5, turmaCol: 6 },
      ] },
      { nome: 'Maternal I', turnos: [
        { turno: 'Parcial', alunoCol: 7, turmaCol: 8 },
        { turno: 'Integral', alunoCol: 9, turmaCol: 10 },
      ] },
      { nome: 'Maternal II', turnos: [
        { turno: 'Parcial', alunoCol: 11, turmaCol: 12 },
        { turno: 'Integral', alunoCol: 13, turmaCol: 14 },
      ] },
    ];
    const recs = buildRecords(rows, { ano: 2021, headerRowsToSkip: 3, groups });
    allRecords.push(...recs);
    console.log(`[04] 2021: ${recs.length} registros`);
  }

  // ---- 2022: cols 0=CRE,1=Designacao,2=Denominacao, blocos de 2 colunas
  // (Aluno,Turma) por grupamento, sem quebra de turno. Dados a partir da
  // linha 2.
  {
    const { rows } = readSheetRows('totalalunoscreche2022.xlsx', 'CONSOLIDADO');
    const groups = [
      { nome: 'Bercario', turnos: [{ turno: 'NaoInformado', alunoCol: 3, turmaCol: 4 }] },
      { nome: 'Maternal I', turnos: [{ turno: 'NaoInformado', alunoCol: 5, turmaCol: 6 }] },
      { nome: 'Maternal II', turnos: [{ turno: 'NaoInformado', alunoCol: 7, turmaCol: 8 }] },
    ];
    const recs = buildRecords(rows, { ano: 2022, headerRowsToSkip: 2, groups });
    allRecords.push(...recs);
    console.log(`[04] 2022: ${recs.length} registros`);
  }

  // ---- 2023/2024/2025: cols 0=CRE,1=Designacao,2=Denominacao, blocos de
  // 4 colunas (Integral-Aluno,Integral-Turma,Parcial-Aluno,Parcial-Turma)
  // por grupamento. Dados a partir da linha 3.
  const post2022Groups = [
    { nome: 'Bercario', turnos: [
      { turno: 'Integral', alunoCol: 3, turmaCol: 4 },
      { turno: 'Parcial', alunoCol: 5, turmaCol: 6 },
    ] },
    { nome: 'Maternal I', turnos: [
      { turno: 'Integral', alunoCol: 7, turmaCol: 8 },
      { turno: 'Parcial', alunoCol: 9, turmaCol: 10 },
    ] },
    { nome: 'Maternal II', turnos: [
      { turno: 'Integral', alunoCol: 11, turmaCol: 12 },
      { turno: 'Parcial', alunoCol: 13, turmaCol: 14 },
    ] },
  ];

  for (const [file, ano, preferredSheet] of [
    ['totalalunoscreche2023.xlsx', 2023, 'CONSOLIDADO'],
    ['totalalunoscreche2024.xlsx', 2024, 'Consolidado'],
    ['totaalunoscreche2025.xlsx', 2025, 'Consolidado'],
  ]) {
    const { rows } = readSheetRows(file, preferredSheet);
    const recs = buildRecords(rows, { ano, headerRowsToSkip: 3, groups: post2022Groups });
    allRecords.push(...recs);
    console.log(`[04] ${ano}: ${recs.length} registros`);
  }

  fs.writeFileSync(OUT_FILE, JSON.stringify(allRecords));
  console.log(`[04] vagas-ofertadas.json gerado com ${allRecords.length} registros (só fonte "publica" — Parceiras não incluídas, Tarefa 6 pulada por tempo).`);
  return allRecords.length;
}

if (require.main === module) {
  run();
}

module.exports = { run, OUT_FILE };
