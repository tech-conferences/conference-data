const sortBy = require('lodash/sortBy');
const parse = require('date-fns/parse');
const propertyOrder = require('../../config/validFields');

module.exports = function orderConferences(conferences) {
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
        propertyOrder.forEach(property => {
            sortedEntry[property] = conference[property];
        });
        return sortedEntry;
    });

    return JSON.stringify(sortedConfByProperties, null, 2);
};
