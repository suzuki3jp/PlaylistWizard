const { cpSync } = require('node:fs');
const { join } = require('node:path');

function main() {
    const sourcePath = join(__dirname, 'default');
    const destPath = join(__dirname, '..', '..', 'packages', 'default');
    cpSync(sourcePath, destPath, { recursive: true });
    console.log(`Created package at ${destPath}`);
}

main();