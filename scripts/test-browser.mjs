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
      await page.waitForFunction(()=>document.querySelectorAll('#app img').length===2);
      assert.equal(await page.locator('#app img').evaluateAll(images=>images[0].src===images[1].src),true);
      const attachment=page.getByRole('link',{name:'Download notes'});
      await attachment.waitFor();
      assert.equal(await page.evaluate(async url=>await (await fetch(url)).text(),await attachment.getAttribute('href')),'Downloadable attachment');
      await page.getByRole('button',{name:'Toggle failed image'}).click();
      await page.getByText('Image could not be loaded',{exact:true}).waitFor();
      await page.getByRole('button',{name:'Switch account'}).click();
      await page.waitForFunction(()=>document.querySelector('#app strong')?.textContent==='bob');
      await page.getByRole('button',{name:'Sign out'}).click();
      assert.equal(await page.locator('#app img').count(),0);
      await page.getByRole('button',{name:'Run lifecycle checks'}).click();
      await page.waitForFunction(()=>window.componentResult);
      const result=await page.evaluate(()=>window.componentResult);
      assert.equal(result.status,'PASS',JSON.stringify(result)); assert.deepEqual(errors,[]);
      await page.screenshot({path:`output/playwright/${name}.png`,fullPage:true});
      reports.push({browser:name,version:browser.version(),result,errors});
      console.log(`${name} ${browser.version()}: ${result.scenarios.length} lifecycle scenarios PASS, ${result.created}/${result.revoked} URLs`);
    } finally { await browser.close(); }
  }
  await writeFile('output/playwright/results.json',JSON.stringify({timestamp:new Date().toISOString(),reports},null,2)+'\n');
} finally { server.kill('SIGTERM'); }
