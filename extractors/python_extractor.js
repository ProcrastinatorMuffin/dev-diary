const vscode = require('vscode');

class PythonExtractor {
    extractFunctionsFromDocument(document) {
        const functions = [];
        let currentFunction = '';
        let insideFunction = false;
        let indentationLevel = null;
        let decorators = [];

        // Check if a line of code is a decorator declaration
        const isDecoratorDeclaration = (lineText) => {
            return /^\s*@[\w.]+/.test(lineText);
        };

        // Check if a line of code is a function declaration
        const isFunctionDeclaration = (lineText) => {
            return /^\s*(async\s+)?def\s+\w+\s*\([^)]*\):/.test(lineText);
        };

        // Get the indentation level of a line of code
        const getIndentationLevel = (lineText) => {
            return lineText.match(/^(\s*)/)[0].length;
        };

        for (let i = 0; i < document.lineCount; i++) {
            const lineText = document.lineAt(i).text;

            if (isDecoratorDeclaration(lineText)) {
                // Add the decorator to the list of decorators for the current function
                decorators.push(lineText);
            } else if (isFunctionDeclaration(lineText) && !insideFunction) {
                // Start a new function
                insideFunction = true;
                currentFunction = decorators.concat(lineText).join('\n');
                decorators = [];
                indentationLevel = getIndentationLevel(lineText);
            } else if (insideFunction) {
                const currentIndentation = getIndentationLevel(lineText);

                if (currentIndentation > indentationLevel) {
                    // Continue capturing the function
                    currentFunction += '\n' + lineText;
                } else {
                    // End of function
                    functions.push(currentFunction.trim());
                    insideFunction = false;
                    currentFunction = '';
                    indentationLevel = null;

                    // Check if the current line starts another function
                    if (isFunctionDeclaration(lineText)) {
                        insideFunction = true;
                        currentFunction = decorators.concat(lineText).join('\n');
                        decorators = [];
                        indentationLevel = getIndentationLevel(lineText);
                    } else if (isDecoratorDeclaration(lineText)) {
                        // Handle case where decorator directly precedes another function
                        decorators.push(lineText);
                    }
                }
            } else {
                // Reset decorators if not inside a function
                decorators = [];
            }
        }

        // In case the last function of the document has been captured but not saved
        if (insideFunction) {
            functions.push(currentFunction.trim());
        }

        return functions;
    }
}

module.exports = PythonExtractor;
