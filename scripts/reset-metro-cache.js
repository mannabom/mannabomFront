/* eslint-disable no-console */
const fs = require('fs');
const os = require('os');
const path = require('path');

function safeRemove(targetPath) {
  try {
    if (fs.existsSync(targetPath)) {
      fs.rmSync(targetPath, { recursive: true, force: true });
      console.log(`Removed: ${targetPath}`);
    }
  } catch (error) {
    console.warn(`Skip: ${targetPath} (${error.message})`);
  }
}

function removeByPrefix(parentDir, prefix) {
  try {
    if (!fs.existsSync(parentDir)) return;
    for (const name of fs.readdirSync(parentDir)) {
      if (name.startsWith(prefix)) {
        safeRemove(path.join(parentDir, name));
      }
    }
  } catch (error) {
    console.warn(`Skip scan: ${parentDir} (${error.message})`);
  }
}

const projectRoot = process.cwd();
const tempDir = os.tmpdir();
const homeDir = os.homedir();

const projectCachePaths = [
  path.join(projectRoot, '.metro-cache'),
  path.join(projectRoot, 'node_modules', '.cache', 'metro'),
];

for (const cachePath of projectCachePaths) {
  safeRemove(cachePath);
}

removeByPrefix(tempDir, 'metro-');
removeByPrefix(tempDir, 'haste-map-');

const hasteMapState = path.join(homeDir, '.metro');
safeRemove(hasteMapState);

console.log('Metro cache cleanup finished.');
