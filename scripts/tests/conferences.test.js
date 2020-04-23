const parse = require('date-fns/parse');
const github = require('@actions/github');
const { context: eventContext } = github;
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

        function reportError(lineNumber, message) {
            if (!currentTestResult.errors) {
                currentTestResult.errors = [];
            }
            currentTestResult.errors.push({
                fileName: fileName,
                lineNumber: lineNumber,
                message: message
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

            function assertField(condition, field, message) {
                if (condition) {
                    return;
                }
                const lineNumber = findLineNumber(conference, field, fileName);
                const textToAppend = ` in file: ${fileName}:${lineNumber}`;
                reportError(lineNumber, message + textToAppend);
            }

            function testUrl(conference, property) {
                const value = conference[property];
                assertField(httpRegex.test(value), property, `[${property}] should start with http – got: "${value}"`);
                assertField(!httpNoQuestionmarkRegex.test(value), property, `[${property}] should not contain a ?  – got: "${value}"`);
                assertField(!urlShortener.test(value), property, `[${property}] should not use url shorteners – got: "${value}"`);
            }

            // Has no missing mandatory key
            REQUIRED_KEYS.forEach(requiredKey => {
                assertField(conference.hasOwnProperty(requiredKey), requiredKey, `[${requiredKey}] is missing`);
            });
            Object.keys(conference).forEach(key => assertField(!emptyStringRegex.test(conference[key]), key, `[${key}] property should not be empty`));
            // Twitter is a valid URL
            if (twitter && twitter.length > 0 && !twitterRegex.test(twitter)) {
                assertField(twitterRegex.test(twitter), 'twitter', `[twitter] should be formatted like @twitter – got: "${twitter}"`);
            }
            assertField(name.indexOf(year) === -1, 'name', `[name] should not contain the year – got: "${name}"`);
            assertField(name.indexOf(year.substring(2, 4)) === -1, 'name', `[name] should not contain the year – got: "${name}"`);
            testUrl(conference, "url");

            if (cfpUrl) {
                testUrl(conference, "cfpUrl");
            }

            const startDate = parse(conference.startDate, dateFormat, new Date());
            assertField(startDate.getFullYear() == year, 'startDate', `Start date should be in the same year as file location: ${startDate.getFullYear()}`);
            const endDate = parse(conference.endDate, dateFormat, new Date());
            assertField(startDate.getTime() <= endDate.getTime(), 'endDate', `End date should be after start date: ${conference.startDate} <= ${conference.endDate}`)

            if (conference.cfpEndDate) {
                const cfpEndDate = parse(conference.cfpEndDate, dateFormat, new Date());
                assertField(cfpEndDate.getTime() <= startDate.getTime(), 'cfpEndDate', `CFP End date should be before start date: ${conference.cfpEndDate} <= ${conference.startDate}`)
            }
            assertField(validLocations[country], 'country', `[country] is a not in the list of valid countries – got: "${country}"`);
            assertField(validLocations[country].indexOf(city) !== -1, 'city', `[city] is a not in the list of valid cities – got: "${city}" in "${country}"`);
            if (country === "U.S.A.") {
                assertField(usaStateRegex.test(city), 'city', `[city] cities in the US must also contain the state – got: "${city}"`);
            }
        };
    };
};

const allErrors = [];
function logTestResult() {
    for (const year of Object.keys(testResult)) {
        const errorsOfYear = [];
        colorLog.gray(`${year}: `);
        Object.keys(testResult[year]).forEach(topic => {
            const errors = testResult[year][topic].errors;
            if (errors) {
                for (const error of errors) {
                    errorsOfYear.push(error);
                    allErrors.push(error);
                }
                colorLog.red(`${topic} x `);
            } else {
                colorLog.green(`${topic} ✓ `);
            }
        });
        colorLog.black('\n');
        for (const error of errorsOfYear) {
            colorLog.redln(` - Error: ${error.message}`);
        }
    }
}
logTestResult();
console.timeEnd(label);

if (hasErrors) {
    colorLog.redln('Tests failed');
    const token = process.env['GITHUB_TOKEN'];
    if (token) {
        commentPullRequest();
    } else {
        process.exitCode = 1;
        process.exit(1);
    }
} else {
    colorLog.greenln(`Checks for all ${conferenceCounter} conferences have passed successfully ✓ `);
}

async function commentPullRequest(token) {
    const octokit = new github.GitHub(token);

    for (const error of allErrors) {
        await octokit.pulls.createReview({
            owner: 'tech-conferences',
            repo: 'conference-data',
            pull_number: eventContext.issue.number,
            event: "COMMENT",
            comments: [
                {
                    path: error.fileName,
                    position: error.line,
                    body: error.message
                }
            ]
        });
    }
    process.exitCode = 1;
    process.exit(1);
}