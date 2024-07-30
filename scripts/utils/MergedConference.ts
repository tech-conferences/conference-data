import { Conference } from './Conference';

export interface MergedConference extends Conference {
    startDateParsed: Date;
    endDateParsed: Date;
    cfpEndDateParsed?: Date;
    stacks: string[];
}
