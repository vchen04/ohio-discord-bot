const path = require("node:path");
const rootDir = require("app-root-dir").get();
const { SlashCommandBuilder } = require("discord.js");
const { loggedReply } = require(path.join(rootDir, "logged-reply.js"));
const { buildMembersArray } = require(path.join(rootDir, "build-members-array.js"));
const { getTeamRole } = require(path.join(rootDir, "get-team-role.js"));

const CONFIG = require(path.join(rootDir, "config.json"));

const TEAM_ASSIGNED_ROLE_ID = CONFIG.teamAssignedRoleID;

const MAX_TEAM_SIZE = 4;

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
        `${interaction.user.tag} tried to add members to a team, but is not in a team themselves.`);
}

/**
 * Respond to the case that the team does not have enough space.
 * @param {ChatInputCommandInteraction} interaction - the interaction to respond to
 * @param {Role} teamRole - the role of the team to add to
 * @param {GuildMember[]} teamMembers - the array of members to add
 */
async function respondTeamFull(interaction, teamRole, teamMembers) {
    await reply(interaction,
        `Failed to add ${teamMembers.join(", ")} to ${teamRole}. There is not enough space on your team. Maximum team size is ${MAX_TEAM_SIZE}.`,
        false,
        `${interaction.user.tag} tried to add ${teamMembers.join(", ")} to ${teamRole}, but there is not enough space in the team.`);
}

/**
 * Respond to the case that a team member is already in another team.
 * @param {ChatInputCommandInteraction} interaction - the interaction to respond to
 * @param {GuildMember[]} teamedMembers - the array of members already in teams 
 */
async function respondTeamMemberTeamed(interaction, teamedMembers) {
    await reply(interaction,
        `Failed to add ${teamedMembers.join(", ")} to team. They are already in team(s).`,
        false,
        `${interaction.user.tag} tried to add members to their team, but ${teamedMembers.join(", ")} is/are already in team(s).`);
}

/**
 * Respond to the case that members were added to the team.
 * @param {ChatInputCommandInteraction} interaction - the interaction to respond to
 * @param {Role} teamRole - the role of the team members were added to
 * @param {GuildMember[]} teamMembers - the array of members added
 */
 async function respondTeamMembersAdded(interaction, teamRole, teamMembers) {
    await reply(interaction,
        `Added ${teamMembers.join(", ")} to ${teamRole}.`,
        false,
        `${interaction.user.tag} added ${teamMembers.join(", ")} to ${teamRole}.`);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("addmember")
        .setDescription("Add participants to your team")
        .addUserOption(option =>
            option.setName("member1")
                .setDescription("A participant to add to your team")
                .setRequired(true))
        .addUserOption(option =>
            option.setName("member2")
                .setDescription("A participant to add to your team"))
        .addUserOption(option =>
            option.setName("member3")
                .setDescription("A participant to add to your team")),
    async execute(interaction) {
        let teamRole = getTeamRole(interaction.member.roles);
        
        if (!teamRole) {
            return await respondNotTeamed(interaction);
        }
        
        let members = await buildMembersArray(interaction);

        if (teamRole.members.size + members.length > MAX_TEAM_SIZE) {
            return await respondTeamFull(interaction, teamRole, members);
        }

        let teamedMembers = members.filter(member => member.roles.cache.some(role => role == TEAM_ASSIGNED_ROLE_ID));
        if (teamedMembers.length) {
            return await respondTeamMemberTeamed(interaction, teamedMembers);
        }

        for (let member of members) {
            member.roles.add(TEAM_ASSIGNED_ROLE_ID);
            member.roles.add(teamRole);
        }

        await respondTeamMembersAdded(interaction, teamRole, members);
    }
}

