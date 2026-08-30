'use strict';

/**
 * Step 05 — Agrega a base de inscrições por ano (837k linhas, gzip, ';',
 * BOM UTF-8) por (ano, unidade, grupamento, horario, situacao) usando
 * streaming (fs.createReadStream -> gunzip -> csv-parse em modo stream),
 * SEM carregar o arquivo inteiro em memória. Só o Map de agregação final
 * (poucos milhares de chaves) fica em memória.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { parse } = require('csv-parse');

const SRC = path.resolve(
  __dirname,
  '../../../../dadoscreche/Bases IC_ ClassificadoseFila/01_QueryA_InscricoesPorAno.csv.gz'
);
const OUT_DIR = path.resolve(__dirname, '../../output');
const OUT_FILE = path.join(OUT_DIR, 'inscricoes-resumo.json');

function run() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  return new Promise((resolve, reject) => {
    const groups = new Map(); // key -> {ano,codigo_unidade,grupamento,horario,situacao,qtd_inscricoes,alunos:Set,opcaoSum,opcaoCount}
    let rowCount = 0;

    const parser = parse({
      delimiter: ';',
      columns: true,
      bom: true,
      relax_column_count: true,
      trim: false,
    });

    fs.createReadStream(SRC)
      .pipe(zlib.createGunzip())
      .pipe(parser)
      .on('data', (rec) => {
        rowCount++;

        const ano = rec.ano;
        const unidade = String(rec.unidade || '').trim().padStart(7, '0');
        const grupamento = String(rec.grupamento || '').trim();
        const horario = String(rec.horario || '').trim();
        const situacao = rec.situacao; // mantém exatamente como vem na fonte
        const opcao = Number(rec.opcao);
        const aluno_anon = rec.aluno_anon;

        const key = `${ano}|${unidade}|${grupamento}|${horario}|${situacao}`;
        let g = groups.get(key);
        if (!g) {
          g = {
            ano: Number(ano),
            codigo_unidade: unidade,
            grupamento,
            horario,
            situacao,
            qtd_inscricoes: 0,
            alunos: new Set(),
            opcaoSum: 0,
            opcaoCount: 0,
          };
          groups.set(key, g);
        }
        g.qtd_inscricoes++;
        if (aluno_anon) g.alunos.add(aluno_anon);
        if (Number.isFinite(opcao)) {
          g.opcaoSum += opcao;
          g.opcaoCount++;
        }
      })
      .on('error', reject)
      .on('end', () => {
        const result = [];
        for (const g of groups.values()) {
          result.push({
            ano: g.ano,
            codigo_unidade: g.codigo_unidade,
            grupamento: g.grupamento,
            horario: g.horario,
            situacao: g.situacao,
            qtd_inscricoes: g.qtd_inscricoes,
            qtd_criancas_distintas: g.alunos.size,
            opcao_media: g.opcaoCount > 0 ? Math.round((g.opcaoSum / g.opcaoCount) * 100) / 100 : null,
          });
        }

        fs.writeFileSync(OUT_FILE, JSON.stringify(result));
        console.log(
          `[05] processadas ${rowCount} linhas -> inscricoes-resumo.json com ${result.length} grupos agregados.`
        );
        resolve(result.length);
      });
  });
}

if (require.main === module) {
  run().catch((err) => {
    console.error('[05] ERRO:', err);
    process.exit(1);
  });
}

module.exports = { run, OUT_FILE };
