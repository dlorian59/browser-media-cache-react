# browser-media-cache-react 0.1.0

[← Versions](../index.md) · [EN](en.md) · [RU](ru.md) · [README](../../README.md)

Use this adapter when a React screen repeats the same avatar or attachment preview and needs predictable cleanup on navigation. Keep application policy in one MediaCache; components reuse the core's existing useMedia hook. There is no second URL cache, loader scheduler or persistence implementation.

## Local installation

Node 24 and the committed lockfile reproduce development. Runtime output is ESM/ES2022 with strict TypeScript declarations. Peers are @59alex/browser-media-cache ^0.1.0 and React ^18.3.1 or ^19.0.0. Tests currently use React 19.3.1; React 18 is declared compatible but untested.

From this checkout, with the core checked out beside it:

```sh
npm run bootstrap
npm test
npm run typecheck:examples
npm run demo
```

Bootstrap can use MEDIA_CACHE_SOURCE=/path/to/browser-media-cache. It performs npm ci for development dependencies, builds the core, packs it and installs the tarball without changing peer metadata or the lockfile. After another npm ci, run bootstrap again to restore the local core artifact.

To use both packages in another React application:

```sh
# EN: Run from the core checkout after bootstrap built it.
# RU: Выполните в checkout ядра после его сборки через bootstrap.
npm pack
# EN: Run in the React adapter checkout.
# RU: Выполните в checkout React-адаптера.
npm pack
# EN: Run in your application, replacing both absolute paths.
# RU: Выполните в приложении, заменив оба абсолютных пути.
npm install /path/to/browser-media-cache/59alex-browser-media-cache-0.1.0.tgz /path/to/browser-media-cache-react/59alex-browser-media-cache-react-0.1.0.tgz react@19.3.1 react-dom@19.3.1
```

These are local artifacts, not a registry release. CI checks out the core repository and uses the same bootstrap; remote checkout/run is pending restored GitHub access.

## Application cache and provider

[Source: create-cache.ts](../../examples/create-cache.ts) configures a fetch loader, a soft idle memory budget and optional CacheStorage. Replace /api/media/{encodedKey} with your authenticated endpoint. Namespace is a logical partition, not an authorization credential. Use stable keys including revision/thumbnail size.

Create the cache once in the browser application's composition root. Pass it to MediaCacheProvider with the account namespace. The provider does not load or dispose anything itself. Nested providers may override scope; they still do not own the supplied cache. Do not create new caches on every render.

[Source: Gallery.tsx](../../examples/Gallery.tsx) wraps a whole gallery in one provider. Two CachedImage instances use avatar:v1 and therefore share a single load and URL. Each component releases its own handle; removing one image keeps the second valid.

## Images and accessible fallbacks

CachedImage requires alt; use an empty string for decoration. Native width, height, className, style, loading, decoding, onLoad, onError and image ref are forwarded to the ready img. src and srcSet belong to the cache and cannot be overridden. No wrapper or CSS is injected.

loadingFallback, idleFallback and errorFallback default to null. Supply application-specific text, skeletons or retry controls; use role=status where an announced status helps. Native image props apply only to the image, so size and style your fallback separately when layout stability matters. [Gallery source](../../examples/Gallery.tsx) shows explicit loading/error slots and image dimensions.

errorFallback handles loading/acquisition errors and forced invalidation. Native image decoding failure is delivered to onError. It does not invalidate shared media automatically. Invalidation stays an explicit application decision. The library does not guess retry policy.

## Download links and custom media

MediaBoundary renders its child function only while the core hook owns a ready resource. [Gallery source](../../examples/Gallery.tsx) renders a downloadable notes attachment. The same shape can render audio/video; attach the returned URL only while the child is mounted. Do not retain resource.url in a separate global store or revoke it yourself.

Pass null as mediaKey to disable acquisition and render idleFallback. Pass an error-rendering function when you need to classify an unknown error. URL availability is not image/video decoding completion or disk durability. Large files requiring continuous transfer belong in a streaming transport rather than this Blob cache.

## Custom hook

The exported useCachedMedia(key) reads provider scope and directly calls the existing core useMedia(cache, namespace, key). It returns idle, loading, ready with resource, or error with an unknown error. [MediaStatus in Gallery.tsx](../../examples/Gallery.tsx) demonstrates custom rendering without implementing another ownership mechanism. Using it outside the provider throws an explicit error.

## Scope and logout

Changing cache, namespace or key hides the previous resource immediately during render; effects release old ownership and acquire the new scope. The core guards ignored late completions. Namespace changes do not delete persistence or evict a previous account's retained idle entries automatically.

For logout, remove the old account's UI, then await cache.invalidateNamespace(oldNamespace). [clearAccountMedia source](../../examples/create-cache.ts) follows that boundary. With required persistence, cleanup errors reject and must be handled by the application. Once all consumers have gone, the application owner may dispose the cache at shutdown. Provider unmount only releases its descendants' handles, allowing caller-owned caches to remain useful elsewhere.

## SSR and StrictMode

The public entry retains a use client directive for frameworks with React Server
Components. Create the cache in client application code; a MediaCache instance
cannot be serialized from a server component as a prop. No Next.js dependency is
required, and a specific framework integration has not been tested.

SSR renders loading/idle fallbacks without acquiring media, creating URLs or touching CacheStorage. Use request-scoped application state on the server and a stable client cache during hydration. Browser object URLs are not serialized into HTML. Loading and idle fallbacks must be deterministic on the server and first client render.

React development StrictMode effect replay is handled by the core hook. The runnable checks exercise shared ownership, partial unmount, account replacement, logout, failures, null keys and ignored old completions. [Functional demo source](https://github.com/59Alex/browser-media-cache-react/blob/main/demo/main.jsx) is also present locally at demo/main.jsx; remote availability awaits repository creation.

## Try and verify

```sh
npm run demo
npm run test:package
npx playwright install chromium firefox
npm run test:browser
```

The gallery demo uses synthetic bounded SVG/text fixtures, not a production backend. Its controls switch accounts, display an intentional failure, sign out, and inspect core diagnostics. CI/package verification uses actual packed core and adapter artifacts. [Verification](../VERIFICATION.md) states tested environments and remaining limits.

[← Versions](../index.md) · [README](../../README.md)
