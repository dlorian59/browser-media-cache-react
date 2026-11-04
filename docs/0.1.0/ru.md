# browser-media-cache-react 0.1.0

[← Версии](../index.md) · [EN](en.md) · [RU](ru.md) · [README](../../README.md)

[Все props, defaults, семантика состояний и устранение проблем](reference.ru.md)

Адаптер подходит для React-экранов с повторяющимися аватарами и превью вложений, которым нужна предсказуемая очистка при навигации. Политика приложения задаётся в одном MediaCache; компоненты используют существующий useMedia ядра. Отдельного кэша URL, планировщика загрузок или реализации хранилища здесь нет.

## Локальная установка

Для разработки используются Node 24 и lockfile. Результат сборки — ESM/ES2022 со строгими TypeScript declarations. Peer-зависимости: @59alex/browser-media-cache ^0.1.0 и React ^18.3.1 или ^19.0.0. Проверки выполнены с React 19.3.1; совместимость с React 18 заявлена в диапазоне, но пока не проверена.

Из этого checkout, если checkout ядра находится рядом:

```sh
npm run bootstrap
npm test
npm run typecheck:examples
npm run demo
```

Другой путь к ядру задаётся MEDIA_CACHE_SOURCE=/path/to/browser-media-cache. Bootstrap выполняет npm ci, собирает ядро, упаковывает и устанавливает tarball, сохраняя semver в peer metadata. После повторного npm ci снова запустите bootstrap для установки локального core-артефакта.

Для отдельного React-приложения:

```sh
# EN: Run in the core checkout after bootstrap built it.
# RU: Выполните в checkout ядра после его сборки через bootstrap.
npm pack
# EN: Run in the React adapter checkout.
# RU: Выполните в checkout React-адаптера.
npm pack
# EN: Run in the application and replace both absolute paths.
# RU: Выполните в приложении и замените оба абсолютных пути.
npm install /path/to/browser-media-cache/59alex-browser-media-cache-0.1.0.tgz /path/to/browser-media-cache-react/59alex-browser-media-cache-react-0.1.0.tgz react@19.3.1 react-dom@19.3.1
```

Это локальные артефакты. Публикация в npm не заявляется. CI получает checkout ядра и использует тот же bootstrap; удалённый запуск ожидает восстановления доступа к GitHub.

## Кэш приложения и provider

[create-cache.ts](../../examples/create-cache.ts) задаёт fetch loader, мягкий бюджет неиспользуемых записей и необязательный CacheStorage. Замените /api/media/{encodedKey} своим endpoint с аутентификацией. Namespace — логическое разделение, а не право доступа. Включайте в ключ ревизию и размер превью.

Создайте кэш один раз при сборке браузерного приложения. Передайте его в MediaCacheProvider вместе с namespace аккаунта. Сам provider не загружает и не уничтожает ресурсы. Вложенные providers могут менять область, но тоже не владеют временем жизни переданного кэша. Не создавайте новый кэш на каждом render.

[Gallery.tsx](../../examples/Gallery.tsx) оборачивает галерею одним provider. Два CachedImage с ключом avatar:v1 разделяют загрузку и URL. Каждый компонент освобождает свой handle; удаление одного изображения сохраняет второе.

## Изображения и доступные состояния

CachedImage требует alt; для декоративного изображения передайте пустую строку. Обычные width, height, className, style, loading, decoding, onLoad, onError и ref передаются готовому img. src и srcSet принадлежат кэшу. Компонент не добавляет обёртку и CSS.

loadingFallback, idleFallback и errorFallback по умолчанию равны null. Передайте текст, skeleton или управление повтором; role=status подходит для нужных пользователю уведомлений. Размеры и стили img не применяются к fallback — задавайте их отдельно для стабильного layout. [Исходник галереи](../../examples/Gallery.tsx) показывает loading/error и размеры изображений.

errorFallback отображает ошибки получения/загрузки и принудительную инвалидацию. Ошибка декодирования самого изображения приходит в onError; она не инвалидирует общий ресурс автоматически. Решение об инвалидации и повторе остаётся у приложения.

## Скачивание и другие медиа

MediaBoundary вызывает дочернюю функцию только при наличии готового ресурса, которым владеет hook ядра. [Галерея](../../examples/Gallery.tsx) выводит ссылку скачивания заметок. Так же можно отобразить audio/video. Используйте URL только во время жизни дочернего элемента; не сохраняйте его отдельно глобально и не вызывайте revokeObjectURL самостоятельно.

mediaKey=null отключает получение ресурса и выводит idleFallback. errorFallback может быть функцией, разбирающей unknown error. Готовый URL не означает завершение декодирования изображения/видео или физической записи файла. Большие файлы со сквозной передачей требуют потокового транспорта, а не Blob-кэша.

## Свой hook

useCachedMedia(key) получает область provider и напрямую вызывает существующий useMedia(cache, namespace, key). Возвращаются idle, loading, ready с resource или error с unknown error. [MediaStatus в Gallery.tsx](../../examples/Gallery.tsx) показывает своё отображение без повторной реализации владения. Вызов вне provider выдаёт явную ошибку.

## Область и logout

При смене cache, namespace или key старый ресурс сразу скрывается во время render. Effects освобождают старое владение и получают новый ресурс. Ядро защищает от опоздавшего результата прежней загрузки. Смена namespace автоматически не удаляет постоянные данные или неиспользуемые записи старого аккаунта.

Для logout сначала уберите UI старого аккаунта, затем дождитесь cache.invalidateNamespace(oldNamespace). [clearAccountMedia](../../examples/create-cache.ts) показывает эту границу. В режиме required ошибка очистки отклоняет Promise; приложение должно её обработать. Владелец вызывает dispose при остановке приложения после удаления потребителей. Unmount provider освобождает handles потомков и сохраняет общий кэш доступным другим частям приложения.

## SSR и StrictMode

Публичный entry сохраняет директиву use client для фреймворков с React Server
Components. Создавайте кэш в клиентском коде приложения: экземпляр MediaCache
нельзя сериализовать как prop из серверного компонента. Зависимость от Next.js
не требуется; интеграция с конкретным фреймворком пока не проверена.

SSR выводит loading/idle без получения медиа, создания URL и обращения к CacheStorage. На сервере используйте состояние приложения в пределах запроса, на клиенте — стабильный кэш. Браузерные object URL не передаются через HTML. Fallback должен быть одинаковым на сервере и первом клиентском render.

Повторный запуск effects в development StrictMode обрабатывается hook ядра. Проверки покрывают общую загрузку, частичный unmount, смену аккаунта, logout, ошибки, null и опоздавшие результаты. Функциональное демо находится локально в demo/main.jsx; его [ссылка на GitHub](https://github.com/59Alex/browser-media-cache-react/blob/main/demo/main.jsx) станет доступна после создания репозитория.

## Попробовать и проверить

```sh
npm run demo
npm run test:package
npx playwright install chromium firefox
npm run test:browser
```

Демо использует небольшие синтетические SVG и текстовые файлы. Можно сменить аккаунт, вызвать намеренную ошибку, выйти из аккаунта и посмотреть диагностику ядра. Проверка установки использует реальные tarball ядра и адаптера. Среды и ограничения приведены в [отчёте](../VERIFICATION.md).

[← Версии](../index.md) · [README](../../README.md)
