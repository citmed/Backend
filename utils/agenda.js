const Agenda = require('agenda');
const Reminder = require('../models/reminder');
const User = require('../models/User');
const InfoUser = require('../models/InfoUser');
const sendReminderEmail = require('./sendEmail');

const mongoConnectionString = process.env.MONGODB_URI;

const agenda = new Agenda({
  db: { address: mongoConnectionString, collection: 'agendaJobs' },
});

// 🔹 Formatear fecha/hora
const formatFechaHora = (date) => {
  const fecha = date.toLocaleDateString("es-CO");
  const hora = date.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return { fecha, hora };
};

// 🔹 Job Agenda
agenda.define("send-reminder", async (job) => {
  const { userId, reminderId } = job.attrs.data;
  const reminder = await Reminder.findById(reminderId);
  if (!reminder || reminder.completed) return;

  // Stock check
  if (reminder.cantidadDisponible !== undefined && reminder.cantidadDisponible <= 0) {
    await agenda.cancel({ "data.reminderId": reminder._id.toString() });
    return;
  }

  const user = await User.findById(userId);
  const info = await InfoUser.findOne({ userId });
  const email = info?.email || (/\S+@\S+\.\S+/.test(user?.username) ? user.username : null);
  if (!email) return;

  const { fecha, hora } = formatFechaHora(reminder.fecha);
  await sendReminderEmail(email, `⏰ Recordatorio de ${reminder.tipo}`, {
    ...reminder.toObject(),
    horarios: [`${fecha} ${hora}`],
    nombrePersona: info?.name ? `${info.name} ${info.lastName || ''}`.trim() : "Paciente",
  });

  // Descontar stock
  if (reminder.cantidadDisponible > 0) {
    reminder.cantidadDisponible -= 1;
    if (reminder.cantidadDisponible === 0) reminder.completed = true;
    await reminder.save();
  } else {
    reminder.completed = true;
    await reminder.save();
  }
});

// 🔹 Programar recordatorio
const scheduleReminder = async (reminder) => {
  if (!reminder.fecha || !reminder.userId) return;
  await agenda.start();

  // Cancelar jobs viejos
  await agenda.cancel({ "data.reminderId": reminder._id.toString() });

  const reminderIdStr = reminder._id.toString();
  const frecuencia = reminder.frecuencia?.toLowerCase();

  let fechaRecordatorio =
    reminder.tipo === "control"
      ? new Date(reminder.fecha.getTime() - 60 * 60 * 1000)
      : reminder.fecha;

  if (reminder.frecuencia === "Diaria") {
    await agenda.create("send-reminder", { userId: reminder.userId, reminderId: reminderIdStr })
      .schedule(reminder.fecha)
      .save();

    await agenda.create("send-reminder", { userId: reminder.userId, reminderId: reminderIdStr })
      .repeatEvery("1 day", { skipImmediate: true })
      .save();
  } else if (reminder.frecuencia === "Semanal") {
    await agenda.create("send-reminder", { userId: reminder.userId, reminderId: reminderIdStr })
      .schedule(reminder.fecha)
      .save();

    await agenda.create("send-reminder", { userId: reminder.userId, reminderId: reminderIdStr })
      .repeatEvery("1 week", { skipImmediate: true })
      .save();
  } else {
    await agenda.create("send-reminder", { userId: reminder.userId, reminderId: reminderIdStr })
      .schedule(fechaRecordatorio)
      .save();
  }
};

// 🔹 Inicializar Agenda
const initAgenda = async () => {
  await agenda.start();
  const recordatorios = await Reminder.find({ fecha: { $gte: new Date() }, completed: false });
  for (const r of recordatorios) {
    await scheduleReminder(r);
  }
};

module.exports = { agenda, initAgenda, scheduleReminder };
