// Sistema de asignación de colores únicos por usuario

// Paleta de colores vibrantes y distinguibles
const COLOR_PALETTE = [
  0xe74c3c, // Rojo
  0x3498db, // Azul
  0x2ecc71, // Verde
  0xf39c12, // Naranja
  0x9b59b6, // Púrpura
  0x1abc9c, // Verde azulado
  0xe91e63, // Rosa
  0xff9800, // Naranja oscuro
  0x00bcd4, // Cian
  0x8bc34a, // Verde claro
  0xff5722, // Naranja rojizo
  0x673ab7, // Púrpura oscuro
  0x009688, // Verde azulado oscuro
  0xffc107, // Ámbar
  0x795548, // Marrón
  0x607d8b, // Gris azulado
  0xf44336, // Rojo oscuro
  0x4caf50, // Verde medio
  0x2196f3, // Azul claro
  0xff6f00, // Naranja intenso
];

// Mapa para almacenar el color asignado a cada usuario
const userColors = new Map();

/**
 * Genera un color único basado en el ID del usuario
 * Usa un hash del ID para seleccionar un color de la paleta
 * @param {string} userId - ID del usuario
 * @returns {number} - Color en formato hexadecimal
 */
function getColorForUser(userId) {
  // Si ya tiene un color asignado, devolverlo
  if (userColors.has(userId)) {
    return userColors.get(userId);
  }

  // Generar un hash del userId para obtener un índice consistente
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }

  // Usar el hash para seleccionar un color de la paleta
  const colorIndex = Math.abs(hash) % COLOR_PALETTE.length;
  const color = COLOR_PALETTE[colorIndex];

  // Guardar el color asignado
  userColors.set(userId, color);

  return color;
}

/**
 * Convierte un color hexadecimal a formato de string para mostrar
 * @param {number} color - Color en formato hexadecimal
 * @returns {string} - Color en formato #RRGGBB
 */
function colorToHex(color) {
  return `#${color.toString(16).padStart(6, "0").toUpperCase()}`;
}

/**
 * Obtiene estadísticas de colores asignados
 * @returns {Object} - Objeto con información de colores
 */
function getColorStats() {
  return {
    totalUsers: userColors.size,
    colorsInUse: new Set(userColors.values()).size,
    availableColors: COLOR_PALETTE.length,
  };
}

/**
 * Limpia el caché de colores (útil para testing)
 */
function clearColorCache() {
  userColors.clear();
}

module.exports = {
  getColorForUser,
  colorToHex,
  getColorStats,
  clearColorCache,
};