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

  // Manejo de botón "delete_anonymous_dm" (eliminar DM)
  if (interaction.customId === "delete_anonymous_dm") {
    await handleDeleteButton(interaction);
  }

  // Manejo de botones de navegación (Prev/Next)
  if (interaction.customId.startsWith("nav_prev_") || interaction.customId.startsWith("nav_next_")) {
    await handleNavigationButton(interaction);
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
  
  // Primero intentar obtener de message-storage (mensajes recientes)
  let messageData = getAnonymousMessage(messageId);
  
  // Si no está en message-storage, obtener del historial de conversación
  if (!messageData) {
    const { getConversationFromMessage } = require("../utils/user-colors");
    const { getConversationHistory } = require("../utils/conversation-history");
    
    const conversationId = getConversationFromMessage(messageId);
    
    if (conversationId) {
      const history = getConversationHistory(conversationId);
      
      if (history && history.messages.length > 0) {
        // Obtener el authorId del primer mensaje (quien inició la conversación)
        const firstMessage = history.messages[0];
        
        // Determinar quién es el autor original (el otro participante)
        const authorId = firstMessage.targetId === userId 
          ? firstMessage.authorId 
          : firstMessage.targetId;
        
        messageData = {
          authorId: authorId,
          originalMessage: "Previous message in conversation",
        };
        
        console.log(`[REPLY] Obtenido authorId del historial: ${authorId}`);
      }
    }
  }

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

  // Mostrar modal inmediatamente
  try {
    await interaction.showModal(modal);
  } catch (error) {
    if (error.code === 10062) {
      console.log('[WARN] Interacción expiró antes de mostrar modal - el usuario debe volver a clickear [Reply]');
    } else {
      console.error('[ERROR] Error mostrando modal:', error);
    }
  }
}

/**
 * Maneja el botón de eliminar mensaje anónimo
 * @param {Interaction} interaction - La interacción del botón
 */
async function handleDeleteButton(interaction) {
  try {
    // Eliminar el mensaje
    await interaction.message.delete();

    // Opcional: enviar confirmación efímera (el mensaje ya estará eliminado)
    // No podemos responder porque el mensaje ya no existe
    console.log(`[DELETE] Usuario ${interaction.user.tag} (${interaction.user.id}) eliminó un mensaje anónimo`);
  } catch (error) {
    console.error("Error deleting message:", error);

    // Si falla, intentar responder
    try {
      await interaction.reply({
        content: "Could not delete the message. It may have already been deleted.",
        flags: MessageFlags.Ephemeral,
      });
    } catch (replyError) {
      // Ignorar si no puede responder
      console.error("Could not send error message:", replyError);
    }
  }
}

/**
 * Maneja los botones de navegación del historial
 * @param {Interaction} interaction - La interacción del botón
 */
async function handleNavigationButton(interaction) {
  try {
    // Parsear el customId: nav_prev_conversationId_currentIndex o nav_next_conversationId_currentIndex
    const parts = interaction.customId.split("_");
    const direction = parts[1]; // "prev" o "next"
    const conversationId = parts.slice(2, -1).join("_"); // Puede tener underscores en el ID
    const currentIndex = parseInt(parts[parts.length - 1]);
    
    const {
      getConversationHistory,
      getMessageAtIndex,
      getCurrentMessageId,
      updateCurrentMessageId,
      setCurrentIndex
    } = require("../utils/conversation-history");
    const { createNavigationButtons } = require("../utils/button-helpers");
    const { createAnonymousDMEmbed, createReplyEmbed } = require("../utils/embed-builder");
    
    // Calcular nuevo índice
    const newIndex = direction === "prev" ? currentIndex - 1 : currentIndex + 1;
    
    // Obtener historial
    const history = getConversationHistory(conversationId);
    if (!history) {
      return interaction.reply({
        content: "Could not find conversation history.",
        flags: MessageFlags.Ephemeral,
      });
    }
    
    // Validar índice
    if (newIndex < 0 || newIndex >= history.messages.length) {
      return interaction.reply({
        content: "No more messages in that direction.",
        flags: MessageFlags.Ephemeral,
      });
    }
    
    // Obtener mensaje del historial
    const messageData = getMessageAtIndex(conversationId, newIndex);
    const totalMessages = history.messages.length;
    
    // Crear embed según el tipo de mensaje
    let embed;
    if (messageData.type === "initial_dm") {
      embed = createAnonymousDMEmbed(
        messageData.message,
        conversationId,
        newIndex,
        totalMessages
      );
    } else {
      embed = createReplyEmbed(
        messageData.originalMessage,
        messageData.replyMessage,
        conversationId,
        messageData.type === "reply_dm",
        newIndex,
        totalMessages
      );
    }
    
    // Crear botones actualizados
    const isDM = messageData.type === "reply_dm" || messageData.type === "initial_dm";
    const row = createNavigationButtons(conversationId, newIndex, totalMessages, isDM);
    
    // EDITAR el mensaje existente en lugar de crear/eliminar
    try {
      await interaction.update({
        embeds: [embed],
        components: [row],
      });
      
      // Actualizar solo el índice (el messageId no cambia)
      setCurrentIndex(conversationId, newIndex);
      
      // IMPORTANTE: Guardar authorId para Reply
      // Siempre usar el primer mensaje para determinar el "otro" participante
      const { saveAnonymousMessage } = require("../utils/message-storage");
      const firstMessage = history.messages[0];
      
      // El authorId siempre es el "otro" participante
      const authorId = firstMessage.targetId === interaction.user.id 
        ? firstMessage.authorId 
        : firstMessage.targetId;
      
      // Obtener el ID del mensaje actual (no cambia, solo se edita)
      const currentMessageId = getCurrentMessageId(conversationId);
      
      // Guardar con el authorId correcto
      saveAnonymousMessage(
        currentMessageId,
        authorId,
        messageData.message || messageData.replyMessage || messageData.originalMessage || "Message"
      );
      
      console.log(`[NAV] Navegado a ${newIndex + 1}/${totalMessages} - authorId: ${authorId}`);
      
    } catch (error) {
      console.error('[ERROR] Error editando mensaje:', error);
      
      // Si falla editar, informar
      try {
        await interaction.reply({
          content: "Error navigating through messages.",
          flags: MessageFlags.Ephemeral,
        });
      } catch (replyError) {
        console.error('[ERROR] No se pudo enviar mensaje de error:', replyError);
      }
    }
    
  } catch (error) {
    console.error("Error handling navigation:", error);
    
    try {
      await interaction.reply({
        content: "Error navigating through messages.",
        flags: MessageFlags.Ephemeral,
      });
    } catch (replyError) {
      console.error("Could not send error message:", replyError);
    }
  }
}

module.exports = { handleButtonInteraction };