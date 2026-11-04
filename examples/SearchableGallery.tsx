import { memo, useDeferredValue, useId, useState } from 'react';
import type { MediaCache } from '@59alex/browser-media-cache';
import { CachedImage, MediaCacheProvider } from '@59alex/browser-media-cache-react';

export interface AttachmentItem {
  readonly id: string;
  readonly mediaKey: string;
  readonly label: string;
}

// EN: Stable items let memo skip unchanged results during urgent keystroke renders.
// RU: Стабильный items позволяет memo пропускать неизменный список при срочном render ввода.
const Results = memo(function Results({ items, query }: {
  items: readonly AttachmentItem[]; query: string;
}) {
  const needle = query.trim().toLocaleLowerCase();
  const matches = items.filter(item => item.label.toLocaleLowerCase().includes(needle));
  return <>
    <p>{matches.length} attachments</p>
    <ul>
      {matches.map(item => <li key={item.id}>
        <CachedImage mediaKey={item.mediaKey} alt="" width={64} height={64}
          loadingFallback={<span>Loading preview…</span>}
          errorFallback={<span>Preview unavailable</span>} />
        <span>{item.label}</span>
      </li>)}
    </ul>
  </>;
});

export function SearchableGallery({ cache, namespace, items }: {
  cache: MediaCache; namespace: string; items: readonly AttachmentItem[];
}) {
  const inputId = useId();
  const [query, setQuery] = useState('');
  // EN: Defer only text filtering. Account scope and the account's item list stay current.
  // RU: Откладывается только текстовый фильтр. Область аккаунта и его список остаются актуальными.
  const deferredQuery = useDeferredValue(query);
  const updating = query !== deferredQuery;
  return <MediaCacheProvider cache={cache} namespace={namespace}>
    <section aria-label="Search attachments">
      <label htmlFor={inputId}>Filter attachments</label>
      <input id={inputId} value={query} onChange={event => setQuery(event.target.value)} />
      <p role="status">{updating ? 'Updating results…' : 'Results up to date'}</p>
      <div aria-busy={updating}><Results items={items} query={deferredQuery} /></div>
    </section>
  </MediaCacheProvider>;
}
