import { ChatInputCommandInteraction, Client, Collection, SlashCommandBuilder } from "discord.js";

export interface Command {
    data: SlashCommandBuilder,
    execute(interaction: ChatInputCommandInteraction): Promise<void>,
    context: any,
}

export interface OHIOBotClient extends Client {
    participants?: Map<string, string>,
    commands?: Collection<string, Command>,
}

// export interface OHIOBotCredentials {
//     /**
//      * Bot Client ID
//      */
//     discordClient: string,
//     /**
//      * Bot Token
//      */
//     discordToken: string,
//     /**
//      * Discord Server ID
//      */
//     discordGuild: string,
//     /**
//      * API Key to use with Qualtrics
//      */
//     qualtricsAPIKey: string,
// }

// export interface OHIOBotConfig {
//     roles: {
//         participant: string,
//         mentor: string,
//         sponsor: string,
//         judge: string,
//         teamAssigned: string,
//     },
//     participantData: {
//         initFile: string,
//         cacheFile: string,
//         emailColumn: string,
//         tagColumn: string,
//     },
//     teamData: {
//         counterFile: string,
//         roleColor: string,
//         maxSize: number,
//     },
//     port: number,
// }
