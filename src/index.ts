import * as fs from "node:fs";
import * as path from "node:path";
import * as appRootDir from "app-root-dir";
import express = require("express");
import { ChatInputCommandInteraction, Client, Collection, GatewayIntentBits, TextChannel } from "discord.js";
import { OHIOBotClient, Command } from "./types";
import { readParticipants } from "./util/read-participants";
import { saveParticipants } from "./util/save-participants";
import { configureRouter as push } from "./api/push";
import * as CONFIG from "../config.json";
import * as CREDENTIALS from "../credentials.json";

/**
 * Base path of the project.
 */
const BASE_DIR: string = appRootDir.get();

/**
 * Directory containing command definitions.
 */
const COMMANDS_PATH = path.join(__dirname, "commands");

/**
 * Store a Collection of commands in client.commands and map of participant data in client.participants.
 * @param {Client} client the discord.js Client object to store the commands in
 * @param {Map<string, string>} participants the map of participant email addresses to Discord tags
 */
async function initClient(client: OHIOBotClient, participants: Map<string, string>): Promise<void> {
    let commandFiles: string[] = fs.readdirSync(COMMANDS_PATH).filter(file => file.endsWith("js"));
    client.commands = new Collection();
    for (let file of commandFiles) {
        let command: Command = await import(path.join(COMMANDS_PATH, file));
        client.commands.set(command.data.name, command);
    }

    client.participants = participants;
}

/**
 * Register listeners for slash commands on client.
 * @param {OHIOBotClient} client the discord.js Client to register commands for
 */
function registerCommandListeners(client: OHIOBotClient): void {
    client.on("interactionCreate", async interaction => {
        if (!interaction.isChatInputCommand) return;

        let commandInteraction: ChatInputCommandInteraction = interaction as ChatInputCommandInteraction;

        let command: Command = client.commands.get(commandInteraction.commandName);
        if (!command) return;
            
        try {
            await command.execute(commandInteraction);
        } catch (error: unknown) {
            console.error(error);

            try {
                let logsChannel: TextChannel = client.channels.resolve(CONFIG.channels.logs) as TextChannel;
                await logsChannel.send(error);
            } catch (error: unknown) {
                console.error(error);
            }

            try {
                await commandInteraction.reply({
                    content: "There was an error while executing this command. Please contact an organizer.",
                    ephemeral: true,
                });
            } catch (error: unknown) {
                console.error(error);
            }
        }
    }).on("ready", (): void => {
        console.log("[Status] Ready");
    });
}

/**
 * Create web API endpoints to receive participant data.
 * @param {Express.Application} api the Express application to register endpoints on
 * @param {Client} client the discord.js client to use (for logging)
 */
function registerAPIEndpoints(api: express.Application, client: Client) {
    api.use("/api/push", push({
        participants: participants,
        client: client,
    }));
}

let participants = new Map();
let api: express.Application = express();
let client: Client = new Client({intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]});
readParticipants(path.join(BASE_DIR, CONFIG.participantData.initFile), path.join(BASE_DIR, CONFIG.participantData.cacheFile), participants, CONFIG.participantData.emailColumn, CONFIG.participantData.tagColumn)
    .then(() => saveParticipants(path.join(BASE_DIR, CONFIG.participantData.cacheFile), participants))
    .then(() => registerAPIEndpoints(api, client))
    .then(() => api.listen(CONFIG.port, () => console.log("[Web API] API server started")))
    .then(() => initClient(client, participants))
    .then(() => registerCommandListeners(client))
    .then(() => client.login(CREDENTIALS.discordToken));
