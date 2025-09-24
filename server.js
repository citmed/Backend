const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

const registerUserRoutes = require('./routes/registerUserRoutes');
const loginRoutes = require('./routes/loginRoutes');
const adminRegistrationRoutes = require('./routes/adminRegistrationRoutes');
const reminderRoutes = require('./routes/reminderRoutes'); 

dotenv.config();
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB Connected');
  })
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ✅ Ruta raíz personalizada
app.get("/", (req, res) => {
  res.send(`
    <h1>🚀 Bienvenido al Backend de CitaMed</h1>
    <p>Tu API está funcionando correctamente en Vercel.</p>
    <p>Rutas disponibles:</p>
    <ul>
      <li><code>/api/register</code></li>
      <li><code>/api/login</code></li>
      <li><code>/api/admin</code></li>
      <li><code>/api/reminders</code></li>
      <li><code>/api/info-user</code></li>
      <li><code>/api/auth</code></li>
    </ul>
  `);
});

// ✅ Rutas principales
app.use('/api/register', registerUserRoutes);
app.use('/api/login', loginRoutes);
app.use('/api/admin', adminRegistrationRoutes);
app.use('/api/reminders', reminderRoutes);
app.use("/api/info-user", require("./routes/infoUserRoutes"));
app.use("/api/auth", require("./routes/authRoutes"));

// ✅ Ruta no encontrada (404)
app.use((req, res, next) => {
  res.status(404).send("<h2>❌ Ups, esta ruta no existe en la API de CitaMed</h2>");
});

// ✅ Manejador de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("<h2>⚠️ Error interno del servidor</h2>");
});

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
