const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

const registerUserRoutes = require('./routes/registerUserRoutes');
const loginRoutes = require('./routes/loginRoutes');
const adminRegistrationRoutes = require('./routes/adminRegistrationRoutes');
const reminderRoutes = require('./routes/reminderRoutes'); 
/*const { cargarRecordatorios } = require("./utils/scheduler");*/
/*const { initAgenda } = require("./utils/agenda");*/


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



// Rutas
app.use('/api/register', registerUserRoutes);
app.use('/api/login', loginRoutes);
app.use('/api/admin', adminRegistrationRoutes);
app.use('/api/reminders', reminderRoutes);
app.use("/api/info-user", require("./routes/infoUserRoutes"));
app.use("/api/auth", require("./routes/authRoutes"));




// Ruta no encontrada
app.use((req, res, next) => {
  res.send ('CORRIENDO BACKEND CITAMED')
    res.status(404).json({ msg: 'Ruta no encontrada' });
});

// Manejador de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ msg: 'Error interno del servidor' });
});

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
