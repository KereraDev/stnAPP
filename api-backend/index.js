require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

/* ---------------------- MongoDB ---------------------- */
(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.MONGO_DB || 'app',
    });
    console.log('✅ Conectado a MongoDB');
  } catch (err) {
    console.error('❌ Error al conectar a MongoDB:', err);
    process.exit(1);
  }
})();

/* ---------------------- Middlewares ---------------------- */
app.use(express.json({ limit: '1mb' }));

// CORS: permite dev y tu dominio de frontend en prod
const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL, // ej: https://mi-frontend.vercel.app
].filter(Boolean);

const corsOptions = {
  origin(origin, cb) {
    // permitir requests sin Origin (curl, health checks, etc.)
    if (!origin) return cb(null, true);

    try {
      const hostname = new URL(origin).hostname;
      const allowByList = allowedOrigins.includes(origin);
      // opcional: permitir subdominios .onrender.com
      const allowRender = /\.onrender\.com$/.test(hostname);

      if (allowByList || allowRender) return cb(null, true);
      return cb(new Error('CORS: origen no permitido'));
    } catch {
      return cb(new Error('CORS: origen inválido'));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));

/* ---------------------- Rutas ---------------------- */
const rutasUsuarios = require('./routes/usuarios');
app.use('/api/usuarios', rutasUsuarios);

const rutasAuth = require('./routes/auth');
app.use('/api/auth', rutasAuth);

const rutasInformes = require('./routes/informes');
app.use('/api/informes', rutasInformes);

// Health check (útil para Render)
app.get('/healthz', (req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

// Home
app.get('/', (req, res) => {
  res.json({ mensaje: 'API funcionando correctamente 🚀' });
});

// 404
app.use((req, res) => {
  res.status(404).json({ mensaje: 'Ruta no encontrada' });
});

// Errores
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ mensaje: 'Error interno del servidor' });
});

/* ---------------------- Arranque ---------------------- */
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});

// Apagado elegante
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  await mongoose.connection.close();
  process.exit(0);
});
