const cors = require('cors');
// Conexión a la base de datos MongoDB
require('dotenv').config();
const mongoose = require('mongoose');
// Importar dependencias
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
// Conectar a MongoDB usando Mongoose
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: 'app'
})
.then(()=> console.log('🚀'))
.catch(err => console.error('Error al conectar a MongoDB:', err));

// Middleware para parsear JSON
app.use(express.json());
// Middleware para permitir CORS
app.use(cors({
  origin: 'http://localhost:5173'
}));
// Importar rutas de usuarios
const rutasUsuarios = require('./routes/usuarios');
app.use('/api/usuarios', rutasUsuarios);

// Importar rutas de autenticación
const rutasAuth = require('./routes/auth');
app.use('/api/auth', rutasAuth);

// Importar rutas de informes
const rutasInformes = require('./routes/informes');
app.use('/api/informes', rutasInformes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ mensaje: 'API funcionando correctamente 🚀' });
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});