const test = require('baretest')('Conferences Test');
const assert = require('assert');
const parse = require('date-fns/parse');
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

const conferencesJSON = conferenceReader();

for (const year of Object.keys(conferencesJSON)) {
    for (const stack of Object.keys(conferencesJSON[year])) {
        const conferences = conferencesJSON[year][stack];
        const fileName = `conferences/${year}/${stack}.json`;

        test(`${fileName} - ${stack} conferences in ${year}`, function () {

            const duplicates = getDuplicates(conferences);

            if (duplicates.length > 0) {
                const dupConfs = duplicates.map(conf => conf.name).join(', ');
                console.error(`Duplicates for ${year}/${stack}: ${dupConfs}`);
            }

            assert.equal(duplicates.length, 0, `Found duplicate for : ${JSON.stringify(duplicates[0])}`);
        });

        for (const conference of conferences) {

            const { name, country, city, url, cfpUrl, twitter } = conference;

            function assertField(condition, field, message) {
                if (condition) {
                    return;
                }
                const lineNumber = findLineNumber(conference, field, fileName);
                const textToAppend = ` in file: ${fileName} in line: ${lineNumber}`;
                assert(false, message + textToAppend);
            }

            function testUrl(conference, property) {
                const value = conference[property];
                assertField(httpRegex.test(value), property, `[${property}] should start with http – got: "${value}"`);
                assertField(!httpNoQuestionmarkRegex.test(value), property, `[${property}] should not contain a ?  – got: "${value}"`);
                assertField(!urlShortener.test(value), property, `[${property}] should not use url shorteners – got: "${value}"`);
            }

            test(`${fileName} - ${name} - ${stack} - ${year}`, function () {
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
            });
        };
    };
};

!(async function () {
    const result = await test.run();
    if (!result) {
        process.exitCode = 1;
        process.exit(1);
    }
})()