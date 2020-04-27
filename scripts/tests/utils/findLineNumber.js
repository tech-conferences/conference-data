const clarinet = require("clarinet");
const parser = clarinet.parser();
const fs = require('fs');

module.exports = function findLineNumber(conferenceToFind, property, fileName) {
    var currentConference = {};
    var foundConference;
    var currentKey;

    function setKey(key) {
        if (!key) {
            return;
        }
        currentKey = key;
        currentConference[key] = {
            line: parser.line
        }
    }

    parser.onopenobject = function (key) {
        currentConference = {};
        setKey(key);
    }

    parser.onkey = function (key) {
        setKey(key);
    };

    parser.onvalue = function (v) {
        if (!currentKey) {
            console.log("No key" + v)
        }
        if (currentConference[currentKey]) {
            currentConference[currentKey].value = v;
        }
    };

    function isConferenceToFind(currentConference) {
        const keys = Object.keys(conferenceToFind);
        if (keys.length !== Object.keys(conferenceToFind).length) {
            return false;
        }
        for (const key of keys) {
            if (currentConference[key] && currentConference[key].value !== conferenceToFind[key]) {
                return false;
            }
        }
        return true;
    }

    parser.oncloseobject = function () {
        if (isConferenceToFind(currentConference)) {
            foundConference = currentConference;
        }
    }

    const fileContent = fs.readFileSync(fileName);
    parser.write(fileContent.toString()).close();
    if (foundConference) {
        if (foundConference[property]) {
            return foundConference[property].line;
        }
        return foundConference[Object.keys(foundConference)[0]].line;
    }
    return null;
}
