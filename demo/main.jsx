import React, { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { MediaCache } from '@59alex/browser-media-cache';
import { MediaCacheProvider, CachedImage, MediaBoundary } from '../dist/index.js';
import { Gallery } from '../examples/Gallery.js';
import { SearchableGallery } from '../examples/SearchableGallery.js';
import { ImageStates } from '../examples/ImageStates.js';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const fixture = namespace => new Blob([`<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" fill="${namespace === 'alice' ? '#367b8a' : '#765ab5'}"/><text x="12" y="54" fill="white">${namespace}</text></svg>`], { type: 'image/svg+xml' });
let loads = 0;
const failedOnce = new Set();
const searchItems = Object.fromEntries(['alice', 'bob'].map(account => [account, [
  { id: 'original', mediaKey: 'avatar:v1', label: `${account} original` },
  { id: 'duplicate', mediaKey: 'avatar:v1', label: `${account} duplicate` },
]]));
// EN: The application creates and owns this cache outside React rendering.
// RU: Приложение создаёт этот кэш и владеет им вне React render.
const cache = new MediaCache({ load: async ({namespace,key,signal}) => {
  loads++; await sleep(40); signal.throwIfAborted();
  if (key === 'missing') throw new Error('Synthetic missing image');
  if (key === 'retry-once' && !failedOnce.has(namespace)) {
    failedOnce.add(namespace);
    throw new Error('Synthetic transient failure');
  }
  return key === 'notes:v1' ? new Blob(['Downloadable attachment'], {type:'text/plain'}) : fixture(namespace);
}, maxEntries: 0 });

function App() {
  const [account, setAccount] = useState('alice');
  const [failure, setFailure] = useState(false);
  const [report, setReport] = useState('');
  async function logout() {
    // EN: Remove consumers before invalidating the old account; the provider never disposes the cache.
    // RU: Уберите потребителей перед инвалидацией аккаунта; provider не вызывает dispose кэша.
    const previous = account; flushSync(() => setAccount(null));
    if (previous) await cache.invalidateNamespace(previous);
    setReport(JSON.stringify({loads,...cache.inspect()}, null, 2));
  }
  return <><p>Account: <strong>{account ?? 'signed out'}</strong></p>
    <button onClick={() => setAccount(account === 'alice' ? 'bob' : 'alice')}>Switch account</button>
    <button onClick={() => setFailure(value => !value)}>Toggle failed image</button>
    <button onClick={logout}>Sign out</button>
    {account && <><Gallery cache={cache} accountId={account}/>
      {/* EN: Only the search text is deferred; account scope and its collection update immediately. */}
      {/* RU: Откладывается только текст поиска; область аккаунта и его список обновляются сразу. */}
      <SearchableGallery cache={cache} namespace={account} items={searchItems[account]} />
      <section aria-label="Image state examples"><MediaCacheProvider cache={cache} namespace={account}>
        <ImageStates mediaKey="retry-once" />
      </MediaCacheProvider></section>
      {failure && <MediaCacheProvider cache={cache} namespace={account}>
        <CachedImage mediaKey="missing" alt="Missing attachment" loadingFallback={<span role="status">Loading…</span>}
          errorFallback={<span role="status">Image could not be loaded</span>}/>
      </MediaCacheProvider>}</>}
    <button onClick={() => setReport(JSON.stringify({loads,...cache.inspect()}, null, 2))}>Inspect cache</button>
    <pre>{report}</pre></>;
}
const appRoot = createRoot(document.querySelector('#app'));
appRoot.render(<StrictMode><App/></StrictMode>);

export async function runChecks() {
  let calls = 0, created = 0, revoked = 0, finishOld;
  const urls = new Set();
  const instance = new MediaCache({ maxEntries: 0, objectUrls: {
    create(blob) { const url=URL.createObjectURL(blob); urls.add(url); created++; return url; },
    revoke(url) { assert(urls.delete(url), 'URL revoked once'); URL.revokeObjectURL(url); revoked++; },
  }, load: async ({namespace,key}) => {
    calls++;
    if (key === 'missing') throw new Error('missing');
    if (key === 'delayed') return new Promise(resolve => { finishOld = resolve; });
    return fixture(namespace);
  } });
  const host=document.querySelector('#lab'); const root=createRoot(host);
  const render = (namespace, mediaKey, count=2) => flushSync(() => root.render(<StrictMode>
    <MediaCacheProvider cache={instance} namespace={namespace}>
      {Array.from({length:count}, (_,index) => <CachedImage key={index} mediaKey={mediaKey} alt={`Preview ${index}`}
        data-preview={index} loadingFallback={<span data-loading>Loading</span>}
        errorFallback={<span data-error>Error</span>} idleFallback={<span data-idle>Idle</span>}/>)}
    </MediaCacheProvider></StrictMode>));
  const ready = async (count=2) => {
    for(let i=0;i<200 && host.querySelectorAll('img').length!==count;i++) await sleep(5);
    assert(host.querySelectorAll('img').length===count,'Images became ready');
    await Promise.all([...host.querySelectorAll('img')].map(image=>image.decode()));
  };
  try {
    // EN: StrictMode must preserve deduplication and release only the removed consumer.
    // RU: StrictMode должен сохранять общую загрузку и освобождать только удалённого потребителя.
    render('alice','avatar'); await ready();
    assert(calls===1 && instance.inspect().activeHandles===2,'One load for two owners');
    const shared=host.querySelector('img').src;
    render('alice','avatar',1); assert(instance.inspect().activeHandles===1 && urls.has(shared),'One owner survives');
    render('bob','avatar'); assert(!host.querySelector('img'),'Old account hidden synchronously'); await ready();
    assert(host.querySelector('img').src!==shared && !urls.has(shared),'Account replacement released old URL');
    await instance.invalidateNamespace('bob'); await sleep(0);
    assert(!host.querySelector('img') && urls.size===0,'Logout removes revoked images');
    render('alice','missing'); await sleep(10);
    assert(host.querySelectorAll('[data-error]').length===2,'Load failure renders error slot');
    render('alice',null); assert(host.querySelectorAll('[data-idle]').length===2,'Null disables acquisition');
    render('alice','delayed'); await sleep(0);
    render('bob','avatar'); await ready(); const current=host.querySelector('img').src;
    finishOld(fixture('alice')); await sleep(0);
    assert(host.querySelector('img').src===current,'Late old result cannot replace current account');
  } finally { flushSync(()=>root.unmount()); }
  assert(!instance.inspect().disposed && instance.inspect().activeHandles===0 && urls.size===0,'Provider preserves caller cache and releases handles');
  const reuse=instance.acquire({namespace:'after-unmount',key:'reuse'}); await reuse.ready; reuse.release();
  instance.dispose(); assert(created===revoked,'All owned URLs revoked');
  return { status:'PASS', calls, created, revoked, activeHandles:instance.inspect().activeHandles,
    scenarios:['StrictMode sharing','partial unmount','account switch','logout','error/idle slots','late completion','caller-owned cache reuse'] };
}
document.querySelector('#checks').onclick=async event=>{
  event.target.disabled=true;
  try { window.componentResult=await runChecks(); }
  catch(error) { window.componentResult={status:'FAIL',error:String(error),stack:error.stack}; }
  finally { document.querySelector('#result').textContent=JSON.stringify(window.componentResult,null,2); event.target.disabled=false; }
};
window.runComponentChecks=runChecks;
window.addEventListener('pagehide',()=>{appRoot.unmount();cache.dispose();},{once:true});
