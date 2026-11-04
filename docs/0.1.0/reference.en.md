# React media components 0.1.0 — reference

[← Guide](en.md) · [RU](reference.ru.md) · [Versions](../index.md) · [README](../../README.md)

## Capabilities and source examples

| Mechanism | Source | Boundary |
|---|---|---|
| Caller-owned cache, authenticated loading, persistence | [create-cache.ts](../../examples/create-cache.ts) | Application owns credentials, size limits and shutdown; namespace is not authorization |
| Provider and shared avatar/attachment previews | [Gallery.tsx](../../examples/Gallery.tsx) | The same instance and namespace/key share a resource, not separate providers globally |
| Render props for a download/audio/video | [Gallery.tsx](../../examples/Gallery.tsx) | Child must not use URL after unmount or forced invalidation |
| Custom status rendering | [MediaStatus](../../examples/Gallery.tsx) | Hook must run inside a provider |
| Disabled state, all fallbacks, ref, native events, explicit retry | [ImageStates.tsx](../../examples/ImageStates.tsx) | Retry remounts this consumer only; image decoding failures do not clear shared cache |
| Search that defers result rendering | [SearchableGallery.tsx](../../examples/SearchableGallery.tsx) | Only text is deferred; cache, account namespace and item collection stay current |
| Logout | [clearAccountMedia](../../examples/create-cache.ts) | Unmount old account UI, await invalidation, handle required persistence errors |

## Imports and compatibility

The root entry exports MediaCacheProvider, useCachedMedia, MediaBoundary, CachedImage;
types MediaCacheProviderProps, MediaBoundaryProps, CachedImageProps, MediaResource
and MediaState. /package.json exports metadata. The entry retains use client.
There are no CSS files, automatic loaders, global caches, timers or React-19-only
exports in this adapter. Core ownership is delegated to its existing useMedia.

Peers: @59alex/browser-media-cache ^0.1.0, React ^18.3.1 or ^19.0.0. Output: strict
TypeScript declarations and ESM/ES2022. Development: Node 24, TypeScript 7.0.2.
Install the core and adapter tarballs together as described in the [guide](en.md#local-installation).
React DOM belongs to the host application. React 19.3.1, Chromium 156 and Firefox
156 are tested; React 18, Safari, mobile browsers and framework-specific hydration are not.

## Provider and hook

| API / field | Required / default | Contract |
|---|---|---|
| MediaCacheProvider.cache | Required MediaCache | Stable caller-owned instance. Provider never calls dispose or clears persistence. |
| MediaCacheProvider.namespace | Required non-empty string | Immediate account/data partition; may be overridden by a nested provider. |
| MediaCacheProvider.children | Required ReactNode | Descendants use the nearest provider. |
| useCachedMedia(mediaKey) | string or null | Delegates to useMedia(cache, namespace, key); null disables acquisition. |

Do not instantiate a new cache during every render. Switching account, cache or
key immediately masks the old resource; effects release the old handle and acquire
the replacement. Namespace switching alone does not delete old memory/persistence.
Never defer authentication or account scope with transitions or useDeferredValue.

The hook returns a discriminated MediaState: idle; loading; ready with resource;
or error with unknown error. MediaResource contains readonly url and blob. The
resource is valid only while the hook retains ownership. Errors from the loader,
required storage, invalid key or disposed cache become error state; a missing
provider throws during render. Empty namespace is rejected by the provider even
when a descendant's key is null. Loading a new key does not show the old URL.

## MediaBoundary

| Prop | Required / default | Behavior |
|---|---|---|
| mediaKey | Required string or null | Logical, preferably versioned key; null selects idle. |
| children(resource) | Required function | Called only in ready state. Returns ReactNode for this owned resource. |
| loadingFallback | null | ReactNode during acquisition. |
| idleFallback | null | ReactNode when disabled. |
| errorFallback | null | ReactNode or (error: unknown) => ReactNode for acquisition/invalidation errors. |

MediaBoundary is a resource-state renderer, not a React Error Boundary. Errors
thrown by child rendering or by a fallback are handled by the application's Error
Boundary. It neither suspends nor catches arbitrary descendant exceptions. Forced
invalidation ends ownership and shows error state; it does not automatically retry.

## CachedImage

CachedImage accepts mediaKey and all three fallbacks from MediaBoundary. It requires
alt; use an empty string for decorative thumbnails beside an accessible caption.
Native image props are forwarded except src, srcSet, children and dangerouslySetInnerHTML.
The cache owns src; srcSet cannot override it. Ref points to the ready HTMLImageElement
and becomes null when that image is removed. It does not expose a component handle.

| Prop group | Default / effect | Limit |
|---|---|---|
| width, height, className, style | Ordinary img behavior | Apply only to the ready image; size/style fallback nodes separately to prevent layout shifts. |
| loading, decoding, fetchPriority | Browser defaults unless supplied | Native loading=lazy does not delay the core's acquisition; the Blob is acquired before img is rendered. |
| onLoad, onError | Native image events | Decode/display events, not loader success/failure. A decode error does not select errorFallback automatically. |
| alt and ARIA props | Explicit application content | Avoid repeated announcements in large galleries; choose useful role/status text for fallbacks. |
| errorFallback | null or caller value | Use an explicit retry control if appropriate; there is no hidden retry loop. |

[ImageStates](../../examples/ImageStates.tsx) retries by changing the React key of
the CachedImage while retaining mediaKey. That remount releases/acquires one
consumer and does not invalidate other consumers. Successful memory hits can still
be reused; to refresh content, use a new versioned mediaKey or explicit core invalidation.

## React concurrency and SSR

The current [React documentation](https://react.dev/blog/2026/09/09/react-19-3)
describes React 19.3. The adapter keeps its React 18 API surface: newer features do
not change Blob ownership. The [search example](../../examples/SearchableGallery.tsx)
uses the one-argument useDeferredValue supported by both major versions and a memoized
result subtree. Keep items immutable and stable when unchanged. Only the query
lags; account and items do not. This is interruptible rendering, not debounce,
request deduplication, network throttling or list virtualization. It is useful when
result rendering competes with typing; measure your own screen. [React reference](https://react.dev/reference/react/useDeferredValue).

Acquisition remains in effects; SSR returns deterministic loading/idle content
without requesting media. StrictMode can replay effect setup and cleanup. Cache
instances cannot be serialized as server-component props: create them in the client
composition root, with request-scoped server state when applicable. Framework-specific
hydration remains untested. [Effect lifecycle](https://react.dev/reference/react/useEffect).

Do not call acquire during render and pass its ready promise to React 19 use.
Suspended or abandoned renders would need a separate resource ownership model.
This package has no Suspense promise cache. [React use](https://react.dev/reference/react/use).

## Troubleshooting

| Symptom | Action |
|---|---|
| useCachedMedia requires MediaCacheProvider | Wrap the consumer with the provider from the same installed package instance. |
| namespace must be a non-empty string | Use the current account/data namespace; hide consumers while scope is unavailable. |
| Repeated loading after parent render | Keep cache stable; repeated object construction creates a different owner. |
| No UI while pending/disabled/error | Fallbacks default to null; provide explicit UI for the states you need. |
| onError fires but errorFallback does not | Loader succeeded; browser decoding failed. Validate MIME/payload in loader or handle native onError. |
| Native lazy image still loads a Blob | Acquisition starts with the component's effect. Conditionally mount only visible previews when you need acquisition-level laziness. |
| Retry by toggling null immediately does nothing | React may batch both updates. Remount using a React key as in ImageStates. |
| Cleared account media appears again | Another instance/tab may repopulate persistence. Coordinate account lifecycle outside this package. |
| Search does not feel faster | Deferred rendering is not a universal optimization; keep item references stable, profile rendering, paginate or virtualize large result sets. |

[← Guide](en.md) · [Versions](../index.md) · [README](../../README.md)
