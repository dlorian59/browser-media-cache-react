import { createHttpMediaCache } from '@59alex/browser-media-cache';
import type { MediaCache } from '@59alex/browser-media-cache';
import { MediaCacheProvider, MediaGallery, MediaPreview } from '@59alex/browser-media-cache-react';
import type { MediaGalleryItem, MediaLanguage, MediaKind } from '@59alex/browser-media-cache-react';

// EN: Create once at browser application startup; never create a new cache during component rendering.
// RU: Создайте один раз при запуске браузерного приложения, а не при рендере компонента.
export function createAttachmentMediaCache() {
  return createHttpMediaCache({
    profile: 'previews',
    url: ({ namespace, key }) => `/api/accounts/${encodeURIComponent(namespace)}/media/${encodeURIComponent(key)}`,
    // EN: The backend must authorize the account and media; namespace/path labels grant no access.
    // RU: Бэкенд проверяет доступ к аккаунту и медиа; метки namespace/path не дают прав.
    request: () => ({ credentials: 'same-origin' }),
  });
}

export function AttachmentGallery({ cache, accountId, language = 'en' }: {
  cache: MediaCache; accountId: string; language?: MediaLanguage;
}) {
  // EN: Business metadata belongs to the application. Two visible images deliberately share one key.
  // RU: Бизнес-метаданные принадлежат приложению. Два изображения намеренно используют один ключ.
  const items: MediaGalleryItem[] = [
    { id: 'cover', mediaKey: 'landscape:v1', alt: language === 'en' ? 'Landscape attachment' : 'Вложение с пейзажем',
      title: language === 'en' ? 'Message attachment' : 'Вложение сообщения' },
    { id: 'preview', mediaKey: 'landscape:v1', alt: language === 'en' ? 'The same landscape in the sidebar' : 'Тот же пейзаж в боковой панели',
      title: language === 'en' ? 'Sidebar preview · shared download' : 'Превью в панели · общая загрузка' },
    { id: 'voice', mediaKey: 'voice:v1', kind: 'audio', alt: language === 'en' ? 'Short voice attachment' : 'Короткое аудиовложение',
      title: language === 'en' ? 'Audio attachment · native controls' : 'Аудиовложение · нативный плеер' },
  ];
  return <MediaCacheProvider cache={cache} namespace={accountId}>
    {/* EN: Loading, error, retry and cancellation are built in; each card owns its resource independently. */}
    {/* RU: Загрузка, ошибка, повтор и отмена встроены; каждая карточка владеет ресурсом независимо. */}
    <MediaGallery items={items} language={language} />
  </MediaCacheProvider>;
}

// EN: A single attachment uses the same ready controls; select image/audio/video from trusted business metadata.
// RU: Одно вложение использует те же готовые контролы; image/audio/video задаются бизнес-метаданными приложения.
export function AttachmentPreview({ cache, accountId, mediaKey, description, kind = 'image', language = 'en' }: {
  cache: MediaCache; accountId: string; mediaKey: string | null; description: string;
  kind?: MediaKind; language?: MediaLanguage;
}) {
  return <MediaCacheProvider cache={cache} namespace={accountId}>
    <MediaPreview mediaKey={mediaKey} alt={description} kind={kind} language={language} />
  </MediaCacheProvider>;
}

// EN: After unmounting old account content, await invalidation before finishing logout.
// RU: После размонтирования содержимого прошлого аккаунта дождитесь инвалидации перед завершением выхода.
export async function clearAttachmentAccount(cache: MediaCache, accountId: string) {
  await cache.invalidateNamespace(accountId);
}
