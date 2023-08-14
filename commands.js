// commands.js
const vscode = require('vscode');

function registerSemanticAnalysisCommand(callback) {
    return vscode.commands.registerCommand('extension.semantic_analysis', callback);
}

module.exports = {
    registerSemanticAnalysisCommand
};