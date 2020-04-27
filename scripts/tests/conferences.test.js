const parse = require('date-fns/parse');
const github = require('@actions/github');
const { Octokit } = require('@octokit/rest');
const colorLog = require('barecolor');
const getDuplicates = require('./utils');
const validLocations = require('./validLocations');
const conferenceReader = require('../conferenceReader');
const findLineNumber = require('./findLineNumber');

const twitterRegex = /@(\w){1,15}$/;
const httpRegex = /^http(s?):\/\//;
const httpNoQuestionmarkRegex = /\?/;
const urlShortener = /(\/bit\.ly)|(\/t\.co)/;
const usaStateRegex = /, ([A-Z][A-Z])|(D.C.)$/;
const emptyStringRegex = /^\s+$|^$/gi;
const dateFormat = 'yyyy-MM-dd';
const REQUIRED_KEYS = ['name', 'url', 'startDate', 'endDate', 'country', 'city'];

const label = 'Conference Tests Runtime';
console.time(label);

const conferencesJSON = conferenceReader();
const testResult = {};
var hasErrors = false;
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
            const { name, country, city, url, cfpUrl, twitter } = conference;

            function assertField(condition, field, message, value) {
                if (condition) {
                    return;
                }
                const lineNumber = findLineNumber(conference, field, fileName);
                reportError(lineNumber, `[${field}] ${message}`, value);
            }

            function testUrl(conference, property) {
                const value = conference[property];
                assertField(httpRegex.test(value), property, 'should start with http', value);
                assertField(!httpNoQuestionmarkRegex.test(value), property, 'should not contain a "?"', value);
                assertField(!urlShortener.test(value), property, 'should not use url shorteners', value);
            }

            // Has no missing mandatory key
            REQUIRED_KEYS.forEach(requiredKey => {
                assertField(conference.hasOwnProperty(requiredKey), requiredKey, `is missing`);
            });
            Object.keys(conference).forEach(key => assertField(!emptyStringRegex.test(conference[key]), key, `property should not be empty`));
            assertField(name.indexOf(year.substring(2, 4)) === -1, 'name', 'should not contain the year', name);
            testUrl(conference, "url");
            const startDate = parse(conference.startDate, dateFormat, new Date());
            assertField(startDate.getFullYear() == year, 'startDate', 'should be in the same year as file location', startDate.getFullYear());
            const endDate = parse(conference.endDate, dateFormat, new Date());
            assertField(startDate.getTime() <= endDate.getTime(), 'endDate', 'should be after start date', `${conference.startDate} <= ${conference.endDate}`)
            if (validLocations[country]) {
                assertField(validLocations[country].indexOf(city) !== -1, 'city', 'is a not in the list of valid cities', `"${city}" in "${country}"`);
            }
            assertField(validLocations[country], 'country', 'is a not in the list of valid countries', country);
            if (country === "U.S.A.") {
                assertField(usaStateRegex.test(city), 'city', 'in the US must also contain the state', city);
            }
            if (cfpUrl) {
                testUrl(conference, "cfpUrl");
            }
            if (conference.cfpEndDate) {
                const cfpEndDate = parse(conference.cfpEndDate, dateFormat, new Date());
                assertField(cfpEndDate.getTime() <= startDate.getTime(), 'cfpEndDate', 'should be before start date', `${conference.cfpEndDate} <= ${conference.startDate}`)
            }
            if (twitter && twitter.length > 0 && !twitterRegex.test(twitter)) {
                assertField(twitterRegex.test(twitter), 'twitter', 'should be formatted like @twitter', twitter);
            }
        };
    };
};

const allErrors = [];
function logTestResult() {
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
}
logTestResult();
console.timeEnd(label);

if (hasErrors) {
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

async function commentPullRequest(token, allErrors) {
    const { context: eventContext } = github;
    if (!eventContext.issue || !eventContext.issue.number) {
        return;
    }
    const octokit = new Octokit({
        auth: token
    });
    const prNumber = eventContext.issue.number;
    const comments = allErrors.map(error => {
        return {
            path: error.fileName,
            line: error.lineNumber,
            body: error.message
        }
    })
    try {
        await octokit.pulls.createReview({
            owner: eventContext.repo.owner,
            repo: eventContext.repo.repo,
            pull_number: prNumber,
            event: "COMMENT",
            comments: comments
        });
    } catch (error) {
        console.error(`Unable to comment on Pull Request: ${error}`)
    } finally {
        process.exitCode = 1;
        process.exit(1);
    }
}