const vscode = require('vscode');

class JavaScriptExtractor {
    extractFunctionsFromDocument(document) {
        const functions = [];
        let decorators = '';

        for (let i = 0; i < document.lineCount; i++) {
            const lineText = document.lineAt(i).text.trim();

            // Match decorators in JS
            const decoratorDeclaration = lineText.match(/^@[\w.]+/);
            
            // Match JavaScript function declarations
            const functionDeclaration = lineText.match(/function\s+\w+\s*\([^)]*\)/);

            if (decoratorDeclaration) {
                // Add the decorator to the list of decorators for the current function
                decorators += lineText + '\n';
            } else if (functionDeclaration) {
                let j = i;
                let functionText = decorators;
                let curlyBraceCount = 0;

                // Add the current line to the functionText
                functionText += lineText + '\n';
                j++;

                // Capture the entire function
                while (j < document.lineCount && curlyBraceCount >= 0) {
                    const currentLineText = document.lineAt(j).text;
                    functionText += currentLineText + '\n';

                    curlyBraceCount += (currentLineText.match(/{/g) || []).length;
                    curlyBraceCount -= (currentLineText.match(/}/g) || []).length;

                    j++;
                }

                functions.push(functionText.trim());
                decorators = ''; // Reset decorators after capturing function
            } else {
                // If the line does not match any known patterns, reset decorators
                decorators = '';
            }
        }

        return functions;
    }
}

module.exports = JavaScriptExtractor;
