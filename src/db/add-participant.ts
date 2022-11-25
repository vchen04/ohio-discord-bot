import { Database } from "sqlite3";

/**
 * Add a participant to the database.
 * 
 * @param db the database object
 * @param email participant email address
 * @param discordTag participant Discord tag
 */
export async function addParticipant(db: Database, email: string, discordTag: string): Promise<void> {
    return new Promise((resolve, reject) => {
        db.get("SELECT id FROM Participants WHERE email=?", email, (err, row) => {
            if (err) reject(err);

            if (row === undefined) {
                db.run("INSERT INTO Participants (email, discordTag) VALUES (?, ?);",
                        [email, discordTag], err => err ? reject(err) : resolve());
            } else {
                db.run("UPDATE Participants SET discordTag=? WHERE id=?;",
                        [discordTag, row.id], err => err ? reject(err) : resolve());
            }
        });
    });
}
