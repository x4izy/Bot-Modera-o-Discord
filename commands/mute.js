const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');

// IDs para o servidor e canal de log
const logServerId = '1323379456827592787'; // Substitua pelo ID do servidor de log
const logChannelId = '1323804133907632139';   // Substitua pelo ID do canal de log

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Aplica um castigo de mute a um usuário.')
        .addUserOption(option =>
            option.setName('usuário')
                .setDescription('O membro que você deseja mutar.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('tempo')
                .setDescription('Duração do mute (ex: 10m, 1h, 1d).')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('motivo')
                .setDescription('Motivo do mute.')
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const user = interaction.options.getUser('usuário');
        const duration = interaction.options.getString('tempo');
        const reason = interaction.options.getString('motivo') || 'Sem motivo especificado'; 

        const member = interaction.guild.members.cache.get(user.id);

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return interaction.editReply({ content: '❌ Você não tem permissão para usar este comando.' });
        }

        if (!member) {
            return interaction.editReply({ content: '❌ Membro não encontrado no servidor!' });
        }

        if (!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return interaction.editReply({ content: '❌ Eu não tenho permissão para aplicar mute nos membros!' });
        }

        const timeInMs = convertTimeToMs(duration);
        if (!timeInMs) {
            return interaction.editReply({ content: '❌ Por favor, forneça um tempo válido (ex: 10m, 1h, 1d).' });
        }

        try {
            const inviter = interaction.user;

            // Embed enviado ao usuário mutado (DM)
            const dmEmbed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setTitle('🔇 Você foi mutado')
                .setDescription(`Você recebeu um mute no servidor **${interaction.guild.name}**.`)
                .addFields(
                    { name: 'Motivo', value: reason },
                    { name: 'Duração', value: duration, inline: true },
                    { name: 'Data do Mute', value: new Date().toLocaleString(), inline: true },
                    { name: 'Aplicado por', value: `<@${inviter.id}>`, inline: true }
                )
                .setFooter({ text: 'Caso ache que sua punição foi injusta, entre em contato com um moderador.' })
                .setTimestamp();

            await user.send({ embeds: [dmEmbed] }).catch(error => {
                console.error(`Não foi possível enviar mensagem privada para ${user.tag}.`, error);
            });

            // Aplicar o mute
            await member.timeout(timeInMs, reason);

            // Embed para o log no canal específico
            const logEmbed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setTitle('🔇 Membro Mutado')
                .addFields(
                    { name: 'Usuário', value: `<@${user.id}> (${user.tag})`, inline: true },
                    { name: 'ID', value: `${user.id}`, inline: true },
                    { name: 'Motivo', value: reason },
                    { name: 'Duração', value: duration, inline: true },
                    { name: 'Mutado por', value: `<@${inviter.id}>`, inline: true },
                    { name: 'Data e Hora', value: new Date().toLocaleString(), inline: false }
                )
                .setFooter({ text: `Ação realizada por ${inviter.tag}`, iconURL: inviter.displayAvatarURL() })
                .setTimestamp();

            // Obter o servidor e canal de log
            const logServer = interaction.client.guilds.cache.get(logServerId);
            if (logServer) {
                const logChannel = logServer.channels.cache.get(logChannelId);
                if (logChannel) {
                    await logChannel.send({ embeds: [logEmbed] });
                } else {
                    console.warn(`Canal de log com ID ${logChannelId} não foi encontrado no servidor ${logServerId}.`);
                }
            } else {
                console.warn(`Servidor de log com ID ${logServerId} não foi encontrado.`);
            }

            // Responder ao comando com menção ao usuário mutado
            await interaction.editReply({
                content: `✅ Usuário <@${user.id}> foi mutado com sucesso.`,
                embeds: [logEmbed]
            });
        } catch (error) {
            console.error('Erro ao aplicar mute no membro:', error);
            await interaction.editReply({ content: '❌ Ocorreu um erro ao tentar mutar este membro.' });
        }
    },
};

// Função para converter tempo (ex: 10m, 1h, 1d) em milissegundos
function convertTimeToMs(time) {
    const regex = /^(\d+)([smhd])$/;
    const match = time.match(regex);

    if (!match) return null;

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
        case 's': return value * 1000; // segundos
        case 'm': return value * 60 * 1000; // minutos
        case 'h': return value * 60 * 60 * 1000; // horas
        case 'd': return value * 24 * 60 * 60 * 1000; // dias
        default: return null;
    }
}
