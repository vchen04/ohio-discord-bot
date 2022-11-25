import * as express from "express";

/**
 * Callback function used to save received data.
 * 
 * @callback pushCallback
 * @param email { string } received email address
 * @param tag { string } received Discord tag
 */

/**
 * Creates a router for a push endpoint.
 * 
 * @param key { string } API key to use to authenticate requests
 * @param callback { pushCallback } function to save received data
 * @returns { express.Router } the express router
 */
export function PushEndpointRouter(key: string, callback: (email: string, tag: string) => void) {
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
