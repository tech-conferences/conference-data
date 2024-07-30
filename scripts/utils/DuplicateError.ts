import { Conference } from './Conference';
import { MergedConference } from './MergedConference';

export interface DuplicateError {
    conference: MergedConference;
    otherConference: Conference;
    stack: string;
}
