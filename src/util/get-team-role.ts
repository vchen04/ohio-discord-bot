import { GuildMemberRoleManager } from "discord.js";

/**
 * Returns the role for the team the user is in, or undefined if no such role exists.
 * @param {GuildMemberRoleManager} roles - the roles of the user
 * @returns {Role} the team role of the user, or undefined if no such role exists
 */
export function getTeamRole(roles: GuildMemberRoleManager) {
    return roles.cache.find(role => role.name.startsWith("Team: "));
}
