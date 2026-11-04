import type { MediaCache } from '@59alex/browser-media-cache';
import { CachedImage, MediaBoundary, MediaCacheProvider, useCachedMedia } from '@59alex/browser-media-cache-react';

// EN: One application-owned cache is shared by the avatar and attachment previews.
// RU: Один принадлежащий приложению кэш используется аватаром и превью вложений.
export function Gallery({ cache, accountId }: { cache: MediaCache; accountId: string }) {
  return <MediaCacheProvider cache={cache} namespace={accountId}>
    <section aria-label="Profile and attachments">
      <h2>Profile</h2>
      <CachedImage mediaKey="avatar:v1" alt="Profile portrait" width={96} height={96}
        className="avatar" loadingFallback={<span role="status">Loading portrait…</span>}
        errorFallback={<span role="status">Portrait unavailable</span>} />
      <h2>Attachments</h2>
      {/* EN: The repeated key shares the same load and object URL. */}
      {/* RU: Повторный ключ разделяет ту же загрузку и object URL. */}
      <CachedImage mediaKey="avatar:v1" alt="Portrait attachment" width={192} height={192}
        loadingFallback={<span role="status">Loading attachment…</span>}
        errorFallback={<span role="status">Attachment unavailable</span>} />
      {/* EN: Render props also support downloads, audio or video without URL bookkeeping. */}
      {/* RU: Render props подходят для скачивания, аудио и видео без ручного учёта URL. */}
      <MediaBoundary mediaKey="notes:v1" loadingFallback={<span role="status">Loading notes…</span>}
        errorFallback={<span role="status">Notes unavailable</span>}>
        {resource => <a href={resource.url} download="notes.txt">Download notes</a>}
      </MediaBoundary>
    </section>
  </MediaCacheProvider>;
}

// EN: Use the same scoped hook when the application needs its own rendering logic.
// RU: Используйте тот же hook области, когда приложению нужна своя логика отображения.
export function MediaStatus({ mediaKey }: { mediaKey: string | null }) {
  const state = useCachedMedia(mediaKey);
  return <span role="status">{state.status}</span>;
}
