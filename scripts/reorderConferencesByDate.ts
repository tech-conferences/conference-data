// Reorder a file by running (from the scripts folder)
import fs from 'fs';
import conferenceReader from './utils/conferenceReader.js';
import orderConferences from './utils/orderConferences.js';
import mergedConferencesReader from './utils/mergedConferencesReader.js';
import { DuplicateType } from './utils/DuplicateType.js';
import { Conference } from './utils/Conference.js';
import IsConferenceEqual from './utils/IsConferenceEqual.js';
import { uniqWith } from 'lodash';

const BASE_DIR = 'conferences';

const conferencesJSON = conferenceReader(true);
const mergedConferences = mergedConferencesReader(true);
const generalDuplicateErrors = mergedConferences.duplicateErrors.filter(error => error.type === DuplicateType.NotOnlyGeneral);
const containsGeneralDuplicateErrors = generalDuplicateErrors.length > 0;
const conferencesWithTooManyStacks = mergedConferences.duplicateErrors.filter(error => error.type === DuplicateType.TooManyStacks).map(error => error.conference);
const uniqueConferencesWithTooManyStacks = uniqWith(conferencesWithTooManyStacks, IsConferenceEqual);
const containsConferencesWithTooManyStacks = uniqueConferencesWithTooManyStacks.length > 0;

function filterGeneralConferencesInOtherStacks(conferences: Conference[], stack: string) {
    if (stack === 'general' || !(containsGeneralDuplicateErrors || containsConferencesWithTooManyStacks)) {
        return conferences;
    }
    return conferences.filter(conference => {
        for (const conferenceWithTooManyStacks of uniqueConferencesWithTooManyStacks) {
            if (conference.name === conferenceWithTooManyStacks.name && IsConferenceEqual(conference, conferenceWithTooManyStacks)) {
                return false;
            }
        }
        for (const error of generalDuplicateErrors) {
            if (error.conference.name === conference.name && IsConferenceEqual(conference, error.conference)) {
                return false;
            }
        }
        return true;
    });
}

Object.keys(conferencesJSON).forEach(year => {
    Object.keys(conferencesJSON[year]).forEach(topic => {
        const fileName = `${BASE_DIR}/${year}/${topic}.json`;

        const conferences = conferencesJSON[year][topic];
        if (!Array.isArray(conferences)) {
            return;
        }
        const filteredConferences = filterGeneralConferencesInOtherStacks(conferences, topic);
        if (topic === 'general') {
            const newGeneralConferences = uniqueConferencesWithTooManyStacks
                .filter(conference => conference.startDateParsed.getFullYear().toString() === year)
                .map(mergedConference => {
                    const conference: Conference = {
                        name: mergedConference.name,
                        url: mergedConference.url,
                        startDate: mergedConference.startDate,
                        endDate: mergedConference.endDate,
                        city: mergedConference.city,
                        country: mergedConference.country,
                        online: mergedConference.online,
                        locales: mergedConference.locales,
                        offersSignLanguageOrCC: mergedConference.offersSignLanguageOrCC,
                        cocUrl: mergedConference.cocUrl,
                        cfpUrl: mergedConference.cfpUrl,
                        cfpEndDate: mergedConference.cfpEndDate,
                        twitter: mergedConference.twitter,
                        github: mergedConference.github,
                        mastodon: mergedConference.mastodon
                    };
                    return conference;
                });
            filteredConferences.push(...newGeneralConferences);
        }

        fs.writeFile(fileName, orderConferences(filteredConferences), () => {
            console.log(`File ${fileName} was successfully reordered`);
        });
    });
});
