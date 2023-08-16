// runExtractor.js
const fs = require('fs');
const path = require('path');
const Parser = require('tree-sitter');
const Python = require('tree-sitter-python');
const JavaScript = require('tree-sitter-javascript');
const Java = require('tree-sitter-java');
const CPP = require('tree-sitter-cpp');  // Import C++ parser

const languageParsers = {
    python: Python,
    javascript: JavaScript,
    java: Java,
    cpp: CPP   // Add C++ to the list of parsers
};

function getFunctionsFromCode(code, language) {
    const parser = new Parser();
    parser.setLanguage(languageParsers[language]);

    let functionNodeType;
    let decoratorType;

    switch (language) {
        case 'python':
            functionNodeType = 'function_definition';
            decoratorType = 'decorator';
            break;
        case 'javascript':
            functionNodeType = 'function_declaration';
            decoratorType = 'decorator';
            break;
        case 'java':
            functionNodeType = 'method_declaration'; 
            decoratorType = null;
            break;
        case 'cpp':  
            functionNodeType = 'function_definition'; 
            decoratorType = null;  
            break;
        default:
            throw new Error(`Unsupported language: ${language}`);
    }

    const functions = [];
    parser.parse(code).rootNode.descendantsOfType(functionNodeType).forEach((node) => {
        let functionNode;
    
        if (language === 'cpp') {
            // For C++, use regex to extract the function name
            const functionRegex = /(?:\w+\s+)?(\w+)\s*\([^)]*\)\s*{/;
            const match = functionRegex.exec(node.text);
            
            if (match) {
                functionNode = {
                    text: match[1],
                    startIndex: match.index,
                    endIndex: match.index + match[1].length
                };
            }
        } else {
            functionNode = node.namedChildren.find((child) => child.type === 'identifier');
        }
        
        if (functionNode) {
            // If the function has decorators (relevant for Python and JS), start from the first decorator.
            let startNode = node;
            while (decoratorType && startNode.previousNamedSibling && startNode.previousNamedSibling.type === decoratorType) {
                startNode = startNode.previousNamedSibling;
            }
    
            functions.push({
                name: functionNode.text,
                content: code.slice(startNode.startIndex, node.endIndex).trim(),
                startPosition: startNode.startPosition,
                endPosition: node.endPosition
            });
        }
    });
    

    return functions;
}

const language = process.argv[2];
if (!languageParsers[language]) {
    console.error(`Unsupported language: ${language}`);
    process.exit(1);
}

const tempDirPath = path.resolve(__dirname, 'temp'); // Pointing to the temp directory
const tempFilePath = path.join(tempDirPath, `${language}_temp.txt`);
const outputFilePath = path.join(tempDirPath, `${language}_temp.json`);

if (!fs.existsSync(tempFilePath)) {
    throw new Error(`File ${tempFilePath} not found.`);
}

const code = fs.readFileSync(tempFilePath, 'utf-8');
const functions = getFunctionsFromCode(code, language);
fs.writeFileSync(outputFilePath, JSON.stringify(functions, null, 2));


