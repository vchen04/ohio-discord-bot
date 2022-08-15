const fs = require("node:fs");
const path = require("node:path");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord.js");

/**
 * Path of the directory containing command definitions.
 */
const COMMANDS_PATH = path.join(__dirname, "commands");

/**
 * Get the array of commands.
 * @returns {SlashCommandBuilder[]} array of commands
 */
function getCommands() {
    let result = [];

    let commandFiles = fs.readdirSync(COMMANDS_PATH).filter(file => file.endsWith(".js"));
    for (let file of commandFiles) {
        result.push(require(path.join(COMMANDS_PATH, file)).data.toJSON());
    }

    return result;
}

/**
 * Registers commands in commands with Discord.
 * @param {REST} rest - the discord.js REST object
 * @param {SlashCommandBuilder[]} commands - array of commands to register with Discord
 */
async function registerCommands(rest, commands) {
    try {
		console.log("Started refreshing application (/) commands.");

		await rest.put(
			Routes.applicationGuildCommands(process.env.CLIENT, process.env.GUILD),
			{ body: commands },
		);

		console.log("Successfully reloaded application (/) commands.");
    } catch (error) {
        console.error(error);
    }
}

/*
 * Main procedure -------------------------------------------------------------
 */

require("dotenv").config();

let rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

let commands = getCommands();
registerCommands(rest, commands);

