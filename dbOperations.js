// dbOperations.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const vscode = require('vscode');

let DATABASE_PATH;

function setDatabasePath(extensionPath) {
    DATABASE_PATH = path.join(extensionPath, 'dev-diary.db');
}

async function initializeDatabase() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DATABASE_PATH, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve(db);
            }
        });
    });
}

async function insertFunctionsIntoDatabase(projectName, projectPath, fileNameOnly, document, functions) {
    const db = await initializeDatabase();

    try {
        await db.run('BEGIN TRANSACTION');

        const projectExists = await db.get(`SELECT COUNT(*) as count FROM project WHERE name = ? AND path = ?`, projectName, projectPath);

        if (projectExists.count === 0) {
            await db.run(`INSERT INTO project (name, path) VALUES (?, ?)`, projectName, projectPath);
        }

        await db.run(`INSERT OR IGNORE INTO project_file (name, path) VALUES (?, ?)`, fileNameOnly, document.fileName);

        await db.run(`INSERT OR IGNORE INTO project_has_file (project_id, file_id) 
            SELECT p.id, f.id 
            FROM project p, project_file f 
            WHERE p.name = ? AND f.path = ?`, projectName, document.fileName);

        const stmt = await db.prepare(`INSERT INTO raw_function (name, location, language, content, majorVersion, minorVersion, patchVersion) 
            VALUES (?, ?, ?, ?, 1, 0, 0)`);

        for (const func of functions) {
            const relativeFilePath = path.relative(vscode.workspace.workspaceFolders[0].uri.fsPath, document.fileName);
            await stmt.run(func.name, relativeFilePath, document.languageId, func.content);
        }

        await stmt.finalize();
        await db.run('COMMIT');

        return true;
    } catch (err) {
        throw err;
    } finally {
        db.close();
    }
}

module.exports = {
    setDatabasePath,
    insertFunctionsIntoDatabase
};
