const fs = require('fs');
const path = require('path');
const Parser = require('tree-sitter');
const Python = require('tree-sitter-python');

try {
    const parser = new Parser();
    parser.setLanguage(Python);

    const tempFilePath = path.resolve(__dirname, 'temp.txt');
    const outputFilePath = path.resolve(__dirname, 'temp.json');

    // Check if temp.txt exists
    if (!fs.existsSync(tempFilePath)) {
        throw new Error(`File ${tempFilePath} not found.`);
    }

    const code = fs.readFileSync(tempFilePath, 'utf-8');

    const functions = [];
    parser.parse(code).rootNode.descendantsOfType('function_definition').forEach((node) => {
        const functionNode = node.namedChildren.find((child) => child.type === 'identifier');
        if (functionNode) {
            functions.push({
                name: functionNode.text,
                content: code.slice(node.startIndex, node.endIndex).trim(),
                startPosition: node.startPosition,
                endPosition: node.endPosition
            });
        }
    });

    fs.writeFileSync(outputFilePath, JSON.stringify(functions, null, 2));

} catch (error) {
    console.error('Error occurred:', error);
    process.exit(1);  // exit with a non-zero code to indicate an error
}

