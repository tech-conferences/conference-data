import { DuplicateError } from './DuplicateError';
import { ErrorDetail } from './ErrorDetail';

export interface TestResult {
    errors: { [year: string]: { [stack: string]: ErrorDetail[] } };
    duplicateErrors: DuplicateError[];
    conferenceCounter: number;
}
