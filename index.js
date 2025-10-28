require("dotenv").config();
const {
  Events,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  EmbedBuilder,
} = require("discord.js");
const client = require("./config/client");
const { saveAnonymousMessage } = require("./utils/message-storage");
const {
  createAnonymousMessageEmbed,
  createAnonymousDMEmbed,
} = require("./utils/embed-builder");
const { handleButtonInteraction } = require("./handlers/button-handler");
const { handleModalInteraction } = require("./handlers/modal-handler");
const { loadHistoryFromFile } = require("./utils/conversation-history");

// Evento: Bot listo
client.once(Events.ClientReady, (c) => {
  console.log(`Bot conectado como ${c.user.tag}`);

  loadHistoryFromFile();

  client.user.setPresence({
    activities: [{ name: "/annonmsg · /annondm @user", type: 3 }],
    status: "online",
  });
});

// Evento: Interacciones
client.on(Events.InteractionCreate, async (interaction) => {
  // ========== COMANDOS ==========
  if (interaction.isCommand()) {
    // Comando: /annonmsg
    if (interaction.commandName === "annonmsg") {
      const message = interaction.options.getString("message");

      const embed = createAnonymousMessageEmbed(message);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("reply_anonymous")
          .setLabel("Reply")
          .setStyle(ButtonStyle.Primary)
          .setEmoji("💬")
      );

      try {
        const sentMessage = await interaction.channel.send({
          embeds: [embed],
          components: [row],
        });

        saveAnonymousMessage(sentMessage.id, interaction.user.id, message);

        await interaction.reply({
          content: "Your message was sent anonymously.",
          flags: MessageFlags.Ephemeral,
        });
      } catch (error) {
        console.error(
          `[ERROR] Failed to send anonymous message in channel ${interaction.channel.id}: ${error.message}`
        );

        if (error.code === 50013) {
          // Missing Permissions
          return interaction.reply({
            content:
              "I don't have permission to send messages in this channel. Please ask a server admin to give me the `Send Messages` permission.",
            flags: MessageFlags.Ephemeral,
          });
        }

        // Other errors
        return interaction.reply({
          content:
            "Failed to send the anonymous message. Please try again later.",
          flags: MessageFlags.Ephemeral,
        });
      }
    }

    // Comando: /annondm
    if (interaction.commandName === "annondm") {
      const targetUser = interaction.options.getUser("user");
      const message = interaction.options.getString("message");

      // Verificar que no se envíe mensaje a sí mismo
      if (targetUser.id === interaction.user.id) {
        return interaction.reply({
          content: "You cannot send anonymous messages to yourself.",
          flags: MessageFlags.Ephemeral,
        });
      }

      // Verificar que no sea un bot
      if (targetUser.bot) {
        return interaction.reply({
          content: "You cannot send anonymous messages to bots.",
          flags: MessageFlags.Ephemeral,
        });
      }

      try {
        // Generar un ID único para esta conversación
        const conversationId =
          Date.now().toString() + Math.random().toString(36).substring(2);

        // Crear embed con el color correcto desde el inicio
        const {
          registerMessageToConversation,
        } = require("./utils/user-colors");
        const {
          addMessageToHistory,
          updateCurrentMessageId,
        } = require("./utils/conversation-history");
        const embed = createAnonymousDMEmbed(message, conversationId);

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("reply_anonymous_dm")
            .setLabel("Reply")
            .setStyle(ButtonStyle.Primary)
            .setEmoji("💬"),
          new ButtonBuilder()
            .setCustomId("delete_anonymous_dm")
            .setLabel("Delete")
            .setStyle(ButtonStyle.Danger)
            .setEmoji("🗑️")
        );

        // Enviar mensaje con el color correcto desde el principio
        const sentDM = await targetUser.send({
          embeds: [embed],
          components: [row],
        });

        // Registrar la conversación
        registerMessageToConversation(sentDM.id, conversationId);
        saveAnonymousMessage(sentDM.id, interaction.user.id, message);

        // Inicializar historial de conversación
        addMessageToHistory(conversationId, sentDM.id, {
          type: "initial_dm",
          message: message,
          authorId: interaction.user.id,
          targetId: targetUser.id,
        });
        updateCurrentMessageId(conversationId, sentDM.id);

        // Log del mensaje (opcional, para moderación)
        console.log(
          `[ANONMD] ${interaction.user.tag} (${interaction.user.id}) -> ${targetUser.tag} (${targetUser.id}): ${message}`
        );

        await interaction.reply({
          content: `Your anonymous message was sent to ${targetUser.tag}.`,
          flags: MessageFlags.Ephemeral,
        });
      } catch (error) {
        console.error("Error sending DM:", error);

        await interaction.reply({
          content:
            "Could not send the message. The user may have DMs disabled or doesn't share a server with the bot.",
          flags: MessageFlags.Ephemeral,
        });
      }
    }

    if (interaction.commandName === "randomdm") {
      const message = interaction.options.getString("message");

      // Responder inmediatamente
      await interaction.reply({
        content: "Searching for a random user...",
        flags: MessageFlags.Ephemeral,
      });

      let targetUser = null;
      let attempts = 0;
      const MAX_ATTEMPTS = 50;

      // Obtener miembros UNA SOLA VEZ (fuera del bucle)
      const guild = interaction.guild;
      const members = await guild.members.fetch();

      // Filtrar miembros válidos (no bots, no el usuario actual)
      const validMembers = members.filter(
        (member) => !member.user.bot && member.id !== interaction.user.id
      );

      if (validMembers.size === 0) {
        return interaction.editReply({
          content: "No valid users found in this server.",
        });
      }

      console.log(
        `[RANDOMDM] ${validMembers.size} usuarios válidos disponibles`
      );

      // Bucle para encontrar usuario con DMs activados
      while (!targetUser && attempts < MAX_ATTEMPTS) {
        attempts++;

        // Elegir miembro aleatorio de los válidos
        const randomMember = validMembers.random();

        // Solo verificar DMs
        try {
          await randomMember.createDM();
          targetUser = randomMember.user;
          console.log(
            `[RANDOMDM] ✅ Usuario encontrado en intento ${attempts}: ${targetUser.tag}`
          );
        } catch (error) {
          console.log(
            `[RANDOMDM] Intento ${attempts}: DMs desactivados - reintentando`
          );

          if (validMembers.size === 0) {
            return interaction.editReply({
              content:
                "No users with DMs enabled found after checking all members.",
            });
          }
          continue;
        }
      }

      if (!targetUser) {
        return interaction.editReply({
          content: `Could not find a user with DMs enabled after ${MAX_ATTEMPTS} attempts.`,
        });
      }

      // Enviar mensaje (resto del código igual)
      try {
        const conversationId =
          Date.now().toString() + Math.random().toString(36).substring(2);
        const {
          registerMessageToConversation,
        } = require("./utils/user-colors");
        const {
          addMessageToHistory,
          updateCurrentMessageId,
        } = require("./utils/conversation-history");

        const embed = createAnonymousDMEmbed(message, conversationId, null, null, true);
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("reply_anonymous_dm")
            .setLabel("Reply")
            .setStyle(ButtonStyle.Primary)
            .setEmoji("💬"),
          new ButtonBuilder()
            .setCustomId("delete_anonymous_dm")
            .setLabel("Delete")
            .setStyle(ButtonStyle.Danger)
            .setEmoji("🗑️")
        );

        const sentDM = await targetUser.send({
          embeds: [embed],
          components: [row],
        });

        registerMessageToConversation(sentDM.id, conversationId);
        saveAnonymousMessage(sentDM.id, interaction.user.id, message);

        addMessageToHistory(conversationId, sentDM.id, {
          type: "initial_dm",
          message: message,
          authorId: interaction.user.id,
          targetId: targetUser.id,
        });
        updateCurrentMessageId(conversationId, sentDM.id);

        console.log(
          `[RANDOMDM] ${interaction.user.tag} (${interaction.user.id}) -> ${targetUser.tag} (${targetUser.id}): ${message}`
        );

        await interaction.editReply({
          content: `Your anonymous message was sent to a random user!`,
        });
      } catch (error) {
        console.error("[ERROR] Error sending random DM:", error);
        await interaction.editReply({
          content: "Could not send the message. Please try again.",
        });
      }
    }
  }

  // ========== BOTONES ==========
  await handleButtonInteraction(interaction);

  // ========== MODALES ==========
  await handleModalInteraction(interaction);
});

// ===== MANEJADORES DE ERRORES (ANTES DEL LOGIN) =====

process.on("unhandledRejection", (error) => {
  // Error 10062 = Unknown interaction (timeout normal de Discord)
  if (error.code === 10062) {
    console.log("[INFO] Interacción expiró (>3s) - esto es normal");
    return;
  }

  // Error 50013 = Missing Permissions
  if (error.code === 50013) {
    console.log(
      "[WARN] Missing Permissions - el bot no tiene permisos necesarios"
    );
    return;
  }

  console.error("[ERROR] Unhandled promise rejection:", error);
});

process.on("uncaughtException", (error) => {
  console.error("[ERROR] Uncaught exception:", error);
  // No hacer process.exit() para que el bot siga funcionando
});

client.on("error", (error) => {
  console.error("[ERROR] Discord client error:", error);
});

// Login
client.login(process.env.TOKEN);
