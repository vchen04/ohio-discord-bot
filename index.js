const fs = require("node:fs");
const path = require("node:path");
const express = require("express");
const { Client, Collection, GatewayIntentBits } = require("discord.js");

/**
 * Path of the directory containing command definitions.
 */
const COMMANDS_PATH = path.join(__dirname, "commands");

/**
 * Store a Collection of commands in client.commands.
 * @param {Client} client - discord.js Client object
 */
function loadCommands(client) {
    let commandFiles = fs.readdirSync(COMMANDS_PATH).filter(file => file.endsWith(".js"));
    client.commands = new Collection();
    for (let file of commandFiles) {
        let command = require(path.join(COMMANDS_PATH, file));
        client.commands.set(command.data.name, command);
    }
}

/**
 * Register listeners for events on client.
 * @param {Client} client - discord.js Client object to configure
 */
function setupListeners(client) {
    client.on('interactionCreate', async interaction => {
        if (!interaction.isChatInputCommand()) return;
        
        let command = client.commands.get(interaction.commandName);
        if (!command) return;
        
        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: "There was an error while executing this command.",
                ephemeral: true,
            });
        }
    });

    client.once("ready", () => {
        console.log("[Status] Ready");
    });
}

/**
 * Create API endpoints to modify participant data via web API.
 * @param {Client} discordClient - the discord.js Client object
 * @returns the Express application created
 */
function setupAPI(discordClient) {
    let api = express();
    api.use("/api/push", require(path.join(__dirname, "api/push.js"))(discordClient));

    api.listen(process.env.PORT, () => {
        console.log("[Web API] API Server started.");
    });
    return api;
}

/*
 * Main procedure -------------------------------------------------------------
 */

require("dotenv").config();

let client = new Client({intents: [GatewayIntentBits.Guilds]});

loadCommands(client);
setupListeners(client);

client.login(process.env.TOKEN);

let api = setupAPI(client);
