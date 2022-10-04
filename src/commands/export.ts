import { ChatInputCommandInteraction, SlashCommandBuilder, GuildMemberRoleManager } from "discord.js";
import { createObjectCsvWriter } from "csv-writer";
import { CsvWriter } from "csv-writer/src/lib/csv-writer";
import * as CONFIG from "../../config.json";
import { logMessage } from "../util/log";
import { OHIOBotClient } from "../types";

export const data = new SlashCommandBuilder()
.setName("export")
.setDescription("Export event data");

/**
 * The prefix to add to all console log messages related to this command.
 */
const LOG_PREFIX = "[Export Data]";

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply();

    if (!(interaction.member.roles as GuildMemberRoleManager).cache.some(role => role.id == CONFIG.roles.organizer)) {
        interaction.editReply({
            content: `Failed to export event data. You must be an organizer to use this command.`,
        });
        return logMessage(interaction.client, `${LOG_PREFIX} Failure: ${interaction.user.tag} tried to export event data, but is not an organizer.`);
    }

    let client: OHIOBotClient = interaction.client as OHIOBotClient;

    let csvWriter: CsvWriter<any> = createObjectCsvWriter({
        path: CONFIG.export.path,
        header: [
            { id: "tag", title: "tag", },
            { id: "email", title: "email", },
            { id: "roles", title: "roles", },
        ],
    });

    interaction.guild.members.cache.forEach(member => {
        let tag: string = member.user.tag;

        /* 
         * TODO: This is soooooooooooooooooo bad, need a more robust way to
         * store participant data... probably using snowflakes + local database
         */
        let email: string;
        client.participants.forEach((pairTag, pairEmail) => {
            if (pairTag == tag) {
                email = pairEmail;
            }
        });

        let roles: string = "";

        member.roles.cache.forEach(role => {
            roles += `${role.name},`;
        });

        csvWriter.writeRecords([
            {
                tag: tag,
                email: email,
                roles: roles,
            }
        ]);
    });

}
