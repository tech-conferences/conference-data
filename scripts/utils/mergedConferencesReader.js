import conferenceReader from './conferenceReader.js';
import { stringSimilarity } from "string-similarity-js";
import { parse, differenceInDays } from 'date-fns';

export default function mergedConferencesReader() {
    const conferencesJSON = conferenceReader();
    const mergedConferences = {};
    const errors = {};
    const dateFormat = 'yyyy-MM-dd';
    for (const year of Object.keys(conferencesJSON)) {
        const confsOfYear = {};
        const almostIdentical = [];
        const duplicates = [];
        function hasAlmostIdentical(key, conference) {
            for (const confOfYear of Object.keys(confsOfYear)) {
                const similarity = stringSimilarity(key, confOfYear);
                if (similarity > 0.95) {
                    const startDate = parse(conference.startDate, dateFormat, new Date());
                    const startDateSimilar = parse(confsOfYear[confOfYear].startDate, dateFormat, new Date());
                    const durationInDays = differenceInDays(startDate, startDateSimilar);
                    if (durationInDays < 10) {
                        console.log(`Similarity of ${key} and ${confOfYear} is ${similarity}`);
                        return confsOfYear[confOfYear];
                    }
                }
            }
        }
        for (const stack of Object.keys(conferencesJSON[year])) {
            const conferences = conferencesJSON[year][stack];
            if (!Array.isArray(conferences)) {
                continue;
            }
            for (const conference of conferences) {
                const url = new URL(conference.url);
                const baseUrl = url.origin + url.pathname;
                const simpleUrl = baseUrl.replace('www.', '').replace('https://', '').replace('http://', '').replace(/\/$/, '');
                const key = `${simpleUrl}-${conference.city || ""}-${conference.startDate.slice(0, 7)}`;

                if (!confsOfYear[key]) {
                    const almostIdenticalConf = hasAlmostIdentical(key, conference);
                    if (almostIdenticalConf) {
                        almostIdentical.push({
                            conference: almostIdenticalConf,
                            otherConference: conference,
                            stack: stack
                        });
                    } else {
                        conference.stacks = [];
                        conference.stacks.push(stack);
                        confsOfYear[key] = conference;
                    }
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
                        if (!(existingConf.startDate > conference.endDate || conference.startDate > existingConf.endDate)) {
                            almostIdentical.push({
                                conference: existingConf,
                                otherConference: conference,
                                stack: stack
                            });
                        }
                    } else {
                        existingConf.stacks.push(stack);
                    }
                }
            }
        }
        mergedConferences[year] = Object.values(confsOfYear);
        if (almostIdentical.length !== 0 || duplicates.length !== 0) {
            errors[year] = {
                almostIdentical: almostIdentical,
                duplicates: duplicates
            };
        }
    }
    return {
        mergedConferences: mergedConferences,
        errors: errors
    };
}
