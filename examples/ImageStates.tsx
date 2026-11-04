import { useRef, useState } from 'react';
import { CachedImage } from '@59alex/browser-media-cache-react';

// EN: Mount under MediaCacheProvider; changing the React key retries without changing media identity.
// RU: Смонтируйте внутри MediaCacheProvider; смена React key повторяет попытку, не меняя идентичность медиа.
export function ImageStates({ mediaKey }: { mediaKey: string | null }) {
  const image = useRef<HTMLImageElement>(null);
  const [attempt, setAttempt] = useState(0);
  const [description, setDescription] = useState('');
  return <>
    <CachedImage key={attempt} ref={image} mediaKey={mediaKey} alt="Attachment preview"
      width={128} height={128}
      idleFallback={<span>No preview selected</span>}
      loadingFallback={<span role="status">Loading preview…</span>}
      errorFallback={() => <button onClick={() => setAttempt(value => value + 1)}>Retry preview</button>}
      // EN: Native image events concern decoding, not the loader's acquisition promise.
      // RU: События img относятся к декодированию, а не к Promise получения ресурса loader.
      onLoad={() => setDescription('Preview decoded')}
      onError={() => setDescription('The browser could not decode this media')} />
    <button onClick={() => setDescription(image.current ? `${image.current.naturalWidth} pixels wide` : 'No ready image')}>
      Inspect image
    </button>
    <p role="status">{description}</p>
  </>;
}
