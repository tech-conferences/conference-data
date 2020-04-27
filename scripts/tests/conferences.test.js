const conferenceReader = require('../conferenceReader');
const checkConferences = require('./utils/checkConferences');
const logTestResult = require('./utils/logTestResult');

const label = 'Conference Tests Runtime';
console.time(label);

const conferencesJSON = conferenceReader();

const testResult = {
    errors: {},
    conferenceCounter: 0
};

for (const year of Object.keys(conferencesJSON)) {
    testResult.errors[year] = {};
    for (const stack of Object.keys(conferencesJSON[year])) {
        const conferences = conferencesJSON[year][stack];
        testResult.errors[year][stack] = checkConferences(year, stack, conferences);
        testResult.conferenceCounter += conferences.length;
    };
};

logTestResult(testResult);
console.timeEnd(label);