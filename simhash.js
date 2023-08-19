// simhash.js
const Parser = require('tree-sitter');
const JavaScript = require('tree-sitter-javascript');
const Java = require('tree-sitter-java');
const Python = require('tree-sitter-python');
const Cpp = require('tree-sitter-cpp');

// Initialize parsers for each language
const parsers = {
    javascript: new Parser().setLanguage(JavaScript),
    java: new Parser().setLanguage(Java),
    python: new Parser().setLanguage(Python),
    cpp: new Parser().setLanguage(Cpp)
};

// MurmurHash3 hash function
function murmurhash3_32_gc(key, seed) {
    let h1 = seed;
    const c1 = 0xcc9e2d51;
    const c2 = 0x1b873593;

    for (let i = 0; i < key.length; i += 4) {
        let k1 = (key.charCodeAt(i) & 0xff) |
                 ((key.charCodeAt(i + 1) & 0xff) << 8) |
                 ((key.charCodeAt(i + 2) & 0xff) << 16) |
                 ((key.charCodeAt(i + 3) & 0xff) << 24);

        k1 = (k1 * c1) >>> 0;
        k1 = (k1 << 15) | (k1 >>> 17);
        k1 = (k1 * c2) >>> 0;

        h1 ^= k1;
        h1 = (h1 << 13) | (h1 >>> 19);
        h1 = (h1 * 5 + 0xe6546b64) >>> 0;
    }

    h1 ^= key.length;
    h1 ^= h1 >>> 16;
    h1 = (h1 * 0x85ebca6b) >>> 0;
    h1 ^= h1 >>> 13;
    h1 = (h1 * 0xc2b2ae35) >>> 0;
    h1 ^= h1 >>> 16;

    return h1 >>> 0;
}

// Compute the weight of a token based on its frequency and position
function weight(token, tokenFrequencies, position) {
    const frequency = tokenFrequencies[token] || 0;
    const weight = (1 + Math.log(frequency)) * Math.log(1 + position);
    return weight;
}

// Tokenize input using Tree-sitter and compute token frequencies
function tokenizeWithTreeSitter(input, language) {
    const tree = parsers[language].parse(input);

    const tokens = [];
    const trivialTypes = new Set(['\n', ' ', '(', ')', '{', '}', ';', '.', ',', '[', ']']);

    function extractTokens(node) {
        if (!trivialTypes.has(node.type)) {
            tokens.push(node.type);
        }
        for (const child of node.children) {
            extractTokens(child);
        }
    }
    
    extractTokens(tree.rootNode);

    const tokenFrequencies = tokens.reduce((acc, token) => {
        acc[token] = (acc[token] || 0) + 1;
        return acc;
    }, {});

    return [tokens, tokenFrequencies];
}

// Remove comments from input
function preprocess(input, language) {
    const tree = parsers[language].parse(input);
    let output = input;

    tree.rootNode.descendantsOfType(['comment']).reverse().forEach(node => {
        output = output.substring(0, node.startIndex) + " ".repeat(node.endIndex - node.startIndex) + output.substring(node.endIndex);
    });

    return output.replace(/\s+/gm, ' ').trim();
}

// Generate the simhash fingerprint of a piece of code
function generateSimhash(input, language) {
    const preprocessedInput = preprocess(input, language);
    const [tokens, tokenFrequencies] = tokenizeWithTreeSitter(preprocessedInput, language);

    const v = Array(32).fill(0);

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        const hashed = murmurhash3_32_gc(token, i);
        const w = weight(token, tokenFrequencies, i);

        for (let j = 0; j < 32; j++) {
            const bitmask = 1 << j;
            const bit = (hashed & bitmask) ? 1 : -1;
            v[j] += w * bit;
        }
    }

    let fingerprint = 0;
    for (let i = 0; i < 32; i++) {
        if (v[i] >= 0) {
            fingerprint |= (1 << i);
        }
    }

    return fingerprint;
}

// Compare the similarity between two pieces of code
function compareHashSimilarity(hash1, hash2) {
    const distance = hammingDistance(hash1, hash2);
    
    if (distance === 0) {
        return "Completely Similar";
    } else if (distance < 6) {
        return "Very Similar";
    } else if (distance < 12) {
        return "Slightly Different";
    } else {
        return "Completely Different";
    }
}

// Compute the Hamming distance between two simhash fingerprints
function hammingDistance(hash1, hash2) {
    let x = hash1 ^ hash2;
    let setBits = 0;

    while (x) {
        setBits += 1;
        x &= x - 1;
    }

    return setBits;
}

if (require.main === module) {
    const action = process.argv[2];
    const content = process.argv[3];
    const language = process.argv[4];

    switch (action) {
        case 'generateSimhash':
            console.log(generateSimhash(content, language));
            break;
            case 'compareHashSimilarity':
                const hash1 = process.argv[5];
                const hash2 = process.argv[6];
                console.log(compareHashSimilarity(hash1, hash2));
                break;            
    }
}

module.exports = {
    generateSimhash,
    compareHashSimilarity
};
