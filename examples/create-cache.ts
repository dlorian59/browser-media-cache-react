import { MediaCache } from '@59alex/browser-media-cache';
import { CacheStorageStore } from '@59alex/browser-media-cache/cache-storage';

// EN: Create once in the browser application's composition root, not during render.
// RU: Создайте один раз при сборке браузерного приложения, а не во время render.
export function createApplicationMediaCache() {
  return new MediaCache({
    // EN: Authentication belongs to the application; namespace labels grant no access.
    // RU: Аутентификация остаётся в приложении; метка namespace не даёт прав доступа.
    load: async ({ key, signal }) => {
      const response = await fetch(`/api/media/${encodeURIComponent(key)}`, { signal, credentials: 'same-origin' });
      if (!response.ok) throw new Error(`Media HTTP ${response.status}`);
      return response.blob();
    },
    idleTtlMs: 30_000,
    maxEntries: 128,
    maxBytes: 64 * 1024 * 1024,
    // EN: Optional persistence has a separate browser quota and expiry policy.
    // RU: Необязательное хранилище имеет отдельную браузерную квоту и срок хранения.
    store: new CacheStorageStore({ cachePrefix: 'my-app:media:v1:', maxAgeMs: 60 * 60 * 1000 }),
    persistence: 'required',
  });
}

// EN: Unmount the old account's UI first; await persistence cleanup before ending the session.
// RU: Сначала уберите UI старого аккаунта; дождитесь очистки хранилища перед завершением сессии.
export async function clearAccountMedia(cache: MediaCache, namespace: string) {
  await cache.invalidateNamespace(namespace);
  // EN: Reuse the cache for another account; dispose only at the application owner's shutdown.
  // RU: Кэш можно использовать для другого аккаунта; dispose вызывается владельцем при остановке приложения.
}
