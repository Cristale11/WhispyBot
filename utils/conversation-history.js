// Sistema de gestión de historial de conversaciones

const fs = require('fs');
const path = require('path');

// Ruta del archivo de persistencia
const HISTORY_FILE = path.join(__dirname, '..', 'data', 'conversation-history.json');

// Almacena el historial de cada conversación
// Estructura: conversationId → { currentMessageId, currentIndex, messages[] }
const conversationHistories = new Map();

/**
 * Guarda el historial en un archivo JSON
 */
function saveHistoryToFile() {
  try {
    // Crear directorio si no existe
    const dir = path.dirname(HISTORY_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Convertir Map a objeto para JSON
    const historyObject = {};
    conversationHistories.forEach((value, key) => {
      historyObject[key] = value;
    });

    // Guardar en archivo
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(historyObject, null, 2), 'utf8');
    console.log(`[HISTORY] Guardado: ${conversationHistories.size} conversaciones`);
  } catch (error) {
    console.error('[ERROR] No se pudo guardar el historial:', error);
  }
}

/**
 * Carga el historial desde el archivo JSON
 */
function loadHistoryFromFile() {
  try {
    if (!fs.existsSync(HISTORY_FILE)) {
      console.log('[HISTORY] No existe archivo de historial - empezando desde cero');
      return;
    }

    const data = fs.readFileSync(HISTORY_FILE, 'utf8');
    const historyObject = JSON.parse(data);

    // Convertir objeto a Map
    conversationHistories.clear();
    Object.keys(historyObject).forEach(key => {
      conversationHistories.set(key, historyObject[key]);
    });

    console.log(`[HISTORY] Cargado: ${conversationHistories.size} conversaciones del historial`);
  } catch (error) {
    console.error('[ERROR] No se pudo cargar el historial:', error);
  }
}

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
  
  // Auto-guardar después de cada cambio
  saveHistoryToFile();
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
    // Auto-guardar después de cambiar índice
    saveHistoryToFile();
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
    // Auto-guardar después de actualizar messageId
    saveHistoryToFile();
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
  // Auto-guardar después de eliminar
  saveHistoryToFile();
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
  loadHistoryFromFile,
  saveHistoryToFile,
  addMessageToHistory,
  getConversationHistory,
  getMessageAtIndex,
  setCurrentIndex,
  updateCurrentMessageId,
  getCurrentMessageId,
  deleteConversationHistory,
  getHistoryStats,
};