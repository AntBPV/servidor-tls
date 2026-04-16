const usuarios = [
  {
    id: 1,
    nombre: "Antonio Admin",
    correo: "antonio.benja.parra.velasquez@gmail.com", 
    password: "admin123",
    rol: "admin",
  },
  {
    id: 2,
    nombre: "Toño Estudiante",
    correo: "antonio.benja.parra.velasquez+estudiante@gmail.com",
    password: "estudiante123",
    rol: "estudiante",
    librosPrestados: [
      { id: 101, titulo: "Cien años de soledad", autor: "Gabriel García Márquez", fechaVencimiento: "2025-08-01" },
      { id: 102, titulo: "El principito", autor: "Antoine de Saint-Exupéry", fechaVencimiento: "2025-07-20" },
    ],
  },
];

const inventarioBiblioteca = [
  { id: 1, titulo: "Cien años de soledad", autor: "Gabriel García Márquez", disponibles: 2, total: 5 },
  { id: 2, titulo: "El principito", autor: "Antoine de Saint-Exupéry", disponibles: 0, total: 3 },
  { id: 3, titulo: "Don Quijote de la Mancha", autor: "Miguel de Cervantes", disponibles: 4, total: 4 },
  { id: 4, titulo: "1984", autor: "George Orwell", disponibles: 1, total: 2 },
  { id: 5, titulo: "El código Da Vinci", autor: "Dan Brown", disponibles: 3, total: 6 },
  { id: 6, titulo: "Sapiens", autor: "Yuval Noah Harari", disponibles: 2, total: 3 },
];

// Almacén temporal de códigos 2FA en memoria
// Estructura: { correo: { codigo: "1234", expira: timestamp } }
const codigosTemporal = {};

// Almacén de Refresh Tokens en memoria
// Estructura: { refreshToken: { usuarioId: 1, expira: timestamp } }
const refreshTokensStore = {};

module.exports = {
  usuarios,
  inventarioBiblioteca,
  codigosTemporal,
  refreshTokensStore,
};