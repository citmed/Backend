const mongoose = require("mongoose");

const InfoUserSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  name: String,
  lastName: String,
  birthdate: String,
  phone: String,
  email: String, // 📩 Aquí se guarda el correo del usuario
});

module.exports = mongoose.model("InfoUser", InfoUserSchema);
