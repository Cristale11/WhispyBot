const { EmbedBuilder } = require("discord.js");
const { getColorForConversation } = require("./user-colors");

/**
 * Crea un embed para mensaje anónimo en canal
 * @param {string} message - Contenido del mensaje
 * @returns {EmbedBuilder}
 */
function createAnonymousMessageEmbed(message) {
  return new EmbedBuilder()
    .setColor(0x000000)
    .setTitle("Anonymous message:")
    .setDescription(`\n${message}`)
    .setFooter({ text: "Someone sent an anonymous message" })
    .setTimestamp();
}

/**
 * Crea un embed para mensaje anónimo directo
 * @param {string} message - Contenido del mensaje
 * @param {string} userId - ID del usuario (para asignar color)
 * @returns {EmbedBuilder}
 */
function createAnonymousDMEmbed(
  message,
  conversationId,
  currentIndex = null,
  totalMessages = null,
  isRandom = false
) {
  const color = getColorForConversation(conversationId);

  let description = message;

  // Agregar contador si se proporciona
  if (currentIndex !== null && totalMessages !== null && totalMessages > 1) {
    description = `📊 Message ${
      currentIndex + 1
    } of ${totalMessages}\n\n${message}`;
  }

  const title = isRandom
    ? "Random Anonymous Message:"
    : "Anonymous Direct Message:";
  const footerText = isRandom
    ? "Someone random from the server sent you an anonymous message"
    : "Someone sent you an anonymous message";

  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(message)
    .setFooter({ text: footerText })
    .setTimestamp();
}

/**
 * Crea un embed para respuesta anónima
 * @param {string} originalMessage - Mensaje original
 * @param {string} userId - ID del usuario (para asignar color)
 * @param {string} replyMessage - Mensaje de respuesta
 * @param {boolean} isDM - Si es respuesta a DM
 * @returns {EmbedBuilder}
 */
function createReplyEmbed(
  originalMessage,
  replyMessage,
  conversationId,
  isDM = false,
  currentIndex = null,
  totalMessages = null
) {
  const color = getColorForConversation(conversationId);
  const footerText = isDM
    ? "Someone replied anonymously to your message"
    : "Someone replied anonymously to your message in a server";

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle("Anonymous reply to your message")
    .addFields({
      name: "Your original message:",
      value: originalMessage || "Message not found",
      inline: false,
    })
    .addFields({
      name: "Anonymous reply:",
      value: replyMessage,
      inline: false,
    })
    .setFooter({ text: footerText })
    .setTimestamp();

  // Agregar contador si se proporciona
  if (currentIndex !== null && totalMessages !== null && totalMessages > 1) {
    embed.setDescription(`📊 Message ${currentIndex + 1} of ${totalMessages}`);
  }

  return embed;
}

module.exports = {
  createAnonymousMessageEmbed,
  createAnonymousDMEmbed,
  createReplyEmbed,
};
