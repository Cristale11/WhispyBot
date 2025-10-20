require('dotenv').config();
const { Client, GatewayIntentBits, Events, EmbedBuilder } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ],
});

client.once(Events.ClientReady, c => {
  console.log(`Bot conectado como ${c.user.tag}`);

  client.user.setPresence({
    activities: [{ name: '/annonmsg', type: 3 }],
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
});

client.login(process.env.TOKEN);