// Reorder a file by running (from the scripts folder)
const fs = require('fs');
const conferenceReader = require('./utils/conferenceReader');
const orderConferences = require('./utils/orderConferences');

const BASE_DIR = 'conferences';

const conferencesJSON = conferenceReader(true);

Object.keys(conferencesJSON).forEach(year => {
    Object.keys(conferencesJSON[year]).forEach(topic => {
        const fileName = `${BASE_DIR}/${year}/${topic}.json`;

        const conferences = conferencesJSON[year][topic];
        if (!Array.isArray(conferences)) {
            return;
        }
        fs.writeFile(fileName, orderConferences(conferences), () => {
            console.log(`File ${fileName} was successfully reordered`);
        });
    });
});
