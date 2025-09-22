const mongoose = require("mongoose");

const InfoUserSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  name: String,
  lastName: String,
  birthdate: String,
  phone: String,
  email: { type: String, required: true,lowercase:true, trim: true,}, // 📩 Aquí se guarda el correo del usuario
});

module.exports = mongoose.model("InfoUser", InfoUserSchema);
