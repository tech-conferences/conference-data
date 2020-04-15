// Reorder a file by running (from the scripts folder)
const fs = require('fs');
const range = require('lodash/range');
const sortBy = require('lodash/sortBy');
const parse = require('date-fns/parse');
const config = require('../config');

const BASE_DIR = 'conferences';
const conferencesJSON = {};

range(config.startYear, config.currentYear + 2).forEach((year) => {
  conferencesJSON[year] = {};
  config.topics.forEach((topic) => {
    conferencesJSON[year][topic] = {};
  });
});

Object.keys(conferencesJSON).forEach((year) => {
  Object.keys(conferencesJSON[year]).forEach((topic) => {
    const fileName = `${BASE_DIR}/${year}/${topic}.json`;

    fs.readFile(fileName, (err, data) => {
      if (err) {
        return;
      }

      const sortedConfs = sortBy(JSON.parse(data), [
        (conf) => parse(conf.startDate, 'yyyy-MM-dd', new Date()).getTime(),
        (conf) => parse(conf.endDate || conf.startDate, 'yyyy-MM-dd', new Date()).getTime(),
        'name'
      ]);

      fs.writeFile(fileName, JSON.stringify(sortedConfs, null, 2), () => {
        console.log(`File ${fileName} was successfully reordered`);
      });
    });
  });
});
