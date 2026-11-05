import { useEffect, useState } from 'react';
import type { MediaCache } from '@59alex/browser-media-cache';
import { CachedImage, MediaBoundary, MediaCacheProvider, useCachedMedia } from '@59alex/browser-media-cache-react';

export type VisualScene = 'provider' | 'image' | 'boundary' | 'hook';
export type VisualLanguage = 'en' | 'ru';

const messages = {
  en: {
    fixture: 'Interactive fixture · real React components',
    provider: 'One resource. Two owners.', image: 'From idle to decoded image.',
    boundary: 'A failed load can be retried.', hook: 'Your UI, the same lifecycle.',
    providerInfo: 'Same cache + namespace + key share one loader call and one object URL.',
    imageInfo: 'The component renders your fallbacks, then a native image.',
    boundaryInfo: 'Render a download link only while this consumer owns the resource.',
    hookInfo: 'Render idle, loading, ready and error explicitly in your own component.',
    loads: 'Loader calls', owners: 'Active owners', idleEntries: 'Idle entries',
    idle: 'No media selected', loading: 'Loading media…', ready: 'Ready',
    failure: 'Fixture load failed', removed: 'Consumer unmounted',
    mount: 'Show both', left: 'Hide left', right: 'Hide right', account: 'Switch account',
    load: 'Load media', clear: 'Clear selection', retry: 'Retry load', fail: 'Load missing media',
    profile: 'Profile', attachment: 'Attachment', download: 'Download notes',
    decoded: 'Native image decoded', bytes: 'bytes',
    footnote: 'Local Blob fixture · 1.2 s delay · no network or persistence',
  },
  ru: {
    fixture: 'Интерактивный пример · настоящие React-компоненты',
    provider: 'Один ресурс. Два владельца.', image: 'От ожидания до изображения.',
    boundary: 'Повтор после ошибки загрузки.', hook: 'Ваш UI, тот же жизненный цикл.',
    providerInfo: 'Общие cache + namespace + key дают один вызов загрузки и один object URL.',
    imageInfo: 'Компонент выводит ваши заглушки, затем обычное изображение.',
    boundaryInfo: 'Ссылка доступна, пока этот потребитель владеет ресурсом.',
    hookInfo: 'Отобразите idle, loading, ready и error в собственном компоненте.',
    loads: 'Вызовы загрузки', owners: 'Владельцы', idleEntries: 'Записи без владельцев',
    idle: 'Медиа не выбрано', loading: 'Загрузка медиа…', ready: 'Готово',
    failure: 'Ошибка тестовой загрузки', removed: 'Потребитель размонтирован',
    mount: 'Показать оба', left: 'Скрыть слева', right: 'Скрыть справа', account: 'Сменить аккаунт',
    load: 'Загрузить медиа', clear: 'Снять выбор', retry: 'Повторить загрузку', fail: 'Загрузить отсутствующее',
    profile: 'Профиль', attachment: 'Вложение', download: 'Скачать заметки',
    decoded: 'Браузер декодировал изображение', bytes: 'байт',
    footnote: 'Локальный Blob · задержка 1,2 с · без сети и постоянного хранилища',
  },
} as const;
type Text = typeof messages[VisualLanguage];

function Placeholder({ status, text }: { status: string; text: string }) {
  return <div className={`placeholder ${status}`} data-state={status} role="status">
    <span className="state-mark" aria-hidden="true" />{text}
  </div>;
}

// EN: Custom UI consumes the actual hook result; it never copies an object URL into state.
// RU: Свой UI использует результат hook; object URL не копируется в состояние.
function HookPreview({ mediaKey, text }: { mediaKey: string | null; text: Text }) {
  const state = useCachedMedia(mediaKey);
  if (state.status !== 'ready') return <Placeholder status={state.status}
    text={state.status === 'error' ? text.failure : text[state.status]} />;
  return <div className="hook-ready" data-state="ready">
    <img src={state.resource.url} width={160} height={100} alt={text.attachment} />
    <div><strong>{text.ready}</strong><p>{state.resource.blob.type}</p>
      <p>{state.resource.blob.size} {text.bytes}</p><code>state.status = ready</code></div>
  </div>;
}

// EN: Diagnostic sampling belongs only to this example, not to the adapter's runtime.
// RU: Периодическое чтение диагностики есть только в примере, а не в runtime адаптера.
function Diagnostics({ cache, loadCount, text }: { cache: MediaCache; loadCount: () => number; text: Text }) {
  const [snapshot, setSnapshot] = useState(() => ({ ...cache.inspect(), loads: loadCount() }));
  useEffect(() => {
    const timer = setInterval(() => setSnapshot({ ...cache.inspect(), loads: loadCount() }), 100);
    return () => clearInterval(timer);
  }, [cache, loadCount]);
  return <dl className="metrics">
    <div><dt>{text.loads}</dt><dd data-metric="loads">{snapshot.loads}</dd></div>
    <div><dt>{text.owners}</dt><dd data-metric="owners">{snapshot.activeHandles}</dd></div>
    <div><dt>{text.idleEntries}</dt><dd data-metric="idle">{snapshot.idleEntries}</dd></div>
  </dl>;
}

// EN: Mount this example with a stable application-owned cache; the fixture is in demo/visuals.jsx.
// RU: Передайте стабильный кэш приложения; тестовый загрузчик находится в demo/visuals.jsx.
export function VisualGuide({ cache, loadCount, scene, language = 'en' }: {
  cache: MediaCache; loadCount: () => number; scene: VisualScene; language?: VisualLanguage;
}) {
  const text = messages[language];
  const [account, setAccount] = useState('alice');
  const [left, setLeft] = useState(false);
  const [right, setRight] = useState(false);
  const [mediaKey, setMediaKey] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [decoded, setDecoded] = useState(false);
  const idle = <Placeholder status="idle" text={text.idle} />;
  const loading = <Placeholder status="loading" text={text.loading} />;
  const error = <Placeholder status="error" text={text.failure} />;
  const names = { provider: 'MediaCacheProvider', image: 'CachedImage', boundary: 'MediaBoundary', hook: 'useCachedMedia' };
  return <main>
    <header><p className="eyebrow">{text.fixture}</p><code>{names[scene]}</code>
      <h1>{text[scene]}</h1><p>{text[`${scene}Info`]}</p></header>
    <Diagnostics cache={cache} loadCount={loadCount} text={text} />
    <MediaCacheProvider cache={cache} namespace={account}>
      {scene === 'provider' ? <>
        <div className="scope"><code>namespace: {account}</code><code>mediaKey: landscape:v1</code></div>
        <div className="previews">
          {[{ shown: left, name: text.profile }, { shown: right, name: text.attachment }].map((item, index) =>
            <section className="preview" key={index}><h2>{item.name}</h2>
              {item.shown ? <CachedImage mediaKey="landscape:v1" alt={item.name} width={300} height={180}
                loadingFallback={loading} errorFallback={error} />
                : <Placeholder status="unmounted" text={text.removed} />}</section>)}
        </div>
        <div className="controls">
          <button data-action="mount" onClick={() => { setLeft(true); setRight(true); }}>{text.mount}</button>
          <button data-action="left" disabled={!left} onClick={() => setLeft(false)}>{text.left}</button>
          <button data-action="right" disabled={!right} onClick={() => setRight(false)}>{text.right}</button>
          <button data-action="account" onClick={() => setAccount(value => value === 'alice' ? 'bob' : 'alice')}>{text.account}</button>
        </div>
      </> : <>
        <section className="single-preview">
          {scene === 'image' && <><CachedImage mediaKey={mediaKey} alt={text.attachment} width={480} height={240}
            idleFallback={idle} loadingFallback={loading} errorFallback={error}
            onLoad={() => setDecoded(true)} />
            <p className="decode" data-decoded={decoded}>{decoded ? text.decoded : 'CachedImage → img'}</p></>}
          {scene === 'boundary' && <MediaBoundary key={attempt} mediaKey={mediaKey}
            idleFallback={idle} loadingFallback={loading}
            errorFallback={() => <div className="retry-panel">{error}
              {/* EN: A React key remount retries this consumer without invalidating other owners. */}
              {/* RU: Новый React key повторяет загрузку для этого потребителя, не инвалидируя остальных. */}
              <button data-action="retry" onClick={() => setAttempt(value => value + 1)}>{text.retry}</button>
            </div>}>
            {resource => <div className="download" data-state="ready"><span className="file-icon" aria-hidden="true">TXT</span>
              <a href={resource.url} download="notes.txt">{text.download}</a>
              <p>{resource.blob.size} {text.bytes} · text/plain</p></div>}
          </MediaBoundary>}
          {scene === 'hook' && <HookPreview mediaKey={mediaKey} text={text} />}
        </section>
        <div className="controls">
          <button data-action="load" onClick={() => {
            const selected = scene === 'boundary' ? 'notes:v1' : 'landscape:v1';
            if (mediaKey !== selected) setDecoded(false);
            setMediaKey(selected);
          }}>{text.load}</button>
          <button data-action="clear" onClick={() => { setDecoded(false); setMediaKey(null); }}>{text.clear}</button>
          {scene === 'hook' && <button data-action="fail" onClick={() => setMediaKey('missing')}>{text.fail}</button>}
        </div>
      </>}
    </MediaCacheProvider>
    <footer>{text.footnote}</footer>
  </main>;
}
