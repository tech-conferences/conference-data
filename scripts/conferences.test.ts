import { AssertField } from './utils/AssertField';
import checkConference from './utils/checkConference';
import { Conference } from './utils/Conference';
import findLineNumber from './utils/findLineNumber';
import logTestResult from './utils/logTestResult';
import mergedConferencesReader from './utils/mergedConferencesReader';
import { TestResult } from './utils/TestResult';

console.log('Running conference tests...');
const label = 'Conference Tests Runtime';
console.time(label);

const testResult: TestResult = {
    errors: {},
    duplicateErrors: [],
    conferenceCounter: 0
};

try {
    const mergedConferences = mergedConferencesReader(false);
    testResult.duplicateErrors = mergedConferences.duplicateErrors;

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
    }
} catch (exception) {
    if (exception instanceof Error) {
        testResult.error = exception;
    }
}
if (testResult.conferenceCounter === 0 && testResult.error === undefined) {
    testResult.error = new Error('No conferences found');
}

logTestResult(testResult);
console.timeEnd(label);
