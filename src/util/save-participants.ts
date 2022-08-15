import { createArrayCsvWriter } from "csv-writer";
import { CsvWriter } from "csv-writer/src/lib/csv-writer";

/**
 * Saves the participants in map into file in csv format.
 * @param {string} file the file to save the map to
 * @param {Map<string, string>} map the map to save
 */
export async function saveParticipants(file: string, map: Map<string, string>): Promise<void> {
    let csvWriter: CsvWriter<any> = createArrayCsvWriter({
        header: ["email", "tag"],
        path: file,
    });

    await csvWriter.writeRecords(Array.from(map.entries()));
}
