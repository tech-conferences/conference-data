module.exports = function getDuplicates(conferences) {
    const keyAndConf = {};
    const duplicates = [];
    conferences.forEach(conf => {
        const uuid = getUUID(conf);
        if (keyAndConf[uuid]) {
            duplicates.push(keyAndConf[uuid]);
            duplicates.push(conf);
        } else {
            keyAndConf[uuid] = conf;
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
