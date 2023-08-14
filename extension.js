// extension.js
const vscode = require('vscode');
const JavaScriptExtractor = require('./extractors/javascript_extractor.js');
const PythonExtractor = require('./extractors/python_extractor.js');
const JavaExtractor = require('./extractors/java_extractor.js');
const CPPExtractor = require('./extractors/cpp_extractor.js');
const { setDatabasePath, insertFunctionsIntoDatabase } = require('./dbOperations.js');
const path = require('path');

function activate(context) {
    setDatabasePath(context.extensionPath);

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

            const projectName = path.basename(vscode.workspace.workspaceFolders[0].uri.fsPath);
            const projectPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
            const fileNameOnly = path.basename(document.fileName);

            try {
                await insertFunctionsIntoDatabase(projectName, projectPath, fileNameOnly, document, functions);
                vscode.window.showInformationMessage('Functions inserted into database.');
            } catch (err) {
                vscode.window.showErrorMessage(err.message);
            }
        })
    );
}

module.exports = {
    activate
};

