const Reminder = require("../models/reminder");
const User = require("../models/User");
const InfoUser = require("../models/InfoUser");
const { agenda, scheduleReminder } = require("../utils/agenda");
const sendReminderEmail = require("../utils/sendEmail");


// 📌 Formatear fecha y hora en 12h AM/PM ajustando a zona horaria local
const formatFechaHora = (date) => {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  const fecha = localDate.toLocaleDateString("es-CO");
  const hora = localDate.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return { fecha, hora };
};

// 📌 Crear recordatorio
const crearRecordatorio = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Usuario no autenticado" });

    const {
      titulo,
      fecha,
      descripcion,
      frecuencia,
      intervaloPersonalizado,
      tipo,
      dosis,
      unidad,
      cantidadDisponible,
    } = req.body;

    const info = await InfoUser.findOne({ userId });
    const user = await User.findById(userId);
    const email = info?.email || (/\S+@\S+\.\S+/.test(user?.username) ? user.username : null);
    if (!email) return res.status(400).json({ message: "Usuario sin correo válido" });

    const fechaNormalizada = fecha ? new Date(fecha) : new Date();
    const nombreCompleto = info?.name ? `${info.name} ${info.lastName || ''}`.trim() : "Paciente";

    const reminder = new Reminder({
      userId,
      tipo,
      titulo,
      fecha: fechaNormalizada,
      descripcion,
      frecuencia,
      intervaloPersonalizado,
      horarios: [],
      dosis,
      unidad,
      cantidadDisponible,
      nombrePersona: nombreCompleto,
      completed: false,
    });

    await reminder.save();

    // Programar recordatorio en Agenda
    await scheduleReminder(reminder);

    const { fecha: fForm, hora: hForm } = formatFechaHora(fechaNormalizada);
    res.status(201).json({
      ...reminder.toObject(),
      fechaFormateada: fForm,
      horaFormateada: hForm,
    });

  } catch (error) {
    console.error("❌ Error en crearRecordatorio:", error);
    res.status(500).json({ message: "Error al crear el recordatorio", error: error.message });
  }
};

// 📌 Obtener recordatorios del usuario
const obtenerRecordatoriosPorUsuario = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Usuario no autenticado" });

    const recordatorios = await Reminder.find({ userId });

    const recordatoriosFormateados = recordatorios.map(r => {
      const { fecha, hora } = formatFechaHora(new Date(r.fecha));
      return {
        ...r.toObject(),
        fechaFormateada: fecha,
        horaFormateada: hora,
      };
    });

    res.json(recordatoriosFormateados);
  } catch (error) {
    console.error("❌ Error en obtenerRecordatorios:", error);
    res.status(500).json({ message: "Error al obtener los recordatorios" });
  }
};

// 📌 Actualizar recordatorio
const actualizarRecordatorio = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (req.body.fecha) {
      req.body.fecha = new Date(req.body.fecha);
    }

    const updated = await Reminder.findOneAndUpdate(
      { _id: id, userId },
      req.body,
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Recordatorio no encontrado" });

    const { fecha: fForm, hora: hForm } = formatFechaHora(new Date(updated.fecha));

    res.json({
      ...updated.toObject(),
      fechaFormateada: fForm,
      horaFormateada: hForm,
    });
  } catch (error) {
    console.error("❌ Error en actualizarRecordatorio:", error);
    res.status(500).json({ message: "Error al actualizar el recordatorio" });
  }
};

// 📌 Eliminar recordatorio
const eliminarRecordatorio = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const deleted = await Reminder.findOneAndDelete({ _id: id, userId });

    if (!deleted) return res.status(404).json({ message: "Recordatorio no encontrado" });

    // Cancelar todos los jobs de Agenda relacionados
    await agenda.start();
    const numCanceled = await agenda.cancel({
      $or: [
        { 'data.reminderId': deleted._id.toString() },
        { 'data.reminderId': deleted._id }
      ]
    });
    console.log(`❌ Se cancelaron ${numCanceled} jobs de Agenda para el recordatorio ${deleted._id}`);

    res.json({ message: "✅ Recordatorio eliminado" });
  } catch (error) {
    console.error("❌ Error en eliminarRecordatorio:", error);
    res.status(500).json({ message: "Error al eliminar el recordatorio" });
  }
};

// 📌 Marcar recordatorio como completado o no
const marcarRecordatorioCompletado = async (req, res) => {
  try {
    const { id } = req.params;
    const { completed } = req.body;
    const userId = req.user?.id;

    const reminder = await Reminder.findOneAndUpdate(
      { _id: id, userId },
      { completed },
      { new: true }
    );

    if (!reminder) return res.status(404).json({ message: "Recordatorio no encontrado" });

    if (completed) {
      await agenda.start();
      const numCanceled = await agenda.cancel({
        $or: [
          { 'data.reminderId': reminder._id.toString() },
          { 'data.reminderId': reminder._id }
        ]
      });
      console.log(`❌ Se cancelaron ${numCanceled} jobs de Agenda para el recordatorio ${reminder._id}`);
    }

    res.json(reminder);
  } catch (error) {
    console.error("❌ Error en marcarRecordatorioCompletado:", error);
    res.status(500).json({ message: "Error al actualizar el estado del recordatorio" });
  }
};


// 📌 Endpoint que ejecutará el CRON (cron-job.org lo llama cada minuto)
const ejecutarRecordatoriosPendientes = async (req, res) => {
  try {
    const ahora = new Date();
    const dentroDe1Min = new Date(ahora.getTime() + 60 * 1000);

    // Buscar recordatorios no completados que estén en el rango de 1 minuto
    const pendientes = await Reminder.find({
      completed: false,
      fecha: { $gte: ahora, $lt: dentroDe1Min },
    }).populate("userId");

    for (const r of pendientes) {
      const user = await User.findById(r.userId);
      const info = await InfoUser.findOne({ userId: r.userId });
      const email =
        info?.email || (/\S+@\S+\.\S+/.test(user?.username) ? user.username : null);

      if (email) {
        const { fecha, hora } = formatFechaHora(new Date(r.fecha));
        await sendReminderEmail(email, {
          titulo: r.titulo,
          descripcion: r.descripcion,
          fecha,
          hora,
          paciente: r.nombrePersona,
        });
      }
    }

    res.json({ message: `Se enviaron ${pendientes.length} recordatorios` });
  } catch (error) {
    console.error("❌ Error en ejecutarRecordatoriosPendientes:", error);
    res.status(500).json({ message: "Error al ejecutar recordatorios", error: error.message });
  }
};

module.exports = {
  crearRecordatorio,
  obtenerRecordatoriosPorUsuario,
  actualizarRecordatorio,
  eliminarRecordatorio,
  marcarRecordatorioCompletado,
  ejecutarRecordatoriosPendientes, // 👈 endpoint para cron-job
};
