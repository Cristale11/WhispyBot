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
      .setDescription(`\n${message}`);

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

    anonymousMessages.set(sentMessage.id, interaction.user.id);

    await interaction.reply({
      content: "Your message was sent anonymously.",
      ephemeral: true,
    });
  }

  if (interaction.commandName === "annondm") {
    const targetUser = interaction.options.getUser("user");
    const message = interaction.options.getString("message");

    // Verificar que no se envíe mensaje a sí mismo
    if (targetUser.id === interaction.user.id) {
      return interaction.reply({
        content: "You cannot send anonymous messages to yourself.",
        ephemeral: true,
      });
    }

    // Verificar que no sea un bot
    if (targetUser.bot) {
      return interaction.reply({
        content: "You cannot send anonymous messages to bots.",
        ephemeral: true,
      });
    }

    try {
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle("Anonymous Direct Message:")
        .setDescription(message)
        .setFooter({ text: "Someone sent you an anonymous message" })
        .setTimestamp();

      await targetUser.send({ embeds: [embed] });

      // Log del mensaje (opcional, para moderación)
      console.log(
        `[ANONDM] ${interaction.user.tag} (${interaction.user.id}) -> ${targetUser.tag} (${targetUser.id}): ${message}`
      );

      await interaction.reply({
        content: `Your anonymous message was sent to ${targetUser.tag}.`,
        ephemeral: true,
      });
    } catch (error) {
      console.error("Error sending DM:", error);

      await interaction.reply({
        content:
          "Could not send the message. The user may have DMs disabled or doesn't share a server with the bot.",
        ephemeral: true,
      });
    }
  }
  if (interaction.isButton()) {
    if (interaction.customId === "reply_anonymous") {
      const messageId = interaction.message.id;
      const originalAuthorId = anonymousMessages.get(messageId);

      if (!originalAuthorId) {
        return interaction.reply({
          content: "❌ Could not find the original author of this message.",
          ephemeral: true,
        });
      }

      // Crear modal para la respuesta
      const modal = new ModalBuilder()
        .setCustomId(`reply_modal_${originalAuthorId}`)
        .setTitle("Reply Anonymously:");

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
    if (interaction.customId.startsWith("reply_modal_")) {
      const originalAuthorId = interaction.customId.replace("reply_modal_", "");
      const replyMessage = interaction.fields.getFieldValue("reply_message");

      try {
        const originalAuthor = await client.users.fetch(originalAuthorId);

        const embed = new EmbedBuilder()
          .setColor(0x5865f2)
          .setTitle("Anonymous Reply to Your Message")
          .setDescription(replyMessage)
          .setFooter({
            text: "Someone replied anonymously to your message in a server",
          })
          .setTimestamp();

        await originalAuthor.send({ embeds: [embed] });

        console.log(
          `[REPLY] ${interaction.user.tag} (${interaction.user.id}) -> ${originalAuthor.tag} (${originalAuthor.id}): ${replyMessage}`
        );

        await interaction.reply({
          content: "Your anonymous reply was sent successfully!",
          ephemeral: true,
        });
      } catch (error) {
        console.error("Error sending reply:", error);

        await interaction.reply({
          content: "Could not send the reply. The user may have DMs disabled.",
          ephemeral: true,
        });
      }
    }
  }
});

client.login(process.env.TOKEN);
