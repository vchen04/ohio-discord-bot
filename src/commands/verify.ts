import { ChatInputCommandInteraction, GuildMemberRoleManager, SlashCommandBuilder } from "discord.js";

import * as CONFIG from "../../config.json";
import { OHIOBotClient } from "../types";

/**
 * The prefix to add to all console log messages related to this command.
 */
const LOG_PREFIX = "[Verification]";

export const data = new SlashCommandBuilder()
    .setName("verify")
    .setDescription("Verify your Discord account for this event")
    .addStringOption(option =>
        option.setName("email")
            .setDescription("The e-mail address you used to register for this event")
            .setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    let memberRoles: GuildMemberRoleManager = interaction.member.roles as GuildMemberRoleManager;

    /* User is already a verified participant */
    if (memberRoles.cache.some(role => role.id == CONFIG.roles.participant)) {
        await interaction.reply({
            content: "Verification failed. You have already been verified.",
            ephemeral: true,
        });
        return console.log(`${LOG_PREFIX} Failure: ${interaction.user.tag} is already a participant.`);
    }

    let client: OHIOBotClient = interaction.client as OHIOBotClient;
    let email: string = interaction.options.getString("email");
    let tag: string = client.participants.get(email);

    /* Email not found */
    if (tag === undefined) {
        await interaction.reply({
            content: `Verification failed. The email address \`<${email}>\` could not be found in our records. Please try again or contact an organizer.`,
            ephemeral: true,
        });
        return console.log(`${LOG_PREFIX} Failure: ${interaction.user.tag} attempted to verify with email <${email}>, which cannot be found in records`);
    }

    /* User's tag does not match the tag in records */
    if (interaction.user.tag !== tag) {
        await interaction.reply({
            content: `Verification failed. The email address \`<${email}>\` does not match your Discord tag \`${interaction.user.tag}\` in our records. Please try again or contact an organizer.`,
            ephemeral: true,
        });
        return console.log(`${LOG_PREFIX} Failure: ${interaction.user.tag} attempted to verify with email <${email}>, but records indicate this email address is associated with Discord tag ${tag}`);
    }

    /* Success */
    await memberRoles.add(CONFIG.roles.participant);

    await interaction.reply({
        content: `You have been successfully verified. You now have access to the Discord server.`,
        ephemeral: true,
    });
    console.log(`${LOG_PREFIX} Success: ${interaction.user.tag} has been verified as a participant`);
}