import mergedConferencesReader from './utils/mergedConferencesReader';
import checkConference from './utils/checkConference';
import logTestResult from './utils/logTestResult';
import findLineNumber from './utils/findLineNumber';
import { DuplicateError } from './utils/DuplicateError';
import { Conference } from './utils/Conference';
import { AssertField } from './utils/AssertField';
import { TestResult } from './utils/TestResult';

console.log('Running conference tests...');
const label = 'Conference Tests Runtime';
console.time(label);

const mergedConferences = mergedConferencesReader();

const testResult: TestResult = {
    errors: {},
    conferenceCounter: 0
};

function pushError(year: string, stack: string, lineNumber: number, message: string, value?: string) {
    const fileName = `conferences/${year}/${stack}.json`;
    testResult.errors[year][stack].push({
        fileName: fileName,
        lineNumber: lineNumber,
        message: message,
        value: value
    });
}

function reportError(year: string, stack: string, conference: Conference, field: string, message: string, value?: string) {
    const fileName = `conferences/${year}/${stack}.json`;
    const lineNumber = findLineNumber(conference, field, fileName);
    pushError(year, stack, lineNumber, `[${field}] ${message}`, value);
}

for (const year of Object.keys(mergedConferences.conferences)) {
    testResult.errors[year] = {};
    const conferences = mergedConferences.conferences[year];
    for (const conference of conferences) {
        for (const stack of conference.stacks) {
            if (testResult.errors[year][stack] === undefined) {
                testResult.errors[year][stack] = [];
            }
            const assertFieldFunction: AssertField = (condition, field, message, value) => {
                if (!condition) {
                    reportError(year, stack, conference, field, message, value);
                }
            };
            checkConference(year, conference, assertFieldFunction);
        }
    }
    testResult.conferenceCounter += conferences.length;

    if (mergedConferences.errors[year]) {
        const errorsOfYear = mergedConferences.errors[year];
        function reportDuplicate(error: DuplicateError, message: string) {
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
