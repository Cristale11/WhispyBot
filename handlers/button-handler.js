const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  MessageFlags,
} = require("discord.js");
const {
  getAnonymousMessage,
  hasUserReplied,
} = require("../utils/messageStorage");

/**
 * Maneja las interacciones de botones
 * @param {Interaction} interaction - La interacción del botón
 */
async function handleButtonInteraction(interaction) {
  if (!interaction.isButton()) return;

  // Manejo de botón "reply_anonymous" (respuesta en canal)
  if (interaction.customId === "reply_anonymous") {
    await handleReplyButton(interaction, false);
  }

  // Manejo de botón "reply_anonymous_dm" (respuesta en DM)
  if (interaction.customId === "reply_anonymous_dm") {
    await handleReplyButton(interaction, true);
  }
}

/**
 * Maneja el botón de respuesta (reutilizable para canal y DM)
 * @param {Interaction} interaction - La interacción del botón
 * @param {boolean} isDM - Si es respuesta a DM
 */
async function handleReplyButton(interaction, isDM) {
  const messageId = interaction.message.id;
  const userId = interaction.user.id;
  const messageData = getAnonymousMessage(messageId);

  if (!messageData) {
    return interaction.reply({
      content: "Could not find the original author of this message.",
      flags: MessageFlags.Ephemeral,
    });
  }

  // Verificar si el usuario ya respondió
  if (hasUserReplied(messageId, userId)) {
    return interaction.reply({
      content: "You have already replied to this message.",
      flags: MessageFlags.Ephemeral,
    });
  }

  // Crear el modal
  const modalId = isDM
    ? `reply_modal_dm_${messageData.authorId}_${messageId}`
    : `reply_modal_${messageData.authorId}_${messageId}`;

  const modal = new ModalBuilder()
    .setCustomId(modalId)
    .setTitle(isDM ? "Reply Anonymously" : "Reply Anonymously (Beta)");

  const replyInput = new TextInputBuilder()
    .setCustomId("reply_message")
    .setLabel("Your anonymous reply")
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder("Type your anonymous reply here...")
    .setRequired(true)
    .setMaxLength(1000);

  const actionRow = new ActionRowBuilder().addComponents(replyInput);
  modal.addComponents(actionRow);

  await interaction.showModal(modal);
}

module.exports = { handleButtonInteraction };