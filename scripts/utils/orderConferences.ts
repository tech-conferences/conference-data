import { sortBy } from 'lodash';
import { parse } from 'date-fns';
import { Conference } from './Conference';

export default function orderConferences(conferences: Conference[]): string {
    if (!Array.isArray(conferences)) {
        return '';
    }
    const sortedConfs = sortBy(conferences, [
        conf => parse(conf.startDate, 'yyyy-MM-dd', new Date()).getTime(),
        conf => parse(conf.endDate || conf.startDate, 'yyyy-MM-dd', new Date()).getTime(),
        'name'
    ]);

    return JSON.stringify(sortedConfs, null, 2);
}
