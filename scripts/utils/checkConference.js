const parse = require('date-fns/parse');
const validLocations = require('../../config/validLocations');
const validFields = require('../../config/validFields');

const twitterRegex = /@(\w){1,15}$/;
const httpRegex = /^http(s?):\/\//;
const httpNoQuestionmarkRegex = /\?/;
const urlShortener = /(\/bit\.ly)|(\/t\.co)/;
const usaStateRegex = /, ([A-Z][A-Z])|(D.C.)$/;
const emptyStringRegex = /^\s+$|^$/gi;
const onlineRegex = /online|remote|everywhere|world|web|global|virtual|www|http/i;
const dateFormat = 'yyyy-MM-dd';
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
    const startDate = parse(conference.startDate, dateFormat, new Date());
    assertField(startDate.getFullYear() == year, 'startDate', 'should be in the same year as file location', startDate.getFullYear());
    const endDate = parse(conference.endDate, dateFormat, new Date());
    assertField(startDate.getTime() <= endDate.getTime(), 'endDate', 'should be after start date', `${conference.startDate} <= ${conference.endDate}`);
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
    }
};
