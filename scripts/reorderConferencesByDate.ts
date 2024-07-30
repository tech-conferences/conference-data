// Reorder a file by running (from the scripts folder)
import fs from 'fs';
import conferenceReader from './utils/conferenceReader.js';
import orderConferences from './utils/orderConferences.js';

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
