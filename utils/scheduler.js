/*const schedule = require("node-schedule");
const Reminder = require("../models/reminder");
const User = require("../models/User");
const InfoUser = require("../models/InfoUser");
const sendReminderEmail = require("./sendEmail");

async function cargarRecordatorios() {
  try {
    const recordatorios = await Reminder.find();

    recordatorios.forEach(async (reminder) => {
      const user = await User.findById(reminder.userId);
      const info = await InfoUser.findOne({ userId: reminder.userId });

      const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);
      const usernameEmail = isValidEmail(user?.username) ? user.username : null;
      const email = info?.email || usernameEmail;

      if (!email) return;

      reminder.horarios.forEach((hora) => {
        const [h, m] = hora.split(":").map(Number);

        if (reminder.frecuencia === "Unica" || !reminder.frecuencia) {
          const fechaRecordatorio = new Date(reminder.fecha);
          fechaRecordatorio.setHours(h, m, 0, 0);

          // 📌 Evita programar recordatorios pasados
          if (fechaRecordatorio > new Date()) {
            schedule.scheduleJob(fechaRecordatorio, async () => {
              await sendReminderEmail(email, "⏰ Recordatorio de medicamento", {
                ...reminder.toObject(),
              });
              console.log(`📩 Recordatorio enviado a ${email} el ${fechaRecordatorio}`);
            });
          }
        } else if (reminder.frecuencia === "Diaria") {
          const rule = new schedule.RecurrenceRule();
          rule.hour = h;
          rule.minute = m;
          rule.tz = "America/Bogota";

          schedule.scheduleJob(rule, async () => {
            await sendReminderEmail(email, "⏰ Recordatorio diario de medicamento", {
              ...reminder.toObject(),
              fecha: new Date(),
            });
            console.log(`📩 Recordatorio diario enviado a ${email} a las ${hora}`);
          });
        } else if (reminder.frecuencia === "Semanal") {
          const rule = new schedule.RecurrenceRule();
          rule.dayOfWeek = reminder.fecha.getDay();
          rule.hour = h;
          rule.minute = m;
          rule.tz = "America/Bogota";

          schedule.scheduleJob(rule, async () => {
            await sendReminderEmail(email, "⏰ Recordatorio semanal de medicamento", {
              ...reminder.toObject(),
              fecha: new Date(),
            });
            console.log(
              `📩 Recordatorio semanal enviado a ${email} cada ${rule.dayOfWeek} a las ${hora}`
            );
          });
        }
      });
    });

    console.log("✅ Recordatorios cargados y reprogramados al iniciar el servidor");
  } catch (error) {
    console.error("❌ Error al cargar recordatorios:", error);
  }
}

module.exports = { cargarRecordatorios };*/
