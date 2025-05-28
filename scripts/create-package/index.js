const { cpSync, readFileSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');

function main() {
    const packageName = process.argv[2];
    if (!packageName) {
        console.error('Package name is required');
        process.exit(1);
    }

    const sourcePath = join(__dirname, 'default');
    const destPath = join(__dirname, '..', '..', 'packages', packageName);

    // Copy files
    cpSync(sourcePath, destPath, { recursive: true });

    // Update package.json
    const packageJsonPath = join(destPath, 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    packageJson.name = `@playlistwizard/${packageName}`;
    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

    console.log(`Created package ${packageName} at ${destPath}`);
}

main();