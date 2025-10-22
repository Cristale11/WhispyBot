// Sistema de asignación de colores únicos por conversación

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

// Mapa para almacenar el color asignado a cada conversación
// Estructura: Map<conversationId, color>
const conversationColors = new Map();

// Mapa para rastrear qué conversación pertenece a cada mensaje
// Estructura: Map<messageId, conversationId>
const messageToConversation = new Map();

/**
 * Genera un color único basado en el ID de la conversación
 * @param {string} conversationId - ID único de la conversación (primer mensaje)
 * @returns {number} - Color en formato hexadecimal
 */
function getColorForConversation(conversationId) {
  // Validar que conversationId existe
  if (!conversationId || typeof conversationId !== 'string') {
    console.error('getColorForConversation: conversationId inválido:', conversationId);
    return COLOR_PALETTE[0]; // Devolver primer color por defecto
  }

  // Si ya tiene un color asignado, devolverlo
  if (conversationColors.has(conversationId)) {
    return conversationColors.get(conversationId);
  }

  // Generar un hash del conversationId
  let hash = 0;
  for (let i = 0; i < conversationId.length; i++) {
    hash = (hash << 5) - hash + conversationId.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }

  // Usar el hash para seleccionar un color de la paleta
  const colorIndex = Math.abs(hash) % COLOR_PALETTE.length;
  const color = COLOR_PALETTE[colorIndex];

  // Guardar el color asignado para esta conversación
  conversationColors.set(conversationId, color);

  console.log(`[COLOR] Nueva conversación ${conversationId}: ${colorToHex(color)}`);

  return color;
}

/**
 * Registra qué conversación pertenece a un mensaje
 * @param {string} messageId - ID del mensaje
 * @param {string} conversationId - ID de la conversación
 */
function registerMessageToConversation(messageId, conversationId) {
  messageToConversation.set(messageId, conversationId);
}

/**
 * Obtiene el ID de conversación de un mensaje
 * @param {string} messageId - ID del mensaje
 * @returns {string|null} - ID de la conversación o null si no existe
 */
function getConversationFromMessage(messageId) {
  return messageToConversation.get(messageId) || null;
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
    trackedMessages: messageToConversation.size,
  };
}

/**
 * Limpia el caché de colores (útil para testing)
 */
function clearColorCache() {
  conversationColors.clear();
  messageToConversation.clear();
}

module.exports = {
  getColorForConversation,
  registerMessageToConversation,
  getConversationFromMessage,
  colorToHex,
  getColorStats,
  clearColorCache,
};