// documentConverter.js
const fs = require('fs');
const path = require('path');

function ensureTempDirectoryExists() {
    const tempDirPath = path.resolve(__dirname, 'temp');
    if (!fs.existsSync(tempDirPath)) {
        fs.mkdirSync(tempDirPath);
    }
    return tempDirPath;
}

function saveDocumentToTempFile(document, language) {
    const tempDirPath = ensureTempDirectoryExists();
    const tempFilePath = path.join(tempDirPath, `${language}_temp.txt`);
    fs.writeFileSync(tempFilePath, document.getText());
    return tempFilePath;
}

function deleteTempFile(filePath) {
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
}

module.exports = {
    saveDocumentToTempFile,
    deleteTempFile
};

