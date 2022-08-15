const fs = require("node:fs");
const path = require("node:path");
const rootDir = require("app-root-dir").get();
const { SlashCommandBuilder, ChannelType, PermissionsBitField } = require("discord.js");
const { loggedReply } = require(path.join(rootDir, "logged-reply.js"));
const { buildMembersArray } = require(path.join(rootDir, "build-members-array.js"));

const CONFIG = require(path.join(rootDir, "config.json"));
const COUNTER_FILE = path.join(rootDir, "teamCounter.json");

const PARTICIPANT_ROLE_ID = CONFIG.participantsRoleID;
const TEAM_ASSIGNED_ROLE_ID = CONFIG.teamAssignedRoleID;

const TEAM_NAME_ILLEGAL_CHARACTERS = ",.<>?/;:'\"[{]}=+~`!@#$%^&*()";

const TEAM_ROLE_COLOR = "#d1f6fc";

const TEAM_CATEGORY_PERMISSIONS = [PermissionsBitField.Flags.ViewChannel,
    PermissionsBitField.Flags.SendMessages,
    PermissionsBitField.Flags.Connect,
    PermissionsBitField.Flags.Speak];

const LOG_PREFIX = "[Team Creation] ";

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
 * Respond to the case that the user is already in a team.
 * @param {ChatInputCommandInteraction} interaction - the interaction to respond to
 */
async function respondAlreadyTeamed(interaction) {
    await reply(interaction,
        "Team creation failed. You are already in a team.",
        false,
        `${interaction.user.tag} tried to create a team, but is already in a team.`);
}

/**
 * Respond to the case that the team name is empty.
 * @param {ChatInputCommandInteraction} interaction - the interaction to respond to
 */
async function respondTeamNameEmpty(interaction) {
    await reply(interaction,
        "Team creation failed. Team name cannot be empty.",
        false,
        `${interaction.user.tag} tried to create a team, but team name is empty.`);
}

/**
 * Respond to the case that the team name contains illegal characters.
 * @param {ChatInputCommandInteraction} interaction - the interaction to respond to
 */
async function respondTeamNameIllegalChars(interaction) {
    await reply(interaction,
        `Team creation failed. Team cannot contain illegal characters: \`${TEAM_NAME_ILLEGAL_CHARACTERS}\``,
        false,
        `${interaction.user.tag} tried to create a team, but team name contained illegal characters.`);
}

/**
 * Respond to the case that the team name already exists.
 * @param {ChatInputCommandInteraction} interaction - the interaction to respond to
 */
async function respondTeamNameAlreadyExists(interaction, teamName) {
    await reply(interaction,
        `Team creation failed. A team with the name \`${teamName}\` already exists.`,
        false,
        `${interaction.user.tag} tried to create a team with name ${teamName}, but a team with that name already exists.`);
}

/**
 * Respond to the case that a team member is not verified.
 * @param {ChatInputCommandInteraction} interaction - the interaction to respond to
 * @param {GuildMember[]} unverifiedMembers - the array of unverified members 
 */
async function respondTeamMemberUnverified(interaction, unverifiedMembers) {
    await reply(interaction,
        `Team creation failed. ${unverifiedMembers.join(", ")} is/are unverified.`,
        false,
        `${interaction.user.tag} tried to create a team, but ${unverifiedMembers.join(", ")} is/are unverified.`);
}

/**
 * Respond to the case that a team member is already in another team.
 * @param {ChatInputCommandInteraction} interaction - the interaction to respond to
 * @param {GuildMember[]} teamedMembers - the array of members already in teams 
 */
async function respondTeamMemberTeamed(interaction, teamedMembers) {
    await reply(interaction,
        `Team creation failed. ${teamedMembers.join(", ")} is/are already in team(s).`,
        false,
        `${interaction.user.tag} tried to create a team, but ${teamedMembers.join(", ")} is/are already in team(s).`);
}

/**
 * Respond to the case that a team is created.
 * @param {ChatInputCommandInteraction} interaction - the interaction to respond to
 * @param {Role} teamRole - the role for the newly created team
 * @param {GuildMember[]} teamMembers - the array of members added 
 */
async function respondTeamCreated(interaction, teamRole, teamMembers) {
    await reply(interaction,
        `${teamRole} created with members ${teamMembers.join(", ")}.`,
        false,
        `${teamRole} created with members ${teamMembers.join(", ")}`);
}

/**
 * Updates the team number counter and returns the number of the next team.
 * @returns {number} teamNumber - the number of the next team
 */
function updateTeamCounter() {
    if (!fs.existsSync(COUNTER_FILE)) {
        fs.writeFileSync(COUNTER_FILE, JSON.stringify({count: 0}));
    }
    let teamNumber = JSON.parse(fs.readFileSync(COUNTER_FILE)).count + 1;
    fs.writeFileSync(COUNTER_FILE, JSON.stringify({count: teamNumber}));
    return teamNumber;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("createteam")
        .setDescription("Creates a team for this event.")
        .addStringOption(option => 
            option.setName("name")
                .setDescription("The name of your team")
                .setRequired(true))
        .addUserOption(option =>
            option.setName("member1")
                .setDescription("A participant to add to your team")
                .setRequired(true))
        .addUserOption(option =>
            option.setName("member2")
                .setDescription("A participant to add to your team")
                .setRequired(false))
        .addUserOption(option =>
            option.setName("member3")
                .setDescription("A participant to add to your team")
                .setRequired(false)),
    async execute(interaction) {
        let memberRoles = interaction.member.roles;
        let teamName = await interaction.options.getString("name");

        if (memberRoles.cache.some(role => role == TEAM_ASSIGNED_ROLE_ID)) {
            return await respondAlreadyTeamed(interaction);
        }

        /* Empty team name... is this even possible? */
        if (teamName.length == 0) {
            return await respondTeamNameEmpty(interaction);
        }

        if (teamName.split("").some(char => TEAM_NAME_ILLEGAL_CHARACTERS.includes(char))) {
            return await respondTeamNameIllegalChars(interaction);
        }

        let guildRoles = interaction.guild.roles;

        if (guildRoles.cache.some(role => role.name.toLowerCase() == "team " + teamName.toLowerCase())) {
            return await respondTeamNameAlreadyExists(interaction, teamName);
        }

        let members = await buildMembersArray(interaction);

        let unverifiedMembers = members.filter(member => !member.roles.cache.some(role => role == PARTICIPANT_ROLE_ID));
        if (unverifiedMembers.length) {
            return await respondTeamMemberUnverified(interaction, unverifiedMembers);
        }

        let teamedMembers = members.filter(member => member.roles.cache.some(role => role == TEAM_ASSIGNED_ROLE_ID));
        if (teamedMembers.length) {
            return await respondTeamMemberTeamed(interaction, teamedMembers);
        }

        let teamNumber = updateTeamCounter();
        
        /* Create team role */
        let teamRole = await guildRoles.create({
            name: "Team " + teamName,
            color: TEAM_ROLE_COLOR,
        });

        let guildChannels = interaction.guild.channels;

        /* Create team category and channels */
        let teamCategory = await guildChannels.create({
            name: `Team ${teamNumber} - ${teamName}`,
            type: ChannelType.GuildCategory,
            permissionOverwrites: [
                {
                    id: interaction.guild.roles.everyone.id,
                    deny: TEAM_CATEGORY_PERMISSIONS,
                },
                {
                    id: teamRole.id,
                    allow: TEAM_CATEGORY_PERMISSIONS,
                },
                {
                    id: CONFIG.mentorsRoleID,
                    allow: TEAM_CATEGORY_PERMISSIONS,
                },
                {
                    id: CONFIG.sponsorsRoleID,
                    allow: TEAM_CATEGORY_PERMISSIONS,
                },
                {
                    id: CONFIG.judgesRoleID,
                    allow: TEAM_CATEGORY_PERMISSIONS,
                }
            ],
        });

        guildChannels.create({
            name: teamName.replaceAll(" ", "-") + "-text",
            parent: teamCategory,
        });

        guildChannels.create({
            name: teamName + " Voice",
            type: ChannelType.GuildVoice,
            parent: teamCategory,
        });

        members.push(interaction.member);
        for (let member of members) {
            member.roles.add(TEAM_ASSIGNED_ROLE_ID);
            member.roles.add(teamRole);
        }

        await respondTeamCreated(interaction, teamRole, members);
    },
}

