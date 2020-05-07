const conferenceReader = require('./conferenceReader');
const assert = require('assert');

const conferencesJSON = conferenceReader();

function mergeConferences() {
    const mergedConferences = {};
    for (const year of Object.keys(conferencesJSON)) {
        const confsOfYear = {};
        const almostIdentical = [];
        const duplicates = [];
        for (const stack of Object.keys(conferencesJSON[year])) {
            const conferences = conferencesJSON[year][stack];
            for (const conference of conferences) {
                const url = new URL(conference.url);
                const baseUrl = url.origin + url.pathname;
                const key = `${baseUrl}-${conference.city}-${conference.startDate.slice(0, 7)}`;
                if (!confsOfYear[key]) {
                    conference.stacks = [];
                    conference.stacks.push(stack);
                    confsOfYear[key] = conference;
                } else {
                    const existingConf = confsOfYear[key];
                    if (existingConf.stacks.indexOf(stack) !== -1) {
                        duplicates.push({
                            conference: existingConf,
                            otherConference: conference,
                            stack: stack
                        });
                    } else if (
                        existingConf.startDate !== conference.startDate ||
                        existingConf.endDate !== conference.endDate ||
                        existingConf.name !== conference.name ||
                        existingConf.url !== conference.url ||
                        existingConf.twitter !== conference.twitter
                    ) {
                        almostIdentical.push({
                            conference: existingConf,
                            otherConference: conference,
                            stack: stack
                        });
                    } else {
                        existingConf.stacks.push(stack);
                    }
                }
            }
        }
        mergedConferences[year] = {
            conferences: Object.values(confsOfYear),
            errors: {
                almostIdentical: almostIdentical,
                duplicates: duplicates
            }
        };
    }
    return mergedConferences;
}
module.exports = mergeConferences;
