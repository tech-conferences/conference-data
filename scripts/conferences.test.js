import conferenceReader from './utils/conferenceReader.js';
import mergedConferencesReader from './utils/mergedConferencesReader.js';
import checkConference from './utils/checkConference.js';
import logTestResult from './utils/logTestResult.js';
import findLineNumber from './utils/findLineNumber.js';

const label = 'Conference Tests Runtime';
console.time(label);

const mergedConferences = mergedConferencesReader();

const testResult = {
    errors: {},
    conferenceCounter: 0
};

function pushError(year, stack, lineNumber, message, value) {
    const fileName = `conferences/${year}/${stack}.json`;
    testResult.errors[year][stack].push({
        fileName: fileName,
        lineNumber: lineNumber,
        message: message,
        value: value
    });
}

function reportError(year, stack, conference, field, value, message) {
    const fileName = `conferences/${year}/${stack}.json`;
    const lineNumber = findLineNumber(conference, field, fileName);
    pushError(year, stack, lineNumber, `[${field}] ${message}`, value);
}

for (const year of Object.keys(mergedConferences.conferences)) {
    testResult.errors[year] = {};
    const conferences = mergedConferences.conferences[year];
    for (const conference of conferences) {
        for (const stack of conference.stacks) {
            if(testResult.errors[year][stack] === undefined) {
                testResult.errors[year][stack] = [];
            }
            function assertField(condition, field, message, value) {
                if (!condition) {
                    reportError(year, stack, conference, field, value, message);
                }
            }
            checkConference(year, conference, assertField);
        }
    }
    testResult.conferenceCounter += conferences.length;
    
    if (mergedConferences.errors[year]) {
        const errorsOfYear = mergedConferences.errors[year];
        function reportDuplicate(error, message) {
            const duplicateConference = error.otherConference;
            reportError(year, error.stack, duplicateConference, 'name', duplicateConference.name, message);
            for (const stack of error.conference.stacks) {
                reportError(year, stack, error.conference, 'name', duplicateConference.name, message);
            }
        }
        for (const duplicate of errorsOfYear.duplicates) {
            reportDuplicate(duplicate, 'Found duplicate conference');
        }
        for (const almostIdentical of errorsOfYear.almostIdentical) {
            reportDuplicate(almostIdentical, 'Found almost identical conference');
        }
    }
}

logTestResult(testResult);
console.timeEnd(label);
