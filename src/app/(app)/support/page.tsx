'use client';

import { useState } from 'react';
import { ChevronDown, LifeBuoy, Mail, MessageSquare } from 'lucide-react';
import { Page, PageHeader } from '@/components/shell/AppShell';
import { Button, Panel, PanelBody, PanelHeader } from '@/components/ui';
import { useApp } from '@/providers/AppProvider';
import { cx } from '@/lib/utils';
import type { StringKey } from '@/lib/i18n';

// Reuses the same scan-quality guidance the workspace shows, framed as FAQ.
const FAQ: { q: string; a: StringKey }[] = [
  { q: 'Why is my confidence score low?', a: 'scanTip1' },
  { q: 'How should I light the leaf?', a: 'scanTip2' },
  { q: 'What backgrounds work best?', a: 'scanTip3' },
  { q: 'Does my image leave the device?', a: 'aboutBody' },
];

export default function SupportPage() {
  const { t } = useApp();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <Page>
      <PageHeader title={t('navSupport')} subtitle={t('supportSubtitle')} />

      <div className="grid grid-cols-12 gap-4 lg:gap-5">
        <div className="col-span-12 lg:col-span-7">
          <Panel>
            <PanelHeader title={t('faqTitle')} icon={<MessageSquare size={16} />} />
            <div className="divide-y divide-line">
              {FAQ.map((f, i) => (
                <div key={f.q}>
                  <button
                    onClick={() => setOpen(open === i ? null : i)}
                    className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left transition hover:bg-panel-2/50"
                    aria-expanded={open === i}
                  >
                    <span className="text-[13.5px] font-medium text-ink">{f.q}</span>
                    <ChevronDown size={16} className={cx('shrink-0 text-ink-3 transition', open === i && 'rotate-180')} />
                  </button>
                  {open === i && (
                    <p className="animate-fade-in px-5 pb-4 text-[13px] leading-relaxed text-ink-2">{t(f.a)}</p>
                  )}
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="col-span-12 lg:col-span-5">
          <Panel className="h-full">
            <PanelHeader title={t('contactTitle')} icon={<LifeBuoy size={16} />} />
            <PanelBody className="flex h-full flex-col">
              <p className="text-[13px] leading-relaxed text-ink-2">{t('contactBody')}</p>
              <div className="mt-4 flex items-center gap-3 rounded-lg border border-line bg-panel-2/50 p-3.5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand"><Mail size={18} /></span>
                <div className="min-w-0">
                  <p className="text-[12px] text-ink-3">Email</p>
                  <a href="mailto:support@agrovision.ai" className="truncate text-[13.5px] font-medium text-ink transition hover:text-brand">
                    support@agrovision.ai
                  </a>
                </div>
              </div>
              <Button href="mailto:support@agrovision.ai" variant="primary" icon={<Mail size={15} />} className="mt-4">
                {t('emailUs')}
              </Button>
            </PanelBody>
          </Panel>
        </div>
      </div>
    </Page>
  );
}
