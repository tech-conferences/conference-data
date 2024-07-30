// Reorder a file by running (from the scripts folder)
import fs from 'fs';
import conferenceReader from './utils/conferenceReader.js';

const conferencesJSON = conferenceReader(false);

const locations: { [key: string]: string[] } = {};
(async function () {
    for (const year of Object.keys(conferencesJSON)) {
        for (const topic of Object.keys(conferencesJSON[year])) {
            const conferences = conferencesJSON[year][topic];
            if (!Array.isArray(conferences)) {
                continue;
            }
            for (const conference of conferences) {
                if (!locations[conference.country]) {
                    locations[conference.country] = [];
                }
                if (locations[conference.country].indexOf(conference.city) === -1) {
                    locations[conference.country].push(conference.city);
                }
            }
        }
    }
    const sortedLocations: { [key: string]: string[] } = {};
    Object.keys(locations)
        .sort()
        .map(location => {
            if (location !== 'undefined') {
                sortedLocations[location] = locations[location].sort();
            }
        });
    console.log(JSON.stringify(sortedLocations, null, '  '));
    fs.writeFile('scripts/config/validLocations.ts', 'export const validLocations = ' + JSON.stringify(sortedLocations, null, 2), err => {
        if (err) {
            console.error(err);
        }
    });
})();
