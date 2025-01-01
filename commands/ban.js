const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

// IDs para o servidor e canal de log
const logServerId = '1323379456827592787'; // Substitua pelo ID do servidor de log
const logChannelId = '1323804099656810576';   // Substitua pelo ID do canal de log

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Bane um membro do servidor.')
        .addUserOption(option =>
            option.setName('usuário')
                .setDescription('O membro que você deseja banir.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('motivo')
                .setDescription('Motivo do banimento.')
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const user = interaction.options.getUser('usuário');
        const reason = interaction.options.getString('motivo') || 'Sem motivo especificado';

        const forbiddenRoles = ['1311615477100974081', '1311615424336625684', '1321991292930101268']; // Substitua pelos IDs dos cargos proibidos
        const memberRoles = interaction.member.roles.cache;

        if (memberRoles.some(role => forbiddenRoles.includes(role.id))) {
            return interaction.editReply({ content: '<:a_requisitos:1322017488489418793> | Você não tem permissão para usar este comando.' });
        }

        const member = interaction.guild.members.cache.get(user.id);

        if (!member) {
            return interaction.editReply({ content: '<:a_requisitos:1322017488489418793> | Membro não encontrado no servidor!' });
        }

        if (!interaction.guild.members.me.permissions.has('BanMembers')) {
            console.error('Permissão "BanMembers" ausente.');
            return interaction.editReply({ content: '<:a_requisitos:1322017488489418793> | Eu não tenho permissão para banir membros!' });
        }

        if (member.roles.highest.position >= interaction.guild.members.me.roles.highest.position) {
            console.error(`Falha na hierarquia: Cargo do membro (${member.roles.highest.position}) >= Cargo do bot (${interaction.guild.members.me.roles.highest.position}).`);
            return interaction.editReply({ content: '<:a_requisitos:1322017488489418793> | Eu não consigo banir este membro devido à hierarquia de cargos.' });
        }

        try {
            const inviter = interaction.user;

            // Embed enviado ao usuário banido
            const dmEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('🚫 Você foi banido')
                .setDescription(`Você foi banido do servidor **${interaction.guild.name}**.`)
                .addFields(
                    { name: 'Motivo', value: reason },
                    { name: 'Data do Banimento', value: new Date().toLocaleString(), inline: true },
                    { name: 'Servidor de Apelação', value: 'https://discord.gg/Tsnj9bp5qN' },
                    { name: 'Banido por', value: `<@${inviter.id}>`, inline: true }
                )
                .setFooter({ text: 'Caso ache que sua punição foi injusta, entre em contato no servidor de apelação.' })
                .setTimestamp();

            await user.send({ embeds: [dmEmbed] }).catch(error => {
                console.error(`Não foi possível enviar mensagem privada para ${user.tag}.`, error);
            });

            // Executar o banimento
            await member.ban({ reason });

            // Embed para o log
            const logEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('🚫 Membro Banido')
                .addFields(
                    { name: 'Usuário', value: `${user.tag}`, inline: true },
                    { name: 'ID', value: `${user.id}`, inline: true },
                    { name: 'Motivo', value: reason },
                    { name: 'Banido por', value: `<@${inviter.id}>`, inline: true },
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

            // Responder ao comando
            await interaction.editReply({ embeds: [logEmbed] });
        } catch (error) {
            console.error('Erro ao banir o membro:', error);
            await interaction.editReply({ content: '<:a_requisitos:1322017488489418793> | Ocorreu um erro ao tentar banir este membro.' });
        }
    },
};
