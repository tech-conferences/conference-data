import { ErrorDetail } from './ErrorDetail';

export interface TestResult {
    errors: { [year: string]: { [stack: string]: ErrorDetail[] } };
    conferenceCounter: number;
}
