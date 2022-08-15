module.exports = {
    /**
     * Build a list of members from the options of an interaction.
     * @param {ChatInputCommandInteraction} interaction - the interaction to pull members from
     */
    async buildMembersArray(interaction) {
        let result = [interaction.options.getMember("member1")];

        let member2 = interaction.options.getMember("member2");
        if (member2) {
            result.push(member2);
        }

        let member3 = interaction.options.getMember("member3");
        if (member3) {
            result.push(member3);
        }

        return result;
    }
}
