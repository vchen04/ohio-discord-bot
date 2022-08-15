import * as path from "node:path";
import * as appRootDir from "app-root-dir";
import * as express from "express";

import * as CONFIG from "../../config.json";
import * as CREDENTIALS from "../../credentials.json";
import { saveParticipants } from "../util/save-participants";

/**
 * Base path of the project.
 */
 const BASE_DIR: string = appRootDir.get();

/**
 * Creates an express router for this endpoint.
 * @param {any} context - the context to pass to this router
 * @returns {Router} the Express router for this endpoint
 */
export function configureRouter(context: any): express.Router {
    let router: express.Router = express.Router();

    router.use(express.json());

    router.use((req, res, next) => {
        if (req.get("api-key") == CREDENTIALS.qualtricsAPIKey) {
            next();
        } else {
            res.json({
                success: false,
            });
        }
    });

    router.post("/", (req, res, next) => {
        context.participants.set(req.body.email, req.body.tag);
        saveParticipants(path.join(BASE_DIR, CONFIG.participantData.cacheFile), context.participants);

        console.log(`[Participant Records] ${req.body.tag} <${req.body.email}> added to participant records cache.`);

        let resBody = req.body;
        resBody.success = true;
        res.json(resBody);

        next();
    });
    
    return router;
}
