// Sistema de asignación de colores únicos por usuario y conversación

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

// Mapa para almacenar el color asignado a cada usuario en cada conversación
// Estructura: Map<conversationKey, color>
// conversationKey = "conversationId_userId_targetUserId"
const conversationColors = new Map();

/**
 * Genera una clave única para una conversación entre dos usuarios
 * @param {string} userId1 - ID del primer usuario
 * @param {string} userId2 - ID del segundo usuario
 * @returns {string} - Clave única de la conversación
 */
function getConversationKey(userId1, userId2) {
  // Ordenar IDs alfabéticamente para que A->B y B->A tengan la misma clave
  const ids = [userId1, userId2].sort();
  return `${ids[0]}_${ids[1]}`;
}

/**
 * Genera un color único basado en el ID del usuario y su conversación
 * Cada conversación nueva tendrá un color diferente para el mismo usuario
 * @param {string} userId - ID del usuario que envía el mensaje
 * @param {string} targetUserId - ID del usuario que recibe el mensaje
 * @returns {number} - Color en formato hexadecimal
 */
function getColorForConversation(userId, targetUserId) {
  // Validar que ambos IDs existen
  if (!userId || typeof userId !== 'string' || !targetUserId || typeof targetUserId !== 'string') {
    console.error('getColorForConversation: IDs inválidos:', { userId, targetUserId });
    return COLOR_PALETTE[0]; // Devolver primer color por defecto
  }

  const conversationKey = getConversationKey(userId, targetUserId);
  const userInConversationKey = `${conversationKey}_${userId}`;

  // Si ya tiene un color asignado en esta conversación, devolverlo
  if (conversationColors.has(userInConversationKey)) {
    return conversationColors.get(userInConversationKey);
  }

  // Generar un hash combinando userId y conversationKey
  let hash = 0;
  const combinedString = userInConversationKey;
  
  for (let i = 0; i < combinedString.length; i++) {
    hash = (hash << 5) - hash + combinedString.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }

  // Usar el hash para seleccionar un color de la paleta
  const colorIndex = Math.abs(hash) % COLOR_PALETTE.length;
  const color = COLOR_PALETTE[colorIndex];

  // Guardar el color asignado para esta conversación
  conversationColors.set(userInConversationKey, color);

  console.log(`[COLOR] Usuario ${userId} en conversación con ${targetUserId}: ${colorToHex(color)}`);

  return color;
}

/**
 * Función legacy para mantener compatibilidad con respuestas
 * Usa color basado solo en userId (para respuestas sin contexto)
 * @param {string} userId - ID del usuario
 * @returns {number} - Color en formato hexadecimal
 */
function getColorForUser(userId) {
  if (!userId || typeof userId !== 'string') {
    console.error('getColorForUser: userId inválido:', userId);
    return COLOR_PALETTE[0];
  }

  // Para respuestas, usar un hash simple del userId
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash = hash & hash;
  }

  const colorIndex = Math.abs(hash) % COLOR_PALETTE.length;
  return COLOR_PALETTE[colorIndex];
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
    totalConversations: conversationColors.size,
    colorsInUse: new Set(conversationColors.values()).size,
    availableColors: COLOR_PALETTE.length,
  };
}

/**
 * Limpia el caché de colores (útil para testing)
 */
function clearColorCache() {
  conversationColors.clear();
}

module.exports = {
  getColorForUser,
  getColorForConversation,
  colorToHex,
  getColorStats,
  clearColorCache,
};