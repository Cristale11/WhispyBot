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
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'annonmsg') {
    const mensaje = interaction.options.getString('mensaje');

    const embed = new EmbedBuilder()
      .setColor(0x000000)
      .setTitle('Mensaje anonimo:')
      .setDescription(`\n${mensaje}`)

    await interaction.channel.send({ embeds: [embed] });

    // Confirmar al usuario
    await interaction.reply({ 
      content: 'Tu mensaje se envió de forma anónima.', 
      ephemeral: true 
    });
  }
});

client.login(process.env.TOKEN);