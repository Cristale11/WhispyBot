// Sistema de gestión de historial de conversaciones

// Almacena el historial de cada conversación
// Estructura: conversationId → { currentMessageId, currentIndex, messages[] }
const conversationHistories = new Map();

/**
 * Inicializa o actualiza el historial de una conversación
 * @param {string} conversationId - ID único de la conversación
 * @param {string} messageId - ID del mensaje de Discord
 * @param {Object} messageData - Datos del mensaje
 */
function addMessageToHistory(conversationId, messageId, messageData) {
  if (!conversationHistories.has(conversationId)) {
    // Primera vez - crear historial nuevo
    conversationHistories.set(conversationId, {
      currentMessageId: messageId,
      currentIndex: 0,
      messages: [
        {
          ...messageData,
          timestamp: new Date().toISOString(),
        }
      ]
    });
  } else {
    // Agregar mensaje al historial existente
    const history = conversationHistories.get(conversationId);
    history.messages.push({
      ...messageData,
      timestamp: new Date().toISOString(),
    });
    history.currentMessageId = messageId;
    history.currentIndex = history.messages.length - 1;
  }
  
  console.log(`[HISTORY] Conversación ${conversationId}: ${conversationHistories.get(conversationId).messages.length} mensajes`);
}

/**
 * Obtiene el historial completo de una conversación
 * @param {string} conversationId - ID de la conversación
 * @returns {Object|null} - Objeto con el historial o null
 */
function getConversationHistory(conversationId) {
  return conversationHistories.get(conversationId) || null;
}

/**
 * Obtiene un mensaje específico del historial
 * @param {string} conversationId - ID de la conversación
 * @param {number} index - Índice del mensaje
 * @returns {Object|null} - Datos del mensaje o null
 */
function getMessageAtIndex(conversationId, index) {
  const history = conversationHistories.get(conversationId);
  if (!history || index < 0 || index >= history.messages.length) {
    return null;
  }
  return history.messages[index];
}

/**
 * Actualiza el índice actual de visualización
 * @param {string} conversationId - ID de la conversación
 * @param {number} newIndex - Nuevo índice
 */
function setCurrentIndex(conversationId, newIndex) {
  const history = conversationHistories.get(conversationId);
  if (history) {
    history.currentIndex = newIndex;
  }
}

/**
 * Actualiza el ID del mensaje actual en DM
 * @param {string} conversationId - ID de la conversación
 * @param {string} messageId - Nuevo ID del mensaje
 */
function updateCurrentMessageId(conversationId, messageId) {
  const history = conversationHistories.get(conversationId);
  if (history) {
    history.currentMessageId = messageId;
  }
}

/**
 * Obtiene el ID del mensaje actual en DM
 * @param {string} conversationId - ID de la conversación
 * @returns {string|null} - ID del mensaje o null
 */
function getCurrentMessageId(conversationId) {
  const history = conversationHistories.get(conversationId);
  return history ? history.currentMessageId : null;
}

/**
 * Elimina una conversación del historial
 * @param {string} conversationId - ID de la conversación
 */
function deleteConversationHistory(conversationId) {
  conversationHistories.delete(conversationId);
  console.log(`[HISTORY] Conversación ${conversationId} eliminada del historial`);
}

/**
 * Obtiene estadísticas del historial
 * @returns {Object} - Estadísticas
 */
function getHistoryStats() {
  let totalMessages = 0;
  conversationHistories.forEach(history => {
    totalMessages += history.messages.length;
  });
  
  return {
    totalConversations: conversationHistories.size,
    totalMessages: totalMessages,
  };
}

module.exports = {
  addMessageToHistory,
  getConversationHistory,
  getMessageAtIndex,
  setCurrentIndex,
  updateCurrentMessageId,
  getCurrentMessageId,
  deleteConversationHistory,
  getHistoryStats,
};