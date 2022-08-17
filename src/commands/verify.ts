import { ChatInputCommandInteraction, GuildChannel, GuildMemberRoleManager, SlashCommandBuilder } from "discord.js";

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
    let startHereChannel: GuildChannel = interaction.guild.channels.cache.get(CONFIG.channels.startHere) as GuildChannel;
    let askOrganizerChannel: GuildChannel = interaction.guild.channels.cache.get(CONFIG.channels.askOrganizer) as GuildChannel;

    /* User is already a verified participant */
    if (memberRoles.cache.some(role => role.id == CONFIG.roles.participant)) {
        await interaction.reply({
            content: `Verification failed. You have already been verified. Head over to the ${startHereChannel} channel for instructions on next steps.`,
            ephemeral: true,
        });
        return console.log(`${LOG_PREFIX} Failure: ${interaction.user.tag} is already a participant.`);
    }

    let client: OHIOBotClient = interaction.client as OHIOBotClient;
    let email: string = interaction.options.getString("email");
    let tag: string = client.participants.get(email);

    /* Email not found */
    if (tag == undefined) {
        await interaction.reply({
            content: `Verification failed. The email address \`<${email}>\` could not be found in our records. Registration is required in order to participate in this event. If you have not already registered, please register at ${CONFIG.messages.registrationLink}, then run the \`verify\` command again. Please contact an organizer at \`<${CONFIG.messages.organizerEmail}\`> or in the ${askOrganizerChannel} channel if you believe this is an error.`,
            ephemeral: true,
        });
        return console.log(`${LOG_PREFIX} Failure: ${interaction.user.tag} attempted to verify with email <${email}>, which cannot be found in records`);
    }

    /* User's tag does not match the tag in records */
    if (interaction.user.tag != tag) {
        await interaction.reply({
            content: `Verification failed. The email address \`<${email}>\` does not match your Discord tag \`${interaction.user.tag}\` in our records. Please contact an organizer at \`<${CONFIG.messages.organizerEmail}\`> or in the ${askOrganizerChannel} channel if you believe this is an error.`,
            ephemeral: true,
        });
        return console.log(`${LOG_PREFIX} Failure: ${interaction.user.tag} attempted to verify with email <${email}>, but records indicate this email address is associated with Discord tag ${tag}`);
    }

    /* Success */
    await memberRoles.add(CONFIG.roles.participant);

    await interaction.reply({
        content: `You have been successfully verified. You now have access to the Discord server. Head over to the ${startHereChannel} channel for instructions on next steps.`,
        ephemeral: true,
    });
    console.log(`${LOG_PREFIX} Success: ${interaction.user.tag} has been verified as a participant`);
}
