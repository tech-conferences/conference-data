const conferenceReader = require('../conferenceReader');
const checkConference = require('./utils/checkConference');
const getDuplicates = require('./utils/getDuplicates');
const logTestResult = require('./utils/logTestResult');
const findLineNumber = require('./utils/findLineNumber');

const label = 'Conference Tests Runtime';
console.time(label);

const conferencesJSON = conferenceReader();

const testResult = {};
var conferenceCounter = 0;

for (const year of Object.keys(conferencesJSON)) {
    testResult[year] = {};
    for (const stack of Object.keys(conferencesJSON[year])) {
        const currentErrors = [];
        testResult[year][stack] = currentErrors;
        const conferences = conferencesJSON[year][stack];
        const fileName = `conferences/${year}/${stack}.json`;

        function reportError(lineNumber, message, value) {
            currentErrors.push({
                fileName: fileName,
                lineNumber: lineNumber,
                message: message,
                value: value
            });
        }

        const duplicates = getDuplicates(conferences);
        if (duplicates.length > 0) {
            const lineNumber = findLineNumber(duplicates[0], 'name', fileName);
            reportError(lineNumber, `Found duplicate conference "${duplicates.map(conf => conf.name)}"`);
        }

        for (const conference of conferences) {
            conferenceCounter++;
            function assertField(condition, field, message, value) {
                if (!condition) {
                    const lineNumber = findLineNumber(conference, field, fileName);
                    reportError(lineNumber, `[${field}] ${message}`, value);
                }
            }
            checkConference(year, conference, assertField);
        };
    };
};

logTestResult(testResult, conferenceCounter);
console.timeEnd(label);
