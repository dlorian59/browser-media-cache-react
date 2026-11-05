'use client';

export { MediaPreview, MediaGallery } from './preview.js';
export type { MediaKind, MediaLanguage, MediaPreviewProps, MediaGalleryProps, MediaGalleryItem } from './preview.js';

import { forwardRef, useMemo } from "react";
import type { ImgHTMLAttributes, ReactNode } from "react";
import type { MediaResource } from "@59alex/browser-media-cache";
import { useMedia } from "@59alex/browser-media-cache/react";
import type { MediaState } from "@59alex/browser-media-cache/react";

import { MediaContext, useMediaScope } from './context.js';
import type { Scope } from './context.js';

export interface MediaCacheProviderProps extends Scope { readonly children: ReactNode }

/** The caller owns cache lifetime and explicit logout invalidation. This provider only supplies scope. */
export function MediaCacheProvider({ cache, namespace, children }: MediaCacheProviderProps): ReactNode {
  if (typeof namespace !== "string" || namespace.length === 0) throw new TypeError("namespace must be a non-empty string");
  const scope = useMemo(() => ({ cache, namespace }), [cache, namespace]);
  return <MediaContext.Provider value={scope}>{children}</MediaContext.Provider>;
}

/** Use the core hook unchanged: effect acquisition, generation guards and cleanup stay in the core. */
export function useCachedMedia(mediaKey: string | null): MediaState {
  const scope = useMediaScope();
  return useMedia(scope.cache, scope.namespace, mediaKey);
}

export interface MediaBoundaryProps {
  readonly mediaKey: string | null;
  readonly children: (resource: MediaResource) => ReactNode;
  readonly loadingFallback?: ReactNode;
  readonly idleFallback?: ReactNode;
  readonly errorFallback?: ReactNode | ((error: unknown) => ReactNode);
}

/** Render a resource only while the existing hook owns it; null keys disable acquisition. */
export function MediaBoundary({ mediaKey, children, loadingFallback = null,
  idleFallback = null, errorFallback = null }: MediaBoundaryProps): ReactNode {
  const state = useCachedMedia(mediaKey);
  switch (state.status) {
    case "idle": return idleFallback;
    case "loading": return loadingFallback;
    case "error": return typeof errorFallback === "function" ? errorFallback(state.error) : errorFallback;
    case "ready": return children(state.resource);
  }
}

export interface CachedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>,
  "src" | "srcSet" | "alt" | "children" | "dangerouslySetInnerHTML">,
  Omit<MediaBoundaryProps, "children"> {
  /** Describe meaningful content; use an empty string for decorative images. */
  readonly alt: string;
}

/** Native image props and ref apply only to the ready image; fallback markup belongs to the caller. */
export const CachedImage = forwardRef<HTMLImageElement, CachedImageProps>(function CachedImage(
  { mediaKey, loadingFallback, idleFallback, errorFallback, ...imageProps }, ref,
) {
  return <MediaBoundary mediaKey={mediaKey} loadingFallback={loadingFallback}
    idleFallback={idleFallback} errorFallback={errorFallback}>
    {resource => <img {...imageProps} src={resource.url} srcSet={undefined} ref={ref} />}
  </MediaBoundary>;
});

export type { MediaResource, MediaState };
