import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join, dirname } from 'node:path';
import assert from 'node:assert/strict';

const root=process.cwd(); const temp=mkdtempSync(join(tmpdir(),'media-react-consumer-'));
const run=(args,cwd=root)=>execFileSync('npm',args,{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe']});
try {
  const pack=cwd=>JSON.parse(run(['pack','--ignore-scripts','--json','--pack-destination',temp],cwd))[0];
  const core=pack(resolve('node_modules/@59alex/browser-media-cache'));
  const adapter=pack(root);
  assert.ok(adapter.files.every(file=>!/^node_modules\/|^demo\/|^scripts\/|^test\/|^output\//.test(file.path)));
  const consumer=join(temp,'consumer');mkdirSync(consumer);
  writeFileSync(join(consumer,'package.json'),JSON.stringify({private:true,type:'module'}));
  // Use local React artifacts too, so no registry release or cache metadata is required.
  const react=pack(resolve('node_modules/react')); const dom=pack(resolve('node_modules/react-dom')); const scheduler=pack(resolve('node_modules/scheduler'));
  run(['install','--ignore-scripts','--legacy-peer-deps','--no-audit','--no-fund',
    ...[core,adapter,react,dom,scheduler].map(value=>join(temp,value.filename))],consumer);
  const metadata=JSON.parse(readFileSync(join(consumer,'node_modules/@59alex/browser-media-cache-react/package.json'),'utf8'));
  assert.equal(metadata.peerDependencies['@59alex/browser-media-cache'],'^0.1.0');
  assert.ok(!JSON.stringify(metadata).includes('file:'));
  const installed=join(consumer,'node_modules/@59alex/browser-media-cache-react');
  assert.match(readFileSync(join(installed,'dist/index.js'),'utf8'),/^['"]use client['"];?/);
  let links=0;
  for(const file of adapter.files.filter(file=>file.path.endsWith('.md'))) {
    const markdown=readFileSync(join(installed,file.path),'utf8');
    for(const [,href] of markdown.matchAll(/\]\(([^)]+)\)/g)) {
      if(/^[a-z][a-z\d+.-]*:/i.test(href)) continue;
      const [path,fragment]=href.split('#');
      const target=path?resolve(installed,dirname(file.path),decodeURIComponent(path)):join(installed,file.path);
      const contents=readFileSync(target,'utf8');
      if(fragment && target.endsWith('.md')) {
        const headings=[...contents.matchAll(/^#{1,6}\s+(.+?)\s*#*$/gm)].map(([,heading])=>heading.toLowerCase().replace(/[^\p{L}\p{N}_\- ]/gu,'').replaceAll(' ','-'));
        assert.ok(headings.includes(decodeURIComponent(fragment)),`${file.path}: missing anchor ${href}`);
      }
      links++;
    }
  }
  console.log(`Packed guides: ${links} relative links/anchors resolve; use client directive retained.`);
  writeFileSync(join(consumer,'smoke.mjs'),`
import assert from 'node:assert/strict';
import { createElement as h } from 'react';
import { renderToString } from 'react-dom/server';
import { MediaCache } from '@59alex/browser-media-cache';
import { MediaCacheProvider, CachedImage } from '@59alex/browser-media-cache-react';
const cache=new MediaCache({load:async()=>{throw new Error('SSR load');}});
assert.match(renderToString(h(MediaCacheProvider,{cache,namespace:'consumer'},h(CachedImage,{mediaKey:'a',alt:'A',loadingFallback:'Loading'}))),/Loading/);
assert.equal(cache.inspect().activeHandles,0);cache.dispose();
`);
  execFileSync(process.execPath,['smoke.mjs'],{cwd:consumer,stdio:'inherit'});
  mkdirSync(join(consumer,'node_modules/@types'),{recursive:true});
  symlinkSync(resolve('node_modules/@types/react'),join(consumer,'node_modules/@types/react'));
  symlinkSync(resolve('node_modules/csstype'),join(consumer,'node_modules/csstype'));
  writeFileSync(join(consumer,'consumer.tsx'),`
import { MediaCache } from '@59alex/browser-media-cache';
import { CachedImage, MediaBoundary, MediaCacheProvider, MediaGallery, MediaPreview } from '@59alex/browser-media-cache-react';
import { AttachmentGallery, createAttachmentMediaCache } from './node_modules/@59alex/browser-media-cache-react/examples/AttachmentGallery.js';
const cache=new MediaCache({load:async()=>new Blob()});
const tree=<MediaCacheProvider cache={cache} namespace="account"><CachedImage mediaKey="avatar" alt="Portrait" width={32}/><MediaBoundary mediaKey={null}>{resource=><a href={resource.url}>Download</a>}</MediaBoundary></MediaCacheProvider>;
// @ts-expect-error alt is required
const missingAlt=<CachedImage mediaKey="avatar"/>;
// @ts-expect-error src cannot bypass cache ownership
const foreignSource=<CachedImage mediaKey="avatar" alt="A" src="https://example.test/a"/>;
void [tree,missingAlt,foreignSource];
const httpCache=createAttachmentMediaCache();
const copiedExample=<AttachmentGallery cache={httpCache} accountId="account" language="ru"/>;
const readyUi=<MediaCacheProvider cache={httpCache} namespace="account"><MediaGallery items={[{id:'photo',mediaKey:'photo:v1',alt:'Photo'}]}/><MediaPreview mediaKey="audio:v1" alt="Audio" kind="audio"/></MediaCacheProvider>;
void [copiedExample,readyUi];
`);
  execFileSync(resolve('node_modules/.bin/tsc'),['--noEmit','--strict','--module','NodeNext','--target','ES2022','--jsx','react-jsx','--lib','ES2022,DOM','consumer.tsx'],{cwd:consumer,stdio:'inherit'});
  console.log(`Clean artifact consumer: SSR, strict types, required alt, forbidden src passed (${adapter.files.length} files).`);
} finally {rmSync(temp,{recursive:true,force:true});}
