const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require("discord.js");
const {
  getAnonymousMessage,
  saveAnonymousMessage,
  markUserReplied,
} = require("../utils/message-storage");
const { createReplyEmbed } = require("../utils/embed-builder");
const client = require("../config/client");

/**
 * Maneja las interacciones de modales
 * @param {Interaction} interaction - La interacción del modal
 */
async function handleModalInteraction(interaction) {
  if (!interaction.isModalSubmit()) return;

  // Manejo de modal de respuesta en canal
  if (
    interaction.customId.startsWith("reply_modal_") &&
    !interaction.customId.startsWith("reply_modal_dm_")
  ) {
    await handleReplyModal(interaction, false);
  }

  // Manejo de modal de respuesta en DM
  if (interaction.customId.startsWith("reply_modal_dm_")) {
    await handleReplyModal(interaction, true);
  }
}

/**
 * Maneja el modal de respuesta (reutilizable para canal y DM)
 * @param {Interaction} interaction - La interacción del modal
 * @param {boolean} isDM - Si es respuesta a DM
 */
async function handleReplyModal(interaction, isDM) {
  const prefix = isDM ? "reply_modal_dm_" : "reply_modal_";
  const parts = interaction.customId.replace(prefix, "").split("_");
  const originalAuthorId = parts[0];
  const messageId = parts[1];
  const userId = interaction.user.id;
  const replyMessage = interaction.fields.getTextInputValue("reply_message");
  const messageData = getAnonymousMessage(messageId);

  try {
    const originalAuthor = await client.users.fetch(originalAuthorId);
    const { getConversationFromMessage } = require("../utils/user-colors");
    const conversationId = getConversationFromMessage(messageId) || messageId;

    // Crear embed de respuesta
    const embed = createReplyEmbed(
      messageData?.originalMessage,
      replyMessage,
      conversationId,
      isDM
    );

    // Crear botón de respuesta
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(isDM ? "reply_anonymous_dm" : "reply_anonymous")
        .setLabel("Reply")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("💬"),
      new ButtonBuilder()
        .setCustomId("delete_anonymous_dm")
        .setLabel("Delete")
        .setStyle(ButtonStyle.Danger)
        .setEmoji("🗑️")
    );


    // Enviar respuesta
    const sentReply = await originalAuthor.send({
      embeds: [embed],
      components: [row],
    });

    const { registerMessageToConversation } = require("../utils/user-colors");
    registerMessageToConversation(sentReply.id, conversationId);

    // Guardar la respuesta para permitir nuevas replies
    saveAnonymousMessage(sentReply.id, userId, replyMessage);

    // Marcar que el usuario respondió
    markUserReplied(messageId, userId);

    // Log para moderación
    console.log(
      `[REPLY] ${interaction.user.tag} (${interaction.user.id}) -> ${originalAuthor.tag} (${originalAuthor.id}): ${replyMessage}`
    );

    await interaction.reply({
      content: "Your anonymous reply was sent successfully!",
      flags: MessageFlags.Ephemeral,
    });
  } catch (error) {
    console.error("Error sending reply:", error);

    await interaction.reply({
      content: "Could not send the reply. The user may have DMs disabled.",
      flags: MessageFlags.Ephemeral,
    });
  }
}

module.exports = { handleModalInteraction };
