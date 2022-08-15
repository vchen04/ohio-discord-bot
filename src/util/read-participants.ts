import * as fs from "node:fs";
import { readFile } from "./read-csv";

/**
 * Populate a map of email addresses to Discord tags from data in cacheFile and initFile. 
 * @param {string} initFile the csv file containing initial participant data
 * @param {string} cacheFile the csv file containing cached participant data
 * @param {Map<string, string>} map the map to read into
 * @param {string} initEmailCol the name of the column containing email addresses in initFile
 * @param {string} initTagCol the name of the column containing Discord tags in initFile
 */
export async function readParticipants(initFile: string, cacheFile: string, map: Map<string, string>, initEmailCol: string, initTagCol: string): Promise<void> {
    if (fs.existsSync(cacheFile)) {
        await readFile(cacheFile, map, "email", "tag");
    } else {
        await readFile(initFile, map, initEmailCol, initTagCol);
    }
}
