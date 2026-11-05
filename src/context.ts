import { createContext, useContext } from 'react';
import type { MediaCache } from '@59alex/browser-media-cache';

export interface Scope { readonly cache: MediaCache; readonly namespace: string }
export const MediaContext = createContext<Scope | undefined>(undefined);
export function useMediaScope(): Scope {
  const scope = useContext(MediaContext);
  if (!scope) throw new Error('useCachedMedia requires MediaCacheProvider');
  return scope;
}
