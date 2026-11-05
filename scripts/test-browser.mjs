import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { chromium, firefox } from 'playwright';

const server=spawn(process.execPath,['scripts/serve-demo.mjs'],{env:{...process.env,PORT:'0'},stdio:['ignore','pipe','inherit']});
const reports=[];
try {
  const url=await new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(new Error('Server startup timed out')),10000);
    server.once('error',error=>{clearTimeout(timer);reject(error);});
    server.once('exit',code=>{clearTimeout(timer);reject(new Error(`Server exited ${code}`));});
    server.stdout.on('data',data=>{const match=String(data).match(/Demo: (http:\/\/127\.0\.0\.1:\d+)/);if(match){clearTimeout(timer);resolve(match[1]);}});
  });
  await mkdir('output/playwright',{recursive:true});
  for(const [name,engine] of Object.entries({chromium,firefox})) {
    const executablePath=process.env[`BROWSER_EXECUTABLE_${name.toUpperCase()}`];
    const browser=await engine.launch({headless:true,...(executablePath?{executablePath}:{})});
    try {
      const page=await browser.newPage(); const errors=[];
      page.on('pageerror',error=>errors.push(String(error)));
      page.on('console',message=>{if(message.type()==='error') errors.push(message.text());});
      await page.goto(url);
      const gallery=page.getByRole('region',{name:'Profile and attachments'});
      await page.waitForFunction(()=>document.querySelectorAll('section[aria-label="Profile and attachments"] img').length===2);
      assert.equal(await gallery.locator('img').evaluateAll(images=>images[0].src===images[1].src),true);
      const attachment=page.getByRole('link',{name:'Download notes'});
      await attachment.waitFor();
      assert.equal(await page.evaluate(async url=>await (await fetch(url)).text(),await attachment.getAttribute('href')),'Downloadable attachment');
      await page.getByRole('button',{name:'Retry preview'}).click();
      await page.getByText('Preview decoded',{exact:true}).waitFor();
      await page.getByRole('button',{name:'Inspect image'}).click();
      await page.getByText('96 pixels wide',{exact:true}).waitFor();
      const search=page.getByRole('region',{name:'Search attachments'});
      await page.getByLabel('Filter attachments').fill('duplicate');
      await page.waitForFunction(()=>document.querySelectorAll('section[aria-label="Search attachments"] li').length===1);
      assert.match(await search.innerText(),/alice duplicate/);
      const previousUrl=await gallery.locator('img').first().getAttribute('src');
      await page.getByRole('button',{name:'Toggle failed image'}).click();
      await page.getByText('Image could not be loaded',{exact:true}).waitFor();
      await page.getByRole('button',{name:'Switch account'}).click();
      await page.waitForFunction(()=>document.querySelector('#app strong')?.textContent==='bob');
      assert.match(await search.innerText(),/bob duplicate/);
      assert.doesNotMatch(await search.innerText(),/alice/);
      assert.equal(await page.locator('#app img').evaluateAll((images,old)=>images.some(image=>image.src===old),previousUrl),false);
      await page.getByRole('button',{name:'Sign out'}).click();
      assert.equal(await page.locator('#app img').count(),0);
      await page.getByRole('button',{name:'Run lifecycle checks'}).click();
      await page.waitForFunction(()=>window.componentResult);
      const result=await page.evaluate(()=>window.componentResult);
      assert.equal(result.status,'PASS',JSON.stringify(result)); assert.deepEqual(errors,[]);
      // EN: A decoder failure must offer display retry without silently invalidating shared media.
      // RU: Ошибка декодера должна давать повтор отображения без скрытой инвалидации общего медиа.
      let imageLoads = 0;
      await page.route(/\/api\/accounts\/alice\/media\/landscape%3Av1/, route => {
        imageLoads++; return route.fulfill({ status: 200, contentType: 'image/png', body: 'not a valid PNG' });
      });
      await page.goto(`${url}/starter`);
      await page.getByRole('button', { name: 'Show attachments', exact: true }).click();
      await page.waitForFunction(() => [...document.querySelectorAll('button')].filter(button => button.textContent === 'Retry display').length === 2);
      await page.getByRole('button', { name: 'Retry display', exact: true }).first().click();
      await page.waitForFunction(() => [...document.querySelectorAll('button')].filter(button => button.textContent === 'Retry display').length === 2);
      assert.equal(imageLoads, 1);
      await page.getByRole('button', { name: 'Switch account', exact: true }).click();
      await page.waitForFunction(() => document.querySelectorAll('main img').length === 2 && [...document.querySelectorAll('main img')].every(image => image.complete && image.naturalWidth > 0));
      assert.equal(await page.getByRole('button', { name: 'Retry display', exact: true }).count(), 0);
      await page.waitForFunction(() => document.querySelector('audio')?.readyState >= 1);
      // EN: Exercise decoding/playback cleanup without requiring an audio device or native-control geometry.
      // RU: Проверяем декодирование и остановку без зависимости от аудиоустройства и геометрии controls.
      await page.locator('audio').evaluate(async player => { player.muted = true; await player.play(); });
      await page.waitForFunction(() => document.querySelector('audio')?.currentTime > 0);
      const detachedPlayer = await page.locator('audio').elementHandle();
      await page.getByRole('button', { name: 'Hide attachments', exact: true }).click();
      await page.waitForFunction(() => document.querySelector('[data-owners]')?.textContent === '0');
      assert.equal(await detachedPlayer.evaluate(player => player.paused && !player.hasAttribute('src')), true);
      await detachedPlayer.dispose();
      assert.deepEqual(errors, []);
      await page.screenshot({path:`output/playwright/${name}.png`,fullPage:true});
      reports.push({browser:name,version:browser.version(),result,
        examples:{searchFilter:'PASS',immediateAccountReplacement:'PASS',explicitRetry:'PASS',imageRefAndNativeLoad:'PASS',readyPreviewDecodeRecovery:'PASS'},errors});
      console.log(`${name} ${browser.version()}: ${result.scenarios.length} lifecycle scenarios PASS, ${result.created}/${result.revoked} URLs`);
    } finally { await browser.close(); }
  }
  await writeFile('output/playwright/results.json',JSON.stringify({timestamp:new Date().toISOString(),reports},null,2)+'\n');
} finally { server.kill('SIGTERM'); }
