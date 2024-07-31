import { DuplicateType } from './DuplicateType';
import { MergedConference } from './MergedConference';

export interface DuplicateError {
    conference: MergedConference;
    duplicate: MergedConference;
    type: DuplicateType;
}
