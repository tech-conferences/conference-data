// Reorder a file by running (from the scripts folder)
import fs from 'fs';
import {range, sortBy} from 'lodash';
import {parse} from 'date-fns';
import {TOPICS, START_YEAR, CURRENT_YEAR} from './config';

const args = process.argv;

const BASE_DIR = 'conferences';
const conferencesJSON = {};

range(START_YEAR, CURRENT_YEAR + 2).forEach((year) => {
  conferencesJSON[year] = {};
  TOPICS.forEach((topic) => {
    conferencesJSON[year][topic] = {};
  });
});

Object.keys(conferencesJSON).forEach((year) => {
  Object.keys(conferencesJSON[year]).forEach((topic) => {
    const fileName = `${BASE_DIR}/${year}/${topic}.json`;

    fs.readFile(fileName, (err, data) => {
      console.log(err)
      if (err) {
        return;
      }

      const sortedConfs = sortBy(JSON.parse(data),[
        (conf) => parse(conf.startDate).getTime(),
        (conf) => parse(conf.endDate || conf.startDate).getTime(),
        'name'
      ]);

      fs.writeFile(fileName, JSON.stringify(sortedConfs, null, 2), () => {
        console.log(`File ${fileName} was successfully reordered`);
      });
    });
  });
});
