const fs = require('node:fs');
const path = require('node:path');

function scanPets(directories) {
  const pets = [];
  for (const { directory, source } of directories) {
    let entries;
    try {
      entries = fs.readdirSync(directory, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const petDirectory = path.join(directory, entry.name);
      if (!fs.existsSync(path.join(petDirectory, 'idle.png'))
        && !fs.existsSync(path.join(petDirectory, 'idle.svg'))) continue;
      pets.push({ name: entry.name, source, key: `${source}:${entry.name}`, directory: petDirectory });
    }
  }
  return pets;
}

module.exports = { scanPets };
