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

// Evento: Bot listo
client.once(Events.ClientReady, (c) => {
  console.log(`Bot conectado como ${c.user.tag}`);

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

      const sentMessage = await interaction.channel.send({
        embeds: [embed],
        components: [row],
      });

      saveAnonymousMessage(sentMessage.id, interaction.user.id, message);

      await interaction.reply({
        content: "Your message was sent anonymously.",
        flags: MessageFlags.Ephemeral,
      });
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
        // Crear un ID de conversación único
        const conversationId = `${Date.now()}-${Math.floor(
          Math.random() * 10000
        )}`;

        const {
          registerMessageToConversation,
        } = require("./utils/user-colors");

        // Crear el embed final con ese ID
        const finalEmbed = createAnonymousDMEmbed(message, conversationId);

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("reply_anonymous_dm")
            .setLabel("Reply")
            .setStyle(ButtonStyle.Primary)
            .setEmoji("💬")
        );

        // Enviar el mensaje directo
        const sentDM = await targetUser.send({
          embeds: [finalEmbed],
          components: [row],
        });

        // Registrar la conversación
        registerMessageToConversation(conversationId, conversationId); // esto ahora fija el color
        saveAnonymousMessage(sentDM.id, interaction.user.id, message);

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
  }

  // ========== BOTONES ==========
  await handleButtonInteraction(interaction);

  // ========== MODALES ==========
  await handleModalInteraction(interaction);
});

// Login
client.login(process.env.TOKEN);
