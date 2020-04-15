// Reorder a file by running (from the scripts folder)
const fs = require('fs').promises;
const range = require('lodash/range');
const config = require('./config');

const BASE_DIR = 'conferences';
const conferencesJSON = {};

range(config.startYear, config.currentYear + 2).forEach((year) => {
    conferencesJSON[year] = {};
    config.topics.forEach((topic) => {
        conferencesJSON[year][topic] = {};
    });
});

const locations = {};
(async function () {
    for (const year of Object.keys(conferencesJSON)) {
        for (const topic of Object.keys(conferencesJSON[year])) {
            const fileName = `${BASE_DIR}/${year}/${topic}.json`;
            try {

                const data = await fs.readFile(fileName);
                const conferences = JSON.parse(data);
                for (const conference of conferences) {
                    if (!locations[conference.country]) {
                        locations[conference.country] = [];
                    }
                    if (locations[conference.country].indexOf(conference.city) === -1) {
                        locations[conference.country].push(conference.city);
                    }
                }
            } catch (error) {
            }
        }
    }
    const sortedLocations = {};
    Object.keys(locations).sort().map(location => {
        sortedLocations[location] = locations[location].sort();
    })
    console.log(JSON.stringify(sortedLocations, null, "  "));
    fs.writeFile("scripts/tests/validLocations.js", "module.exports = " + JSON.stringify(sortedLocations, null, 2));
})()