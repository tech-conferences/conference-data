import fs from 'fs';
import assert from 'assert';
import { topics } from '../config/topics';
import orderConferences from './orderConferences';
import { Conference } from './Conference';
import { ConferencesJSON } from './ConferencesJSON';

const jsonFileRegex = /(.*).json$/;

export default function conferenceReader(reorderConferences: boolean): ConferencesJSON {
    const conferencesJSON: ConferencesJSON = {};

    fs.readdirSync('conferences').forEach(year => {
        conferencesJSON[year] = {};
        fs.readdirSync(`conferences/${year}`).forEach(fileName => {
            const filePath = `conferences/${year}/${fileName}`;
            assert(jsonFileRegex.test(fileName));
            const topic = jsonFileRegex.exec(fileName)![1];
            assert(topics.indexOf(topic) !== -1, `Topic "${topic}" is not in topic list. File: ${filePath}`);
            const fileContent = fs.readFileSync(filePath);
            if (fileContent.toString() === '[]') {
                return;
            }
            let conferences: Conference[];
            const fileContentString = fileContent.toString();
            try {
                conferences = JSON.parse(fileContentString);
            } catch (exception) {
                assert.fail(`Unable to read file: "${filePath}". Error: ${exception}`);
            }
            const orderedConferences = orderConferences(conferences);
            if (!reorderConferences && fileContentString !== orderedConferences) {
                assert.fail(`Conferences not in the right order: "${filePath}". Please run 'npm run reorder-confs'`);
            }
            conferencesJSON[year][topic] = conferences;
        });
    });

    return conferencesJSON;
}
