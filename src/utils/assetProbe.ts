const probeCache = new Map<string, Promise<boolean>>();

/**
 * Safely checks whether an optional static file exists in `/public/assets/...`
 * without being fooled by Vite SPA fallback returning `200 OK` with `text/html`.
 */
export function probeStaticAsset(
  url: string | undefined,
  expectedKind: 'binary-or-model' | 'image' | 'video'
): Promise<boolean> {
  if (!url) return Promise.resolve(false);

  // Bundled Vite assets (data: URIs or hashed /assets/ imports with timestamps) are known present
  if (url.startsWith('data:') || url.startsWith('blob:')) {
    return Promise.resolve(true);
  }

  const cacheKey = `${expectedKind}:${url}`;
  const existing = probeCache.get(cacheKey);
  if (existing) return existing;

  const checkPromise = (async () => {
    try {
      const res = await fetch(url, { method: 'HEAD', cache: 'no-cache' });
      if (!res.ok) return false;

      const contentType = (res.headers.get('content-type') || '').toLowerCase();
      if (contentType.includes('text/html') || contentType.includes('text/plain')) {
        return false;
      }

      if (expectedKind === 'image') {
        return contentType.startsWith('image/');
      }
      if (expectedKind === 'video') {
        return contentType.startsWith('video/') || contentType.includes('application/octet-stream');
      }
      // GLB / model
      return (
        contentType.includes('model/') ||
        contentType.includes('application/octet-stream') ||
        (!contentType.includes('text/') && !contentType.includes('json'))
      );
    } catch {
      return false;
    }
  })();

  probeCache.set(cacheKey, checkPromise);
  return checkPromise;
}
