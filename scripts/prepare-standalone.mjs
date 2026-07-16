import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const standaloneRoot = path.join(root, '.next', 'standalone');
const serverPath = path.join(standaloneRoot, 'server.js');

if (!fs.existsSync(serverPath)) {
  console.error('Standalone build not found. Run `npm run build` first.');
  process.exit(1);
}

copyDirectory(path.join(root, 'public'), path.join(standaloneRoot, 'public'));
copyDirectory(
  path.join(root, '.next', 'static'),
  path.join(standaloneRoot, '.next', 'static'),
);
copyDirectory(path.join(root, 'data'), path.join(standaloneRoot, 'data'));

function copyDirectory(source, destination) {
  if (!fs.existsSync(source)) {
    console.error(`Required standalone asset directory is missing: ${path.relative(root, source)}`);
    process.exit(1);
  }

  fs.mkdirSync(destination, { recursive: true });
  fs.cpSync(source, destination, { recursive: true, force: true });
}
