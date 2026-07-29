'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Check, Database, Globe, Info, LogOut, Moon, Palette, Settings as SettingsIcon,
  Shield, Sun, Trash2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Page, PageHeader } from '@/components/shell/AppShell';
import { Button, Modal, Panel, PanelBody, PanelHeader, Toggle } from '@/components/ui';
import { useApp } from '@/providers/AppProvider';
import { useScans } from '@/lib/hooks';
import { db } from '@/lib/db';
import { logout } from '@/lib/auth-actions';
import { LOCALES, LOCALE_NAMES } from '@/lib/i18n';
import { cx } from '@/lib/utils';
import type { StringKey } from '@/lib/i18n';

type Section = 'general' | 'appearance' | 'data' | 'about';

const SECTIONS: { id: Section; key: StringKey; icon: typeof SettingsIcon }[] = [
  { id: 'general', key: 'tabGeneral', icon: SettingsIcon },
  { id: 'appearance', key: 'tabAppearance', icon: Palette },
  { id: 'data', key: 'tabData', icon: Database },
  { id: 'about', key: 'tabAbout', icon: Info },
];

export default function SettingsPage() {
  const { t } = useApp();
  const [section, setSection] = useState<Section>('general');

  return (
    <Page>
      <PageHeader title={t('navSettings')} subtitle={t('settingsSubtitle')} />

      <div className="grid grid-cols-12 gap-4 lg:gap-6">
        {/* left nav — desktop settings pattern, not a flat scroll */}
        <aside className="col-span-12 lg:col-span-3">
          <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
            {SECTIONS.map(({ id, key, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSection(id)}
                className={cx(
                  'flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] font-medium transition',
                  section === id ? 'bg-brand/10 text-brand' : 'text-ink-2 hover:bg-panel-2 hover:text-ink',
                )}
              >
                <Icon size={16} />{t(key)}
              </button>
            ))}
          </nav>
        </aside>

        <div className="col-span-12 space-y-4 lg:col-span-9">
          {section === 'general' && <GeneralSection />}
          {section === 'appearance' && <AppearanceSection />}
          {section === 'data' && <DataSection />}
          {section === 'about' && <AboutSection />}
        </div>
      </div>
    </Page>
  );
}

function Row({ icon, title, desc, children }: { icon: React.ReactNode; title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 shrink-0 text-ink-3">{icon}</span>
        <div className="min-w-0">
          <p className="text-[14px] font-medium text-ink">{title}</p>
          {desc && <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-3">{desc}</p>}
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function GeneralSection() {
  const { t, locale, setLocale } = useApp();
  return (
    <Panel>
      <PanelHeader title={t('language')} icon={<Globe size={16} />} />
      <PanelBody>
        <p className="mb-3 text-[12.5px] text-ink-3">{t('languageDesc')}</p>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {LOCALES.map((l) => (
            <button
              key={l}
              onClick={() => setLocale(l)}
              className={cx(
                'flex items-center justify-between rounded-lg border px-4 py-3 text-left transition',
                locale === l ? 'border-brand bg-brand/8' : 'border-line hover:border-line-strong hover:bg-panel-2',
              )}
            >
              <span className="text-[14px] font-medium text-ink">{LOCALE_NAMES[l]}</span>
              {locale === l && <Check size={17} className="text-brand" />}
            </button>
          ))}
        </div>
      </PanelBody>
    </Panel>
  );
}

function AppearanceSection() {
  const { t, dark, toggleDark } = useApp();
  return (
    <Panel className="divide-y divide-line">
      <PanelHeader title={t('tabAppearance')} icon={<Palette size={16} />} />
      <Row
        icon={dark ? <Moon size={17} /> : <Sun size={17} />}
        title={t('darkMode')}
        desc={t('themeDesc')}
      >
        <Toggle checked={dark} onChange={toggleDark} label={t('darkMode')} />
      </Row>
    </Panel>
  );
}

function DataSection() {
  const { t } = useApp();
  const scans = useScans();
  const [confirm, setConfirm] = useState(false);
  const [cleared, setCleared] = useState(false);

  async function clearAll() {
    await db.scans.clear();
    setConfirm(false);
    setCleared(true);
    setTimeout(() => setCleared(false), 2500);
  }

  return (
    <>
      <Panel>
        <PanelHeader title={t('dataTitle')} icon={<Database size={16} />} />
        <PanelBody className="space-y-4">
          <p className="text-[13px] leading-relaxed text-ink-2">{t('dataDesc')}</p>
          <div className="flex items-center justify-between gap-4 rounded-lg border border-line bg-panel-2/50 px-4 py-3">
            <p className="text-[13px] text-ink-2">{t('storageUsed', scans?.length ?? 0)}</p>
            <Button variant="danger" icon={<Trash2 size={15} />} disabled={!scans?.length} onClick={() => setConfirm(true)}>
              {t('clearLocalData')}
            </Button>
          </div>
          {cleared && (
            <p className="flex items-center gap-1.5 text-[13px] text-risk-safe"><Check size={15} />{t('dataCleared')}</p>
          )}
        </PanelBody>
      </Panel>

      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title={t('clearConfirmTitle')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirm(false)}>{t('cancel')}</Button>
            <Button variant="danger" icon={<Trash2 size={15} />} onClick={clearAll}>{t('confirmClear')}</Button>
          </>
        }
      >
        <p className="text-[13.5px] leading-relaxed text-ink-2">{t('clearConfirmBody')}</p>
      </Modal>
    </>
  );
}

function AboutSection() {
  const { t } = useApp();
  const router = useRouter();
  return (
    <>
      <Panel>
        <PanelHeader title={t('aboutApp')} icon={<Info size={16} />} />
        <PanelBody className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand text-brand-ink">
              <Shield size={20} />
            </span>
            <div>
              <p className="text-[15px] font-semibold text-ink">AgroVision AI</p>
              <p className="text-[12.5px] text-ink-3">v1.0 · Web Platform</p>
            </div>
          </div>
          <p className="text-[13px] leading-relaxed text-ink-2">{t('aboutBody')}</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" href="/privacy" icon={<Shield size={15} />}>{t('privacyPolicy')}</Button>
            <Button variant="secondary" href="/terms">{t('termsOfService')}</Button>
            <Button variant="secondary" href="/support">{t('navSupport')}</Button>
          </div>
        </PanelBody>
      </Panel>

      <Panel>
        <PanelBody>
          <Button variant="ghost" icon={<LogOut size={16} />} className="text-risk-high hover:bg-risk-high/10"
            onClick={async () => { await logout(); router.replace('/login'); }}>
            {t('logout')}
          </Button>
        </PanelBody>
      </Panel>
    </>
  );
}
