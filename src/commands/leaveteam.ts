import { ChatInputCommandInteraction, GuildMemberRoleManager, Role, SlashCommandBuilder } from "discord.js";

import * as CONFIG from "../../config.json";
import { getTeamRole } from "../util/get-team-role";
import { logMessage } from "../util/log";

/**
 * The prefix to add to all console log messages related to this command.
 */
const LOG_PREFIX = "[Leave Team]";

export const data = new SlashCommandBuilder()
    .setName("leaveteam")
    .setDescription("Leave your current team");

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply();

    let memberRoles: GuildMemberRoleManager = interaction.member.roles as GuildMemberRoleManager;

    /* Not in a team */
    if (!memberRoles.cache.some(role => role.id == CONFIG.roles.teamAssigned)) {
        await interaction.editReply({
            content: `Failed to leave team. You must be in a team to use this command.`
        });
        return logMessage(interaction.client, `${LOG_PREFIX} Failure: ${interaction.user.tag} is not in a team`);
    }

    await memberRoles.remove(CONFIG.roles.teamAssigned);
    let teamRole: Role = getTeamRole(memberRoles);
    await memberRoles.remove(teamRole);

    await interaction.editReply({
        content: `Team left. You have left ${teamRole}`,
    });
    logMessage(interaction.client, `${LOG_PREFIX} Success: ${interaction.user.tag} left ${teamRole.name}`);

    if (teamRole.members.size == 0) {
        await teamRole.delete();
        logMessage(interaction.client, `${LOG_PREFIX} Role deleted: ${teamRole.name}`);
    }

}
