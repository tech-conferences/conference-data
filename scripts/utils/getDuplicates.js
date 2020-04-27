module.exports = function getDuplicates(conferences) {
    const confUUIDs = conferences.map(conf => getUUID(conf));
    const duplicates = [];

    Object.keys(conferences).forEach((key, index) => {
        const uuid = getUUID(conferences[key]);
        if (confUUIDs.indexOf(uuid, index + 1) !== -1) {
            if (duplicates.indexOf(uuid) === -1) {
                duplicates.push(conferences[key]);
            }
        }
    });
    return duplicates;
};

/**
 * Creates a unique ID for a conference from its url, city, year and month
 * @param conf
 * @returns {string}
 */
function getUUID(conf) {
    const baseUrl = /https?:\/\/(.*)(\/|$)/.exec(conf.url)[1];
    return `${baseUrl}-${conf.city}-${conf.startDate.slice(0, 7)}`;
}
