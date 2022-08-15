import * as fs from "node:fs";
import * as path from "node:path";
import { REST } from "@discordjs/rest";
import { RESTPostAPIApplicationCommandsJSONBody, Routes } from "discord.js";
import { Command } from "../src/types";

import * as CREDENTIALS from "../credentials.json";

/**
 * Path of the directory containing command definitions.
 */
const COMMANDS_PATH = path.join(__dirname, "../src/commands");

/**
 * Get the array of commands.
 * @returns {Promise<RESTPostAPIApplicationCommandsJSONBody[]>} array of commands
 */
async function getCommands(): Promise<RESTPostAPIApplicationCommandsJSONBody[]> {
    let result: RESTPostAPIApplicationCommandsJSONBody[] = [];

    let commandFiles = fs.readdirSync(COMMANDS_PATH).filter(file => file.endsWith(".js"));
    for (let file of commandFiles) {
        let command: Command = await import(path.join(COMMANDS_PATH, file)) as Command;
        result.push(command.data.toJSON());
    }

    return result;
}

/**
 * Registers commands in commands with Discord.
 * @param {REST} rest - the discord.js REST object
 * @param {RESTPostAPIApplicationCommandsJSONBody[]} commands - array of commands to register with Discord
 */
async function registerCommands(rest: REST, commands: RESTPostAPIApplicationCommandsJSONBody[]): Promise<void> {
    try {
		console.log("Started refreshing application (/) commands.");

		await rest.put(
			Routes.applicationGuildCommands(CREDENTIALS.discordClient, CREDENTIALS.discordGuild),
			{ body: commands },
		);

		console.log("Successfully reloaded application (/) commands.");
    } catch (error) {
        console.error(error);
    }
}

let rest: REST = new REST({ version: "10" }).setToken(CREDENTIALS.discordToken);
getCommands().then((commands) => registerCommands(rest, commands));
