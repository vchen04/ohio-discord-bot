const fs = require("node:fs");
const path = require("node:path");
const csv = require("csv-parser");
const createCsvWriter = require("csv-writer").createObjectCsvWriter
const rootDir = require("app-root-dir").get();
const { SlashCommandBuilder } = require("discord.js");
const { loggedReply } = require(path.join(rootDir, "logged-reply.js"));

const CONFIG = require(path.join(rootDir, "config.json"));

const PARTICIPANTS_CSV_FILE = path.join(rootDir, CONFIG.participantsFile);
const PARTICIPANT_ROLE_ID = CONFIG.participantsRoleID;
const PARTICIPANT_CSV_EMAIL_COLUMN = CONFIG.participantsEmailColumn;
const PARTICIPANT_CSV_TAG_COLUMN = CONFIG.participantsDiscordTagColumn;

const PARTICIPANTS_CACHE_FILE = path.join(rootDir, "participant-cache.csv");

const LOG_PREFIX = "[Verification] ";

/**
 * Replies to an interaction and logs the interaction, prefixed with LOG_PREFIX, to the console.
 * @param {ChatInputCommandInteraction} interaction - the interaction to reply to
 * @param {string} replyMessage - content of the reply
 * @param {boolean} replyEphemeral - if the reply is ephemeral
 * @param {string} logMessage - log message
 */
async function reply(interaction, replyMessage, replyEphemeral, logMessage) {
    loggedReply(interaction, replyMessage, replyEphemeral, LOG_PREFIX + logMessage);
}

/**
 * Respond to the case that the user is already verified.
 * @param {ChatInputCommandInteraction} interaction - the interaction to respond to
 */
async function respondAlreadyVerified(interaction) {
    await reply(interaction,
        "You have already been verified.",
        true,
        `${interaction.user.tag} attempted to verify as a participant, but has already been verified.`);
}

/**
 * Respond to the case that email is not found in records.
 * @param {ChatInputCommandInteraction} interaction - the interaction to respond to
 * @param {string} email - the email address provided by the user
 * @param {string} tag - the user's Discord tag
 */
async function respondEmailNotFound(interaction, email, tag) {
    await reply(interaction,
        `The e-mail address \`<${email}>\` could not be found in our records. Please try again or contact an organizer.`,
        true,
        `${tag} attempted to verify as a participant with e-mail address \`<${email}>\`, but no records exist for this address.`);
}

/**
 * Respond to the case that email in records does not match the email provided by the user.
 * @param {ChatInputCommandInteraction} interaction - the interaction to respond to
 * @param {string} email - the email address provided by the user
 * @param {string} tagActual - the user's Discord tag
 * @param {string} tagExpected - the tag associated with email in records
 */
async function respondEmailMismatch(interaction, email, tagActual, tagExpected) {
    await reply(interaction,
        `Your Discord tag \`${tagActual}\` does not match our records for the e-mail address \`<${email}>\`. Please try again or contact an organizer.`,
        true,
        `${tagActual} attempted to verify as a participant with e-mail address \`<${email}>\`, but this address is associated with Discord tag ${tagExpected} in records.`);
}

/**
 * Respond to the case that the user is verified.
 * @param {ChatInputCommandInteraction} interaction - the interaction to respond to
 * @param {string} email - the email address provided by the user
 * @param {string} tag - the user's Discord tag
 */
async function respondUserVerified(interaction, email, tag) {
    await reply(interaction,
        "Account verified. You now have access to the Discord server.",
        true,
        `${tag} \`<${email}>\` has been verified as a participant.`);
}

function readCSV(file, map, emailColumn, tagColumn) {
    return new Promise((resolve) => {
        fs.createReadStream(file).pipe(csv())
            .on("data", data => {
                map.set(data[emailColumn], data[tagColumn]);
            })
            .on("end", () => {
                resolve();
            });
    });
}

/**
 * Saves the map of emails to Discord tags to a cache file in .csv format
 * @param {string} file - the file to save map to
 * @param {Map} map - the email to Discord tag map to save
 */
async function saveCache(file, map) {
    let csvWriter = createCsvWriter({
        path: file,
        header: [
            { id: "email", title: "email" },
            { id: "tag", title: "tag" },
        ],
    });

    let records = [];
    map.forEach((value, key) => {
        records.push({ email: key, tag: value });
    });

    await csvWriter.writeRecords(records);
}

/**
 * Populates map with email and Discord tag pairs from file.
 * @param {string} file - the csv file containing email and Discord tag data from Qualtrics
 * @param {string} cache - the csv file containing cached email and Discord tag data
 * @param {Map} map - the map to fill with email to Discord tag pairs
 * @param {string} emailColumn - the name of the column containing email addresses
 * @param {string} tagColumn - the name of the column containing Discord tags
 */
async function populateData(file, cache, map, emailColumn, tagColumn) {
    await readCSV(file, map, emailColumn, tagColumn);
    if (fs.existsSync(cache)) {
        await readCSV(cache, map, "email", "tag");
    } else {
        await saveCache(cache, map);
    }
}

let participantData = new Map();
populateData(PARTICIPANTS_CSV_FILE, PARTICIPANTS_CACHE_FILE, participantData, PARTICIPANT_CSV_EMAIL_COLUMN, PARTICIPANT_CSV_TAG_COLUMN);

module.exports = {
    data: new SlashCommandBuilder()
        .setName("verify")
        .setDescription("Verifies your Discord account for this event.")
        .addStringOption(option =>
            option.setName("email")
                .setDescription("The e-mail address you used to register for this event")
                .setRequired(true)),
    async execute(interaction) {
        let memberRoles = interaction.member.roles;

        if (memberRoles.cache.some(id => id == PARTICIPANT_ROLE_ID)) {
            return await respondAlreadyVerified(interaction);
        }

        let userTag = interaction.user.tag;
        let email = await interaction.options.getString("email");
        let expectedTag = participantData.get(email);

        if (!expectedTag) {
            return await respondEmailNotFound(interaction, email, userTag);
        }

        if (expectedTag != userTag) {
            return await respondEmailMismatch(interaction, email, userTag, expectedTag);
        }

        await memberRoles.add(PARTICIPANT_ROLE_ID);
        await respondUserVerified(interaction, email, userTag);
    },
    participantData: participantData,
    saveParticipantData: () => saveCache(PARTICIPANTS_CACHE_FILE, participantData),
}
