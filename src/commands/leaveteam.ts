import { ChatInputCommandInteraction, GuildMemberRoleManager, SlashCommandBuilder } from "discord.js";

import * as CONFIG from "../../config.json";
import { getTeamRole } from "../util/get-team-role";

/**
 * The prefix to add to all console log messages related to this command.
 */
const LOG_PREFIX = "[Leave Team]";

export const data = new SlashCommandBuilder()
    .setName("leaveteam")
    .setDescription("Leave your current team");

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    let memberRoles: GuildMemberRoleManager = interaction.member.roles as GuildMemberRoleManager;

    /* Not in a team */
    if (!memberRoles.cache.some(role => role.id == CONFIG.roles.teamAssigned)) {
        await interaction.reply({
            content: `Failed to leave team. You must be in a team to use this command.`
        });
        return console.log(`${LOG_PREFIX} Failure: ${interaction.user.tag} is not in a team`);
    }

    await memberRoles.remove(CONFIG.roles.teamAssigned);
    let teamRole = getTeamRole(memberRoles);
    await memberRoles.remove(teamRole);

    await interaction.reply({
        content: `Team left. You have left ${teamRole}`,
    });
    console.log(`${LOG_PREFIX} Success: ${interaction.user.tag} left ${teamRole.name}`);
}
