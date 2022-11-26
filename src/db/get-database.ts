import { initDatabase } from "./db-init";
import * as sqlite3 from "sqlite3";
import * as fs from "node:fs";

const FILENAME: string = "data.db";

let db: sqlite3.Database;

async function Database(filename: string): Promise<sqlite3.Database> {
    return new Promise((resolve, reject) => {
        const db: sqlite3.Database = new sqlite3.Database(filename, err => err ? reject(err) : resolve(db));
    });
}

/**
 * Returns the database object and initializes it if necessary.
 * 
 * @returns the database object
 */
export async function getDatabase(): Promise<sqlite3.Database> {
    if (!db) {
        const init: boolean = !fs.existsSync(FILENAME);
        db = await Database(FILENAME);
        if (init) initDatabase(db);
    }

    return db;
}
