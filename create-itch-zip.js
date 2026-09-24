const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const zipPath = path.resolve(__dirname, 'block-itch.zip');
const sourceDir = path.resolve(__dirname, 'play');

if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

try {
  execSync(`tar.exe -a -cf "${zipPath}" -C "${sourceDir}" .`, { stdio: 'inherit' });
  console.log(`[ZIP SUCCESS] block-itch.zip created successfully using bsdtar!`);
} catch (err) {
  console.error('[ZIP ERROR]', err);
}
