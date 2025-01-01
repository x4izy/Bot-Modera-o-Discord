const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Avisa um usuário com uma mensagem personalizada.')
        .addUserOption(option =>
            option.setName('usuário')
                .setDescription('O usuário que você deseja avisar.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('mensagem')
                .setDescription('A mensagem de aviso.')
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const user = interaction.options.getUser('usuário');
        const message = interaction.options.getString('mensagem');

        try {
            // Criar o embed de aviso
            const warningEmbed = new EmbedBuilder()
                .setColor(0xFFA500) // Cor laranja para aviso
                .setTitle('⚠️ Você recebeu um aviso')
                .setDescription(`Você foi avisado por um moderador do servidor **${interaction.guild.name}**.`)
                .addFields(
                    { name: 'Mensagem', value: message },
                    { name: 'Data do Aviso', value: new Date().toLocaleString() }
                )
                .setFooter({ text: 'Entre em contato com a moderação se tiver dúvidas.' })
                .setTimestamp();

            // Tentar enviar a mensagem para o usuário
            try {
                await user.send({ embeds: [warningEmbed] });
                // Confirmar o envio ao moderador
                await interaction.editReply({ content: `<:a_Mod:1322616220096135179> | O usuário ${user.tag} foi avisado com sucesso.` });
            } catch (error) {
                console.warn(`Não foi possível enviar mensagem privada para ${user.tag}.`, error);
                // Informar o moderador caso a mensagem não seja entregue
                await interaction.editReply({ content: `<:a_Pin:1322031698501697558> | Aviso não pôde ser enviado para ${user.tag}, pois o usuário bloqueou mensagens diretas ou desativou mensagens privadas.` });
            }
        } catch (error) {
            console.error('Erro ao enviar aviso:', error);
            await interaction.editReply({ content: '<:a_requisitos:1322017488489418793> | Ocorreu um erro ao tentar avisar este usuário.' });
        }
    },
};
