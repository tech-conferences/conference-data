/* global describe, it, expect, require */
/* eslint-disable no-console, shopify/prefer-early-return */
import {range} from 'lodash';
import {getDuplicates} from './utils';
import {TOPICS, START_YEAR, CURRENT_YEAR} from '../config';
const BASE_DIR = '../../conferences';

const conferencesJSON = {};

range(START_YEAR, CURRENT_YEAR + 2).forEach(year => {
  conferencesJSON[year] = {};
  TOPICS.forEach(lang => {
    try {
      conferencesJSON[year][lang] = require(`${BASE_DIR}/${year}/${lang}.json`);
      // In case some years have no files
      // eslint-disable-next-line no-empty
    } catch (exception) {}
  });
});

const REQUIRED_KEYS = ['name', 'url', 'startDate', 'country', 'city'];
const DATES_KEYS = ['startDate', 'endDate', 'cfpEndDate'];
const BAD_CITY_NAMES = [
  'San Fransisco'
];

const BAD_COUNTRY_NAMES = [
  'US',
  'U.S.',
  'U.S',
  'USA',
  'U.S.A',
  'UK',
  'U.K',
  'UAE',
  'The Netherlands',
  'United Kingdom',
];

Object.keys(conferencesJSON).forEach(year => {
  Object.keys(conferencesJSON[year]).forEach(stack => {
    describe(`${stack} conferences in ${year}`, () => {
      const conferences = conferencesJSON[year][stack];

      it('does not have duplicates', () => {
        const duplicates = getDuplicates(conferences);

        if (duplicates.length > 0) {
          const dupConfs = duplicates.map(conf => conf.name).join(', ');
          console.error(`Duplicates for ${year}/${stack}: ${dupConfs}`);
        }

        expect(duplicates.length).toBe(0);
      });

      conferences.forEach(conference => {
        const {name, country, city, url, cfpUrl, twitter} = conference;

        describe(name, () => {
          it('is valid', () => {
            // Twitter is a valid URL
            if (twitter && twitter.length > 0) {
              expect(
                twitter,
                `[twitter] should be formatted like @twitter – got: "${twitter}"`
              ).not.toContain('twitter.com');
            }
            // Twitter stats with @
            if (twitter && twitter.length > 0) {
              expect(twitter, `[twitter] should start with @ – got: "${twitter}"`).toContain('@');
            }
            const httpRegex = new RegExp('^http(s?)://');
            // url starts with http(s)://
            expect(
              httpRegex.exec(url),
              `[url] should start with http – got: "${url}"`
            ).not.toBe(null);

            // cfpUrl starts with http(s)://
            if (cfpUrl) {
              expect(
                httpRegex.exec(cfpUrl),
                `[cfpUrl] should start with http – got: "${cfpUrl}"`
              ).not.toBe(null);
            }
            // Has no missing mandatory key
            REQUIRED_KEYS.forEach(requiredKey => {
              expect(
                conference.hasOwnProperty(requiredKey),
                `[${requiredKey}] is missing`
              ).toBe(true);
            });

            // Dates are correctly formatted
            DATES_KEYS.forEach(dateKey => {
              // cfpEndDate could be undefined or null
              if (conference[dateKey]) {
                expect(
                  [7, 10],
                  `[${dateKey}] should be formatter like YYYY-MM-DD or YYYY-MM – got: "${conference[dateKey]}"`
                ).toContain(conference[dateKey].length);
              }
            });

            // Has a good country name', () => {
            expect(
              BAD_COUNTRY_NAMES.indexOf(country) !== -1,
              `[country] is a bad country name – got: "${country}", did you miss a dot? Try U.S.A. / U.K.`
            ).toBe(false);

            // Has a good city name', () => {
            expect(
              BAD_CITY_NAMES.indexOf(city) !== -1,
              `[city] is a bad city name – got: "${city}", did you mean San Francisco?`
            ).toBe(false);
          });
        });
      });
    });
  });
});
