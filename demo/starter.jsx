import React, { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AttachmentGallery, createAttachmentMediaCache } from '../examples/AttachmentGallery.js';

const cache = createAttachmentMediaCache();
const ru = new URLSearchParams(location.search).get('lang') === 'ru';
document.documentElement.lang = ru ? 'ru' : 'en';
function App() {
  const [visible, setVisible] = useState(false);
  const [account, setAccount] = useState('alice');
  const [stats, setStats] = useState(() => cache.inspect());
  // EN: Only this demonstration polls diagnostics; the library does not add a polling loop.
  // RU: Диагностику опрашивает только демо; библиотека не добавляет цикл опроса.
  useEffect(() => { const timer = setInterval(() => setStats(cache.inspect()), 100); return () => clearInterval(timer); }, []);
  return <main>
    <p className="eyebrow">MediaGallery + MediaPreview</p>
    <h1>{ru ? 'Вложения, готовые к просмотру' : 'Attachments ready to explore'}</h1>
    <p>{ru ? 'Готовая галерея: отмените загрузку, повторите попытку, включите аудио.' : 'A ready gallery: cancel a load, retry an error, play an audio attachment.'}</p>
    <div className="controls">
      <button data-action="show" onClick={() => setVisible(value => !value)}>{visible ? (ru ? 'Скрыть вложения' : 'Hide attachments') : (ru ? 'Показать вложения' : 'Show attachments')}</button>
      <button data-action="account" onClick={() => setAccount(value => value === 'alice' ? 'bob' : 'alice')}>{ru ? 'Сменить аккаунт' : 'Switch account'}</button>
      <code data-account>{account}</code>
    </div>
    <p className="diagnostics"><span data-owners>{stats.activeHandles}</span> {ru ? 'владельцев' : 'owners'} · <span data-idle>{stats.idleEntries}</span> {ru ? 'записей без владельцев' : 'idle entries'}</p>
    <section aria-label={ru ? 'Вложения' : 'Attachments'}>
      {visible ? <AttachmentGallery cache={cache} accountId={account} language={ru ? 'ru' : 'en'} />
        : <p className="empty">{ru ? 'Медиа загрузится при показе вложений.' : 'Media loads when you show the attachments.'}</p>}
    </section>
    <footer>{ru ? 'Локальный HTTP fixture: задержка 1,2 с, первая загрузка изображения — 503. Аудио — тестовый WAV.' : 'Local HTTP fixture: 1.2 s delay, first image load returns 503. Audio is a test WAV.'}</footer>
  </main>;
}
const root = createRoot(document.querySelector('#app'));
root.render(<StrictMode><App /></StrictMode>);
window.addEventListener('pagehide', () => { root.unmount(); cache.dispose(); }, { once: true });
