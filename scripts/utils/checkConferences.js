const checkConference = require('./checkConference');
const getDuplicates = require('./getDuplicates');
const findLineNumber = require('./findLineNumber');

module.exports = function checkConferences(year, stack, conferences) {
    const errors = [];
    const fileName = `conferences/${year}/${stack}.json`;
    function reportError(lineNumber, message, value) {
        errors.push({
            fileName: fileName,
            lineNumber: lineNumber,
            message: message,
            value: value
        });
    }
    const duplicates = getDuplicates(conferences);
    for (const duplicate of duplicates) {
        const lineNumber = findLineNumber(duplicate, 'name', fileName);
        reportError(lineNumber, `Found duplicate conference "${duplicate.name} in ${duplicate.city}"`);
    }
    if (duplicates.length > 0) {
    }

    for (const conference of conferences) {
        function assertField(condition, field, message, value) {
            if (!condition) {
                const lineNumber = findLineNumber(conference, field, fileName);
                reportError(lineNumber, `[${field}] ${message}`, value);
            }
        }
        checkConference(year, conference, assertField);
    }
    return errors;
};
