import { initDatabase } from "./db-init";
import * as sqlite3 from "sqlite3";
import * as fs from "node:fs";

async function Database(filename: string): Promise<sqlite3.Database> {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(filename, err => err ? reject(err) : resolve(db));
    });
}

/**
 * Returns the database object for the database at filename and initializes it
 * if necessary.
 * 
 * @param filename path to database file
 * @returns the database object
 */
export async function getDatabase(filename: string): Promise<sqlite3.Database> {
    const init: boolean = !fs.existsSync(filename);
    const db: sqlite3.Database = await Database(filename);
    if (init) initDatabase(db);
    return db;
}
