// Reorder a file by running (from the scripts folder)
const fs = require('fs').promises;
const conferenceReader = require('./conferenceReader');

const conferencesJSON = conferenceReader();

const locations = {};
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
    const sortedLocations = {};
    Object.keys(locations).sort().map(location => {
        sortedLocations[location] = locations[location].sort();
    })
    console.log(JSON.stringify(sortedLocations, null, "  "));
    fs.writeFile("config/validLocations.js", "module.exports = " + JSON.stringify(sortedLocations, null, 2));
})()