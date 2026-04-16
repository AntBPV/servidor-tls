// =============================================
// RUTAS DE LA API
// =============================================
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const { usuarios, inventarioBiblioteca, codigosTemporal, refreshTokensStore } = require("./Database");
const { enviarCodigo2FA } = require("./Emailservice");
const { verificarToken, verificarRol } = require("./Middleware");

/**
 * POST /login-paso1
 * Recibe correo + contraseña → valida credenciales → envía código 2FA por email
 */
router.post("/login-paso1", async (req, res) => {
  const { correo, password } = req.body;

  if (!correo || !password) {
    return res.status(400).json({
      error: "Faltan datos",
      mensaje: "Se requiere 'correo' y 'password' en el body.",
    });
  }

  const usuario = usuarios.find(
    (u) => u.correo === correo && u.password === password
  );

  if (!usuario) {
    return res.status(401).json({
      error: "Credenciales incorrectas",
      mensaje: "El correo o la contraseña no son correctos.",
    });
  }

  const codigo = Math.floor(1000 + Math.random() * 9000).toString();

  codigosTemporal[correo] = {
    codigo,
    expira: Date.now() + 5 * 60 * 1000, // 5 minutos
  };

  try {
    await enviarCodigo2FA(correo, codigo);
    console.log(`[2FA] Código enviado a ${correo}: ${codigo}`); // Para depuración

    return res.status(200).json({
      mensaje: "✅ Código de verificación enviado a tu correo.",
      instruccion: "Usa ese código en POST /login-paso2 junto con tu correo.",
    });
  } catch (error) {
    console.error("[ERROR] No se pudo enviar el correo:", error.message);
    return res.status(500).json({
      error: "Error al enviar correo",
      mensaje: "No se pudo enviar el código. Verifica tu configuración de Gmail en .env",
      detalle: error.message,
    });
  }
});


/**
 * POST /login-paso2
 * Valida el código 2FA → entrega Access Token (15s) + Refresh Token (1 día)
 */
router.post("/login-paso2", (req, res) => {
  const { correo, codigo } = req.body;

  if (!correo || !codigo) {
    return res.status(400).json({
      error: "Faltan datos",
      mensaje: "Se requiere 'correo' y 'codigo' en el body.",
    });
  }

  const registro = codigosTemporal[correo];

  if (!registro) {
    return res.status(400).json({
      error: "Sin código pendiente",
      mensaje: "No hay ningún código activo para este correo. Inicia sesión con /login-paso1 primero.",
    });
  }

  if (Date.now() > registro.expira) {
    delete codigosTemporal[correo];
    return res.status(401).json({
      error: "Código expirado",
      mensaje: "El código de verificación ha expirado (5 min). Vuelve a iniciar sesión.",
    });
  }

  if (registro.codigo !== codigo) {
    return res.status(401).json({
      error: "Código incorrecto",
      mensaje: "El código ingresado no es válido.",
    });
  }

  delete codigosTemporal[correo];

  const usuario = usuarios.find((u) => u.correo === correo);

  const accessToken = jwt.sign(
    { id: usuario.id, rol: usuario.rol, nombre: usuario.nombre },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "15s" }
  );

  const refreshToken = crypto.randomBytes(64).toString("hex");
  const expiraRefresh = Date.now() + 24 * 60 * 60 * 1000; // 1 día

  refreshTokensStore[refreshToken] = {
    usuarioId: usuario.id,
    expira: expiraRefresh,
  };

  console.log(`[AUTH] Usuario "${usuario.nombre}" (${usuario.rol}) autenticado exitosamente.`);

  return res.status(200).json({
    mensaje: `🎉 Bienvenido, ${usuario.nombre}! Autenticación exitosa.`,
    rol: usuario.rol,
    accessToken,
    refreshToken,
    nota: "⚠️ El accessToken expira en 15 segundos. Usa /refresh-token para renovarlo.",
  });
});

/**
 * GET /mi-espacio
 * Solo para rol: "estudiante"
 * Devuelve los libros prestados del estudiante
 */
router.get("/mi-espacio", verificarToken, verificarRol("estudiante"), (req, res) => {
  const usuario = usuarios.find((u) => u.id === req.usuario.id);

  return res.status(200).json({
    mensaje: `📖 Bienvenido a tu espacio, ${usuario.nombre}`,
    rol: usuario.rol,
    librosPrestados: usuario.librosPrestados || [],
    total: (usuario.librosPrestados || []).length,
  });
});

/**
 * GET /dashboard-admin
 * Solo para rol: "admin"
 * Devuelve el inventario completo de la biblioteca
 */
router.get("/dashboard-admin", verificarToken, verificarRol("admin"), (req, res) => {
  const totalLibros = inventarioBiblioteca.reduce((sum, libro) => sum + libro.total, 0);
  const librosDisponibles = inventarioBiblioteca.reduce((sum, libro) => sum + libro.disponibles, 0);
  const librosPrestados = totalLibros - librosDisponibles;

  return res.status(200).json({
    mensaje: `🛡️ Panel de Administración - Biblioteca`,
    admin: req.usuario.nombre,
    resumen: {
      totalTitulos: inventarioBiblioteca.length,
      totalEjemplares: totalLibros,
      disponibles: librosDisponibles,
      prestados: librosPrestados,
    },
    inventario: inventarioBiblioteca,
  });
});

/**
 * POST /refresh-token
 * Ruta pública: recibe un Refresh Token válido → devuelve nuevo Access Token (15s)
 */
router.post("/refresh-token", (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      error: "Falta el refreshToken",
      mensaje: "Envía el campo 'refreshToken' en el body.",
    });
  }

  const registro = refreshTokensStore[refreshToken];

  if (!registro) {
    return res.status(403).json({
      error: "Refresh token inválido",
      mensaje: "Este token no existe o ya fue utilizado/eliminado.",
    });
  }

  if (Date.now() > registro.expira) {
    delete refreshTokensStore[refreshToken];
    return res.status(403).json({
      error: "Refresh token expirado",
      mensaje: "Tu sesión ha caducado (más de 1 día). Debes iniciar sesión nuevamente.",
    });
  }

  const usuario = usuarios.find((u) => u.id === registro.usuarioId);

  if (!usuario) {
    return res.status(403).json({
      error: "Usuario no encontrado",
      mensaje: "El usuario asociado a este token ya no existe.",
    });
  }

  const nuevoAccessToken = jwt.sign(
    { id: usuario.id, rol: usuario.rol, nombre: usuario.nombre },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "15s" }
  );

  console.log(`[REFRESH] Nuevo accessToken generado para "${usuario.nombre}"`);

  return res.status(200).json({
    mensaje: "🔄 Access Token renovado exitosamente.",
    accessToken: nuevoAccessToken,
    nota: "⚠️ Este nuevo accessToken también expira en 15 segundos.",
  });
});

router.get("/", (req, res) => {
  res.json({
    sistema: "📚 Biblioteca Segura - API",
    version: "1.0.0",
    estado: "🟢 Activo",
    rutas: {
      "POST /login-paso1": "Paso 1 - Envía código 2FA a tu correo",
      "POST /login-paso2": "Paso 2 - Valida código y obtiene tokens",
      "GET  /mi-espacio": "🔐 [Solo estudiante] Ver libros prestados",
      "GET  /dashboard-admin": "🔐 [Solo admin] Ver inventario",
      "POST /refresh-token": "Renovar Access Token sin re-autenticar",
    },
  });
});

module.exports = router;