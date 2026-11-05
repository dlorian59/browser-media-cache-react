# React media components 0.1.0 — справочник

[← Руководство](ru.md) · [EN](reference.en.md) · [Версии](../index.md) · [README](../../README.md)

[Компоненты в действии](visuals.ru.md) — код интеграции, записи и статичные кадры для каждого публичного компонента и hook.

## Готовые превью и галереи

[Разбор интеграции и запись](application.ru.md) · [Полный AttachmentGallery](../../examples/AttachmentGallery.tsx)

Дополнительные корневые экспорты: `MediaPreview`, `MediaGallery`; типы `MediaKind`, `MediaLanguage`, `MediaPreviewProps`, `MediaGalleryProps`, `MediaGalleryItem`. Оба компонента используют прежнее владение provider/hook; второго движка кэша нет.

| MediaPreview prop | По умолчанию | Контракт |
|---|---|---|
| `mediaKey` | Обязательный string или null | Null означает idle. Смена namespace/key сбрасывает retry/cancel-состояние карточки. |
| `alt` | Обязательная строка | Alt изображения, aria-label аудио/видео и описание контейнера. |
| `kind` | `image` | `image`, `audio`, `video`; у плееров native controls, preload metadata, без autoplay. |
| `language` | `en` | `en` или `ru` для встроенных статусов и кнопок. |
| `className`, `style` | Нет | Внешняя поверхность; inline defaults дают стабильную область заглушек. |

При ожидании есть Отменить; отмена снимает только этого владельца и показывает Загрузить снова. Ошибка получения имеет Повторить: перемонтируется только этот потребитель. Нативная ошибка декодирования имеет Повторить отображение: пересоздаётся элемент с теми же байтами кэша, без скрытой инвалидации других владельцев. Исправленному медиа нужен новый ключ версии. Provider требуется даже при null-ключе. Autoplay, потоковое декодирование, upload, конвертация кодеков и автоматические повторы не добавлены.

| MediaGallery prop | По умолчанию | Контракт |
|---|---|---|
| `items` | Обязательный readonly array | Элемент: уникальный стабильный `id`, `mediaKey`, обязательный `alt`, необязательные `title` и `kind`. Порядок сохраняется; ключи могут повторяться и разделять ресурс. |
| `language` | `en` | Подписи дочерних превью и сообщение пустой коллекции. |
| `className`, `style` | Нет | Внешняя адаптивная сетка (либо пустой параграф); style переопределяет grid columns/gaps. |

Все перечисленные карточки смонтированы: виртуализации и отложенного acquire нет. Нативный `preload=metadata` не откладывает загрузку полного Blob кэшем. Активные ресурсы могут превышать мягкий бюджет. Поддержка кодеков принадлежит браузеру. HTTP-фабрика/профиль настраивается приложением, а не создаётся неявно provider.


## Возможности и исходники

| Механизм | Исходник | Граница |
|---|---|---|
| Кэш приложения, загрузка с auth, persistence | [create-cache.ts](../../examples/create-cache.ts) | Приложение владеет credentials, лимитами загрузки и shutdown; namespace не даёт прав |
| Provider, общий аватар и превью | [Gallery.tsx](../../examples/Gallery.tsx) | Делится ресурс одного instance и namespace/key; providers не создают глобальный кэш |
| Render props для скачивания/audio/video | [Gallery.tsx](../../examples/Gallery.tsx) | URL нельзя использовать после unmount или принудительной инвалидации |
| Свой вывод состояния | [MediaStatus](../../examples/Gallery.tsx) | Hook вызывается внутри provider |
| Disabled, все fallbacks, ref, события img, retry | [ImageStates.tsx](../../examples/ImageStates.tsx) | Remount повторяет попытку одного потребителя; ошибка decode не очищает общий кэш |
| Поиск с отложенным render результатов | [SearchableGallery.tsx](../../examples/SearchableGallery.tsx) | Откладывается только текст; cache, namespace и список аккаунта остаются актуальными |
| Logout | [clearAccountMedia](../../examples/create-cache.ts) | Уберите UI, дождитесь инвалидации, обработайте ошибки required persistence |

## Импорты и совместимость

API примитивов экспортирует MediaCacheProvider, useCachedMedia, MediaBoundary,
CachedImage; типы MediaCacheProviderProps, MediaBoundaryProps, CachedImageProps,
MediaResource и MediaState. /package.json экспортирует metadata. В entry сохранён
use client. Адаптер не добавляет CSS, автоматический loader, глобальный кэш,
таймеры или React-19-only API. Владение делегировано существующему useMedia ядра.

Peers: @59alex/browser-media-cache ^0.1.0, React ^18.3.1 или ^19.0.0. Выход: строгие
declarations и ESM/ES2022. Разработка: Node 24, TypeScript 7.0.2. Устанавливайте
tarball ядра и адаптера вместе по [руководству](ru.md#локальная-установка).
React DOM принадлежит приложению. Для React 19.3.1 проверены жизненный цикл, ошибки и аудио в Chromium 156 и Firefox 158. Чистый consumer с React 18.3.1 прошёл SSR и проверки общей загрузки галереи/размонтирования в Chromium StrictMode. Safari, мобильные браузеры и hydration конкретного фреймворка не проверены; см. [границы проверок](../VERIFICATION.md).

## Provider и hook

| API / поле | Требование / default | Контракт |
|---|---|---|
| MediaCacheProvider.cache | Обязательный MediaCache | Стабильный экземпляр приложения; provider не вызывает dispose и не очищает persistence. |
| MediaCacheProvider.namespace | Обязательная непустая строка | Актуальная область аккаунта/данных; вложенный provider может её заменить. |
| MediaCacheProvider.children | Обязательный ReactNode | Потомки используют ближайший provider. |
| useCachedMedia(mediaKey) | string либо null | Делегирует useMedia(cache, namespace, key); null отключает получение ресурса. |

Не создавайте новый кэш на каждом render. Смена аккаунта, cache или key сразу скрывает
старый ресурс; effects освобождают старый handle и получают новый. Смена namespace
сама не удаляет прежнюю память/persistence. Не откладывайте auth и область аккаунта
через transitions или useDeferredValue.

Hook возвращает MediaState: idle; loading; ready с resource; error с unknown error.
MediaResource содержит readonly url и blob. Ресурс валиден, пока hook владеет им.
Ошибки loader, required storage, неверного key или закрытого cache дают error;
отсутствие provider бросает ошибку render. Пустой namespace отклоняется даже при
null у потомка. Загрузка нового ключа не показывает старый URL.

## MediaBoundary

| Prop | Требование / default | Поведение |
|---|---|---|
| mediaKey | Обязательный string либо null | Логический, желательно версионированный ключ; null выбирает idle. |
| children(resource) | Обязательная функция | Вызывается только в ready; возвращает ReactNode для принадлежащего ресурса. |
| loadingFallback | null | ReactNode во время получения ресурса. |
| idleFallback | null | ReactNode в отключённом состоянии. |
| errorFallback | null | ReactNode либо (error: unknown) => ReactNode для ошибки получения/инвалидации. |

MediaBoundary выводит состояние ресурса и не является React Error Boundary.
Ошибки render потомков/fallback обрабатывает Error Boundary приложения. Компонент
не suspends и не ловит произвольные исключения потомков. Принудительная инвалидация
завершает владение и показывает error без автоматического повтора.

## CachedImage

CachedImage принимает mediaKey и три fallback от MediaBoundary. alt обязателен;
пустая строка подходит для декоративного превью рядом с доступной подписью. Обычные
img props передаются кроме src, srcSet, children и dangerouslySetInnerHTML. src
принадлежит кэшу, srcSet не может заменить его. Ref указывает на готовый
HTMLImageElement и становится null при его удалении, а не выдаёт component handle.

| Группа props | Default / действие | Ограничение |
|---|---|---|
| width, height, className, style | Обычное поведение img | Только готовое изображение; отдельно задайте размер/стиль fallback для стабильного layout. |
| loading, decoding, fetchPriority | Default браузера | loading=lazy не откладывает получение Blob ядром: img появляется после acquisition. |
| onLoad, onError | Нативные события img | События decode/display, не успех/ошибка loader. Ошибка decode сама не включает errorFallback. |
| alt и ARIA | Явное содержание приложения | Избегайте повторных объявлений в больших списках; выбирайте полезный текст статусов. |
| errorFallback | null либо значение приложения | При необходимости добавьте явную кнопку retry; скрытого цикла повторов нет. |

[ImageStates](../../examples/ImageStates.tsx) меняет React key у CachedImage,
сохраняя mediaKey. Remount освобождает/получает одного потребителя и не инвалидирует
других. Готовая запись памяти может переиспользоваться; для обновления содержания
смените версию mediaKey либо явно инвалидируйте ядро.

## React concurrency и SSR

Актуальная [документация React](https://react.dev/blog/2026/09/09/react-19-3) описывает
React 19.3. Поверхность API остаётся совместимой с React 18: новая версия не меняет
владение Blob. [Поисковая галерея](../../examples/SearchableGallery.tsx) использует
одноаргументный useDeferredValue и memo-список. Сохраняйте items неизменяемым и
стабильным, когда данные не менялись. Отстаёт только query; аккаунт и items актуальны.
Это прерываемый render, не debounce, ограничение сети, дедупликация запросов или
виртуализация. Пример полезен, если render списка конкурирует с вводом; измерьте
свой экран. [Справочник React](https://react.dev/reference/react/useDeferredValue).

Получение ресурса остаётся в effects; SSR даёт стабильный loading/idle без запроса
медиа. StrictMode может повторить setup/cleanup. Экземпляр cache нельзя сериализовать
в prop серверного компонента: создавайте его в клиентской точке сборки приложения,
а серверное состояние ограничивайте запросом. Hydration конкретного фреймворка не
проверена. [Lifecycle effect](https://react.dev/reference/react/useEffect).

Не вызывайте acquire в render ради передачи ready в React 19 use. Suspended или
прерванный render потребовал бы другой модели владения; Suspense promise-cache в
пакете нет. [React use](https://react.dev/reference/react/use).

## Устранение проблем

| Симптом | Действие |
|---|---|
| useCachedMedia requires MediaCacheProvider | Оберните потребителя provider из того же установленного экземпляра пакета. |
| namespace must be a non-empty string | Передайте актуальную область данных/аккаунта; скройте потребителей, пока её нет. |
| Повтор loading после render родителя | Держите cache стабильным; создание нового объекта создаёт другого владельца. |
| Пустой UI в pending/disabled/error | Fallback по умолчанию null; задайте необходимые состояния явно. |
| onError сработал, errorFallback нет | Loader успешен, декодирование нет. Проверяйте MIME/данные в loader или обрабатывайте onError. |
| lazy img всё равно загружает Blob | Acquisition начинается в effect компонента. Для ленивого acquisition монтируйте только нужные превью. |
| Мгновенное переключение null не повторяет загрузку | React может объединить обновления. Выполните remount через React key как в ImageStates. |
| Данные аккаунта появились после очистки | Другой экземпляр/вкладка может повторно заполнить persistence; координация остаётся у приложения. |
| Поиск не стал быстрее | Deferred render не универсальная оптимизация. Стабилизируйте items, измерьте render, используйте пагинацию/виртуализацию больших списков. |

[← Руководство](ru.md) · [Версии](../index.md) · [README](../../README.md)
