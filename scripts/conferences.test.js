const conferenceReader = require('./utils/conferenceReader');
const mergedConferencesRead = require('./utils/mergedConferences');
const checkConference = require('./utils/checkConference');
const checkDuplicates = require('./utils/checkDuplicates');
const logTestResult = require('./utils/logTestResult');
const findLineNumber = require('./utils/findLineNumber');

const label = 'Conference Tests Runtime';
console.time(label);

const conferencesJSON = conferenceReader();
const mergedConferences = mergedConferencesRead();

const testResult = {
    errors: {},
    conferenceCounter: 0
};

function reportError(year, stack, conference, field, value, message) {
    const fileName = `conferences/${year}/${stack}.json`;
    const lineNumber = findLineNumber(conference, field, fileName);
    testResult.errors[year][stack].push({
        fileName: fileName,
        lineNumber: lineNumber,
        message: `[${field}] ${message}`,
        value: value
    });
}

for (const year of Object.keys(conferencesJSON)) {
    testResult.errors[year] = {};
    for (const stack of Object.keys(conferencesJSON[year])) {
        const conferences = conferencesJSON[year][stack];
        testResult.errors[year][stack] = [];
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
    checkDuplicates(year, mergedConferences[year], reportError);
};

logTestResult(testResult);
console.timeEnd(label);