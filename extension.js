const vscode = require('vscode');
const fs = require('fs');
const JavaScriptExtractor = require('./extractors/javascript_extractor.js');
const PythonExtractor = require('./extractors/python_extractor.js');
const JavaExtractor = require('./extractors/java_extractor.js');
const CPPExtractor = require('./extractors/cpp_extractor.js');


function activate(context) {
    const provider = new FunctionTypeTokenProvider();

    context.subscriptions.push(
        vscode.languages.registerDocumentSemanticTokensProvider(
            { language: 'javascript' },
            provider,
            provider.getLegend()
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('extension.semantic_analysis', () => {
            const editor = vscode.window.activeTextEditor;

            if (!editor) {
                vscode.window.showErrorMessage('No active editor found');
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

            const filePath = '/Users/peocrastinatormuffin/Code/functions.txt';

            if (functions.length === 0) {
                vscode.window.showWarningMessage('No functions captured. Nothing to write.');
                return;
            }

            fs.writeFile(filePath, functions.join('\n\n'), (err) => {
                if (err) {
                    vscode.window.showErrorMessage('Error writing to file: ' + err.toString());
                } else {
                    vscode.window.showInformationMessage('Functions extracted to file');
                }
            });
        })
    );
}

class FunctionTypeTokenProvider {
    provideDocumentSemanticTokens(document, token) {
        const tokensBuilder = new vscode.SemanticTokensBuilder();

        for (let i = 0; i < document.lineCount; i++) {
            const line = document.lineAt(i);
            const functionTypeRegex = /function\s+\w+\s*\([^)]*\)\s*:\s*\w+/g;
            let match;
            while ((match = functionTypeRegex.exec(line.text))) {
                const [matchText] = match;
                const matchIndex = match.index;
                const matchLength = matchText.length;
                const tokenType = 0;
                const tokenModifiers = 0;

                tokensBuilder.push(
                    matchIndex,
                    matchLength,
                    tokenType,
                    tokenModifiers
                );
            }
        }

        return tokensBuilder.build();
    }

    getLegend() {
        const tokenTypes = ['function'];
        const tokenModifiers = [];
        return new vscode.SemanticTokensLegend(tokenTypes, tokenModifiers);
    }
}

module.exports = {
    activate
};
