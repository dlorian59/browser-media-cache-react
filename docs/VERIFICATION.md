# Verification / Проверки — 0.1.0

[← Documentation / Документация](index.md) · [README](../README.md)

Local validation on 2026-11-04. React adapter source is new and reuses the core's
existing useMedia hook. No core lifecycle code was changed for this integration.

OSS-009 example/reference validation on 2026-11-05 retains the same public API.
The current packed consumer contains 20 files; 102 relative links/anchors resolve.
SearchableGallery and ImageStates compile with the existing strict configuration.
Both headless browsers verified filtering, immediate account/item replacement,
explicit retry, image ref and native load handling alongside the seven existing
lifecycle scenarios. No FPS, response-time or comparative performance claim is made.

## OSS-013 ready attachment UI · 2026-11-05

MediaPreview and MediaGallery reuse the original provider/useMedia lifecycle. The full AttachmentGallery.tsx compiles in the isolated package consumer, alongside existing declarations and SSR checks. Packed docs: 220 links/anchors resolved (50 files). Build, strict examples and SSR pass.

Chromium 156.0.8078.4 recorded the actual HTTP gallery in EN/RU: cancel pending audio, 503 then one shared retry, decoded images with equal URLs, native audio playback progress, hide/show without new HTTP downloads and immediate account namespace replacement. GIFs are 166,275 / 187,499 bytes with PNG alternatives. Capture is repeatable with MEDIA_CAPTURE_SCENES=gallery npm run docs:capture.

The existing browser suite passes in Chromium156 and Firefox158 with its seven lifecycle scenarios, plus a damaged-image response: Retry display reuses the existing Blob without an extra fetch, account replacement clears the decode-error UI, hiding removes all owners and pauses/clears the detached native player. The fixture deliberately uses local SVG and WAV; video codec coverage and physical devices were not tested.

An additional clean consumer installed the current core/adapter tarballs with React 18.3.1 and React DOM 18.3.1. SSR emitted idle/loading UI without acquisition. Headless Chromium verified StrictMode, two decoded images sharing one HTTP request and object URL, then zero owners and zero retained bytes after unmount with the transient profile. This is React 18 gallery/lifecycle coverage; the full error/audio matrix above runs with React 19.3.1.

Готовые карточки проверены настоящими действиями: отмена, сетевой retry, общий ресурс, воспроизведение аудио и смена аккаунта. Повтор отображения повреждённого Blob не обещает новую сетевую загрузку. Нативные кодеки и production-авторизация остаются за браузером/приложением.


## OSS-011 visual guide verification · 2026-11-05

All four runtime exports are demonstrated through actual React components:
MediaCacheProvider (shared children), CachedImage, MediaBoundary and useCachedMedia
(custom UI). Eight recordings cover four scenes in EN/RU; each has a static PNG
and a reduced-motion source. Chromium 156.0.8078.4 captured the 832 × 800 example.
GIF sizes are 49,370–100,779 bytes. UI assertions passed for loader calls, owner
counts, shared object URLs, idle reuse, namespace replacement, decoded images,
explicit retry, downloaded Blob content and absence of browser errors.

`npm run docs:capture` reproduces the fixtures and recordings. Results and raw
frames are in ignored `output/playwright/media-visuals/`. The source uses local
SVG/text Blobs, a 1.2-second fixture delay and one intentional notes failure;
it is not evidence of production network performance or persistent-cache behavior.

Build, strict example types, both SSR tests and the isolated packed consumer passed.
The artifact contains 39 files; 186 relative Markdown links/anchors resolved during
the package check, and a separate check found no missing Markdown/image targets.
The existing browser suite also passed all seven lifecycle scenarios and example
controls in Chromium 156.0.8078.4 and the installed Firefox 158.0, with 4/4
object URLs released in each. Firefox used an explicit executable override.
Source-only demo/capture links point to the repository because those tools are
intentionally excluded from the npm artifact. No adapter runtime API changed.

Все три компонента и hook показаны в восьми записях на двух языках. Проверены
реальные состояния UI, разделение ресурса, повторное использование и retry.
Статичные PNG доступны для уменьшения движения; данные и задержка — тестовые.

| Check | Observed result |
|---|---|
| Strict TypeScript build and example compilation | Pass; public declarations, Gallery.tsx, create-cache.ts, SearchableGallery.tsx and ImageStates.tsx |
| SSR | 2 tests: loading/idle output without acquisition, and explicit missing-provider error |
| Chromium 156.0.8078.4 / React 19.3.1 | 7 lifecycle scenarios passed; 4 URLs created and revoked, zero handles at completion |
| Firefox 156.0 / React 19.3.1 | Same 7 scenarios passed; 4 URLs created and revoked, zero handles at completion |
| Functional gallery | Shared avatar URL, failure fallback, account switch and logout controls exercised |
| New example controls | Search filtering, current account captions/URLs, explicit retry and native image ref/load passed in both tested browsers |
| Isolated artifact consumer | Actual core + adapter + React tarballs installed; SSR and strict declarations pass, alt is required and src cannot bypass cache ownership |
| Client entry | use client directive remains in the packed JavaScript; no framework-specific integration claimed |
| Packed documentation | Relative file links and section anchors are checked in the installed artifact |

Scenarios cover development StrictMode sharing, partial unmount, account changes
without exposing old media, forced logout, error and idle slots, ignored old
completion, and continued use of the caller-owned cache after provider unmount.
The fixtures are bounded SVG/text Blobs. This is lifecycle evidence, not a memory
or throughput benchmark. The browser runner starts its own loopback server and
headless browser profiles, then closes them. It does not use a personal Firefox profile.

[Recorded browser results](verification/browser-results.json) preserve the local
run used for this report. Raw screenshots remain in ignored output/playwright.

Проверено локально: SSR, строгая компиляция примеров и семь сценариев жизненного
цикла в Chromium/Firefox с React 19.3.1. В каждом браузере все четыре URL отозваны,
активных handles не осталось. Это проверка владения ресурсами; производительность
и освобождение памяти операционной системой не измерялись.

React 18 was not covered by the earlier OSS-011 run; its subsequent OSS-013 consumer check is recorded above. Safari/WebKit, mobile browsers, real authentication/backend integration,
and hydration in a specific SSR framework are not tested. The React peer range
expresses intended compatibility. Required CacheStorage cleanup can fail, and
namespace labels do not provide authentication. Core memory budgets remain soft
for active owners and do not include decoded image memory.

GitHub is currently unavailable for public repository creation and remote CI.
No push, npm release or remote validation is claimed. Source, examples and
MIT metadata are local. CI obtains the core checkout and builds its tarball; it
does not require an already published @59alex package.

[← Documentation / Документация](index.md) · [README](../README.md)
