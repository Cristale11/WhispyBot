// Almacenamiento de mensajes anónimos y respuestas
const anonymousMessages = new Map();
const userReplies = new Map();

/**
 * Guarda un mensaje anónimo
 * @param {string} messageId - ID del mensaje
 * @param {string} authorId - ID del autor
 * @param {string} originalMessage - Contenido del mensaje
 */
function saveAnonymousMessage(messageId, authorId, originalMessage) {
  anonymousMessages.set(messageId, {
    authorId,
    originalMessage,
  });
}

/**
 * Obtiene los datos de un mensaje anónimo
 * @param {string} messageId - ID del mensaje
 * @returns {Object|undefined} Datos del mensaje o undefined
 */
function getAnonymousMessage(messageId) {
  return anonymousMessages.get(messageId);
}

/**
 * Verifica si un usuario ya respondió a un mensaje
 * @param {string} messageId - ID del mensaje
 * @param {string} userId - ID del usuario
 * @returns {boolean}
 */
function hasUserReplied(messageId, userId) {
  const replyKey = `${messageId}_${userId}`;
  return userReplies.has(replyKey);
}

/**
 * Marca que un usuario respondió a un mensaje
 * @param {string} messageId - ID del mensaje
 * @param {string} userId - ID del usuario
 */
function markUserReplied(messageId, userId) {
  const replyKey = `${messageId}_${userId}`;
  userReplies.set(replyKey, true);
}

module.exports = {
  saveAnonymousMessage,
  getAnonymousMessage,
  hasUserReplied,
  markUserReplied,
};