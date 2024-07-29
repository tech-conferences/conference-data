import conferenceReader from './conferenceReader.js';
import { stringSimilarity } from 'string-similarity-js';
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
        function getBaseUrl(conference) {
            const url = new URL(conference.url);
            return url.origin.replace('www.', '').replace('https://', '').replace('http://', '');
        }
        function createSimpleUrl(conference) {
            const url = new URL(conference.url);
            const baseUrl = url.origin + url.pathname;
            return baseUrl.replace('www.', '').replace('https://', '').replace('http://', '').replace(/\/$/, '');
        }
        function createUrlPath(conference) {
            const url = new URL(conference.url);
            return url.pathname.replace(/\/$/, '');
        }
        function createConferenceKey(conference) {
            return `${conference.name}-${createUrlPath(conference)}`;
        }
        function hasAlmostIdentical(conference) {
            const confKey = createConferenceKey(conference);
            const confSimpleUrl = createSimpleUrl(conference);
            for (const confOfYearObjectKey of Object.keys(confsOfYear)) {
                const confOfYear = confsOfYear[confOfYearObjectKey];
                const confOfYearKey = createConferenceKey(confOfYear);
                const daysDiff = Math.abs(differenceInDays(conference.startDateParsed, confOfYear.startDateParsed));
                if (daysDiff > 10) {
                    continue;
                }
                const nameSimilarity = stringSimilarity(conference.name, confOfYear.name);
                if (nameSimilarity > 0.91 && conference.city === confOfYear.city) {
                    console.log(`Name similarity of ${conference.name} and ${confOfYear.name} is ${nameSimilarity}`);
                    return confOfYear;
                }
                const confOfYearSimpleUrl = createSimpleUrl(confOfYear);
                const urlSimilarity = stringSimilarity(confSimpleUrl, confOfYearSimpleUrl);
                if (urlSimilarity > 0.91) {
                    console.log(`URL similarity of ${confSimpleUrl} and ${confOfYearSimpleUrl} is ${urlSimilarity}`);
                    return confOfYear;
                }
                const similarity = stringSimilarity(confKey, confOfYearKey);
                if (similarity > 0.78) {
                    if (conference.city !== confOfYear.city) {
                        continue;
                    }
                    if (getBaseUrl(conference) !== getBaseUrl(confOfYear)) {
                        continue;
                    }
                    console.log(`Similarity of ${confKey} and ${confOfYearKey} is ${similarity}`);
                    return confOfYear;
                }
            }
        }
        for (const stack of Object.keys(conferencesJSON[year])) {
            const conferences = conferencesJSON[year][stack];
            if (!Array.isArray(conferences)) {
                continue;
            }

            for (const conference of conferences) {
                conference.startDateParsed = parse(conference.startDate, dateFormat, new Date());
                conference.endDateParsed = parse(conference.endDate, dateFormat, new Date());
                const key = `${createSimpleUrl(conference)}-${conference.city || ''}-${conference.startDate.slice(0, 7)}`;
                if (!confsOfYear[key]) {
                    const almostIdenticalConf = hasAlmostIdentical(conference);
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
        conferences: mergedConferences,
        errors: errors
    };
}
