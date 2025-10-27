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
  
  if (!originalAuthorId || originalAuthorId === 'undefined') {
    console.error('[ERROR] originalAuthorId es undefined - no se puede enviar reply');
    return interaction.reply({
      content: "Error: Could not find the recipient of this message. Please try again.",
      flags: MessageFlags.Ephemeral,
    }).catch(err => console.error('[ERROR] No se pudo enviar mensaje de error:', err));
  }

  try {
    const originalAuthor = await client.users.fetch(originalAuthorId);
    const { getConversationFromMessage } = require("../utils/user-colors");
    const { 
      addMessageToHistory, 
      getConversationHistory,
      updateCurrentMessageId
    } = require("../utils/conversation-history");
    const { createNavigationButtons } = require("../utils/button-helpers");
    
    // Obtener el conversationId del mensaje original
    const conversationId = getConversationFromMessage(messageId) || messageId;
    
    // Agregar mensaje al historial - IMPORTANTE: incluir authorId y targetId
    addMessageToHistory(conversationId, null, {
      type: isDM ? "reply_dm" : "reply_channel",
      originalMessage: messageData?.originalMessage,
      replyMessage: replyMessage,
      authorId: userId,  // Quien envía la respuesta
      targetId: originalAuthorId,  // Quien la recibe
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

    // SOLUCIÓN: Eliminar solo los mensajes de ESTA conversación antes de enviar el nuevo
    try {
      const channel = await originalAuthor.createDM();
      const messages = await channel.messages.fetch({ limit: 100 });
      
      // Filtrar solo mensajes del bot que pertenecen a ESTA conversación
      const { getConversationFromMessage } = require("../utils/user-colors");
      const botMessages = messages.filter(msg => {
        if (msg.author.id !== client.user.id) return false;
        const msgConversationId = getConversationFromMessage(msg.id);
        return msgConversationId === conversationId;
      });
      
      console.log(`[CLEANUP] Encontrados ${botMessages.size} mensajes de conversación ${conversationId} en DM de ${originalAuthor.tag}`);
      
      // Eliminar solo los mensajes de esta conversación
      for (const [id, message] of botMessages) {
        try {
          await message.delete();
          console.log(`[CLEANUP] ✅ Mensaje ${id} eliminado`);
        } catch (err) {
          console.log(`[CLEANUP] ⚠️ No se pudo eliminar ${id}: ${err.message}`);
        }
      }
    } catch (error) {
      console.log(`[CLEANUP] ⚠️ Error limpiando mensajes: ${error.message}`);
    }

    // Enviar respuesta (ahora el DM está limpio para esta conversación)
    const sentReply = await originalAuthor.send({
      embeds: [embed],
      components: [row],
    });
    
    console.log(`[REPLY] ✅ Nuevo mensaje enviado con ID: ${sentReply.id}`);

    // Registrar el mensaje de respuesta con el mismo conversationId
    const { registerMessageToConversation } = require("../utils/user-colors");
    registerMessageToConversation(sentReply.id, conversationId);
    
    // Actualizar el ID del mensaje actual
    updateCurrentMessageId(conversationId, sentReply.id);

    // Guardar la respuesta para permitir nuevas replies
    // IMPORTANTE: El authorId aquí es quien ENVIÓ este mensaje (userId)
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