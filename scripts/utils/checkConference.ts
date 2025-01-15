import { parse, differenceInDays } from 'date-fns';
import { validLocations } from '../config/validLocations';
import validFields from '../config/validFields';
import { MergedConference } from './MergedConference';
import { AssertField } from './AssertField';
import { Conference } from './Conference';

const maxDurationInDays: number = 10;
const twitterRegex: RegExp = /@\w([\w\.]){1,15}$/;
const httpRegex: RegExp = /^http(s?):\/\//;
const httpNoQuestionmarkRegex: RegExp = /\?/;
const urlShortener: RegExp = /(bit\.ly)|(\/t\.co)|(shorturl)|(\/aka\.ms)/;
const usaStateRegex: RegExp = /, ([A-Z][A-Z])|(D.C.)$/;
const emptyStringRegex: RegExp = /^\s+$|^$/gi;
const onlineRegex: RegExp = /online|remote|everywhere|world|web|global|virtual|www|http/i;
const dateFormat: string = 'yyyy-MM-dd';
const dateRegex: RegExp = /(2\d\d\d)-(0[1-9])|(1[012])-(0[1-9])|([12][0-9])|(3[01])/;
const year2000Regex: RegExp = /20\d{2}/;
const REQUIRED_KEYS: string[] = ['name', 'url', 'startDate', 'endDate'];
const validLocationsHint: string = ' - Check/Maintain the file "scripts/config/validLocations.ts"';

export default function (year: string, conference: MergedConference, assertField: AssertField) {
    const { name, url, cfpUrl, twitter } = conference;

    REQUIRED_KEYS.forEach((requiredKey: string) => {
        assertField(conference.hasOwnProperty(requiredKey), requiredKey, `is missing`);
    });
    Object.keys(conference).forEach((key: string) => {
        if (key == 'startDateParsed' || key == 'stacks' || key == 'endDateParsed' || key == 'cfpEndDateParsed') {
            return;
        }
        const propertyName: keyof Conference = key as keyof Conference;
        const propertyValue: string = conference[propertyName] as string;
        assertField(validFields.indexOf(key) !== -1, key, `property is not valid`);
        assertField(!emptyStringRegex.test(propertyValue), key, `property should not be empty`);
    });
    assertField(name.indexOf(year.substring(2, 4)) === -1, 'name', 'should not contain the year', name);
    checkUrl(conference, 'url');
    assertField(dateRegex.test(conference.startDate), 'startDate', 'should be of format yyyy-mm-dd', conference.startDate);
    assertField(conference.startDate.length === 10, 'startDate', 'should have a length of 10 characters', conference.startDate);
    const startDate: Date = conference.startDateParsed;
    assertField(startDate.getFullYear() == parseInt(year), 'startDate', 'should be in the same year as file location', startDate.getFullYear().toString());
    assertField(dateRegex.test(conference.endDate), 'endDate', 'should be of format yyyy-mm-dd', conference.endDate);
    assertField(conference.endDate.length === 10, 'endDate', 'should have a length of 10 characters', conference.endDate);
    const endDate: Date = conference.endDateParsed;
    assertField(startDate.getTime() <= endDate.getTime(), 'endDate', 'should be after start date', `${conference.startDate} <= ${conference.endDate}`);
    const durationInDays: number = differenceInDays(endDate, startDate);
    assertField(durationInDays <= maxDurationInDays, 'endDate', `the duration of the conference is above the max limit of ${maxDurationInDays} days`, durationInDays.toString());
    const hasCountry: boolean = conference.hasOwnProperty('country');
    const hasCity: boolean = conference.hasOwnProperty('city');
    var hasOnline: boolean = conference.hasOwnProperty('online');
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
        const cfpEndDate: Date = parse(conference.cfpEndDate, dateFormat, new Date());
        assertField(cfpEndDate.getTime() <= startDate.getTime(), 'cfpEndDate', 'should be before start date', `${conference.cfpEndDate} <= ${conference.startDate}`);
    }
    if (twitter && twitter.length > 0 && !twitterRegex.test(twitter)) {
        assertField(twitterRegex.test(twitter), 'twitter', 'should be formatted like @twitter', twitter);
    }

    function checkLocation(country: string, city: string) {
        const isOnline: boolean = onlineRegex.test(city) || onlineRegex.test(country);
        if (isOnline) {
            assertField(false, 'city', 'for Online conferences please use the property "online" and no city', city);
            assertField(false, 'country', 'for Online conferences please use the property "online" and no country', country);
        } else {
            const isCountryValid: boolean = validLocations.hasOwnProperty(country);
            const countryKey = country as keyof typeof validLocations;
            const countryObject = validLocations[countryKey];
            const isCityValid: boolean = isCountryValid && countryObject.includes(city);
            assertField(isCityValid, 'city', 'is a not in the list of valid cities' + validLocationsHint, `"${city}" in "${country}"`);
            assertField(isCountryValid, 'country', 'is a not in the list of valid countries' + validLocationsHint, country);
            if (country === 'U.S.A.') {
                assertField(usaStateRegex.test(city), 'city', 'in the US must also contain the state', city);
            }
        }
    }

    function checkUrl(conference: MergedConference, property: keyof Conference) {
        const value: string = conference[property] as string;
        assertField(httpRegex.test(value), property, 'should start with http', value);
        assertField(!httpNoQuestionmarkRegex.test(value), property, 'should not contain a "?"', value);
        assertField(!urlShortener.test(value), property, 'should not use url shorteners', value);
        checkYearInUrl(conference, property, value);
    }

    function checkYearInUrl(conference: MergedConference, property: string, value: string) {
        const urlContainsYear: RegExpMatchArray | null = value.match(year2000Regex);

        // If a 4-digit number starting with "20" is found in the URL
        if (urlContainsYear) {
            const year: number = parseInt(urlContainsYear[0]);
            const eventStartYear: number = new Date(conference.startDate).getFullYear();
            const diffInYears: number = Math.abs(year - eventStartYear);
            if (diffInYears == 0 || diffInYears > 5) {
                return;
            }
            const eventEndYear: number = new Date(conference.endDate).getFullYear();

            // Check if the year in the URL matches the event start or end year
            assertField(year === eventStartYear || year === eventEndYear, property, `If a year is present in the URL, it should match the event start or end year`, value);
        }
    }
}
