import React from 'react';
import { createRoot } from 'react-dom/client';
import { MediaCache } from '@59alex/browser-media-cache';
import { VisualGuide } from '../examples/VisualGuide.js';

// EN: Controlled local fixtures make loading and retry visible; this is not an HTTP backend.
// RU: Локальные данные делают загрузку и повтор наглядными; это не HTTP-бэкенд.
const query = new URLSearchParams(location.search);
const scene = ['provider', 'image', 'boundary', 'hook'].includes(query.get('scene')) ? query.get('scene') : 'provider';
const language = query.get('lang') === 'ru' ? 'ru' : 'en';
document.documentElement.lang = language;
let loads = 0;
let noteFailed = false;
const cache = new MediaCache({ idleTtlMs: 60_000, maxEntries: 8, load: async ({ namespace, key, signal }) => {
  loads++;
  await new Promise(resolve => setTimeout(resolve, 1200));
  signal.throwIfAborted();
  if (key === 'missing') throw new Error('Fixture: missing media');
  if (key === 'notes:v1') {
    if (!noteFailed) { noteFailed = true; throw new Error('Fixture: transient load failure'); }
    return new Blob(['These notes are a local fixture.'], { type: 'text/plain' });
  }
  const color = namespace === 'alice' ? '#3b746d' : '#5766a8';
  return new Blob([`<svg xmlns="http://www.w3.org/2000/svg" width="480" height="240" viewBox="0 0 480 240">
    <rect width="480" height="240" fill="#e3edf0"/><circle cx="370" cy="65" r="30" fill="#efc880"/>
    <path d="M0 240V165L140 55 270 195 365 115 480 200V240Z" fill="${color}"/>
    <path d="M0 240V205L115 155 220 225 335 180 480 225V240Z" fill="#234a49"/>
    <text x="24" y="35" fill="#172b35" font-family="sans-serif" font-size="20">${namespace} / landscape:v1</text></svg>`], { type: 'image/svg+xml' });
} });
// EN: The application owns the cache; provider unmount alone does not dispose it.
// RU: Кэшем владеет приложение; размонтирование provider само по себе не вызывает dispose.
const root = createRoot(document.querySelector('#app'));
root.render(<VisualGuide cache={cache} loadCount={() => loads} scene={scene} language={language} />);
window.addEventListener('pagehide', () => { root.unmount(); cache.dispose(); }, { once: true });
