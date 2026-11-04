# browser-media-cache-react

<details name="readme-language">
<summary><picture><source media="(prefers-color-scheme: dark)" srcset="assets/lang-en-dark.svg"><img src="assets/lang-en-light.svg" width="42" height="26" alt="EN"></picture></summary>

**0.1.0 · React 18.3+/19 · TypeScript · ESM / ES2022 · MIT**

Render shared avatars and attachment previews without managing object URLs in every component. A provider supplies an application-owned cache and account namespace. CachedImage, MediaBoundary and useCachedMedia reuse the existing core hook for acquisition, cancellation and cleanup.

| Need | API and example |
|---|---|
| Share one avatar between a profile and its attachment preview | [CachedImage gallery](examples/Gallery.tsx) |
| Render audio, video, a download link or custom content | [MediaBoundary render props](examples/Gallery.tsx) |
| Use custom rendering with the same lifecycle | [useCachedMedia / MediaStatus](examples/Gallery.tsx) |
| Configure authenticated loading and persistence | [Application-owned cache](examples/create-cache.ts) |
| Change accounts and remove persisted account media | [Scope and logout guide](docs/0.1.0/en.md#scope-and-logout) |
| Defer result rendering while typing | [SearchableGallery](examples/SearchableGallery.tsx) |
| Explicit retry, disabled state and native image ref/events | [ImageStates](examples/ImageStates.tsx) |

[All props, defaults and mechanisms](docs/0.1.0/reference.en.md) · [Troubleshooting](docs/0.1.0/reference.en.md#troubleshooting)

```tsx
import { MediaCacheProvider, CachedImage } from '@59alex/browser-media-cache-react';

// EN: cache is a stable MediaCache created once by the application.
// RU: cache — стабильный MediaCache, созданный приложением один раз.
<MediaCacheProvider cache={cache} namespace={accountId}>
  <CachedImage mediaKey="avatar:42:v3" alt="Profile portrait" width={96} height={96}
    loadingFallback={<span role="status">Loading portrait…</span>}
    errorFallback={<span role="status">Portrait unavailable</span>} />
</MediaCacheProvider>;
```

Start from adjacent local checkouts named browser-media-cache and browser-media-cache-react:

```sh
npm run bootstrap
npm test
npm run demo
npm run test:package
```

Bootstrap installs the locked development dependencies, builds the core checkout, packs it, and installs that local artifact. Set MEDIA_CACHE_SOURCE to use a different core checkout. Neither package needs to exist in npm. Published peer metadata contains semver ranges, not local filesystem paths. An ordinary npm ci alone does not supply the unpublished core peer.

For an application, pack both built repositories and install their two tarballs together with React and React DOM. [Installation and examples](docs/0.1.0/en.md#local-installation) describe the exact sequence.

The provider never disposes caller-owned caches or clears persistence automatically. Null keys disable loading. SSR renders the loading/idle fallback without acquiring resources. Active media may exceed the core's soft memory budget; complete Blobs are cached, so this is suitable for bounded avatars/previews rather than arbitrarily large streamed files. Native image decoding errors are delivered to onError; errorFallback handles core acquisition/loading failures.

Source and examples are local. npm publication and public creation of this new repository are pending; GitHub account access is currently blocked. CI is configured but no remote run is claimed.

[Versioned EN guide](docs/0.1.0/en.md) · [Documentation index](docs/index.md) · [Verification](docs/VERIFICATION.md) · [MIT](LICENSE)

</details>

<details name="readme-language" open>
<summary><picture><source media="(prefers-color-scheme: dark)" srcset="assets/lang-ru-dark.svg"><img src="assets/lang-ru-light.svg" width="42" height="26" alt="RU"></picture></summary>

**0.1.0 · React 18.3+/19 · TypeScript · ESM / ES2022 · MIT**

Общие аватары и превью вложений без ручного управления object URL в каждом компоненте. Provider передаёт принадлежащий приложению кэш и namespace аккаунта. CachedImage, MediaBoundary и useCachedMedia используют существующий hook ядра для получения ресурса, отмены и очистки.

| Задача | API и пример |
|---|---|
| Разделить аватар между профилем и превью вложения | [Галерея CachedImage](examples/Gallery.tsx) |
| Вывести аудио, видео, ссылку скачивания или свой элемент | [Render props MediaBoundary](examples/Gallery.tsx) |
| Написать своё отображение с тем же lifecycle | [useCachedMedia / MediaStatus](examples/Gallery.tsx) |
| Настроить загрузку с аутентификацией и хранилище | [Кэш приложения](examples/create-cache.ts) |
| Сменить аккаунт и удалить его сохранённые медиа | [Область и logout](docs/0.1.0/ru.md#область-и-logout) |
| Отложить render результатов во время ввода | [SearchableGallery](examples/SearchableGallery.tsx) |
| Явный повтор, disabled, ref и события img | [ImageStates](examples/ImageStates.tsx) |

[Все props, defaults и механизмы](docs/0.1.0/reference.ru.md) · [Устранение проблем](docs/0.1.0/reference.ru.md#устранение-проблем)

```tsx
import { MediaCacheProvider, CachedImage } from '@59alex/browser-media-cache-react';

// EN: cache is a stable MediaCache created once by the application.
// RU: cache — стабильный MediaCache, созданный приложением один раз.
<MediaCacheProvider cache={cache} namespace={accountId}>
  <CachedImage mediaKey="avatar:42:v3" alt="Аватар профиля" width={96} height={96}
    loadingFallback={<span role="status">Загружаем аватар…</span>}
    errorFallback={<span role="status">Аватар недоступен</span>} />
</MediaCacheProvider>;
```

Расположите локальные checkout browser-media-cache и browser-media-cache-react рядом и выполните из второго:

```sh
npm run bootstrap
npm test
npm run demo
npm run test:package
```

Bootstrap устанавливает зависимости по lockfile, собирает checkout ядра, упаковывает и устанавливает его локальный артефакт. Другой путь задаётся через MEDIA_CACHE_SOURCE. Публикация пакетов в npm для этого не требуется. В metadata peer-зависимостей сохраняются semver-диапазоны без локальных путей. Обычный npm ci сам по себе не устанавливает неопубликованный core peer.

Для приложения упакуйте оба собранных репозитория и установите два архива вместе с React и React DOM. Точная последовательность — в [руководстве по установке и примерам](docs/0.1.0/ru.md#локальная-установка).

Provider не уничтожает чужой кэш и не очищает хранилище автоматически. Null отключает загрузку. SSR выводит loading/idle fallback без получения ресурса. Активные медиа могут превышать мягкий бюджет ядра; кэш содержит целые Blob, поэтому подходит для ограниченных по размеру аватаров и превью. Ошибки декодирования изображения приходят в обычный onError; errorFallback обрабатывает ошибки получения и загрузки ресурса ядром.

Исходники и примеры готовы локально. Публикация npm и создание этого публичного репозитория ожидают восстановления доступа к GitHub. CI настроен, удалённый запуск не заявляется.

[Руководство RU](docs/0.1.0/ru.md) · [Все версии](docs/index.md) · [Проверки](docs/VERIFICATION.md) · [MIT](LICENSE)

</details>
