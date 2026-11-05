import { useCallback, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { useCachedMedia } from './index.js';
import { useMediaScope } from './context.js';

export type MediaKind = 'image' | 'audio' | 'video';
export type MediaLanguage = 'en' | 'ru';
export interface MediaPreviewProps {
  readonly mediaKey: string | null;
  /** Meaningful description; also labels native audio/video controls. */
  readonly alt: string;
  readonly kind?: MediaKind;
  readonly language?: MediaLanguage;
  readonly className?: string;
  readonly style?: CSSProperties;
}
export interface MediaGalleryItem {
  readonly id: string;
  readonly mediaKey: string | null;
  readonly alt: string;
  readonly title?: string;
  readonly kind?: MediaKind;
}
export interface MediaGalleryProps {
  readonly items: readonly MediaGalleryItem[];
  readonly language?: MediaLanguage;
  readonly className?: string;
  readonly style?: CSSProperties;
}

const labels = {
  en: { idle: 'No media selected', loading: 'Loading media…', error: 'Media could not be loaded',
    decode: 'This media could not be displayed', retry: 'Retry', cancel: 'Cancel', cancelled: 'Loading cancelled',
    resume: 'Load again', empty: 'No attachments', retryDisplay: 'Retry display' },
  ru: { idle: 'Медиа не выбрано', loading: 'Загрузка медиа…', error: 'Не удалось загрузить медиа',
    decode: 'Не удалось отобразить медиа', retry: 'Повторить', cancel: 'Отменить', cancelled: 'Загрузка отменена',
    resume: 'Загрузить снова', empty: 'Вложений нет', retryDisplay: 'Повторить отображение' },
};
const surface: CSSProperties = { minHeight: 170, border: '1px solid #d6e1e5', borderRadius: 10,
  overflow: 'hidden', background: '#f6f9fa', color: '#25323e', display: 'grid', alignContent: 'center',
  justifyItems: 'center', gap: 12, padding: 14, font: 'inherit' };
const button: CSSProperties = { minHeight: 40, padding: '8px 16px', borderRadius: 7, border: '1px solid #a5bbb6',
  background: '#fff', color: '#24594f', font: 'inherit', cursor: 'pointer' };

function Status({ status, text, action }: { status: string; text: string; action?: ReactNode }) {
  return <div data-media-state={status} style={{ display: 'grid', gap: 14, justifyItems: 'center', padding: 12 }}>
    <span role="status">{text}</span>{action}
  </div>;
}

function PreviewAttempt({ mediaKey, alt, kind, language, retry, cancel }: {
  mediaKey: string; alt: string; kind: MediaKind; language: MediaLanguage; retry: () => void; cancel: () => void;
}) {
  const state = useCachedMedia(mediaKey);
  const [decodeFailed, setDecodeFailed] = useState(false);
  const player = useRef<HTMLMediaElement | null>(null);
  const readyUrl = state.status === 'ready' ? state.resource.url : undefined;
  const playerRef = useCallback((node: HTMLMediaElement | null) => {
    if (player.current && player.current !== node) {
      player.current.pause();
      player.current.removeAttribute('src');
      player.current.load();
    }
    player.current = node;
    // EN: Reattach safely after a StrictMode ref cleanup without restarting an unchanged player.
    // RU: После StrictMode-очистки ref подключаем заново, не перезапуская неизменённый плеер.
    if (node && readyUrl && node.getAttribute('src') !== readyUrl) node.src = readyUrl;
  }, [readyUrl]);
  const text = labels[language];
  if (state.status === 'loading' || state.status === 'idle') return <Status status="loading" text={text.loading}
    action={<button type="button" style={button} onClick={cancel}>{text.cancel}</button>} />;
  if (state.status === 'error' || decodeFailed) return <Status status="error" text={decodeFailed ? text.decode : text.error}
    action={<button type="button" style={button} onClick={retry}>{decodeFailed ? text.retryDisplay : text.retry}</button>} />;
  const mediaStyle: CSSProperties = { display: 'block', width: '100%', maxHeight: 240, objectFit: 'contain', borderRadius: 6 };
  const props = { src: state.resource.url, onError: () => setDecodeFailed(true), style: mediaStyle, 'data-media-state': 'ready' };
  if (kind === 'audio') return <audio {...props} ref={playerRef} controls preload="metadata" aria-label={alt} />;
  if (kind === 'video') return <video {...props} ref={playerRef} controls preload="metadata" playsInline aria-label={alt} />;
  return <img {...props} alt={alt} />;
}

/** Ready-to-use finite media preview. Retry remounts only this owner; cancellation releases its handle. */
export function MediaPreview({ mediaKey, alt, kind = 'image', language = 'en', className, style }: MediaPreviewProps) {
  const { namespace } = useMediaScope();
  return <PreviewController key={JSON.stringify([namespace, kind, mediaKey])} mediaKey={mediaKey} alt={alt} kind={kind}
    language={language} {...(className === undefined ? {} : { className })} {...(style === undefined ? {} : { style })} />;
}

function PreviewController({ mediaKey, alt, kind = 'image', language = 'en', className, style }: MediaPreviewProps) {
  const [attempt, setAttempt] = useState(0);
  const [cancelled, setCancelled] = useState(false);
  const text = labels[language];
  return <div className={className} style={{ ...surface, ...style }} aria-label={alt}>
    {mediaKey === null ? <Status status="idle" text={text.idle} /> : cancelled
      ? <Status status="cancelled" text={text.cancelled}
        action={<button type="button" style={button} onClick={() => { setCancelled(false); setAttempt(value => value + 1); }}>{text.resume}</button>} />
      : <PreviewAttempt key={attempt} mediaKey={mediaKey} alt={alt} kind={kind} language={language}
        cancel={() => setCancelled(true)} retry={() => setAttempt(value => value + 1)} />}
  </div>;
}

/** Responsive attachment collection; duplicate media keys share a load, distinct item IDs own their UI. */
export function MediaGallery({ items, language = 'en', className, style }: MediaGalleryProps) {
  if (items.length === 0) return <p role="status" className={className} style={style}>{labels[language].empty}</p>;
  return <div className={className} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 16, ...style }}>
    {items.map(item => <figure key={item.id} style={{ margin: 0, minWidth: 0 }}>
      <MediaPreview mediaKey={item.mediaKey} alt={item.alt} kind={item.kind ?? 'image'} language={language} />
      {item.title && <figcaption style={{ marginTop: 8, fontSize: '0.9em' }}>{item.title}</figcaption>}
    </figure>)}
  </div>;
}
