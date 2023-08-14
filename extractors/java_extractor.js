// java_extractor.js
const vscode = require('vscode');

class JavaExtractor {
    extractFunctionsFromDocument(document) {
        const functions = [];
        let annotations = '';
        let currentFunctionName = '';

        // Extract function name from declaration
        const extractFunctionName = (lineText) => {
            const match = lineText.match(/\s(\w+)\s*\(/);
            return match ? match[1] : '';
        };

        for (let i = 0; i < document.lineCount; i++) {
            const lineText = document.lineAt(i).text.trim();

            // Match Java annotations
            const annotationDeclaration = lineText.match(/^@[\w.]+/);

            // Match Java function declarations
            const functionDeclaration = lineText.match(/(public|private|protected)?\s*[\w\<\>\[\]]+\s+\w+\s*\([^)]*\)\s*({)?/);

            if (annotationDeclaration) {
                // Add the annotation to the list of annotations for the current function
                annotations += lineText + '\n';
            } else if (functionDeclaration) {
                let j = i;
                let functionText = annotations;
                let curlyBraceCount = functionDeclaration[2] === '{' ? 1 : 0;  // Check if the function declaration ends with {
                currentFunctionName = extractFunctionName(lineText);

                // Add the current line to the functionText
                functionText += lineText + '\n';
                j++;

                // Capture the entire function
                while (j < document.lineCount && curlyBraceCount > 0) {
                    const currentLineText = document.lineAt(j).text;
                    functionText += currentLineText + '\n';

                    curlyBraceCount += (currentLineText.match(/{/g) || []).length;
                    curlyBraceCount -= (currentLineText.match(/}/g) || []).length;

                    j++;
                }

                functions.push({
                    name: currentFunctionName,
                    content: functionText.trim()
                });

                annotations = ''; // Reset annotations after capturing function
            } else {
                // If the line does not match any known patterns, reset annotations
                annotations = '';
            }
        }

        return functions;
    }
}

module.exports = JavaExtractor;

