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
        const currentTestResult = {};
        testResult[year][stack] = currentTestResult;
        const conferences = conferencesJSON[year][stack];
        const fileName = `conferences/${year}/${stack}.json`;

        function reportError(lineNumber, message, value) {
            if (!currentTestResult.errors) {
                currentTestResult.errors = [];
            }
            currentTestResult.errors.push({
                fileName: fileName,
                lineNumber: lineNumber,
                message: message,
                value: value
            });
            hasErrors = true;
        }

        const duplicates = getDuplicates(conferences);
        if (duplicates.length > 0) {
            const dupConfs = duplicates.map(conf => conf.name).join(', ');
            const lineNumber = findLineNumber(duplicates[0], 'name', fileName);
            reportError(lineNumber, `Found duplicate conferences : ${dupConfs}`);
        }

        for (const conference of conferences) {
            conferenceCounter++;
            function assertField(condition, field, message, value) {
                if (condition) {
                    return;
                }
                const lineNumber = findLineNumber(conference, field, fileName);
                reportError(lineNumber, `[${field}] ${message}`, value);
            }
            checkConference(year, conference, assertField);

        };
    };
};

logTestResult(testResult, conferenceCounter);
console.timeEnd(label);
