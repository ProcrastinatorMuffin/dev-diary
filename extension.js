// extension.js
const vscode = require('vscode');
const JavaScriptExtractor = require('./extractors/javascript_extractor.js');
const PythonExtractor = require('./extractors/python_extractor.js');
const JavaExtractor = require('./extractors/java_extractor.js');
const CPPExtractor = require('./extractors/cpp_extractor.js');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

let DATABASE_PATH

function activate(context) {
    DATABASE_PATH = path.join(context.extensionPath, 'dev-diary.db');
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.semantic_analysis', async () => {
            const editor = vscode.window.activeTextEditor;

            if (!editor) {
                vscode.window.showErrorMessage('No active editor found');
                return;
            }

            if (!vscode.workspace.rootPath) {
                vscode.window.showErrorMessage('Please open a project/workspace.');
                return;
            }

            const document = editor.document;
            let extractor;

            switch (document.languageId) {
                case 'javascript':
                    extractor = new JavaScriptExtractor();
                    break;
                case 'python':
                    extractor = new PythonExtractor();
                    break;
                case 'java':
                    extractor = new JavaExtractor();
                    break;
                case 'cpp':
                    extractor = new CPPExtractor();
                    break;
                default:
                    vscode.window.showErrorMessage('Unsupported file type for extraction.');
                    return;
            }

            const functions = extractor.extractFunctionsFromDocument(document);

            if (functions.length === 0) {
                vscode.window.showWarningMessage('No functions captured. Nothing to insert into database.');
                return;
            }

            const db = await initializeDatabase();

            const projectName = path.basename(vscode.workspace.workspaceFolders[0].uri.fsPath); 
            const projectPath = vscode.workspace.workspaceFolders[0].uri.fsPath; 
            const fileNameOnly = path.basename(document.fileName);
            const relativeFilePath = path.relative(vscode.workspace.workspaceFolders[0].uri.fsPath, document.fileName);

            try {
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

                vscode.window.showInformationMessage('Functions inserted into database.');
            } catch (err) {
                vscode.window.showErrorMessage(err.message);
            } finally {
                db.close();
            }
        })
    );
}

async function initializeDatabase() {
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
    activate
};

