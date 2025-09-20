// agendaWorker.js
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { initAgenda } = require("./utils/agenda");

dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("✅ MongoDB Connected (Worker)");
    await initAgenda();
    console.log("⏳ Agenda iniciada y corriendo como Worker...");
  })
  .catch(err => console.error("❌ MongoDB connection error:", err));
