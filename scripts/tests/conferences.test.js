const test = require('baretest')('Conferences Test');
const assert = require('assert');
const range = require('lodash/range');
const getDuplicates = require('./utils');
const config = require('../config');

const BASE_DIR = '../../conferences';

const twitterRegex = /@(\w){1,15}$/;
const httpRegex = new RegExp('^http(s?)://');

const conferencesJSON = {};

range(config.startYear, config.currentYear + 2).forEach(year => {
    conferencesJSON[year] = {};
    config.topics.forEach(lang => {
        try {
            conferencesJSON[year][lang] = require(`${BASE_DIR}/${year}/${lang}.json`);
            // In case some years have no files
            // eslint-disable-next-line no-empty
        } catch (exception) { }
    });
});

const REQUIRED_KEYS = ['name', 'url', 'startDate', 'country', 'city'];
const DATES_KEYS = ['startDate', 'endDate', 'cfpEndDate'];
const BAD_CITY_NAMES = [
    'San Fransisco',
    'Feiburg'
];

const BAD_COUNTRY_NAMES = [
    'US',
    'U.S.',
    'U.S',
    'USA',
    'U.S.A',
    'United States of America',
    'UK',
    'U.K',
    'UAE',
    'The Netherlands',
    'United Kingdom',
];

Object.keys(conferencesJSON).forEach(year => {
    Object.keys(conferencesJSON[year]).forEach(stack => {

        const conferences = conferencesJSON[year][stack];

        test(`${stack} conferences in ${year}`, function () {

            const duplicates = getDuplicates(conferences);

            if (duplicates.length > 0) {
                const dupConfs = duplicates.map(conf => conf.name).join(', ');
                console.error(`Duplicates for ${year}/${stack}: ${dupConfs}`);
            }

            assert.equal(duplicates.length, 0);
        });

        conferences.forEach(conference => {
            const { name, country, city, url, cfpUrl, twitter } = conference;

            test(`conferences/${year}/${stack}.json - ${name} - ${stack} - ${year}`, function () {
                // Twitter is a valid URL
                if (twitter && twitter.length > 0 && !twitterRegex.test(twitter)) {
                    assert(twitterRegex.test(twitter), `[twitter] should be formatted like @twitter – got: "${twitter}"`);
                }

                // url starts with http(s)://
                assert(httpRegex.test(url), `[url] should start with http – got: "${url}"`);

                // cfpUrl starts with http(s)://
                if (cfpUrl) {
                    assert(httpRegex.test(cfpUrl), `[cfpUrl] should start with http – got: "${cfpUrl}"`);
                }
                // Has no missing mandatory key
                REQUIRED_KEYS.forEach(requiredKey => {
                    assert(conference.hasOwnProperty(requiredKey), `[${requiredKey}] is missing`);
                });

                // Dates are correctly formatted
                DATES_KEYS.forEach(dateKey => {
                    // cfpEndDate could be undefined or null
                    if (conference[dateKey]) {
                        const dateRegex = /^20\d\d-\d\d(-\d\d)?$/;
                        assert(dateRegex.test(conference[dateKey]), `[${dateKey}] should be formatter like YYYY-MM-DD or YYYY-MM – got: "${conference[dateKey]}"`)
                    }
                });

                // Has a good country name', () => {
                assert(BAD_COUNTRY_NAMES.indexOf(country) === -1,
                    `[country] is a bad country name – got: "${country}", did you miss a dot? Try U.S.A. / U.K.`
                );

                // Has a good city name', () => {
                assert(
                    BAD_CITY_NAMES.indexOf(city) === -1,
                    `[city] is a bad city name – got: "${city}", did you mean San Francisco?`
                );

            });
        });
    });
});

test.run()