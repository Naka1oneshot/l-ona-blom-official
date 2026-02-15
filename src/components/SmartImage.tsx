import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { blurImage, generateSrcSet } from '@/lib/imageOptim';

/* ------------------------------------------------------------------ */
/*  L1 cache – in-memory Set (instant, lost on refresh)               */
/* ------------------------------------------------------------------ */
const memoryCache = new Set<string>();

/* ------------------------------------------------------------------ */
/*  L2 cache – IndexedDB (persistent across sessions, 7-day TTL)      */
/* ------------------------------------------------------------------ */
const DB_NAME = 'SmartImageCache';
const DB_VERSION = 1;
const STORE = 'urls';
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve(req.result);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'url' });
        }
      };
    } catch {
      // IndexedDB unavailable (SSR, privacy mode) — fail silently
      reject(new Error('IndexedDB unavailable'));
    }
  });
  return dbPromise;
}

async function idbHas(url: string): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise(resolve => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(url);
      req.onsuccess = () => {
        const row = req.result;
        if (!row) return resolve(false);
        if (Date.now() - row.ts > TTL_MS) {
          // expired — remove async
          idbAdd(url).catch(() => {}); // will overwrite with fresh ts
          resolve(false);
        } else {
          memoryCache.add(url); // promote to L1
          resolve(true);
        }
      };
      req.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

async function idbAdd(url: string) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put({ url, ts: Date.now() });
  } catch {
    // ignore
  }
}

/* ------------------------------------------------------------------ */
/*  Hydrate L1 cache from L2 on startup (async, non-blocking)        */
/* ------------------------------------------------------------------ */
openDB()
  .then(db => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => {
      const now = Date.now();
      for (const row of req.result ?? []) {
        if (now - row.ts < TTL_MS) memoryCache.add(row.url);
      }
    };
  })
  .catch(() => {});

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */
interface SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string | undefined | null;
  alt: string;
  sizes?: string;
  priority?: boolean;
  fallbackClassName?: string;
}

const SmartImage = ({
  src,
  alt,
  className,
  sizes,
  priority = false,
  fallbackClassName,
  style,
  ...rest
}: SmartImageProps) => {
  const alreadyCached = !!(src && memoryCache.has(src));
  const [loaded, setLoaded] = useState(alreadyCached);
  const [error, setError] = useState(false);
  const [inView, setInView] = useState(priority || alreadyCached);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check IndexedDB on mount if not in memory cache
  useEffect(() => {
    if (!src || alreadyCached || loaded) return;
    let cancelled = false;
    idbHas(src).then(hit => {
      if (hit && !cancelled) {
        memoryCache.add(src);
        setLoaded(true);
      }
    });
    return () => { cancelled = true; };
  }, [src, alreadyCached, loaded]);

  // IntersectionObserver with rootMargin for prefetching
  useEffect(() => {
    if (inView || priority) return;
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px', threshold: 0.01 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [inView, priority]);

  const handleLoad = useCallback(() => {
    if (!src) return;
    memoryCache.add(src);
    idbAdd(src);
    setLoaded(true);
  }, [src]);

  if (!src || error) {
    return (
      <div
        className={cn('bg-muted', className, fallbackClassName)}
        style={style}
        aria-hidden="true"
      />
    );
  }

  const srcSet = generateSrcSet(src);

  return (
    <div ref={containerRef} className={cn('relative overflow-hidden', className)} style={style}>
      {/* Blur placeholder — tiny 20px image */}
      {!loaded && inView && (
        <img
          src={blurImage(src)}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover blur-xl scale-110"
          style={{ imageRendering: 'auto' }}
        />
      )}
      {/* Shimmer fallback if blur hasn't loaded yet */}
      {!loaded && !inView && (
        <div className="absolute inset-0 bg-muted animate-pulse" aria-hidden="true" />
      )}
      {inView && (
        <img
          src={src}
          alt={alt}
          srcSet={srcSet || undefined}
          sizes={sizes}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'low'}
          onLoad={handleLoad}
          onError={() => setError(true)}
          className={cn(
            'w-full h-full object-cover',
            alreadyCached
              ? 'opacity-100'
              : loaded
                ? 'opacity-100 transition-opacity duration-500'
                : 'opacity-0',
          )}
          style={{ imageRendering: 'auto' }}
          {...rest}
        />
      )}
    </div>
  );
};

export default SmartImage;
