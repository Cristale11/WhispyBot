const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

/**
 * Crea los botones para un mensaje DM con navegación de historial
 * @param {string} conversationId - ID de la conversación
 * @param {number} currentIndex - Índice actual
 * @param {number} totalMessages - Total de mensajes
 * @param {boolean} isDM - Si es respuesta a DM
 * @returns {ActionRowBuilder}
 */
function createNavigationButtons(conversationId, currentIndex, totalMessages, isDM = true) {
  const buttons = [];
  
  // Botón Prev (solo si no es el primer mensaje)
  if (currentIndex > 0) {
    buttons.push(
      new ButtonBuilder()
        .setCustomId(`nav_prev_${conversationId}_${currentIndex}`)
        .setEmoji("⬅️")
        .setStyle(ButtonStyle.Secondary)
    );
  }
  
  // Botón Next (solo si no es el último mensaje)
  if (currentIndex < totalMessages - 1) {
    buttons.push(
      new ButtonBuilder()
        .setCustomId(`nav_next_${conversationId}_${currentIndex}`)
        .setEmoji("➡️")
        .setStyle(ButtonStyle.Secondary)
    );
  }
  
  // Botón Reply
  buttons.push(
    new ButtonBuilder()
      .setCustomId(isDM ? "reply_anonymous_dm" : "reply_anonymous")
      .setLabel("Reply")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("💬")
  );
  
  // Botón Delete
  buttons.push(
    new ButtonBuilder()
      .setCustomId("delete_anonymous_dm")
      .setLabel("Delete")
      .setStyle(ButtonStyle.Danger)
      .setEmoji("🗑️")
  );
  
  return new ActionRowBuilder().addComponents(...buttons);
}

module.exports = {
  createNavigationButtons,
};