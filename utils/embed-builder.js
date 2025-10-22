const { EmbedBuilder } = require("discord.js");
const { getColorForUser } = require("./user-colors");

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
function createAnonymousDMEmbed(message, userId, targetUserId) {
    const color = getColorForUser(userId, targetUserId);

  return new EmbedBuilder()
    .setColor(color)
    .setTitle("Anonymous Direct Message:")
    .setDescription(message)
    .setFooter({ text: "Someone sent you an anonymous message" })
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
function createReplyEmbed(originalMessage, replyMessage, userId, targetUserId, isDM = false) {
  const color = getColorForUser(userId, targetUserId);
  const footerText = isDM
    ? "Someone replied anonymously to your message"
    : "Someone replied anonymously to your message in a server";

  return new EmbedBuilder()
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
}

module.exports = {
  createAnonymousMessageEmbed,
  createAnonymousDMEmbed,
  createReplyEmbed,
};