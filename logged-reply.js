module.exports = {
    /**
     * Replies to an interaction and logs the interaction to the console.
     * @param {ChatInputCommandInteraction} interaction - the interaction to reply to
     * @param {string} replyMessage - content of the reply
     * @param {boolean} replyEphemeral - if the reply is ephemeral
     * @param {string} logMessage - log message
     */
    async loggedReply(interaction, replyMessage, replyEphemeral, logMessage) {
        await interaction.reply({
            content: replyMessage,
            ephemeral: replyEphemeral,
        });
        console.log(logMessage);
    }
}
