import sortBy from 'lodash/sortBy.js';
import { parse } from 'date-fns';
import validFields from '../../config/validFields.js';

export default function orderConferences(conferences) {
    if (!Array.isArray(conferences)) {
        return;
    }
    const sortedConfs = sortBy(conferences, [
        conf => parse(conf.startDate, 'yyyy-MM-dd', new Date()).getTime(),
        conf => parse(conf.endDate || conf.startDate, 'yyyy-MM-dd', new Date()).getTime(),
        'name'
    ]);

    const sortedConfByProperties = sortedConfs.map(conference => {
        const sortedEntry = {};
        validFields.forEach(property => {
            sortedEntry[property] = conference[property];
        });
        return sortedEntry;
    });

    return JSON.stringify(sortedConfByProperties, null, 2);
}
