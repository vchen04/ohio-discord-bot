import { ChatInputCommandInteraction, GuildMember, GuildMemberRoleManager, Role, SlashCommandBuilder } from "discord.js";

import * as CONFIG from "../../config.json";
import { getTeamRole } from "../util/get-team-role";
import { nonNullArgs } from "../util/non-null-args";

/**
 * The prefix to add to all console log messages related to this command.
 */
const LOG_PREFIX = "[Add Team Member]";

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

export const data = new SlashCommandBuilder()
.setName("addmember")
.setDescription("Add participants to your team")
.addUserOption(option =>
    option.setName(ARG_PARTICIPANT_1_NAME)
        .setDescription("Participant to add to your team")
        .setRequired(true))
.addUserOption(option =>
    option.setName(ARG_PARTICIPANT_2_NAME)
        .setDescription("Participant to add to your team"))
.addUserOption(option =>
    option.setName(ARG_PARTICIPANT_3_NAME)
        .setDescription("Participant to add to your team"));

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply();

    let teamRole: Role = getTeamRole(interaction.member.roles as GuildMemberRoleManager);

    /* Not in a team */
    if (teamRole === undefined) {
        interaction.editReply({
            content: `Failed to add team member(s). You must be in a team to use this command.`,
        });
        return console.log(`${LOG_PREFIX} Failure: ${interaction.user.tag} is not in a team`);
    }

    let members: GuildMember[] = nonNullArgs(interaction.options.getMember(ARG_PARTICIPANT_1_NAME), interaction.options.getMember(ARG_PARTICIPANT_2_NAME), interaction.options.getMember(ARG_PARTICIPANT_3_NAME)) as GuildMember[];

    /* Too many members */
    if (teamRole.members.size + members.length > Number(CONFIG.teamData.maxSize)) {
        interaction.editReply({
            content: `Failed to add team member(s). There is not enough space on your team. Maximum team size is ${CONFIG.teamData.maxSize}`
        });
        return console.log(`${LOG_PREFIX} Failure: ${interaction.user.tag} attempted to add too many members to their team`);
    }

    /* Unverified participants */
    let unverifiedMembers: GuildMember[] = members.filter(member => !member.roles.cache.some(role => role.id == CONFIG.roles.participant));
    if (unverifiedMembers.length) {
        interaction.editReply({
            content: `Failed to add team member(s). These user(s) have not been verified: ${unverifiedMembers.join(", ")}`,
        });
        return console.log(`${LOG_PREFIX} Failure: ${interaction.user.tag} tried to add unverified users to their team: ${unverifiedMembers.map(member => member.user.tag).join(", ")}`);
    }

    /* Participants already in teams */
    let teamedMembers: GuildMember[] = members.filter(member => member.roles.cache.some(role => role.id == CONFIG.roles.teamAssigned));
    if (teamedMembers.length) {
        await interaction.editReply({
            content: `Team creation failed. These participant(s) are already in team(s): ${teamedMembers.join(", ")}`,
        });
        return console.log(`${LOG_PREFIX} Failure: ${interaction.user.tag} tried to add participants already in teams: ${teamedMembers.map(member => member.user.tag).join(", ")}`);
    }

    /* Give team members appropriate roles */
    for (let member of members) {
        member.roles.add(CONFIG.roles.teamAssigned);
        member.roles.add(teamRole);
    }

    await interaction.editReply({
        content: `Team members added. Participant(s) ${members.join(", ")} added to ${teamRole}`,
    });
    console.log(`Success: Participant(s) ${members.map((member: GuildMember) => member.user.tag).join(", ")} added to ${teamRole.name}`);
}
