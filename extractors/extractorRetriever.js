// extractorRetriever.js
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const vscode = require('vscode');
const { saveDocumentToTempFile } = require('./documentConverter');
const { deleteTempFile } = require('./documentConverter'); // Assuming the deleteTempFile function is defined and exported in this module.

class ExtractorRetriever {
    extractFunctionsFromDocument(document) {
        const tempFilePath = saveDocumentToTempFile(document, document.languageId);

        // Run the standalone Node script with the language ID as an argument
        const child = spawnSync('node', [path.join(__dirname, 'runExtractor.js'), document.languageId]);
        
        if (child.error) {
            console.error(child.error);
            throw new Error('Failed to run the extraction process.');
        }

        // Updated to use the 'temp' directory
        const outputFilePath = path.join(__dirname, 'temp', `${document.languageId}_temp.json`);
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

        // Cleanup: Delete the temp files after reading
        deleteTempFile(tempFilePath);
        deleteTempFile(outputFilePath);

        return functions;
    }
}

module.exports = ExtractorRetriever;


