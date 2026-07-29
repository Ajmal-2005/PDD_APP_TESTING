'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CornerDownLeft, Search } from 'lucide-react';
import { useApp } from '@/providers/AppProvider';
import { useScans } from '@/lib/hooks';
import { ALL_NAV_ITEMS } from './nav';
import { DISEASE_KB } from '@/lib/disease-kb';
import { RiskBadge, useDismiss } from '@/components/ui';
import { cx, formatDate } from '@/lib/utils';
import { diseaseKey } from '@/lib/labels';

interface Hit { id: string; label: string; sub?: string; href: string; group: string; badge?: string }

/** Cmd/Ctrl-K palette: navigation, past scans and the disease library in one index. */
export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, locale } = useApp();
  const router = useRouter();
  const scans = useScans();
  const [q, setQ] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const ref = useDismiss<HTMLDivElement>(open, onClose);

  useEffect(() => {
    if (open) { setQ(''); setCursor(0); setTimeout(() => inputRef.current?.focus(), 10); }
  }, [open]);

  const hits = useMemo<Hit[]>(() => {
    const needle = q.trim().toLowerCase();
    const match = (s: string) => s.toLowerCase().includes(needle);

    const pages: Hit[] = ALL_NAV_ITEMS
      .map((i) => ({ id: i.href, label: t(i.key), href: i.href, group: t('cmdPages') }))
      .filter((h) => !needle || match(h.label));

    const diseases: Hit[] = DISEASE_KB
      .filter((d) => !needle || match(d.name) || match(d.scientific))
      .slice(0, 6)
      .map((d) => ({ id: 'kb-' + d.id, label: d.name, sub: d.scientific, href: `/library?d=${d.id}`, group: t('cmdLibrary') }));

    const recent: Hit[] = (scans ?? [])
      .filter((s) => !needle || match(s.disease) || match(t(diseaseKey(s.disease))))
      .slice(0, 6)
      .map((s) => ({
        id: s.id, label: t(diseaseKey(s.disease)),
        sub: formatDate(s.timestamp, locale), href: `/history/${s.id}`,
        group: t('cmdScans'), badge: s.riskLevel,
      }));

    return [...pages, ...diseases, ...recent];
  }, [q, scans, t, locale]);

  useEffect(() => { setCursor(0); }, [q]);

  if (!open) return null;

  function go(h: Hit) { router.push(h.href); onClose(); }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => Math.min(c + 1, hits.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)); }
    if (e.key === 'Enter' && hits[cursor]) { e.preventDefault(); go(hits[cursor]); }
  }

  let lastGroup = '';

  return (
    <div className="fixed inset-0 z-[110] flex items-start justify-center p-4 pt-[12vh]">
      <div className="fixed inset-0 animate-fade-in bg-black/50 backdrop-blur-[2px]" aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={t('searchEverything')}
        className="relative z-10 w-full max-w-xl animate-rise overflow-hidden rounded-2xl border border-line bg-panel shadow-lg"
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search size={17} className="shrink-0 text-ink-3" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder={t('searchEverything')}
            className="h-12 w-full bg-transparent text-[14.5px] text-ink outline-none placeholder:text-ink-3"
          />
          <kbd className="hidden shrink-0 rounded border border-line bg-panel-2 px-1.5 py-0.5 text-[10.5px] font-medium text-ink-3 sm:block">ESC</kbd>
        </div>

        <div className="max-h-[52vh] overflow-y-auto scroll-thin p-2">
          {hits.length === 0 ? (
            <p className="px-3 py-8 text-center text-[13px] text-ink-3">{t('noResults')}</p>
          ) : hits.map((h, i) => {
            const header = h.group !== lastGroup ? ((lastGroup = h.group), h.group) : null;
            return (
              <div key={h.id}>
                {header && (
                  <p className="px-2.5 pb-1 pt-2.5 text-[10.5px] font-semibold uppercase tracking-wider text-ink-3">{header}</p>
                )}
                <button
                  onClick={() => go(h)}
                  onMouseEnter={() => setCursor(i)}
                  className={cx(
                    'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition',
                    i === cursor ? 'bg-brand/10' : 'hover:bg-panel-2',
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className={cx('truncate text-[13.5px]', i === cursor ? 'text-brand' : 'text-ink')}>{h.label}</p>
                    {h.sub && <p className="truncate text-[11.5px] text-ink-3">{h.sub}</p>}
                  </div>
                  {h.badge && <RiskBadge level={h.badge} size="sm" />}
                  {i === cursor && <CornerDownLeft size={14} className="shrink-0 text-brand" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
