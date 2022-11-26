import { Database } from "sqlite3";

/**
 * Initializes a new database.
 * @param db database object
 */
export function initDatabase(db: Database): void {
    db.run(`
        CREATE TABLE Teams (
            number INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL
        );`
    ).run(`
        CREATE TABLE Participants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            discordTag TEXT NOT NULL UNIQUE,
            discordID INTEGER,
            team INTEGER REFERENCES Teams(number)
        );`
    ).run(`
        CREATE TABLE Judges (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            discordTag TEXT NOT NULL UNIQUE,
            discordID INTEGER
        );`
    ).run(`
        CREATE TABLE Mentors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            discordTag TEXT NOT NULL UNIQUE,
            discordID INTEGER
        );`
    );
}
