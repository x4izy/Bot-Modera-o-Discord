const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

// IDs para o servidor e canal de log
const logServerId = '1323379456827592787'; // Substitua pelo ID do servidor de log
const logChannelId = '1323804116304003145';   // Substitua pelo ID do canal de log

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Desbane um usuário pelo ID e envia uma mensagem para ele.')
        .addStringOption(option =>
            option.setName('user_id')
                .setDescription('O ID do usuário que você deseja desbanir.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('motivo')
                .setDescription('O motivo do desbanimento.')
                .setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const userId = interaction.options.getString('user_id');
        const reason = interaction.options.getString('motivo') || 'Sem motivo especificado';

        // IDs dos cargos que NÃO podem usar o comando
        const forbiddenRoles = ['1311615477100974081', '1311615424336625684', '1321991292930101268']; // Substitua pelos IDs dos cargos proibidos
        const memberRoles = interaction.member.roles.cache;

        // Verificar se o usuário possui um dos cargos proibidos
        if (memberRoles.some(role => forbiddenRoles.includes(role.id))) {
            return interaction.editReply({ content: '<:a_requisitos:1322017488489418793> | Você não tem permissão para usar este comando.' });
        }

        try {
            // Buscar o usuário pelo ID fornecido
            const user = await interaction.client.users.fetch(userId);
            if (!user) {
                return interaction.editReply({ content: '<:a_requisitos:1322017488489418793> | Usuário não encontrado.' });
            }

            // Tentar desbanir o usuário
            await interaction.guild.bans.fetch(userId).then(async () => {
                await interaction.guild.bans.remove(userId, reason);

                // Criar o embed de notificação para o usuário
                const unbanEmbed = new EmbedBuilder()
                    .setColor(0x00FF00) // Cor verde para desbanimento
                    .setTitle('✅ Você foi desbanido')
                    .setDescription(`Você foi desbanido do servidor **${interaction.guild.name}**.`)
                    .addFields(
                        { name: 'Motivo', value: reason },
                        { name: 'Data do Desbanimento', value: new Date().toLocaleString() }
                    )
                    .setFooter({ text: 'Bem-vindo de volta! Respeite as regras do servidor.' })
                    .setTimestamp();

                // Enviar mensagem ao usuário desbanido
                await user.send({ embeds: [unbanEmbed] }).catch(error => {
                    console.error(`Não foi possível enviar mensagem privada para ${user.tag}.`, error);
                });

                // Log do desbanimento
                const logEmbed = new EmbedBuilder()
                    .setColor(0x00FF00) // Cor verde para log
                    .setTitle('✅ Usuário Desbanido')
                    .addFields(
                        { name: 'Usuário', value: `${user.tag}`, inline: true },
                        { name: 'ID', value: `${user.id}`, inline: true },
                        { name: 'Motivo', value: reason },
                        { name: 'Desbanido por', value: `<@${interaction.user.id}>`, inline: true },
                        { name: 'Data e Hora', value: new Date().toLocaleString(), inline: false }
                    )
                    .setFooter({ text: `Ação realizada por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
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

                // Confirmar o desbanimento para o moderador
                await interaction.editReply({ content: `<:a_Mod:1322616220096135179> | O usuário ${user.tag} foi desbanido com sucesso.` });
            }).catch(() => {
                return interaction.editReply({ content: '<:a_requisitos:1322017488489418793> | Este usuário não está banido ou o ID é inválido.' });
            });

        } catch (error) {
            console.error('Erro ao desbanir usuário:', error);
            await interaction.editReply({ content: '<:a_requisitos:1322017488489418793> | Ocorreu um erro ao tentar desbanir este usuário.' });
        }
    },
};
