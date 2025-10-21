require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
  new SlashCommandBuilder()
    .setName('annonmsg')
    .setDescription('Send an anonymous message.')
    .addStringOption(option =>
      option
        .setName('message')
        .setDescription('The message you want to send anonymously.')
        .setRequired(true)
    )
    .toJSON(),


  new SlashCommandBuilder()
    .setName('annondm')
    .setDescription('Send an anonymous direct message to a user.')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user you want to send the message to.')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('message')
        .setDescription('The anonymous message content.')
        .setRequired(true)
        .setMaxLength(1000)
    )
    .toJSON(),
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('Registrando comando global /annonmsg');
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands },
    );
    console.log('Comando global registrado correctamente.');
    console.log('   - /annonmsg (mensajes en canal)');
    console.log('   - /annonmd (mensajes directos)');
  } catch (error) {
    console.error(error);
  }
})();
