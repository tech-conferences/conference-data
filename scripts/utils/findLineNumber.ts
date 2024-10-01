import fs from 'fs';
import clarinet from 'clarinet';
import { Conference } from './Conference';

const parser = clarinet.parser();

export default function findLineNumber(conferenceToFind: Conference, property: string, fileName: string) {
    var currentConference: any = {};
    var foundConference: any;
    var currentKey: string;

    function setKey(key: string) {
        if (!key) {
            return;
        }
        currentKey = key;
        currentConference[key] = {
            line: parser.line
        };
    }

    parser.onopenobject = function (key) {
        currentConference = {};
        setKey(key);
    };

    parser.onkey = function (key) {
        setKey(key);
    };

    parser.onvalue = function (v) {
        if (!currentKey) {
            console.log('No key' + v);
        }
        if (currentConference[currentKey]) {
            currentConference[currentKey].value = v;
        }
    };

    function isConferenceToFind(currentConference: any) {
        const keys = Object.keys(conferenceToFind);
        if (keys.length !== Object.keys(conferenceToFind).length) {
            return false;
        }
        for (const key of keys) {
            if (currentConference[key] && currentConference[key].value !== conferenceToFind[key as keyof Conference]) {
                return false;
            }
        }
        return true;
    }

    parser.oncloseobject = function () {
        if (isConferenceToFind(currentConference)) {
            foundConference = currentConference;
        }
    };

    const fileContent = fs.readFileSync(fileName);
    parser.write(fileContent.toString());
    parser.close();
    if (foundConference) {
        if (foundConference[property]) {
            return foundConference[property].line;
        }
        return foundConference[Object.keys(foundConference)[0]].line;
    }
    return null;
}
