'use client';

import { CloudSun, Droplets, Gauge, Thermometer, TriangleAlert, Wind } from 'lucide-react';
import { Meter, Panel, PanelBody, PanelHeader, RiskBadge, Skeleton } from '@/components/ui';
import { useApp } from '@/providers/AppProvider';
import { useWeather } from '@/lib/hooks';
import { computeForecast, displayLevel } from '@/lib/forecast';
import { riskColor } from '@/components/ui';
import type { Scan } from '@/lib/db';
import type { StringKey } from '@/lib/i18n';
import { useMemo } from 'react';

/** Live conditions plus the spread forecast they drive — one panel, since the
 *  forecast is meaningless without the weather that produced it. */
export function WeatherPanel({ scans }: { scans: Scan[] | undefined }) {
  const { t } = useApp();
  const { weather, loading, errorKey } = useWeather();

  const forecast = useMemo(
    () => computeForecast(weather, scans?.[0] ?? null, scans?.slice(0, 5) ?? []),
    [weather, scans],
  );

  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader
        title={t('fieldConditions')}
        icon={<CloudSun size={16} />}
        action={<RiskBadge level={forecast.riskLevel} />}
      />
      <PanelBody className="flex flex-1 flex-col gap-4">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-32" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : weather ? (
          <>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[12.5px] text-ink-3">{weather.name}</p>
                <p className="mt-0.5 text-[34px] font-semibold leading-none tracking-[-0.03em] text-ink">
                  {Math.round(weather.main.temp)}°
                </p>
                <p className="mt-1 text-[12.5px] capitalize text-ink-2">{weather.weather[0]?.description}</p>
              </div>
              <p className="shrink-0 text-right text-[12px] text-ink-3">
                {t('feelsLike', Math.round(weather.main.feels_like))}
                <br />
                {t('max')} {Math.round(weather.main.temp_max)}° · {t('min')} {Math.round(weather.main.temp_min)}°
              </p>
            </div>

            <dl className="grid grid-cols-3 gap-2">
              {[
                { icon: <Droplets size={14} />, label: t('humidity'), value: `${weather.main.humidity}%` },
                { icon: <Wind size={14} />, label: t('wind'), value: `${weather.wind.speed} m/s` },
                { icon: <Gauge size={14} />, label: 'hPa', value: `${weather.main.pressure}` },
              ].map((m) => (
                <div key={m.label} className="rounded-lg border border-line bg-panel-2/60 px-2.5 py-2">
                  <dt className="flex items-center gap-1.5 text-[11px] text-ink-3">{m.icon}{m.label}</dt>
                  <dd className="mt-0.5 text-[14px] font-semibold tnum text-ink">{m.value}</dd>
                </div>
              ))}
            </dl>
          </>
        ) : (
          <div className="flex items-start gap-2.5 rounded-lg border border-line bg-panel-2/60 p-3">
            <Thermometer size={16} className="mt-0.5 shrink-0 text-ink-3" />
            <p className="text-[12.5px] leading-relaxed text-ink-2">{t(errorKey ?? 'weatherUnavailable')}</p>
          </div>
        )}

        <div className="mt-auto space-y-3 border-t border-line pt-4">
          <Meter
            value={forecast.riskPercentage}
            color={riskColor(forecast.riskLevel)}
            label={<span className="inline-flex items-center gap-1.5"><TriangleAlert size={13} />{t('spreadRisk')}</span>}
            valueLabel={`${forecast.riskPercentage}% · ${displayLevel(forecast.riskLevel)}`}
          />
          <p className="text-[12.5px] leading-relaxed text-ink-2">{t(forecast.advisoryKey)}</p>
          <ul className="space-y-1">
            {forecast.recommendationKeys.map((k) => (
              <li key={k} className="text-[12.5px] text-ink-3">{t(k as StringKey)}</li>
            ))}
          </ul>
        </div>
      </PanelBody>
    </Panel>
  );
}
