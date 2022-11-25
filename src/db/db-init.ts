import { Database } from "sqlite3";

/**
 * Initializes a new database.
 * @param db database object
 */
export async function initDatabase(db: Database): Promise<void> {
    return new Promise((resolve, reject) => {
        db.run(
            `CREATE TABLE Teams (
                number int PRIMARY KEY AUTO_INCREMENT,
                name varchar(80) NOT NULL
            );
            CREATE TABLE Participants (
                id int PRIMARY KEY AUTO_INCREMENT,
                email varchar(255) NOT NULL UNIQUE,
                discordTag varchar(39) NOT NULL UNIQUE,
                discordID int,
                team REFERENCES Teams(number)
            );
            CREATE TABLE Judges (
                id int PRIMARY KEY AUTO_INCREMENT,
                email varchar(255) NOT NULL UNIQUE,
                discordTag varchar(39) NOT NULL UNIQUE,
                discordID int
            );
            CREATE TABLE Mentors (
                id int PRIMARY KEY AUTO_INCREMENT,
                email varchar(255) NOT NULL UNIQUE,
                discordTag varchar(39) NOT NULL UNIQUE,
                discordID int
            );`, err => err ? reject(err) : resolve()
        );
    });
}
