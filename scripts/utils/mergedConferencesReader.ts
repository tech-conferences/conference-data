import conferenceReader from './conferenceReader';
import { stringSimilarity } from 'string-similarity-js';
import { parse, differenceInDays } from 'date-fns';
import { Conference } from './Conference';
import { MergedConference } from './MergedConference';
import { DuplicateError } from './DuplicateError';
import { DuplicateType } from './DuplicateType';
import IsConferenceEqual from './IsConferenceEqual';

export default function mergedConferencesReader(reorderConferences: boolean) {
    const conferencesJSON = conferenceReader(reorderConferences);
    const mergedConferences: { [key: string]: MergedConference[] } = {};

    const duplicateErrors: DuplicateError[] = [];
    const dateFormat = 'yyyy-MM-dd';
    for (const year of Object.keys(conferencesJSON)) {
        const confsOfYear: { [key: string]: MergedConference } = {};
        function getBaseUrl(conference: Conference) {
            const url = new URL(conference.url);
            return url.origin.replace('www.', '').replace('https://', '').replace('http://', '');
        }
        function createSimpleUrl(conference: Conference) {
            const url = new URL(conference.url);
            const baseUrl = url.origin + url.pathname;
            return baseUrl.replace('www.', '').replace('https://', '').replace('http://', '').replace(/\/$/, '');
        }
        function createUrlPath(conference: Conference) {
            const url = new URL(conference.url);
            return url.pathname.replace(/\/$/, '');
        }
        function createConferenceKey(conference: Conference) {
            return `${conference.name}-${createUrlPath(conference)}`;
        }
        function hasAlmostIdentical(conference: MergedConference) {
            const confKey = createConferenceKey(conference);
            const confSimpleUrl = createSimpleUrl(conference);
            for (const confOfYearObjectKey of Object.keys(confsOfYear)) {
                const confOfYear = confsOfYear[confOfYearObjectKey];
                const daysDiff = Math.abs(differenceInDays(conference.startDateParsed, confOfYear.startDateParsed));
                if (daysDiff > 15) {
                    continue;
                }
                const oneConfIsOnline = (conference.city && !confOfYear.city) || (!conference.city && confOfYear.city);
                if (!oneConfIsOnline && conference.city !== confOfYear.city) {
                    continue;
                }
                const confOfYearSimpleUrl = createSimpleUrl(confOfYear);
                const urlSimilarity = stringSimilarity(confSimpleUrl, confOfYearSimpleUrl);
                if (urlSimilarity > 0.9) {
                    console.log(`URL similarity of ${confSimpleUrl} and ${confOfYearSimpleUrl} is ${urlSimilarity}`);
                    return confOfYear;
                }
                if (getBaseUrl(conference) !== getBaseUrl(confOfYear)) {
                    continue;
                }
                const nameSimilarity = stringSimilarity(conference.name, confOfYear.name);
                if (nameSimilarity > 0.91) {
                    console.log(`Name similarity of ${conference.name} and ${confOfYear.name} is ${nameSimilarity}`);
                    return confOfYear;
                }
                const confOfYearKey = createConferenceKey(confOfYear);
                const similarity = stringSimilarity(confKey, confOfYearKey);
                if (similarity > 0.81) {
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
                const mergedConference: MergedConference = {
                    ...conference,
                    startDateParsed: parse(conference.startDate, dateFormat, new Date()),
                    endDateParsed: parse(conference.endDate, dateFormat, new Date()),
                    cfpEndDateParsed: conference.cfpEndDate ? parse(conference.cfpEndDate, dateFormat, new Date()) : undefined,
                    stacks: [stack]
                };
                const key = `${createSimpleUrl(conference)}-${conference.city || ''}-${conference.startDate.slice(0, 7)}`;
                if (!confsOfYear[key]) {
                    const almostIdenticalConf = hasAlmostIdentical(mergedConference);
                    if (almostIdenticalConf) {
                        duplicateErrors.push({
                            conference: almostIdenticalConf,
                            duplicate: mergedConference,
                            type: DuplicateType.AlmostIdentical
                        });
                    } else {
                        confsOfYear[key] = mergedConference;
                    }
                } else {
                    const existingConf = confsOfYear[key];
                    if (existingConf.stacks.indexOf(stack) !== -1) {
                        duplicateErrors.push({
                            conference: existingConf,
                            duplicate: mergedConference,
                            type: DuplicateType.Duplicate
                        });
                    } else if (!IsConferenceEqual(existingConf, mergedConference)) {
                        duplicateErrors.push({
                            conference: existingConf,
                            duplicate: mergedConference,
                            type: DuplicateType.AlmostIdentical
                        });
                    } else {
                        existingConf.stacks.push(stack);
                        if (existingConf.stacks.indexOf('general') !== -1 && existingConf.stacks.length > 1) {
                            duplicateErrors.push({
                                conference: existingConf,
                                duplicate: mergedConference,
                                type: DuplicateType.NotOnlyGeneral
                            });
                        }
                        if (existingConf.stacks.length > 3) {
                            duplicateErrors.push({
                                conference: existingConf,
                                duplicate: mergedConference,
                                type: DuplicateType.TooManyStacks
                            });
                        }
                    }
                }
            }
        }
        mergedConferences[year] = Object.values(confsOfYear);
    }
    return {
        conferences: mergedConferences,
        duplicateErrors: duplicateErrors
    };
}
