const colorLog = require('barecolor');
const commentPullRequest = require('./commentPullRequest');

module.exports = function (testResult, conferenceCounter) {
    const allErrors = [];
    for (const year of Object.keys(testResult)) {
        const errorsOfYear = [];
        colorLog.gray(`${year}: `);
        const topics = Object.keys(testResult[year]);
        topics.forEach((topic, i) => {
            const errors = testResult[year][topic].errors;
            if (errors) {
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
        for (const error of errorsOfYear) {
            colorLog.redln(` - Error: ${error.message} - got "${error.value}" in file: ${error.fileName}:${error.lineNumber}`);
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
        colorLog.greenln(`✓ Checks for all ${conferenceCounter} conferences have passed successfully`);
    }


}