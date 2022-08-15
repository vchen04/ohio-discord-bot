const path = require("node:path");
const rootDir = require("app-root-dir").get();

const CONFIG = require(path.join(rootDir, "config.json"));

const TEAM_ASSIGNED_ROLE_ID = CONFIG.teamAssignedRoleID;

module.exports = {
    /**
     * Returns the role for the team the user is in, or undefined if no such role exists.
     * @param {GuildMemberRoleManager} roles - the roles of the user
     * @returns {Role} the team role of the user, or undefined if no such role exists
     */
    getTeamRole(roles) {
        return roles.cache.find(role => role.name.includes("Team ") && role.id != TEAM_ASSIGNED_ROLE_ID);
    }
}
