// function_insertion.js
const vscode = require('vscode');
const path = require('path');
async function insertFunctionsIntoDatabase(db, document, functions) {
    const projectName = path.basename(vscode.workspace.workspaceFolders[0].uri.fsPath); 
    const projectPath = vscode.workspace.workspaceFolders[0].uri.fsPath; 
    const fileNameOnly = path.basename(document.fileName);
    const relativeFilePath = path.relative(vscode.workspace.workspaceFolders[0].uri.fsPath, document.fileName);

    await db.run('BEGIN TRANSACTION');

    // Check if the project already exists in the database
    const projectExists = await db.get(`SELECT COUNT(*) as count FROM project WHERE name = ? AND path = ?`, projectName, projectPath);

    if (projectExists.count === 0) {
        await db.run(`INSERT INTO project (name, path) VALUES (?, ?)`, projectName, projectPath);
    }

    await db.run(`INSERT OR IGNORE INTO project_file (name, path) VALUES (?, ?)`, fileNameOnly, document.fileName);

    await db.run(`INSERT OR IGNORE INTO project_has_file (project_id, file_id) 
        SELECT p.id, f.id 
        FROM project p, project_file f 
        WHERE p.name = ? AND f.path = ?`, projectName, document.fileName);

    // Insert the extracted functions into the database using a prepared statement
    const stmt = await db.prepare(`INSERT INTO raw_function (name, location, language, content, majorVersion, minorVersion, patchVersion) 
        VALUES (?, ?, ?, ?, 1, 0, 0)`);

    for (const func of functions) {
        await stmt.run(func.name, relativeFilePath, document.languageId, func.content);
    }

    await stmt.finalize();

    await db.run('COMMIT');
}

module.exports = {
    insertFunctionsIntoDatabase
};