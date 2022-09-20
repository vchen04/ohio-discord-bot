import { Client, TextChannel } from "discord.js";
import * as CONFIG from "../../config.json";

/**
 * Logs a message to the console.
 * @param {Client} client the discord.js client to use to log a message (for logging to a channel)
 * @param {string} message the message to log to the console
 */
export async function logMessage(client: Client, message: string): Promise<void> {
    let channel: TextChannel = client.channels.resolve(CONFIG.channels.logs) as TextChannel;
    console.log(message);
    await channel.send(message);
}
