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
    const { 
      addMessageToHistory, 
      getConversationHistory,
      getCurrentMessageId,
      updateCurrentMessageId 
    } = require("../utils/conversation-history");
    const { createNavigationButtons } = require("../utils/button-helpers");
    
    // Obtener el conversationId del mensaje original
    const conversationId = getConversationFromMessage(messageId) || messageId;

    // Obtener mensaje anterior para eliminarlo ANTES de enviar el nuevo
    const previousMessageId = getCurrentMessageId(conversationId);
    console.log(`[DEBUG-REPLY] ConversationID: ${conversationId}`);
    console.log(`[DEBUG-REPLY] PreviousMessageID: ${previousMessageId || 'NINGUNO (primer mensaje)'}`);
    
    // Agregar mensaje al historial
    addMessageToHistory(conversationId, null, {
      type: isDM ? "reply_dm" : "reply_channel",
      originalMessage: messageData?.originalMessage,
      replyMessage: replyMessage,
      authorId: userId,
    });
    
    // Obtener historial actualizado
    const history = getConversationHistory(conversationId);
    const totalMessages = history ? history.messages.length : 1;
    const currentIndex = totalMessages - 1;

    // Crear embed de respuesta con contador
    const embed = createReplyEmbed(
      messageData?.originalMessage,
      replyMessage,
      conversationId,
      isDM,
      currentIndex,
      totalMessages
    );

    // Crear botones con navegación
    const row = createNavigationButtons(conversationId, currentIndex, totalMessages, isDM);

    // Enviar respuesta
    const sentReply = await originalAuthor.send({
      embeds: [embed],
      components: [row],
    });
    
    console.log(`[DEBUG-REPLY] Nuevo mensaje enviado con ID: ${sentReply.id}`);

    // Registrar el mensaje de respuesta con el mismo conversationId
    const { registerMessageToConversation } = require("../utils/user-colors");
    registerMessageToConversation(sentReply.id, conversationId);
    
    // Actualizar el ID del mensaje actual
    updateCurrentMessageId(conversationId, sentReply.id);
    console.log(`[DEBUG-REPLY] CurrentMessageID actualizado a: ${sentReply.id}`);
    
    // ELIMINAR mensaje anterior DESPUÉS de enviar el nuevo (para evitar gaps)
    if (previousMessageId) {
      console.log(`[DEBUG-REPLY] Intentando eliminar mensaje anterior: ${previousMessageId}`);
      try {
        const channel = await originalAuthor.createDM();
        const previousMessage = await channel.messages.fetch(previousMessageId);
        await previousMessage.delete();
        console.log(`[REPLY] ✅ Mensaje anterior ${previousMessageId} eliminado - solo se muestra el más reciente`);
      } catch (error) {
        console.log(`[REPLY] ❌ No se pudo eliminar mensaje anterior ${previousMessageId}: ${error.message}`);
      }
    } else {
      console.log(`[DEBUG-REPLY] No hay mensaje anterior para eliminar (es el primer mensaje de la conversación)`);
    }

    // Guardar la respuesta para permitir nuevas replies
    saveAnonymousMessage(sentReply.id, userId, replyMessage);

    // Marcar que el usuario respondió
    markUserReplied(messageId, userId);

    // Log para moderación
    console.log(
      `[REPLY] ${interaction.user.tag} (${interaction.user.id}) -> ${originalAuthor.tag} (${originalAuthor.id}): ${replyMessage}`
    );

    // Responder al usuario
    try {
      await interaction.reply({
        content: "Your anonymous reply was sent successfully!",
        flags: MessageFlags.Ephemeral,
      });
    } catch (replyError) {
      // Error 10062 = Usuario tardó >3s en enviar el modal
      if (replyError.code === 10062) {
        console.log('[INFO] Usuario tardó >3s en enviar modal - reply ya fue enviado correctamente');
        // El mensaje ya se envió correctamente, solo no podemos confirmar al usuario
        return;
      }
      console.error('[ERROR] Error enviando confirmación:', replyError);
    }
  } catch (error) {
    console.error("Error sending reply:", error);

    // Intentar responder al usuario sobre el error
    try {
      await interaction.reply({
        content: "Could not send the reply. The user may have DMs disabled.",
        flags: MessageFlags.Ephemeral,
      });
    } catch (replyError) {
      // Si también falla responder el error, solo loggearlo
      if (replyError.code === 10062) {
        console.log('[INFO] No se pudo enviar mensaje de error - interacción expiró');
      } else {
        console.error('[ERROR] Error enviando mensaje de error:', replyError);
      }
    }
  }
}

module.exports = { handleModalInteraction };