'use client';

import { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';
import { cx } from '@/lib/utils';

/**
 * Scan thumbnail, resolved from the best source available.
 *
 * Three tiers, in order:
 *   1. `src`      - the base64 copy held by the device that took the scan. Instant.
 *   2. `remoteSrc` - the Firebase Storage URL, so a scan taken on the phone still shows
 *                    its picture in the browser (and the reverse).
 *   3. placeholder - neither available, or the remote fetch failed.
 *
 * The local copy wins when present because it needs no network and cannot fail. The
 * remote URL only carries the picture; the diagnosis still travels in the Firestore
 * document, since base64 would exceed the 1 MB document limit.
 */
export function ScanThumb({ src, remoteSrc, alt = '', className, iconSize = 18 }: {
  src?: string; remoteSrc?: string; alt?: string; className?: string; iconSize?: number;
}) {
  const local = src?.trim() ? src : undefined;
  const remote = remoteSrc?.trim() ? remoteSrc : undefined;

  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // A new row can arrive in the same mounted component (live queries reuse it), so reset
  // the error state when the source changes or a retry would be stuck on a stale failure.
  useEffect(() => { setFailed(false); setLoaded(false); }, [local, remote]);

  const chosen = local ?? (failed ? undefined : remote);

  if (chosen) {
    return (
      <span className={cx('relative block overflow-hidden', className)}>
        {/* Remote images arrive over the network, so hold a shimmer until the first
            paint rather than flashing an empty box. Local data URLs decode instantly
            and skip this entirely. */}
        {!local && !loaded && <span className="skeleton absolute inset-0" aria-hidden />}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={chosen}
          alt={alt}
          className={cx('h-full w-full object-cover', !local && !loaded && 'opacity-0')}
          // A dead or expired Storage URL must degrade to the placeholder, never to the
          // browser's broken-image icon.
          onError={() => setFailed(true)}
          onLoad={() => setLoaded(true)}
        />
      </span>
    );
  }

  return (
    <div
      className={cx('grid place-items-center bg-panel-2 text-ink-3', className)}
      title="No image available for this scan"
      role="img"
      aria-label="Image unavailable"
    >
      <ImageOff size={iconSize} />
    </div>
  );
}
