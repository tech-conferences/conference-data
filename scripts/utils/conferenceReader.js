const fs = require('fs');
const assert = require('assert');
const topics = require('../../config/topics');
const orderConferences = require('./orderConferences');

const jsonFileRegex = /(.*).json$/;

module.exports = function conferenceReader(reorderConferences) {
    const conferencesJSON = {};

    fs.readdirSync('conferences').forEach(year => {
        conferencesJSON[year] = {};
        fs.readdirSync(`conferences/${year}`).forEach(fileName => {
            const filePath = `conferences/${year}/${fileName}`;
            assert(jsonFileRegex.test(fileName));
            const topic = jsonFileRegex.exec(fileName)[1];
            assert(topics.indexOf(topic) != -1, `Topic "${topic} is not in topic list. File: ${filePath}`);
            const fileContent = fs.readFileSync(filePath);
            if (fileContent.toString() === '[]') {
                return;
            }
            let conferences;
            try {
                conferences = JSON.parse(fileContent);
            } catch (exception) {
                assert.fail(`Unable to read file: "${filePath}". Error: ${exception}`);
            }
            const orderedConferences = orderConferences(conferences);
            if (!reorderConferences && fileContent != orderedConferences) {
                assert.fail(`Conferences not in the right order: "${filePath}". Please run 'npm run reorder-confs'`);
            }
            conferencesJSON[year][topic] = conferences;
        });
    });

    return conferencesJSON;
};
