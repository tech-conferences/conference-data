export function getDuplicates(conferences) {
  const confUUIDs = conferences.map((conf) => getUUID(conf));
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
}

function getUUID(conf) {
  return `${conf.url.replace(/https?:\/\//, '')}-${conf.city}`;
}
