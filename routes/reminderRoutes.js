const express = require('express');
const router = express.Router();
const {
  crearRecordatorio,
  obtenerRecordatoriosPorUsuario,
  eliminarRecordatorio,
  actualizarRecordatorio,
  marcarRecordatorioCompletado,
  ejecutarRecordatoriosPendientes,
  obtenerRecordatorioPorId
} = require('../controllers/reminderController');


const authMiddleware = require('../middlewares/authMiddleware'); // ⬅️ IMPORTA EL MIDDLEWARE

// ✅ Crear recordatorio - requiere token válido
router.post('/', authMiddleware, crearRecordatorio);

// ✅ Obtener recordatorios del usuario autenticado
router.get('/', authMiddleware, obtenerRecordatoriosPorUsuario);

// ✅ Obtener un recordatorio por ID
router.get('/:id', authMiddleware, obtenerRecordatorioPorId);

// ✅ Actualizar un recordatorio
router.put('/:id', authMiddleware, actualizarRecordatorio);

// ✅ Eliminar un recordatorio
router.delete('/:id', authMiddleware, eliminarRecordatorio);

// ✅ Marcar recordatorio como completado o no
router.put('/:id/completed', authMiddleware, marcarRecordatorioCompletado);

//✅ configuracion del cron cada minuto
router.get("/cron/reminders", ejecutarRecordatoriosPendientes);

//✅ Recordatorio favorito
router.patch("/recordatorios/:id/favorito", authMiddleware, toggleFavorito);



module.exports = router;
