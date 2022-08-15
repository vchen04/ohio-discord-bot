const path = require("node:path");
const rootDir = require("app-root-dir").get();
const { SlashCommandBuilder } = require("discord.js");
const { loggedReply } = require(path.join(rootDir, "logged-reply.js"));
const { getTeamRole } = require(path.join(rootDir, "get-team-role.js"));

const CONFIG = require(path.join(rootDir, "config.json"));

const TEAM_ASSIGNED_ROLE_ID = CONFIG.teamAssignedRoleID;

const LOG_PREFIX = "[Team Modification] ";

/**
 * Replies to an interaction and logs the interaction, prefixed with LOG_PREFIX, to the console.
 * @param {ChatInputCommandInteraction} interaction - the interaction to reply to
 * @param {string} replyMessage - content of the reply
 * @param {boolean} replyEphemeral - if the reply is ephemeral
 * @param {string} logMessage - log message
 */
async function reply(interaction, replyMessage, replyEphemeral, logMessage) {
    loggedReply(interaction, replyMessage, replyEphemeral, LOG_PREFIX + logMessage);
}

/**
 * Respond to the case that the user is not in a team.
 * @param {ChatInputCommandInteraction} interaction - the interaction to respond to
 */
async function respondNotTeamed(interaction) {
    await reply(interaction,
        `You must be in a team to use this command.`,
        false,
        `${interaction.user.tag} tried to leave a team, but is not already in a team.`);
}

/**
 * Respond to the case that the user has left their team.
 * @param {ChatInputCommandInteraction} interaction - the interaction to respond to
 * @param {Role} teamRole - the role of the team that was just left
 */
async function respondLeftTeam(interaction, teamRole) {
    await reply(interaction,
        `You have left ${teamRole}.`,
        false,
        `${interaction.user.tag} left ${teamRole}.`);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("leaveteam")
        .setDescription("Leave your current team"),
    async execute(interaction) {
        let memberRoles = interaction.member.roles;
        if (!memberRoles.cache.some(role => role == TEAM_ASSIGNED_ROLE_ID)) {
            return await respondNotTeamed(interaction);
        }

        await interaction.member.roles.remove(TEAM_ASSIGNED_ROLE_ID);

        let teamRole = getTeamRole(interaction.member.roles);
        await interaction.member.roles.remove(teamRole);

        await respondLeftTeam(interaction, teamRole);
    }
}
