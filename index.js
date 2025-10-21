require('dotenv').config();
const { Client, GatewayIntentBits, Events, EmbedBuilder } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent, // Necesario para leer contenido de DMs
  ],
});

client.once(Events.ClientReady, c => {
  console.log(`Bot conectado como ${c.user.tag}`);

  client.user.setPresence({
    activities: [{ name: '/annonmsg · /annondm @user', type: 3 }],
    status: 'online'
  });
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'annonmsg') {
    const message = interaction.options.getString('message');

    const embed = new EmbedBuilder()
      .setColor(0x000000)
      .setTitle('Anonymous message:')
      .setDescription(`\n${message}`)

    await interaction.channel.send({ embeds: [embed] });

    // Confirmar al usuario
    await interaction.reply({
      content: 'Your message was sent anonymously.',
      ephemeral: true
    });
  }

    if (interaction.commandName === 'annondm') {
    const targetUser = interaction.options.getUser('user');
    const message = interaction.options.getString('message');

    // Verificar que no se envíe mensaje a sí mismo
    if (targetUser.id === interaction.user.id) {
      return interaction.reply({
        content: 'You cannot send anonymous messages to yourself.',
        ephemeral: true
      });
    }

    // Verificar que no sea un bot
    if (targetUser.bot) {
      return interaction.reply({
        content: 'You cannot send anonymous messages to bots.',
        ephemeral: true
      });
    }

    try {
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle('Anonymous Direct Message:')
        .setDescription(message)
        .setFooter({ text: 'Someone sent you an anonymous message' })
        .setTimestamp();

      await targetUser.send({ embeds: [embed] });

      // Log del mensaje (opcional, para moderación)
      console.log(`[ANONDM] ${interaction.user.tag} (${interaction.user.id}) -> ${targetUser.tag} (${targetUser.id}): ${message}`);

      await interaction.reply({
        content: `Your anonymous message was sent to ${targetUser.tag}.`,
        ephemeral: true
      });

    } catch (error) {
      console.error('Error sending DM:', error);
      
      await interaction.reply({
        content: 'Could not send the message. The user may have DMs disabled or doesn\'t share a server with the bot.',
        ephemeral: true
      });
    }
  }
});

client.login(process.env.TOKEN);