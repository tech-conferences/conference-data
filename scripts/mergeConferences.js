const fs = require('fs');
const mergedConferencesReader = require('./utils/mergedConferencesReader');

const mergedConferences = mergedConferencesReader();

const fileName = "build/mergedConference.json";

if (Object.keys(mergedConferences.errors).length === 0) {
    fs.writeFile(fileName, JSON.stringify(mergedConferences.mergedConferences, null, 2), () => {
        console.log(`Conferences have been successfully merged into file: ${fileName}`);
    });
} else {
    console.log(`Error: ${JSON.stringify(mergedConferences.errors, null, 2)}`);
    console.log('Found duplicate/almost identical issues while merging conferences.');
}