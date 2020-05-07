module.exports = function checkDuplicates(year, mergedConferencesOfYear, reportError) {
    function reportDuplicate(error, message) {
        const duplicateConference = error.otherConference;
        reportError(year, error.stack, duplicateConference, 'name', duplicateConference.name, message);
        for (const stack of error.conference.stacks) {
            reportError(year, stack, error.conference, 'name', duplicateConference.name, message);
        }
    }
    for (const duplicate of mergedConferencesOfYear.errors.duplicates) {
        reportDuplicate(duplicate, 'Found duplicate conference');
    }
    for (const almostIdentical of mergedConferencesOfYear.errors.almostIdentical) {
        reportDuplicate(almostIdentical, 'Found almost identical conference');
    }
};
