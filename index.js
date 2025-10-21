require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  Events,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageFlags,
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent, // Necesario para leer contenido de DMs
  ],
});
const anonymousMessages = new Map();
const userReplies = new Map();

client.once(Events.ClientReady, (c) => {
  console.log(`Bot conectado como ${c.user.tag}`);

  client.user.setPresence({
    activities: [{ name: "/annonmsg · /annondm @user", type: 3 }],
    status: "online",
  });
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.commandName === "annonmsg") {
    const message = interaction.options.getString("message");

    const embed = new EmbedBuilder()
      .setColor(0x000000)
      .setTitle("Anonymous message:")
      .setDescription(`\n${message}`)
      .setFooter({ text: "Someone sent an anonymous message" })
      .setTimestamp();

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

    anonymousMessages.set(sentMessage.id, {
      authorId: interaction.user.id,
      originalMessage: message,
    });
    await interaction.reply({
      content: "Your message was sent anonymously.",
      flags: MessageFlags.Ephemeral,
    });
  }

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
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle("Anonymous Direct Message:")
        .setDescription(message)
        .setFooter({ text: "Someone sent you an anonymous message" })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("reply_anonymous_dm") // ✅ NUEVO customId
          .setLabel("Reply")
          .setStyle(ButtonStyle.Primary)
          .setEmoji("💬")
      );

      const sentDM = await targetUser.send({
        embeds: [embed],
        components: [row] // ✅ NUEVO
      });

      anonymousMessages.set(sentDM.id, {
        authorId: interaction.user.id,
        originalMessage: message,
      });

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
  if (interaction.isButton()) {
    if (interaction.customId === "reply_anonymous") {
      const messageId = interaction.message.id;
      const userId = interaction.user.id; // ✅ NUEVO
      const messageData = anonymousMessages.get(messageId);

      if (!messageData) {
        return interaction.reply({
          content: "Could not find the original author of this message.",
          flags: MessageFlags.Ephemeral,
        });
      }

      const replyKey = `${messageId}_${userId}`;
      if (userReplies.has(replyKey)) {
        return interaction.reply({
          content: "You have already replied to this message.",
          flags: MessageFlags.Ephemeral,
        });
      }

      // Crear modal para la respuesta
      const modal = new ModalBuilder()
        .setCustomId(`reply_modal_${messageData.authorId}_${messageId}`)
        .setTitle("Reply Anonymously (Beta)");

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

    if (interaction.customId === "reply_anonymous_dm") {
      const messageId = interaction.message.id;
      const userId = interaction.user.id;
      const messageData = anonymousMessages.get(messageId);

      if (!messageData) {
        return interaction.reply({
          content: "Could not find the original author of this message.",
          flags: MessageFlags.Ephemeral,
        });
      }

      // ✅ Verificar si este usuario ya respondió a este mensaje
      const replyKey = `${messageId}_${userId}`;
      if (userReplies.has(replyKey)) {
        return interaction.reply({
          content: "You have already replied to this message.",
          flags: MessageFlags.Ephemeral,
        });
      }

      const modal = new ModalBuilder()
        .setCustomId(`reply_modal_dm_${messageData.authorId}_${messageId}`)
        .setTitle("Reply Anonymously");

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
  }

  // Manejo de modales
  if (interaction.isModalSubmit()) {
    if (interaction.customId.startsWith("reply_modal_") &&
      !interaction.customId.startsWith("reply_modal_dm_")) {
      const parts = interaction.customId.replace("reply_modal_", "").split("_");
      const originalAuthorId = parts[0];
      const messageId = parts[1];
      const userId = interaction.user.id;
      const replyMessage =
        interaction.fields.getTextInputValue("reply_message");
      const messageData = anonymousMessages.get(messageId);

      try {
        const originalAuthor = await client.users.fetch(originalAuthorId);

        const embed = new EmbedBuilder()
          .setColor(0x5865f2)
          .setTitle("Anonymous reply to your message")
          .addFields({
            name: "Your original message:",
            value: messageData?.originalMessage || "Message not found",
            inline: false,
          })
          .addFields({
            name: "Anonymous reply:",
            value: replyMessage,
            inline: false,
          })
          .setFooter({
            text: "Someone replied anonymously to your message in a server",
          })
          .setTimestamp();
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("reply_anonymous")
            .setLabel("Reply")
            .setStyle(ButtonStyle.Primary)
            .setEmoji("💬")
        );

        const sentReply = await originalAuthor.send({
          embeds: [embed],
          components: [row] // ✅ NUEVO
        });

        // ✅ NUEVO: Guardar la respuesta para permitir reply
        anonymousMessages.set(sentReply.id, {
          authorId: userId,
          originalMessage: replyMessage,
        });

        const replyKey = `${messageId}_${userId}`;
        userReplies.set(replyKey, true);

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
  }
  if (interaction.customId.startsWith("reply_modal_dm_")) {
    const parts = interaction.customId.replace("reply_modal_dm_", "").split("_");
    const originalAuthorId = parts[0];
    const messageId = parts[1];
    const userId = interaction.user.id;
    const replyMessage = interaction.fields.getTextInputValue("reply_message");
    const messageData = anonymousMessages.get(messageId);

    try {
      const originalAuthor = await client.users.fetch(originalAuthorId);

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("Anonymous reply to your message")
        .addFields({
          name: "Your original message:",
          value: messageData?.originalMessage || "Message not found",
          inline: false,
        })
        .addFields({
          name: "Anonymous reply:",
          value: replyMessage,
          inline: false,
        })
        .setFooter({
          text: "Someone replied anonymously to your message in a server",
        })
        .setTimestamp();
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("reply_anonymous")
          .setLabel("Reply")
          .setStyle(ButtonStyle.Primary)
          .setEmoji("💬")
      );

      const sentReply = await originalAuthor.send({
        embeds: [embed],
        components: [row] // ✅ NUEVO
      });

      anonymousMessages.set(sentReply.id, {
        authorId: userId,
        originalMessage: replyMessage,
      });

      const replyKey = `${messageId}_${userId}`;
      userReplies.set(replyKey, true);

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
});

client.login(process.env.TOKEN);
