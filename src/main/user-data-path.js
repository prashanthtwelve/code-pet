const os = require('node:os');
const path = require('node:path');

function getUserDataDirectory({ platform = process.platform, env = process.env, home = os.homedir() } = {}) {
  if (env.CODE_PET_USER_DATA_DIR) return path.resolve(env.CODE_PET_USER_DATA_DIR);

  let baseDirectory;
  if (platform === 'win32') {
    baseDirectory = env.APPDATA || path.join(home, 'AppData', 'Roaming');
  } else if (platform === 'darwin') {
    baseDirectory = path.join(home, 'Library', 'Application Support');
  } else {
    baseDirectory = env.XDG_CONFIG_HOME || path.join(home, '.config');
  }
  return path.join(baseDirectory, 'code-pet');
}

module.exports = { getUserDataDirectory };
