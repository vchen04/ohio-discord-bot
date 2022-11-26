import { readdir } from "node:fs/promises";
import { ChatInputCommandInteraction, Client, Collection, GatewayIntentBits } from "discord.js";
import { Command } from "./types";
import * as express from "express";
import * as path from "node:path";
import { PushEndpointRouter } from "./webapi/push-endpoint-router";
import { Database } from "sqlite3";
import { addParticipant } from "./db/add-participant";
import { getDatabase } from "./db/get-database";

const COMMANDS_PATH: string = path.join(__dirname, "/commands");

/**
 * Read commands from the commands directory into a commands object attached to
 * client.
 * 
 * @param client discord.js Client object
 * @returns discord.js Client object
 */
async function loadCommands(client: Client): Promise<Client & { commands: Collection<string, Command> }> {
    const result: Client & { commands: Collection<string, Command> } = client as Client & { commands: Collection<string, Command> };

    result.commands = new Collection<string, Command>();

    const files: string[] = (await readdir(COMMANDS_PATH)).filter(file => file.endsWith(".js"));
    for (const file of files) {
        const command: Command = await import(path.join(COMMANDS_PATH, file));
        result.commands.set(command.data.name, command);
    }

    return result;
}

/**
 * Register listener for slash commands.
 * 
 * @param client discord.js Client object
 */
function registerCommands(client: Client & { commands: Collection<string, Command> }): void {
    client.on("interactionCreate", async interaction => {
        if (!interaction.isChatInputCommand()) return;

        const cmdInteraction: ChatInputCommandInteraction = interaction as ChatInputCommandInteraction;
        
        const cmd: Command | undefined = client.commands.get(cmdInteraction.commandName);
        if (cmd === undefined) return;

        try {
            await cmd.execute(cmdInteraction);
        } catch (error: unknown) {
            console.error(error);

            try {
                if (cmdInteraction.deferred || cmdInteraction.replied) {
                    cmdInteraction.editReply({
                        content: "There was an error executing this command.",
                    });
                } else {
                    cmdInteraction.reply({
                        content: "There was an error executing this command.",
                        ephemeral: true,
                    });

                }
            } catch (error: unknown) {
                console.error(error);
            }
        }
    });
}

/**
 * Mount routers for web API endpoints.
 * 
 * @param app Express application
 * @param db the database object
 */
function loadWebAPI(app: express.Application, db: Database) {
    app.use("/push/participant", PushEndpointRouter("FIX-THIS",
            (email: string, tag: string) => addParticipant(db, email, tag)));
}

const webapi: express.Application = express();
const discord: Client = new Client({ intents: [ GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers ] });

Promise.all([
    loadCommands(discord),
    getDatabase(),
]).then(results => {
    registerCommands(results[0]);
    loadWebAPI(webapi, results[1]);
    process.on("SIGTERM", results[1].close);
}).then(() => {
    webapi.listen("3000");
    // discord.login("FIX THIS");
}).catch((err: unknown) => console.error(err));
