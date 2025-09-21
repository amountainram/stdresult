import { readFile, writeFile } from 'fs/promises';
import { execSync } from 'child_process';
import * as semver from 'semver';

async function bumpVersion(file: string, newVersion: string) {
  const data = JSON.parse(await readFile(file, 'utf8'));
  data.version = newVersion;
  await writeFile(file, JSON.stringify(data, null, 2) + '\n');
}

async function updateReadme(newVersion: string) {
  const readmePath = './README.md';
  let content = await readFile(readmePath, 'utf8');
  // Replace all occurrences of vX.Y.Z or X.Y.Z
  content = content.replace(/\b\d+\.\d+\.\d+\b/g, newVersion);
  await writeFile(readmePath, content);
}

async function main() {
  const pkg = JSON.parse(await readFile('./package.json', 'utf8'));
  const oldVersion = pkg.version;
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const bumpType = args.find(arg => ['patch', 'minor', 'major'].includes(arg)) || 'patch';

  const newVersion = semver.inc(oldVersion, bumpType as semver.ReleaseType);

  if (!newVersion) {
    console.error('Invalid version bump type.');
    process.exit(1);
  }

  if (dryRun) {
    console.log(`[dry-run] Would bump version: ${oldVersion} -> ${newVersion}`);
    process.exit(0);
  }

  await bumpVersion('./package.json', newVersion);
  await bumpVersion('./jsr.json', newVersion);
  await updateReadme(newVersion);

  execSync('git add package.json jsr.json README.md');
  execSync(`git commit -m "chore: release v${newVersion}"`);
  execSync(`git tag -a v${newVersion} -m "Version ${newVersion}"`);
  console.log(`Bumped to version v${newVersion} and created git tag.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
