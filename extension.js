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
        vscode.commands.registerCommand('extension.semantic_analysis', () => {
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

            // Create or open the database
            let db = new sqlite3.Database(DATABASE_PATH, (err) => {
                if (err) {
                    return vscode.window.showErrorMessage(err.message);
                }
            });

            const projectName = path.basename(vscode.workspace.workspaceFolders[0].uri.fsPath); 
            const projectPath = vscode.workspace.workspaceFolders[0].uri.fsPath; 
            const fileNameOnly = path.basename(document.fileName);
            const relativeFilePath = path.relative(vscode.workspace.workspaceFolders[0].uri.fsPath, document.fileName);


            // Using transactions for batch operations
            db.serialize(function() {
                db.run('BEGIN TRANSACTION');

                let stmt = db.prepare("INSERT OR IGNORE INTO project (name, path) VALUES (?, ?)");
                stmt.run(projectName, projectPath);
                stmt.finalize();

                stmt = db.prepare("INSERT OR IGNORE INTO project_file (name, path) VALUES (?, ?)");
                stmt.run(fileNameOnly, document.fileName);
                stmt.finalize();


                stmt = db.prepare(`INSERT OR IGNORE INTO project_has_file (project_id, file_id) 
                    SELECT p.id, f.id 
                    FROM project p, project_file f 
                    WHERE p.name = ? AND f.path = ?`);
                stmt.run(projectName, document.fileName);
                stmt.finalize();

                // Insert the extracted functions into the database
                functions.forEach(func => {
                    stmt = db.prepare(`INSERT INTO raw_function (name, location, language, content, majorVersion, minorVersion, patchVersion) 
                        VALUES (?, ?, ?, ?, 1, 0, 0)`);
                    stmt.run(func.name, relativeFilePath, document.languageId, func.content);
                    stmt.finalize();
                });

                db.run('COMMIT');
            });

            vscode.window.showInformationMessage('Functions inserted into database.');

            // Close the database
            db.close();
        })
    );
}

module.exports = {
    activate
};

