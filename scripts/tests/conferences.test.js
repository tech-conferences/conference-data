const test = require('baretest')('Conferences Test');
const assert = require('assert');
const parse = require('date-fns/parse');
const getDuplicates = require('./utils');
const validLocations = require('./validLocations');
const conferenceReader = require('../conferenceReader');

const twitterRegex = /@(\w){1,15}$/;
const httpRegex = /^http(s?):\/\//;
const httpNoQuestionmarkRegex = /\?/;
const urlShortener = /(\/bit\.ly)|(\/t\.co)/;
const usaStateRegex = /, ([A-Z][A-Z])|(D.C.)$/;
const emptyStringRegex = /^\s+$|^$/gi;
const dateFormat = 'yyyy-MM-dd';
const REQUIRED_KEYS = ['name', 'url', 'startDate', 'endDate', 'country', 'city'];

function testUrl(conference, property) {
    const value = conference[property];
    assert(httpRegex.test(value), `[${property}] should start with http – got: "${value}"`);
    assert(!httpNoQuestionmarkRegex.test(value), `[${property}] should not contain a ?  – got: "${value}"`);
    assert(!urlShortener.test(value), `[${property}] should not use url shorteners – got: "${value}"`);
}

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

            test(`${fileName} - ${name} - ${stack} - ${year}`, function () {
                Object.keys(conference).forEach(key => assert(!emptyStringRegex.test(conference[key]), `property should not be empty ${key}`));
                // Twitter is a valid URL
                if (twitter && twitter.length > 0 && !twitterRegex.test(twitter)) {
                    assert(twitterRegex.test(twitter), `[twitter] should be formatted like @twitter – got: "${twitter}"`);
                }

                testUrl(conference, "url");

                // cfpUrl starts with http(s)://
                if (cfpUrl) {
                    testUrl(conference, "cfpUrl");
                }
                // Has no missing mandatory key
                REQUIRED_KEYS.forEach(requiredKey => {
                    assert(conference.hasOwnProperty(requiredKey), `[${requiredKey}]is missing`);
                });

                const startDate = parse(conference.startDate, dateFormat, new Date());
                assert(startDate.getFullYear() == year, `Start date should be in the same year as file location: ${startDate.getFullYear()}`);
                const endDate = parse(conference.endDate, dateFormat, new Date());
                assert(startDate.getTime() <= endDate.getTime(), `End date should be after start date: ${conference.startDate} <= ${conference.endDate}`)

                if (conference.cfpEndDate) {
                    const cfpEndDate = parse(conference.cfpEndDate, dateFormat, new Date());
                    assert(cfpEndDate.getTime() <= startDate.getTime(), `CFP End date should be before start date: ${conference.cfpEndDate} <= ${conference.startDate}`)
                }
                assert(validLocations[country], `[country] is a not in the list of valid countries – got: "${country}"`);
                assert(validLocations[country].indexOf(city) !== -1, `[city] is a not in the list of valid cities – got: "${city}" in "${country}""`);
                if (country === "U.S.A.") {
                    assert(usaStateRegex.test(city), `[city] cities in the US must also contain the state – got: "${city}"`);
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