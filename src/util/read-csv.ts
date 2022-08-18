import * as fs from "node:fs";
import * as csvParse from "csv-parser";

/**
 * Reads the contents of csv file containing email addresses and Discord tags into Map of emails to Discord tags, mapping keys from emailCol to values from tagCol.
 * @param {string} file the csv file to read from
 * @param {Map<string, string>} map the map to read into
 * @param {string} emailCol the name of column of file containing email addresses
 * @param {string} tagCol the name of the column of file containing Discord tags
 */
export async function readFile(file: string, map: Map<string, string>, emailCol: string, tagCol: string): Promise<void> {
    return new Promise(resolve => {
        fs.createReadStream(file).pipe(csvParse())
            .on("data", data => map.set(data[emailCol].toLowerCase(), data[tagCol]))
            .on("end", () => resolve());
    });
}
