const fs = require('fs');
const path = require('path');

function saveDocumentToTempFile(document) {
    const tempFilePath = path.resolve(__dirname, 'temp.txt');
    fs.writeFileSync(tempFilePath, document.getText());
    return tempFilePath;
}

module.exports = {
    saveDocumentToTempFile
};
