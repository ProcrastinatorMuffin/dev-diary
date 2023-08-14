// cpp_extractor.js
const vscode = require('vscode');

class CppExtractor {
    extractFunctionsFromDocument(document) {
        const functions = [];
        let buffer = '';  // Temporary buffer to store multi-line functions or classes
        let curlyBraceCount = 0;
        let isInFunction = false;
        let currentFunctionName = '';

        // Extract function name from declaration
        const extractFunctionName = (lineText) => {
            const match = lineText.match(/\b(\w+)\s*\(/);
            return match ? match[1] : '';
        };

        for (let i = 0; i < document.lineCount; i++) {
            const lineText = document.lineAt(i).text.trim();
            
            // Check for template functions
            if (lineText.startsWith('template')) {
                buffer += lineText + '\n';
                continue; // Move to next line
            }

            // Check for member functions of a class or struct
            if (lineText.match(/^(class|struct)\s+\w+/)) {
                buffer += lineText + '\n';
                continue;  // It's a class or struct declaration; continue until we find its end
            }

            const functionDeclaration = lineText.match(/(\w+\s+)?\w+\s*\w*\s*\([^)]*\)\s*(const)?\s*{?/);

            if (functionDeclaration) {
                currentFunctionName = extractFunctionName(lineText);
                isInFunction = true;
            }

            if (isInFunction) {
                buffer += lineText + '\n';
                curlyBraceCount += (lineText.match(/{/g) || []).length;
                curlyBraceCount -= (lineText.match(/}/g) || []).length;

                if (curlyBraceCount === 0) {
                    functions.push({
                        name: currentFunctionName,
                        content: buffer.trim()
                    });
                    buffer = '';  // Reset the buffer
                    currentFunctionName = '';  // Reset the function name
                    isInFunction = false;
                }
            }
        }

        return functions;
    }
}

module.exports = CppExtractor;


