const generateSimhash = require('./simhash.js').generateSimhash;
const compareHashSimilarity = require('./simhash.js').compareHashSimilarity;

process.on('message', (data) => {
    if (data.type === 'generateSimhash') {
        const hash = generateSimhash(data.content, data.language);
        process.send({ hash });
    } else if (data.type === 'compareHashSimilarity') {
        const comparison = compareHashSimilarity(data.content1, data.content2, data.language);
        process.send({ comparison });
    }
});