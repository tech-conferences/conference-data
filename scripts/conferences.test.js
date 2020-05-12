const conferenceReader = require('./utils/conferenceReader');
const mergedConferencesReader = require('./utils/mergedConferencesReader');
const checkConference = require('./utils/checkConference');
const logTestResult = require('./utils/logTestResult');
const findLineNumber = require('./utils/findLineNumber');

const label = 'Conference Tests Runtime';
console.time(label);

const conferencesJSON = conferenceReader();
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

for (const year of Object.keys(conferencesJSON)) {
    testResult.errors[year] = {};
    for (const stack of Object.keys(conferencesJSON[year])) {
        const conferences = conferencesJSON[year][stack];
        testResult.errors[year][stack] = [];
        if (!Array.isArray(conferences)) {
            pushError(year, stack, 1, 'List of conferences must be an array', typeof conferences);
            continue;
        }
        for (const conference of conferences) {
            function assertField(condition, field, message, value) {
                if (!condition) {
                    reportError(year, stack, conference, field, value, message);
                }
            }
            checkConference(year, conference, assertField);
        }
        testResult.conferenceCounter += conferences.length;
    };
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
};

logTestResult(testResult);
console.timeEnd(label);