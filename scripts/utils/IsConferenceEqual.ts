import { Conference } from './Conference';

export default function IsConferenceEqual(conference: Conference, duplicate: Conference): boolean {
    for (const field of Object.keys(conference)) {
        if (field == 'startDateParsed' || field == 'stacks' || field == 'endDateParsed' || field == 'cfpEndDateParsed') {
            continue;
        }
        const value = conference[field as keyof Conference];
        const duplicateValue = duplicate[field as keyof Conference];
        if (value !== duplicateValue) {
            return false;
        }
    }
    return true;
}
