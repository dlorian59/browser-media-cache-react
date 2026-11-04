import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';

const core = resolve(process.env.MEDIA_CACHE_SOURCE ?? '../browser-media-cache');
const temp = mkdtempSync(join(tmpdir(), 'media-react-bootstrap-'));
const run = (args, cwd = process.cwd()) => execFileSync('npm', args, { cwd, stdio: 'inherit' });
try {
  run(['ci', '--ignore-scripts', '--legacy-peer-deps']);
  run(['ci', '--ignore-scripts'], core);
  run(['run', 'build'], core);
  const packed = JSON.parse(execFileSync('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', temp], { cwd: core, encoding: 'utf8' }))[0];
  run(['install', '--no-save', '--package-lock=false', '--ignore-scripts', '--no-audit', '--no-fund', join(temp, packed.filename)]);
  console.log('Installed the local core artifact; published peer ranges remain semver-only.');
} finally { rmSync(temp, { recursive: true, force: true }); }
