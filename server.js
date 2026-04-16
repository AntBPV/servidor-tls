require("dotenv").config();

const express = require("express");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
  next();
});

const rutas = require("./Routes");
app.use("/", rutas);

app.use((req, res) => {
  res.status(404).json({
    error: "Ruta no encontrada",
    mensaje: `La ruta ${req.method} ${req.path} no existe.`,
    rutasDisponibles: ["POST /login-paso1", "POST /login-paso2", "GET /mi-espacio", "GET /dashboard-admin", "POST /refresh-token"],
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("\n╔════════════════════════════════════════╗");
  console.log("║     📚 BIBLIOTECA SEGURA - API         ║");
  console.log("╠════════════════════════════════════════╣");
  console.log(`║  🟢 Servidor corriendo en puerto ${PORT}   ║`);
  console.log("╠════════════════════════════════════════╣");
  console.log("║  RUTAS DISPONIBLES:                    ║");
  console.log("║  POST /login-paso1  (Envía código)     ║");
  console.log("║  POST /login-paso2  (Valida código)    ║");
  console.log("║  GET  /mi-espacio   (Rol: estudiante)  ║");
  console.log("║  GET  /dashboard-admin (Rol: admin)    ║");
  console.log("║  POST /refresh-token (Renovar token)   ║");
  console.log("╚════════════════════════════════════════╝\n");

  if (!process.env.GMAIL_USER || process.env.GMAIL_USER.includes("tu_correo")) {
    console.warn("⚠️  AVISO: Configura GMAIL_USER en tu archivo .env");
  }
  if (!process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_APP_PASSWORD.includes("contraseña")) {
    console.warn("⚠️  AVISO: Configura GMAIL_APP_PASSWORD en tu archivo .env");
  }
});

module.exports = app;