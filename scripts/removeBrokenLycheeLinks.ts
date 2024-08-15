import fs from 'fs';

const lycheeLogFile = fs.readFileSync('lychee.json');
const lycheeLogString = lycheeLogFile.toString();
const lycheeLog = JSON.parse(lycheeLogString);

const filesWithBrokenLinks = Object.keys(lycheeLog.fail_map);

for (const fileWithBrokenLinks of filesWithBrokenLinks) {
    const file = fs.readFileSync(fileWithBrokenLinks);
    const fileString = file.toString();
    const fileJSON = JSON.parse(fileString);
    const errors = lycheeLog.fail_map[fileWithBrokenLinks].map((error: any) => error.url);
    const filteredConferences = fileJSON.filter((conference: any) => {
        if (errors.includes(conference.url)) {
            return false;
        }
        return true;
    });
    const cleanedAndFilteredConferences = filteredConferences.map((conference: any) => {
        if (errors.includes(conference.cfpUrl)) {
            delete conference.cfpUrl;
            delete conference.cfpEndDate;
        }
        if (errors.includes(conference.cocUrl)) {
            delete conference.cocUrl;
        }
        return conference;
    });
    fs.writeFile(fileWithBrokenLinks, JSON.stringify(cleanedAndFilteredConferences, null, 2), () => {
        console.log(`File ${fileWithBrokenLinks} was successfully reordered`);
    });
}
