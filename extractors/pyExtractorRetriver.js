// const vscode = require('vscode');

// class PythonExtractor {
//     extractFunctionsFromDocument(document) {
//         const functions = [];
//         let currentFunctionContent = '';
//         let currentFunctionName = '';
//         let insideFunction = false;
//         let indentationLevel = null;
//         let decorators = [];

//         // Extract function name from declaration
//         const extractFunctionName = (lineText) => {
//             const match = lineText.match(/def\s+(\w+)/);
//             return match ? match[1] : '';
//         };

//         // Check if a line of code is a decorator declaration
//         const isDecoratorDeclaration = (lineText) => {
//             return /^\s*@[\w.]+/.test(lineText);
//         };

//         // Check if a line of code is a function declaration
//         const isFunctionDeclaration = (lineText) => {
//             return /^\s*(async\s+)?def\s+\w+\s*\([^)]*\):/.test(lineText);
//         };

//         // Get the indentation level of a line of code
//         const getIndentationLevel = (lineText) => {
//             return lineText.match(/^(\s*)/)[0].length;
//         };

//         for (let i = 0; i < document.lineCount; i++) {
//             const lineText = document.lineAt(i).text;

//             if (isDecoratorDeclaration(lineText)) {
//                 decorators.push(lineText);
//             } else if (isFunctionDeclaration(lineText) && !insideFunction) {
//                 insideFunction = true;
//                 currentFunctionName = extractFunctionName(lineText);
//                 currentFunctionContent = decorators.concat(lineText).join('\n');
//                 decorators = [];
//                 indentationLevel = getIndentationLevel(lineText);
//             } else if (insideFunction) {
//                 const currentIndentation = getIndentationLevel(lineText);

//                 if (currentIndentation > indentationLevel) {
//                     currentFunctionContent += '\n' + lineText;
//                 } else {
//                     functions.push({
//                         name: currentFunctionName,
//                         content: currentFunctionContent.trim()
//                     });

//                     insideFunction = false;
//                     currentFunctionContent = '';
//                     currentFunctionName = '';
//                     indentationLevel = null;

//                     if (isFunctionDeclaration(lineText)) {
//                         insideFunction = true;
//                         currentFunctionName = extractFunctionName(lineText);
//                         currentFunctionContent = decorators.concat(lineText).join('\n');
//                         decorators = [];
//                         indentationLevel = getIndentationLevel(lineText);
//                     } else if (isDecoratorDeclaration(lineText)) {
//                         decorators.push(lineText);
//                     }
//                 }
//             } else {
//                 decorators = [];
//             }
//         }

//         if (insideFunction) {
//             functions.push({
//                 name: currentFunctionName,
//                 content: currentFunctionContent.trim()
//             });
//         }

//         return functions;
//     }
// }

// module.exports = PythonExtractor;

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const vscode = require('vscode');
const { saveDocumentToTempFile } = require('./documentConverter');

class PythonExtractor {
    extractFunctionsFromDocument(document) {
        const tempFilePath = saveDocumentToTempFile(document);

        // Run the standalone Node script
        const child = spawnSync('node', [path.join(__dirname, 'runPyExtractor.js')]);
        
        if (child.error) {
            console.error(child.error);
            throw new Error('Failed to run the extraction process.');
        }

        const outputFilePath = path.join(__dirname, 'temp.json');
        const functionsData = JSON.parse(fs.readFileSync(outputFilePath, 'utf-8'));

        // Transform data as needed (if required)
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

module.exports = PythonExtractor;


