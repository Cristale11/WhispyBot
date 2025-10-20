require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
  new SlashCommandBuilder()
    .setName('annonmsg')
    .setDescription('Send an anonymous message.')
    .addStringOption(option =>
      option
        .setName('mensaje')
        .setDescription('The message you want to send anonymously.')
        .setRequired(true)
    )
    .toJSON(),
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('Registrando comando global /anonmsg');
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands },
    );
    console.log('Comando global registrado correctamente.');
  } catch (error) {
    console.error(error);
  }
})();
