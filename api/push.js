const express = require("express");
require("dotenv").config();

/**
 * Creates an express router for this endpoint.
 * @param {Client} client - the discord.js Client object
 * @returns {Router} the Express router for this endpoint
 */
function configureRouter(client) {
    let router = express.Router();

    router.use(express.json());

    router.use((req, res, next) => {
        if (req.get("api-key") == process.env.API_KEY) {
            next();
        } else {
            res.json({
                success: false,
            });
        }
    });

    router.post("/", (req, res, next) => {
        let command = client.commands.get("verify");
        command.participantData.set(req.body.email, req.body.tag);
        command.saveParticipantData();

        console.log(`[Participant Records] ${req.body.tag} <${req.body.email}> added to participant records cache.`);

        let resBody = req.body;
        resBody.success = true;
        res.json(resBody);

        next();
    });
    
    return router;
}

module.exports = configureRouter;
