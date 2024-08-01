import { Conference } from './Conference';

export default function IsConferenceEqual(conference: Conference, otherConference: Conference): boolean {
    let filledFieldsConference = 0;
    let filledFieldsOtherConference = 0;
    for (const field of Object.keys(conference)) {
        if (field == 'startDateParsed' || field == 'stacks' || field == 'endDateParsed' || field == 'cfpEndDateParsed') {
            continue;
        }
        const value = conference[field as keyof Conference];
        const otherValue = otherConference[field as keyof Conference];
        if (value !== undefined) {
            filledFieldsConference++;
        }
        if (otherValue !== undefined) {
            filledFieldsOtherConference++;
        }
        if (value !== otherValue) {
            return false;
        }
    }
    if (filledFieldsConference !== filledFieldsOtherConference) {
        return false;
    }
    return true;
}
