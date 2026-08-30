require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const https = require('https');

const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const unidadesEscolaresRoutes = require('./routes/unidadesEscolaresRoutes');
const microareasRoutes = require('./routes/microareasRoutes');
const dominioTerritorialRoutes = require('./routes/dominioTerritorialRoutes');
const inscricoesResumoRoutes = require('./routes/inscricoesResumoRoutes');
const vagasOfertadasRoutes = require('./routes/vagasOfertadasRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const planejamentoVagasRoutes = require('./routes/planejamentoVagasRoutes');
const convocacoesRoutes = require('./routes/convocacoesRoutes');

const app = express();

app.use(cors({ origin: 'http://localhost:4200' }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

app.use('/api/auth', authRoutes);
app.use('/api/unidades-escolares', unidadesEscolaresRoutes);
app.use('/api/microareas', microareasRoutes);
app.use('/api/dominio-territorial', dominioTerritorialRoutes);
app.use('/api/inscricoes-resumo', inscricoesResumoRoutes);
app.use('/api/vagas-ofertadas', vagasOfertadasRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/planejamento-vagas', planejamentoVagasRoutes);
app.use('/api/convocacoes', convocacoesRoutes);

// ---- Proxy de tiles do OpenStreetMap com cache em disco ----
const TILES_CACHE_DIR = path.join(__dirname, 'tiles-cache');
const TILE_USER_AGENT = 'CrecheInteligenteRio/1.0 (hackathon SME-Rio; contato: rafaeltorres.hubxp@parceiro.afya.com.br)';

app.get('/tiles/:z/:x/:y.png', (req, res) => {
  const { z, x, y } = req.params;

  if (!/^\d+$/.test(z) || !/^\d+$/.test(x) || !/^\d+$/.test(y)) {
    return res.status(400).end();
  }

  const dirCache = path.join(TILES_CACHE_DIR, z, x);
  const caminhoCache = path.join(dirCache, `${y}.png`);

  if (fs.existsSync(caminhoCache)) {
    return res.sendFile(caminhoCache);
  }

  const url = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;

  https
    .get(url, { headers: { 'User-Agent': TILE_USER_AGENT } }, (tileRes) => {
      if (tileRes.statusCode !== 200) {
        tileRes.resume();
        return res.status(404).end();
      }

      const chunks = [];
      tileRes.on('data', (chunk) => chunks.push(chunk));
      tileRes.on('end', () => {
        const buffer = Buffer.concat(chunks);
        try {
          fs.mkdirSync(dirCache, { recursive: true });
          fs.writeFileSync(caminhoCache, buffer);
        } catch (err) {
          console.warn('[tiles] falha ao gravar cache:', err.message);
        }
        res.set('Content-Type', 'image/png');
        res.send(buffer);
      });
    })
    .on('error', (err) => {
      console.warn('[tiles] falha ao buscar tile remoto:', err.message);
      res.status(404).end();
    });
});

// 404 para rotas nao encontradas
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Rota nao encontrada.' });
});

app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Creche Inteligente API rodando na porta ${PORT}`);
});
