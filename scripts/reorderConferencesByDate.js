// Reorder a file by running (from the scripts folder)
const fs = require('fs');
const sortBy = require('lodash/sortBy');
const parse = require('date-fns/parse');
const conferenceReader = require('./utils/conferenceReader');

const BASE_DIR = 'conferences';

const conferencesJSON = conferenceReader();

const propertyOrder = require('../config/validFields');

Object.keys(conferencesJSON).forEach((year) => {
  Object.keys(conferencesJSON[year]).forEach((topic) => {
    const fileName = `${BASE_DIR}/${year}/${topic}.json`;

    const conferences = conferencesJSON[year][topic];
    if (!Array.isArray(conferences)) {
      return;
    }
    const sortedConfs = sortBy(conferences, [
      (conf) => parse(conf.startDate, 'yyyy-MM-dd', new Date()).getTime(),
      (conf) => parse(conf.endDate || conf.startDate, 'yyyy-MM-dd', new Date()).getTime(),
      'name'
    ]);

    const sortedConfByProperties = sortedConfs.map(conference => {
      const sortedEntry = {};
      propertyOrder.forEach(property => {
        sortedEntry[property] = conference[property];
      });
      return sortedEntry;
    });


    fs.writeFile(fileName, JSON.stringify(sortedConfByProperties, null, 2), () => {
      console.log(`File ${fileName} was successfully reordered`);
    });

  });
});
