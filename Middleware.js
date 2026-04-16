const jwt = require("jsonwebtoken");

const verificarToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Acceso denegado",
      mensaje: "No se proporcionó un token de acceso. Usa el header: Authorization: Bearer <token>",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.usuario = payload; // { id, rol, iat, exp }
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Token expirado",
        mensaje: "Tu access token de 15 segundos ha expirado. Usa /refresh-token para obtener uno nuevo.",
        solucion: "POST /refresh-token con tu refreshToken",
      });
    }
    return res.status(403).json({
      error: "Token inválido",
      mensaje: "El token proporcionado no es válido.",
    });
  }
};

/**
 * Middleware para verificar rol específico.
 * Se usa DESPUÉS de verificarToken.
 * @param {string} rolRequerido - El rol que debe tener el usuario
 */
const verificarRol = (rolRequerido) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ error: "No autenticado" });
    }

    if (req.usuario.rol !== rolRequerido) {
      return res.status(403).json({
        error: "Acceso prohibido",
        mensaje: `Esta ruta requiere el rol: "${rolRequerido}". Tu rol es: "${req.usuario.rol}"`,
      });
    }

    next();
  };
};

module.exports = { verificarToken, verificarRol };