import * as fs from "node:fs";
import * as path from "node:path";
import * as appRootDir from "app-root-dir";

import * as CONFIG from "../../config.json";

/**
 * Base path of the project.
 */
const BASE_DIR: string = appRootDir.get();

/**
 * Path of the team counter file.
 */
const COUNTER_FILE = path.join(BASE_DIR, CONFIG.teamData.counterFile);

/**
 * Gets the current team count.
 * @returns {number} the current team count
 */
function getCounter(): number {
    if (!fs.existsSync(COUNTER_FILE)) {
        return 0;
    } else {
        let counter = require(COUNTER_FILE);
        return counter.count;
    }
}

/**
 * Set the counter to a certain number.
 * @param count the count to set.
 */
function setCounter(count: number): void {
    fs.writeFileSync(COUNTER_FILE, JSON.stringify({count: count}));
}

/**
 * Increment the counter and return the incremented value.
 * @returns {number} the previous value of the counter incremented by 1
 */
export function incrementCounter(): number {
    let count = getCounter() + 1;
    setCounter(count);
    return count;
}
