# dev-diary

# TO DO

1. Decide how to improve function extractors:
    - By using vscode build-in semantic tokenizer (```vscode.commands.executeCommand('vscode.provideDocumentSemanticTokens', document.uri)```)
    - By utilizing antlr4 parser 
    - ...
2. How to trigger parsing?
3. How to avoid overwriting?
    - By using versions for each function in database? It require script that can compare two functions and say if it is completelly different functions or just itterations of the same one.
        It can be implemented by converting each function to an AST and then compare the nodes
