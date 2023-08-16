// extension.js
const vscode = require('vscode');
const ExtractorRetriever = require('./extractors/extractorRetriever.js');
const { setDatabasePath, insertFunctionsIntoDatabase } = require('./dbOperations.js');
const path = require('path');

function activate(context) {
    setDatabasePath(context.extensionPath);

    context.subscriptions.push(
        vscode.commands.registerCommand('extension.semantic_analysis', async () => {
            console.log('Starting semantic analysis...'); // LOGGING START

            const editor = vscode.window.activeTextEditor;

            if (!editor) {
                vscode.window.showErrorMessage('No active editor found');
                return;
            }

            if (!vscode.workspace.workspaceFolders) {
                vscode.window.showErrorMessage('Please open a project/workspace.');
                return;
            }

            const document = editor.document;

            console.log('Detected language: ', document.languageId); // LOGGING LANGUAGE

            // Using the new ExtractorRetriever
            const supportedLanguages = ['javascript', 'python', 'java', 'cpp'];
            if (!supportedLanguages.includes(document.languageId)) {
                vscode.window.showErrorMessage('Unsupported file type for extraction.');
                return;
            }
            const extractor = new ExtractorRetriever();

            console.log('Extracting functions...'); // LOGGING BEFORE EXTRACTION

            const functions = extractor.extractFunctionsFromDocument(document);

            console.log('Functions extracted:', functions); // LOGGING FUNCTIONS EXTRACTED

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
                console.error(err);  // LOGGING ERROR
                vscode.window.showErrorMessage(err.message);
            }
        })
    );
}

module.exports = {
    activate
};



