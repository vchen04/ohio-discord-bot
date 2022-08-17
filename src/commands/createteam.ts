import { CategoryChannel, ChannelType, ChatInputCommandInteraction, ColorResolvable, GuildChannelManager, GuildMember, GuildMemberRoleManager, PermissionsBitField, Role, RoleManager, SlashCommandBuilder } from "discord.js";

import * as CONFIG from "../../config.json";
import { nonNullArgs } from "../util/non-null-args";
import { incrementCounter } from "../util/team-counter";

/**
 * The prefix to add to all console log messages related to this command.
 */
const LOG_PREFIX = "[Create Team]";

/**
 * The name to use for the name argument of the command.
 */
const ARG_NAME_NAME = "name";

/**
 * The name to use for the participant 1 argument of the command.
 */
const ARG_PARTICIPANT_1_NAME = "participant1";

/**
 * The name to use for the participant 2 argument of the command.
 */
const ARG_PARTICIPANT_2_NAME = "participant2";

/**
 * The name to use for the participant 3 argument of the command.
 */
const ARG_PARTICIPANT_3_NAME = "participant3";

/**
 * Characters prohibited for use in team names.
 */
const TEAM_NAME_ILLEGAL_CHARACTERS = ",.<>?/;:'\"[{]}=+~`!@#$%^&*()";

/**
 * Permissions overwrites to apply to the team category.
 */
const TEAM_CATEGORY_PERMISSIONS = [PermissionsBitField.Flags.ViewChannel,
    PermissionsBitField.Flags.SendMessages,
    PermissionsBitField.Flags.Connect,
    PermissionsBitField.Flags.Speak];

/**
 * Formats a team name as a role name.
 * @param {string} name the team name to format as a role name
 * @returns {string} name formatted as a role name
 */
function formatTeamName(name: string): string {
    return `Team: ${name}`;
}

/**
 * Checks if a team name has already been used, case insensitive.
 * @param {RoleManager} roles the guild roles to check
 * @param {string} name the team name to check
 * @returns {boolean} if there exists a team with named name
 */
function teamNameExists(roles: RoleManager, name: string): boolean {
    return roles.cache.some(role => role.name.toLowerCase() == formatTeamName(name).toLowerCase());
}

/**
 * Formats a team name as a text channel name.
 * @param {string} name the team name to format as a text channel name
 * @returns {string} name formatted as a text channel name
 */
function formatTextChannelName(name: string): string {
    return name.replaceAll(" ", "-") + "-text";
}

/**
 * Formats a team name as a voice channel name.
 * @param {string} name the team name to format as a voice channel name
 * @returns {string} name formatted as a voice channel name
 */
function formatVoiceChannelName(name: string): string {
    return name + " Voice";
}

export const data = new SlashCommandBuilder()
    .setName("createteam")
    .setDescription("Create a new team for this event")
    .addStringOption(option => 
        option.setName(ARG_NAME_NAME)
            .setDescription("Name of your team")
            .setRequired(true))
    .addUserOption(option =>
        option.setName(ARG_PARTICIPANT_1_NAME)
            .setDescription("Participant to add to your team")
            .setRequired(true))
    .addUserOption(option =>
        option.setName(ARG_PARTICIPANT_2_NAME)
            .setDescription("Participant to add to your team")
            .setRequired(false))
    .addUserOption(option =>
        option.setName(ARG_PARTICIPANT_3_NAME)
            .setDescription("Participant to add to your team")
            .setRequired(false));

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    let memberRoles: GuildMemberRoleManager = interaction.member.roles as GuildMemberRoleManager;
    let teamName: string = interaction.options.getString(ARG_NAME_NAME);

    /* Already in a team */
    if (memberRoles.cache.some(role => role.id == CONFIG.roles.teamAssigned)) {
        await interaction.reply({
            content: "Team creation failed. You are already in a team",
        });
        return console.log(`${LOG_PREFIX} Failure: ${interaction.user.tag} is already in a team`);
    }

    /* Illegal characters in team name */
    if (teamName.split("").some(char => TEAM_NAME_ILLEGAL_CHARACTERS.includes(char))) {
        await interaction.reply({
            content: `Team creation failed. Team name includes prohibited characters: ${TEAM_NAME_ILLEGAL_CHARACTERS}`,
        });
        return console.log(`${LOG_PREFIX} Failure: ${interaction.user.tag} used illegal characters in team name`);
    }

    let guildRoles: RoleManager = interaction.guild.roles;

    /* Team name already exists */
    if (teamNameExists(guildRoles, teamName)) {
        await interaction.reply({
            content: `Team creation failed. A team called \`${teamName}\` already exists.`,
        });
        return console.log(`${LOG_PREFIX} Failure: ${interaction.user.tag} used team name ${teamName}, which is already used`);
    }

    let members: GuildMember[] = nonNullArgs(interaction.options.getMember(ARG_PARTICIPANT_1_NAME), interaction.options.getMember(ARG_PARTICIPANT_2_NAME), interaction.options.getMember(ARG_PARTICIPANT_3_NAME)) as GuildMember[];

    /* Unverified participants */
    let unverifiedMembers: GuildMember[] = members.filter(member => !member.roles.cache.some(role => role.id == CONFIG.roles.participant));
    if (unverifiedMembers.length) {
        await interaction.reply({
            content: `Team creation failed. These user(s) have not been verified: ${unverifiedMembers.join(", ")}`,
        });
        return console.log(`${LOG_PREFIX} Failure: ${interaction.user.tag} tried to create a team with unverified users: ${unverifiedMembers.map(member => member.user.tag).join(", ")}`);
    }

    /* Participants already in teams */
    let teamedMembers: GuildMember[] = members.filter(member => member.roles.cache.some(role => role.id == CONFIG.roles.teamAssigned));
    if (teamedMembers.length) {
        await interaction.reply({
            content: `Team creation failed. These participant(s) are already in team(s): ${teamedMembers.join(", ")}`,
        });
        return console.log(`${LOG_PREFIX} Failure: ${interaction.user.tag} tried to create a team with participants already in teams: ${teamedMembers.map(member => member.user.tag).join(", ")}`);
    }

    /* Create team role */
    let teamRole: Role = await guildRoles.create({
        name: formatTeamName(teamName),
        color: CONFIG.teamData.roleColor as ColorResolvable,
    });

    /* Create team channels */

    let guildChannels: GuildChannelManager = interaction.guild.channels;
    let teamNum: number = incrementCounter();

    let teamCategory: CategoryChannel = await guildChannels.create({
        name: `Team ${teamNum} - ${teamName}`,
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
                id: CONFIG.roles.mentor,
                allow: TEAM_CATEGORY_PERMISSIONS,
            },
            {
                id: CONFIG.roles.sponsor,
                allow: TEAM_CATEGORY_PERMISSIONS,
            },
            {
                id: CONFIG.roles.judge,
                allow: TEAM_CATEGORY_PERMISSIONS,
            },
        ],
    });

    await guildChannels.create({
        name: formatTextChannelName(teamName),
        parent: teamCategory,
    });

    await guildChannels.create({
        name: formatVoiceChannelName(teamName),
        type: ChannelType.GuildVoice,
        parent: teamCategory,
    });

    /* Give team members appropriate roles */
    members.push(interaction.member as GuildMember);
    for (let member of members) {
        member.roles.add(CONFIG.roles.teamAssigned);
        member.roles.add(teamRole);
    }

    await interaction.reply({
        content: `Team created. ${teamRole} created with members ${members.join(", ")}`,
    });
    console.log(`Success: ${teamRole.name} created with members ${members.map((member: GuildMember) => member.user.tag).join(", ")}`);
}
