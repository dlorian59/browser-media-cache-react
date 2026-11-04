import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement as h } from 'react';
import { renderToString } from 'react-dom/server';
import { MediaCache } from '@59alex/browser-media-cache';
import { MediaCacheProvider, CachedImage, MediaBoundary } from '../dist/index.js';

test('SSR renders loading/idle without loading, acquiring or disposing caller cache', () => {
  let loads = 0;
  const cache = new MediaCache({ load: async () => { loads++; throw new Error('SSR must not load'); } });
  const html = renderToString(h(MediaCacheProvider, { cache, namespace: 'ssr' },
    h(CachedImage, { mediaKey: 'avatar', alt: 'Portrait', loadingFallback: h('span', null, 'Waiting') }),
    h(MediaBoundary, { mediaKey: null, idleFallback: h('span', null, 'Disabled'), children: () => assert.fail() })));
  assert.match(html, /Waiting/); assert.match(html, /Disabled/);
  assert.equal(loads, 0); assert.equal(cache.inspect().activeHandles, 0);
  assert.equal(cache.inspect().disposed, false); cache.dispose();
});

test('missing provider fails explicitly, including on the server', () => {
  assert.throws(() => renderToString(h(CachedImage, { mediaKey: 'avatar', alt: '' })), /requires MediaCacheProvider/);
});
