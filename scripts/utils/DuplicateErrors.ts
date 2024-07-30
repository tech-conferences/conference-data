import { DuplicateError } from './DuplicateError';

export interface DuplicateErrors {
    almostIdentical: DuplicateError[];
    duplicates: DuplicateError[];
}
