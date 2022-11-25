import { readdir } from "node:fs/promises";
import { ChatInputCommandInteraction, Client, Collection } from "discord.js";
import { Command, CustomClient } from "./types";

const COMMANDS_PATH: string = "./commands";

async function loadCommands(client: Client): Promise<Client & { commands: Collection<string, Command> }> {
    const result: Client & { commands: Collection<string, Command> } = client as Client & { commands: Collection<string, Command> };

    result.commands = new Collection<string, Command>();

    const files: string[] = (await readdir(COMMANDS_PATH)).filter(file => file.endsWith(".js"));
    for (const file of files) {
        const command: Command = await import(file);
        result.commands.set(command.data.name, command);
    }

    return result;
}

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

function loadWebAPI(app: Express.Application, client: CustomClient) {

}

