const Reminder = require("../models/reminder");
const User = require("../models/User");
const InfoUser = require("../models/InfoUser");
const sendReminderEmail = require("../utils/sendEmail");

// 📌 Formatear fecha y hora en 12h AM/PM ajustando a zona horaria local
const formatFechaHora = (date) => {
  const fecha = date.toLocaleDateString("es-CO", {
    timeZone: "America/Bogota",
  });
  const hora = date.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/Bogota",
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

// 📌 Obtener un recordatorio por ID
const obtenerRecordatorioPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const reminder = await Reminder.findOne({ _id: id, userId });

    if (!reminder) {
      return res.status(404).json({ message: "Recordatorio no encontrado" });
    }

    const { fecha, hora } = formatFechaHora(new Date(reminder.fecha));

    res.json({
      ...reminder.toObject(),
      fechaFormateada: fecha,
      horaFormateada: hora,
      // 👇 importante para <input type="datetime-local">
      fechaISO: new Date(reminder.fecha.getTime() - reminder.fecha.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16),
    });
  } catch (error) {
    console.error("❌ Error en obtenerRecordatorioPorId:", error);
    res.status(500).json({ message: "Error al obtener recordatorio" });
  }
};


// 📌 Actualizar recordatorio
const actualizarRecordatorio = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // 🔹 Primero buscamos el recordatorio
    const reminder = await Reminder.findOne({ _id: id, userId });
    if (!reminder) {
      return res.status(404).json({ message: "Recordatorio no encontrado" });
    }

    // 🚫 Bloquear si ya fue enviado
    if (reminder.sent) {
      return res.status(400).json({ message: "Este recordatorio ya fue enviado y no se puede modificar" });
    }

    // 🔹 Convertir fecha si viene
    if (req.body.fecha) {
      req.body.fecha = new Date(req.body.fecha);
    }

    // 🔹 Actualizar recordatorio
    const updated = await Reminder.findOneAndUpdate(
      { _id: id, userId },
      req.body,
      { new: true }
    );

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

    // ✅ Buscar recordatorios pendientes
    const pendientes = await Reminder.find({
      completed: false,
      sent: false, // 👈 evita reenvíos
      $or: [
        // Para "control" → enviar 1 hora antes
        {
          tipo: "control",
          fecha: {
            $gte: new Date(ahora.getTime() + 60 * 60 * 1000), // fecha real = ahora +1h
            $lt: new Date(dentroDe1Min.getTime() + 60 * 60 * 1000),
          },
        },
        // Para otros tipos → enviar en la hora normal
        {
          tipo: { $ne: "control" },
          fecha: { $gte: ahora, $lt: dentroDe1Min },
        },
      ],
    });

    let enviados = 0;

    for (const r of pendientes) {
      const user = await User.findById(r.userId);
      const info = await InfoUser.findOne({ userId: r.userId });
      const email =
        info?.email || (/\S+@\S+\.\S+/.test(user?.username) ? user.username : null);

      if (!email) {
        console.warn(`⚠️ Recordatorio sin email válido → ID: ${r._id}`);
        continue;
      }

      // 👇 Si es "control", muestro la fecha ajustada -1h en el correo
      const fechaMostrar =
        r.tipo === "control"
          ? new Date(r.fecha)
          : new Date(r.fecha);

      const { fecha, hora } = formatFechaHora(fechaMostrar);

      console.log(`📩 Enviando recordatorio:
  Usuario: ${info?.name || "Paciente"} ${info?.lastName || ""}
  Email: ${email}
  Tipo: ${r.tipo}
  Título: ${r.titulo}
  Fecha: ${fecha} ${hora}
  Descripción: ${r.descripcion}
  Dosis restante: ${r.cantidadDisponible}
      `);

      await sendReminderEmail(email, `⏰ Recordatorio de ${r.tipo}`, {
        ...r.toObject(),
        horarios: [`${fecha} ${hora}`],
      });

      // ✅ Marcar como enviado
      r.sent = true;

      // ✅ Descontar dosis
      if (r.cantidadDisponible > 0) {
        r.cantidadDisponible -= 1;

        // Si aún quedan, mover la fecha al próximo intervalo
        if (r.cantidadDisponible > 0 && r.intervaloPersonalizado) {
          const intervalo = parseInt(r.intervaloPersonalizado, 10); // minutos
          r.fecha = new Date(r.fecha.getTime() + intervalo * 60 * 1000);
          r.sent = false; // 👈 para permitir futuros envíos
        } else if (r.cantidadDisponible === 0) {
          r.completed = true; // sin stock
        }
      } else {
        r.completed = true;
      }

      await r.save();
      enviados++;
    }

    res.json({ message: `Se enviaron ${enviados} recordatorios` });
  } catch (error) {
    console.error("❌ Error en ejecutarRecordatoriosPendientes:", error);
    res.status(500).json({
      message: "Error al ejecutar recordatorios",
      error: error.message,
    });
  }
};





module.exports = {
  crearRecordatorio,
  obtenerRecordatoriosPorUsuario,
  actualizarRecordatorio,
  eliminarRecordatorio,
  marcarRecordatorioCompletado,
  ejecutarRecordatoriosPendientes, 
  obtenerRecordatorioPorId,
};
