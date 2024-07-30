import { Conference } from './Conference';

export interface ConferencesJSON {
    [year: string]: {
        [topic: string]: Conference[];
    };
}
