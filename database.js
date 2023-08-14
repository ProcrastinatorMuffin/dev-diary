// database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

function initializeDatabase(extensionPath) {
    const DATABASE_PATH = path.join(extensionPath, 'dev-diary.db');

    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DATABASE_PATH, (err) => {
            if (err) {
                reject(err);
            } else {
                // Enable foreign key constraints for the database
                db.run('PRAGMA foreign_keys = ON');

                resolve(db);
            }
        });
    });
}

module.exports = {
    initializeDatabase
};