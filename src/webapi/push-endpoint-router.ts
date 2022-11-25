import * as express from "express";

/**
 * Callback function used to save received data.
 * 
 * @callback pushCallback
 * @param email received email address
 * @param tag received Discord tag
 */

/**
 * Creates a router for a push endpoint.
 * 
 * @param key API key to use to authenticate requests
 * @param {pushCallback} callback function to save received data
 * @returns the express router
 */
export function PushEndpointRouter(key: string, callback: (email: string, tag: string) => void): express.Router {
    const router = express.Router();

    router.use(express.json());

    router.use((req, res, next) => {
        if (req.get("api-key") == key) {
            next();
        } else {
            res.json({
                success: false,
            });
        }
    });
    
    router.post("/", (req, res, next) => {
        callback(req.body.email.toLowerCase(), req.body.tag);

        const resBody: any = req.body;
        resBody.success = true;
        res.json(resBody);

        next();
    });

    return router;
}
