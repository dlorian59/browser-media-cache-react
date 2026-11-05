import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { chromium } from 'playwright';

// EN: Record the existing local example, assert real UI state, then encode its frames with ffmpeg.
// RU: Записываем локальный пример, проверяем реальное состояние UI и кодируем кадры через ffmpeg.
const output = resolve('output/playwright/media-visuals');
const assets = resolve('docs/0.1.0/visuals');
await mkdir(assets, { recursive: true });
const server = spawn(process.execPath, ['scripts/serve-demo.mjs'], {
  env: { ...process.env, PORT: process.env.MEDIA_VISUAL_PORT ?? '5182' }, stdio: ['ignore', 'pipe', 'inherit'],
});
let browser;
const report = [];
try {
  const url = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Demo startup timed out')), 10000);
    server.once('error', error => { clearTimeout(timer); reject(error); });
    server.once('exit', code => { clearTimeout(timer); reject(new Error(`Demo exited ${code}`)); });
    server.stdout.on('data', data => {
      const match = String(data).match(/Demo: (http:\/\/127\.0\.0\.1:\d+)/);
      if (match) { clearTimeout(timer); resolve(match[1]); }
    });
  });
  browser = await chromium.launch({ headless: true,
    ...(process.env.BROWSER_EXECUTABLE_CHROMIUM ? { executablePath: process.env.BROWSER_EXECUTABLE_CHROMIUM } : {}),
  });
  for (const language of ['en', 'ru']) for (const scene of ['provider', 'image', 'boundary', 'hook']) {
    const name = `${scene}.${language}`;
    const directory = resolve(output, name);
    await mkdir(directory, { recursive: true });
    const page = await browser.newPage({ viewport: { width: 832, height: 800 }, deviceScaleFactor: 1 });
    const errors = [];
    page.on('pageerror', error => errors.push(String(error)));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(`${url}/visuals?scene=${scene}&lang=${language}`);
    await page.locator('main').waitFor();
    const frames = [];
    async function record(milliseconds) {
      const end = performance.now() + milliseconds;
      do {
        const filename = `${String(frames.length).padStart(4, '0')}.png`;
        const start = performance.now();
        await page.screenshot({ path: resolve(directory, filename) });
        await sleep(Math.max(0, 125 - (performance.now() - start)));
        frames.push(`file '${filename}'\nduration ${((performance.now() - start) / 1000).toFixed(3)}`);
      } while (performance.now() < end);
    }
    const click = action => page.locator(`[data-action="${action}"]`).click();
    async function metric(name, value) {
      await page.waitForFunction(({ name, value }) => document.querySelector(`[data-metric="${name}"]`)?.textContent === String(value), { name, value });
    }
    async function readyImages(count) {
      await page.waitForFunction(count => document.querySelectorAll('main img').length === count &&
        [...document.querySelectorAll('main img')].every(image => image.complete && image.naturalWidth > 0), count);
    }
    await record(650);
    if (scene === 'provider') {
      await click('mount'); await record(1600); await readyImages(2);
      await metric('loads', 1); await metric('owners', 2);
      const original = await page.locator('main img').first().getAttribute('src');
      assert.equal(await page.locator('main img').last().getAttribute('src'), original);
      await page.screenshot({ path: resolve(assets, `${name}.png`) });
      await click('left'); await metric('owners', 1); await record(800);
      await click('right'); await metric('owners', 0); await metric('idle', 1); await record(800);
      await click('mount'); await readyImages(2); await metric('loads', 1); await metric('owners', 2);
      assert.equal(await page.locator('main img').first().getAttribute('src'), original);
      await record(900);
      await click('account'); await record(1600); await readyImages(2); await metric('loads', 2);
      assert.notEqual(await page.locator('main img').first().getAttribute('src'), original);
      await record(650);
    } else if (scene === 'image') {
      await click('load'); await record(1600); await readyImages(1);
      assert.equal(await page.locator('[data-decoded]').getAttribute('data-decoded'), 'true');
      await metric('loads', 1); await page.screenshot({ path: resolve(assets, `${name}.png`) });
      await record(650); await click('clear'); await metric('owners', 0); await record(800);
      await click('load'); await readyImages(1); await metric('loads', 1); await record(900);
    } else if (scene === 'boundary') {
      await click('load'); await record(1600); await page.locator('[data-state="error"]').waitFor();
      await record(700); await click('retry'); await record(1600);
      await page.locator('[data-state="ready"]').waitFor(); await metric('loads', 2);
      const href = await page.locator('a[download]').getAttribute('href');
      assert.equal(await page.evaluate(async url => (await fetch(url)).text(), href), 'These notes are a local fixture.');
      await page.screenshot({ path: resolve(assets, `${name}.png`) }); await record(900);
    } else {
      await click('load'); await record(1600); await page.locator('[data-state="ready"]').waitFor();
      await readyImages(1); await metric('loads', 1);
      await page.screenshot({ path: resolve(assets, `${name}.png`) });
      await record(650); await click('fail'); await record(1600); await page.locator('[data-state="error"]').waitFor();
      await record(700); await click('clear'); await page.locator('[data-state="idle"]').waitFor(); await record(650);
      await click('load'); await page.locator('[data-state="ready"]').waitFor(); await metric('loads', 2); await record(800);
    }
    assert.deepEqual(errors, [], `${name} browser errors`);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight), true, `${name} capture must fit`);
    // EN: The static alternative also works when the viewer requests reduced motion.
    // RU: Статичный вариант доступен и при включённом уменьшении движения.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), true);
    await page.close();
    await writeFile(resolve(directory, 'frames.txt'), `${frames.join('\n')}\nfile '${String(frames.length - 1).padStart(4, '0')}.png'\n`);
    const gifPath = resolve(assets, `${name}.gif`);
    await new Promise((resolve, reject) => {
      const encoder = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', 'frames.txt',
        '-filter_complex', 'fps=8,split[a][b];[a]palettegen=max_colors=96:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=3',
        '-loop', '0', gifPath], { cwd: directory, stdio: 'inherit' });
      encoder.once('error', reject); encoder.once('exit', code => code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}`)));
    });
    const bytes = (await stat(resolve(assets, `${name}.gif`))).size;
    assert.ok(bytes <= 2_000_000, `${name} exceeds the 2 MB GIF budget`);
    report.push({ scene, language, frames: frames.length, gifBytes: bytes, uiAssertions: 'PASS' });
    console.log(`${name}: UI assertions PASS, ${frames.length} frames, ${bytes} bytes`);
  }
  await writeFile(resolve(output, 'results.json'), `${JSON.stringify({ browser: browser.version(), captures: report }, null, 2)}\n`);
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
