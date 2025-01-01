const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config.json');

// Cria o cliente do bot
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

// Coleção de comandos
client.commands = new Collection();

// Carrega os comandos da pasta commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

const commands = [];
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
}

// Registra os comandos globalmente no Discord
const rest = new REST({ version: '10' }).setToken(config.token);

(async () => {
    try {
        console.log('Registrando comandos Slash globalmente...');

        await rest.put(
            Routes.applicationCommands(config.clientId),
            { body: commands }
        );

        console.log('Comandos Slash registrados globalmente com sucesso!');
    } catch (error) {
        console.error('Erro ao registrar os comandos:', error);
    }
})();

// Evento: Bot está pronto
client.once('ready', () => {
    console.log(`Bot conectado como ${client.user.tag}`);
});

// Evento: Interação com comandos Slash
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'Houve um erro ao executar este comando!', ephemeral: true });
    }
});

// Login do bot
client.login(config.token);
