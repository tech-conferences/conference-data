import colorLog from 'barecolor';
import commentPullRequest from './commentPullRequest.js';
import sortBy from 'lodash/sortBy.js';
import uniqWith from 'lodash/uniqWith.js';
import isEqual from 'lodash/isEqual.js';

export default function logTestResult(testResult) {
    const allErrors = [];
    for (const year of Object.keys(testResult.errors)) {
        const errorsOfYear = [];
        colorLog.gray(`${year}: `);
        const topics = Object.keys(testResult.errors[year]);
        topics.forEach((topic, i) => {
            const errors = testResult.errors[year][topic];
            if (errors.length >= 1) {
                for (const error of errors) {
                    errorsOfYear.push(error);
                    allErrors.push(error);
                }
                colorLog.red(`x ${topic}`);
            } else {
                colorLog.green(`✓ ${topic}`);
            }
            if (i < topics.length - 1) {
                colorLog.gray(', ');
            }
        });
        colorLog.black('\n');
        const sortedErrorsOfYear = sortBy(errorsOfYear, ['value', 'fileName', 'lineNumber']);
        const uniqSortedErrorsOfYear = uniqWith(sortedErrorsOfYear, isEqual);
        for (const error of uniqSortedErrorsOfYear) {
            const value = error.value ? ` - got "${error.value}"` : '';
            colorLog.redln(` - Error: ${error.message}${value} in file: ${error.fileName}:${error.lineNumber}`);
        }
    }

    if (allErrors.length !== 0) {
        colorLog.redln('Tests failed');
        const token = process.env['GITHUB_TOKEN'];
        if (token) {
            commentPullRequest(token, allErrors);
        } else {
            process.exitCode = 1;
            process.exit(1);
        }
    } else {
        colorLog.greenln(`✓ Checks for all ${testResult.conferenceCounter} conferences have passed successfully`);
    }
}
