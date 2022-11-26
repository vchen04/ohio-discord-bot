import * as fs from "node:fs";
import * as path from "node:path";
import { REST } from "@discordjs/rest";
import { RESTPostAPIApplicationCommandsJSONBody, Routes } from "discord.js";
import { Command } from "../src/types";

/**
 * Path of the directory containing command definitions.
 */
const COMMANDS_PATH: string = path.join(__dirname, "../src/commands");

/**
 * Get the array of commands.
 * @returns array of commands
 */
async function getCommands(): Promise<RESTPostAPIApplicationCommandsJSONBody[]> {
    const result: RESTPostAPIApplicationCommandsJSONBody[] = [];

    const commandFiles: string[] = fs.readdirSync(COMMANDS_PATH).filter(file => file.endsWith(".js"));
    for (const file of commandFiles) {
        const command: Command = await import(path.join(COMMANDS_PATH, file));
        result.push(command.data.toJSON());
    }

    return result;
}

/**
 * Registers commands in commands with Discord.
 * @param rest - the discord.js REST object
 * @param commands - array of commands to register with Discord
 */
async function registerCommands(rest: REST, commands: RESTPostAPIApplicationCommandsJSONBody[]): Promise<void> {
    try {
		console.log("Started refreshing application (/) commands.");

		await rest.put(
			Routes.applicationGuildCommands("FIX THIS", "FIX THIS"),
			{ body: commands },
		);

		console.log("Successfully reloaded application (/) commands.");
    } catch (error) {
        console.error(error);
    }
}

const rest: REST = new REST({ version: "10" }).setToken("FIX THIS");
getCommands().then(commands => registerCommands(rest, commands));
