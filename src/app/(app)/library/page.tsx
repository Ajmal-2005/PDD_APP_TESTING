'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { BookOpen, Bug, Leaf, Pill, ScanLine, ShieldCheck, Sprout, Wind, Zap } from 'lucide-react';
import { Page, PageHeader } from '@/components/shell/AppShell';
import {
  Badge, Button, EmptyState, Modal, Panel, SearchInput, SegmentedControl, Spinner,
} from '@/components/ui';
import { useApp } from '@/providers/AppProvider';
import { useScans } from '@/lib/hooks';
import { DISEASE_KB, PATHOGEN_TONE, type DiseaseEntry, type Pathogen } from '@/lib/disease-kb';
import { cx } from '@/lib/utils';
import type { StringKey } from '@/lib/i18n';

const PATHOGEN_KEY: Record<Pathogen, StringKey> = {
  fungal: 'pathogenFungal', bacterial: 'pathogenBacterial', viral: 'pathogenViral', pest: 'pathogenPest', none: 'pathogenNone',
};

export default function LibraryPage() {
  return (
    <Suspense fallback={<Page><div className="flex justify-center py-20 text-brand"><Spinner size={26} /></div></Page>}>
      <Library />
    </Suspense>
  );
}

function Library() {
  const { t, locale } = useApp();
  const params = useSearchParams();
  const scans = useScans();

  const [query, setQuery] = useState('');
  const [type, setType] = useState<Pathogen | 'all'>('all');
  const [open, setOpen] = useState<DiseaseEntry | null>(() =>
    params.get('d') ? DISEASE_KB.find((d) => d.id === params.get('d')) ?? null : null,
  );

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of scans ?? []) m.set(s.disease, (m.get(s.disease) ?? 0) + 1);
    return m;
  }, [scans]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DISEASE_KB.filter(
      (d) =>
        (type === 'all' || d.pathogen === type) &&
        (!q || d.name.toLowerCase().includes(q) || d.scientific.toLowerCase().includes(q) || d.summary.toLowerCase().includes(q)),
    );
  }, [query, type]);

  const typeFilters: { value: Pathogen | 'all'; label: string }[] = [
    { value: 'all', label: t('allTypes') },
    { value: 'fungal', label: t('pathogenFungal') },
    { value: 'bacterial', label: t('pathogenBacterial') },
    { value: 'viral', label: t('pathogenViral') },
    { value: 'pest', label: t('pathogenPest') },
  ];

  return (
    <Page>
      <PageHeader title={t('navLibrary')} subtitle={t('librarySubtitle')} />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="min-w-[14rem] flex-1 sm:max-w-sm">
          <SearchInput placeholder={t('searchDiagnoses')} value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <SegmentedControl items={typeFilters} value={type} onChange={setType} />
      </div>

      {filtered.length === 0 ? (
        <Panel><EmptyState icon={<BookOpen size={22} />} title={t('noDiseasesMatch')} hint={t('noMatchHint')} /></Panel>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((d) => {
            const n = counts.get(d.disease) ?? 0;
            return (
              <button
                key={d.id}
                onClick={() => setOpen(d)}
                className="panel group flex flex-col p-0 text-left transition hover:border-line-strong hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3 p-4 pb-3">
                  <div className="flex items-center gap-3">
                    <span className={cx('grid h-10 w-10 shrink-0 place-items-center rounded-lg',
                      d.pathogen === 'none' ? 'bg-risk-safe/12 text-risk-safe' : 'bg-brand/10 text-brand')}>
                      {d.pathogen === 'pest' ? <Bug size={18} /> : d.pathogen === 'none' ? <Sprout size={18} /> : <Leaf size={18} />}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink transition group-hover:text-brand">{d.name}</p>
                      <p className="truncate text-[12px] italic text-ink-3">{d.scientific}</p>
                    </div>
                  </div>
                </div>
                <p className="flex-1 px-4 text-[13px] leading-relaxed text-ink-2">{d.summary}</p>
                <div className="mt-3 flex items-center gap-2 border-t border-line px-4 py-3">
                  <Badge tone={PATHOGEN_TONE[d.pathogen]}>{t(PATHOGEN_KEY[d.pathogen])}</Badge>
                  {n > 0
                    ? <Badge tone="neutral" icon={<ScanLine size={11} />}>{t('detectedTimes', n)}</Badge>
                    : <span className="text-[11.5px] text-ink-3">{t('neverDetected')}</span>}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <DiseaseModal entry={open} onClose={() => setOpen(null)} detected={open ? counts.get(open.disease) ?? 0 : 0} />
    </Page>
  );
}

function DiseaseModal({ entry, onClose, detected }: { entry: DiseaseEntry | null; onClose: () => void; detected: number }) {
  const { t } = useApp();
  if (!entry) return null;

  return (
    <Modal open={!!entry} onClose={onClose} size="lg" title={entry.name} description={entry.scientific}>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={PATHOGEN_TONE[entry.pathogen]}>{t(PATHOGEN_KEY[entry.pathogen])}</Badge>
          {detected > 0
            ? <Badge tone="neutral" icon={<ScanLine size={11} />}>{t('detectedTimes', detected)}</Badge>
            : <Badge tone="neutral">{t('neverDetected')}</Badge>}
        </div>

        <p className="text-[13.5px] leading-relaxed text-ink-2">{entry.summary}</p>

        <div className="flex gap-2.5 rounded-lg border border-brand/25 bg-brand/8 p-3">
          <Zap size={16} className="mt-0.5 shrink-0 text-brand" />
          <p className="text-[13px] leading-relaxed text-ink-2">{entry.action}</p>
        </div>

        <KbSection icon={<Leaf size={15} />} title={t('symptomsLabel')} items={entry.symptoms} />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-line bg-panel-2/50 p-3.5">
            <p className="mb-1 flex items-center gap-1.5 text-[12.5px] font-semibold text-ink"><Wind size={14} className="text-ink-3" />{t('conditionsLabel')}</p>
            <p className="text-[12.5px] leading-relaxed text-ink-2">{entry.conditions}</p>
          </div>
          <div className="rounded-lg border border-line bg-panel-2/50 p-3.5">
            <p className="mb-1 flex items-center gap-1.5 text-[12.5px] font-semibold text-ink"><Bug size={14} className="text-ink-3" />{t('spreadsLabel')}</p>
            <p className="text-[12.5px] leading-relaxed text-ink-2">{entry.spreads}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {entry.treatment.length > 0 && <KbSection icon={<Pill size={15} />} title={t('treatment')} items={entry.treatment} />}
          {entry.prevention.length > 0 && <KbSection icon={<ShieldCheck size={15} />} title={t('prevention')} items={entry.prevention} />}
        </div>

        <Button variant="primary" href="/scan" icon={<ScanLine size={15} />}>{t('navScanCrops')}</Button>
      </div>
    </Modal>
  );
}

function KbSection({ icon, title, items }: { icon: React.ReactNode; title: string; items: string[] }) {
  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold text-ink">{icon}{title}</p>
      <ul className="space-y-1.5">
        {items.map((i) => (
          <li key={i} className="flex gap-2 text-[12.5px] leading-relaxed text-ink-2">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand" />{i}
          </li>
        ))}
      </ul>
    </div>
  );
}
