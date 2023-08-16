// extractorRetriever.js
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const vscode = require('vscode');
const { saveDocumentToTempFile } = require('./documentConverter');

class ExtractorRetriever {
    extractFunctionsFromDocument(document) {
        const tempFilePath = saveDocumentToTempFile(document, document.languageId);

        // Run the standalone Node script with the language ID as an argument
        const child = spawnSync('node', [path.join(__dirname, 'runExtractor.js'), document.languageId]);
        
        if (child.error) {
            console.error(child.error);
            throw new Error('Failed to run the extraction process.');
        }

        const outputFilePath = path.join(__dirname, `${document.languageId}_temp.json`);
        const functionsData = JSON.parse(fs.readFileSync(outputFilePath, 'utf-8'));

        const functions = functionsData.map(func => {
            const range = new vscode.Range(
                new vscode.Position(func.startPosition.row, func.startPosition.column),
                new vscode.Position(func.endPosition.row, func.endPosition.column)
            );
            const content = document.getText(range);
            
            return {
                name: func.name,
                content: content
            };
        });

        return functions;
    }
}

module.exports = ExtractorRetriever;
