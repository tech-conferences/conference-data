const parse = require('date-fns/parse');
const differenceInDays = require('date-fns/differenceInDays');
const validLocations = require('../../config/validLocations');
const validFields = require('../../config/validFields');

const maxDurationInDays = 10;
const twitterRegex = /@\w([\w\.]){1,15}$/;
const httpRegex = /^http(s?):\/\//;
const httpNoQuestionmarkRegex = /\?/;
const urlShortener = /(\/bit\.ly)|(\/t\.co)/;
const usaStateRegex = /, ([A-Z][A-Z])|(D.C.)$/;
const emptyStringRegex = /^\s+$|^$/gi;
const onlineRegex = /online|remote|everywhere|world|web|global|virtual|www|http/i;
const dateFormat = 'yyyy-MM-dd';
const dateRegex = /(2\d\d\d)-(0[1-9])|(1[012])-(0[1-9])|([12][0-9])|(3[01])/;
const REQUIRED_KEYS = ['name', 'url', 'startDate', 'endDate'];
const validLocationsHint = ' - Check/Maintain the file "config/validLocations.js"';

module.exports = function checkConference(year, conference, assertField) {
    const { name, url, cfpUrl, twitter } = conference;

    REQUIRED_KEYS.forEach(requiredKey => {
        assertField(conference.hasOwnProperty(requiredKey), requiredKey, `is missing`);
    });
    Object.keys(conference).forEach(key => {
        assertField(validFields.indexOf(key) !== -1, key, `property is not valid`);
        assertField(!emptyStringRegex.test(conference[key]), key, `property should not be empty`);
    });
    assertField(name.indexOf(year.substring(2, 4)) === -1, 'name', 'should not contain the year', name);
    checkUrl(conference, 'url');
    assertField(dateRegex.test(conference.startDate), 'startDate', 'should be of format yyyy-mm-dd', conference.startDate);
    assertField(conference.startDate.length === 10, 'startDate', 'should have a length of 10 characters', conference.startDate);
    const startDate = parse(conference.startDate, dateFormat, new Date());
    assertField(startDate.getFullYear() == year, 'startDate', 'should be in the same year as file location', startDate.getFullYear());
    assertField(dateRegex.test(conference.endDate), 'endDate', 'should be of format yyyy-mm-dd', conference.endDate);
    assertField(conference.endDate.length === 10, 'endDate', 'should have a length of 10 characters', conference.endDate);
    const endDate = parse(conference.endDate, dateFormat, new Date());
    assertField(startDate.getTime() <= endDate.getTime(), 'endDate', 'should be after start date', `${conference.startDate} <= ${conference.endDate}`);
    const durationInDays = differenceInDays(endDate, startDate);
    assertField(durationInDays <= maxDurationInDays, 'endDate', `the duration of the conference is above the max limit of ${maxDurationInDays} days`, durationInDays);
    const hasCountry = conference.hasOwnProperty('country');
    const hasCity = conference.hasOwnProperty('city');
    var hasOnline = conference.hasOwnProperty('online');
    if (!hasOnline) {
        assertField(hasCountry, 'country', 'country should be maintained for in-person conferences', conference.country);
        assertField(hasCity, 'city', 'city should be maintained for in-person conferences', conference.city);
    }
    if (hasCountry || hasCity) {
        checkLocation(conference.country, conference.city);
    }
    if (cfpUrl) {
        checkUrl(conference, 'cfpUrl');
        assertField(cfpUrl !== url, 'cfpUrl', 'should not be identical to url', cfpUrl);
    }
    if (conference.cfpEndDate) {
        const cfpEndDate = parse(conference.cfpEndDate, dateFormat, new Date());
        assertField(cfpEndDate.getTime() <= startDate.getTime(), 'cfpEndDate', 'should be before start date', `${conference.cfpEndDate} <= ${conference.startDate}`);
    }
    if (twitter && twitter.length > 0 && !twitterRegex.test(twitter)) {
        assertField(twitterRegex.test(twitter), 'twitter', 'should be formatted like @twitter', twitter);
    }

    function checkLocation(country, city) {
        const isCountryValid = validLocations[country];
        const isCityValid = isCountryValid && validLocations[country].indexOf(city) !== -1;
        const isOnline = onlineRegex.test(city) || onlineRegex.test(country);
        if (isOnline) {
            assertField(false, 'city', 'for Online conferences please use the property "online" and no city', city);
            assertField(false, 'country', 'for Online conferences please use the property "online" and no country', country);
        } else {
            assertField(isCityValid, 'city', 'is a not in the list of valid cities' + validLocationsHint, `"${city}" in "${country}"`);
            assertField(isCountryValid, 'country', 'is a not in the list of valid countries' + validLocationsHint, country);
            if (country === 'U.S.A.') {
                assertField(usaStateRegex.test(city), 'city', 'in the US must also contain the state', city);
            }
        }
    }
    function checkUrl(conference, property) {
        const value = conference[property];
        assertField(httpRegex.test(value), property, 'should start with http', value);
        assertField(!httpNoQuestionmarkRegex.test(value), property, 'should not contain a "?"', value);
        assertField(!urlShortener.test(value), property, 'should not use url shorteners', value);

        const yearInUrl = value.match(/20\d{2}/);

        // If a 4-digit number starting with "20" is found in the URL
        if (yearInUrl) {
            const year = yearInUrl[0];
            const eventStartYear = new Date(conference.startDate).getFullYear();
            const eventEndYear = new Date(conference.endDate).getFullYear();

            // Check if the year in the URL matches the event start or end year
            assertField(
                year === eventStartYear.toString() || year === eventEndYear.toString(),
                property,
                `If a year is present in the URL, it should match the event start or end year`,
                value
            );
        }
    }
};
