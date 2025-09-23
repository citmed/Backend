const mongoose = require("mongoose");

const reminderSchema = new mongoose.Schema({
  tipo: {
    type: String, // "control" o "medicamento"
    required: true,
  },
  titulo: {
    type: String,
    required: true,
  },
  fecha: {
    type: Date,
    required: true,
  },
  descripcion: {
    type: String,
    required: true,
  },
  frecuencia: {
    type: String,
    enum: ["Diaria", "Semanal", "Personalizada", "Unica"],
    default: "Unica",
    required: true,
  },
  horarios: {
    type: [String], // ["08:00", "18:00"]
    default: [],
  },
  dosis: Number,
  unidad: String,
  cantidadDisponible: Number,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  creadoEn: {
    type: Date,
    default: Date.now,
  },
  completed: {
    type: Boolean, // ✅ Paciente confirma
    default: false,
  },
  sent: {
    type: Boolean, // ✅ Se envió correo, independiente de si el paciente tomó o no
    default: false,
  },
  intervaloPersonalizado: {
    type: String,
    default: null,
  },
  nombrePersona: {
    type: String,
    default: "paciente",
  },
  favorito: { 
    type: Boolean, 
    default: false 
  },
});

module.exports = mongoose.model("Reminder", reminderSchema);
