const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');

// IDs para o servidor e canal de log
const logServerId = '1323379456827592787'; // Substitua pelo ID do servidor de log
const logChannelId = '1323804153490964541';   // Substitua pelo ID do canal de log

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Remove o mute de um usuário.')
        .addUserOption(option =>
            option.setName('usuário')
                .setDescription('O membro que você deseja desmutar.')
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const user = interaction.options.getUser('usuário');
        const member = interaction.guild.members.cache.get(user.id);

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return interaction.editReply({ content: '<:a_requisitos:1322017488489418793> | Você não tem permissão para usar este comando.' });
        }

        if (!member) {
            return interaction.editReply({ content: '<:a_requisitos:1322017488489418793> | Membro não encontrado no servidor!' });
        }

        if (!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return interaction.editReply({ content: '<:a_requisitos:1322017488489418793> | Eu não tenho permissão para remover o mute dos membros!' });
        }

        if (!member.communicationDisabledUntil) {
            return interaction.editReply({ content: '<:a_requisitos:1322017488489418793> | Este membro não está mutado.' });
        }

        try {
            const inviter = interaction.user;

            // Remover o mute
            await member.timeout(null);

            // Embed enviado ao usuário desmutado (DM)
            const dmEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🔊 Você foi desmutado')
                .setDescription(`Você foi desmutado no servidor **${interaction.guild.name}**.`)
                .addFields(
                    { name: 'Removido por', value: `<@${inviter.id}>`, inline: true },
                    { name: 'Data', value: new Date().toLocaleString(), inline: true }
                )
                .setFooter({ text: 'Siga as regras para evitar futuras punições.' })
                .setTimestamp();

            await user.send({ embeds: [dmEmbed] }).catch(error => {
                console.error(`Não foi possível enviar mensagem privada para ${user.tag}.`, error);
            });

            // Embed para o log
            const logEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🔊 Membro Desmutado')
                .addFields(
                    { name: 'Usuário', value: `<@${user.id}> (${user.tag})`, inline: true },
                    { name: 'ID', value: `${user.id}`, inline: true },
                    { name: 'Desmutado por', value: `<@${inviter.id}>`, inline: true },
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

            // Responder ao comando com menção ao usuário desmutado
            await interaction.editReply({
                content: `✅ Usuário <@${user.id}> foi desmutado com sucesso.`,
                embeds: [logEmbed]
            });
        } catch (error) {
            console.error('Erro ao remover o mute do membro:', error);
            await interaction.editReply({ content: '<:a_requisitos:1322017488489418793> | Ocorreu um erro ao tentar desmutar este membro.' });
        }
    },
};
