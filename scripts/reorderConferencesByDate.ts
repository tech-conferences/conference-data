// Reorder a file by running (from the scripts folder)
import fs from 'fs';
import conferenceReader from './utils/conferenceReader.js';
import orderConferences from './utils/orderConferences.js';
import mergedConferencesReader from './utils/mergedConferencesReader.js';
import { DuplicateType } from './utils/DuplicateType.js';
import { Conference } from './utils/Conference.js';
import IsConferenceEqual from './utils/IsConferenceEqual.js';

const BASE_DIR = 'conferences';

const conferencesJSON = conferenceReader(true);
const mergedConferences = mergedConferencesReader();
const generalDuplicateErrors = mergedConferences.duplicateErrors.filter(error => error.type === DuplicateType.NotOnlyGeneral);
const containsGeneralDuplicateErrors = generalDuplicateErrors.length > 0;

function filterGeneralConferencesInOtherStacks(conferences: Conference[], stack: string) {
    if (!containsGeneralDuplicateErrors || stack === 'general') {
        return conferences;
    }
    return conferences.filter(conference => {
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

        fs.writeFile(fileName, orderConferences(filteredConferences), () => {
            console.log(`File ${fileName} was successfully reordered`);
        });
    });
});
