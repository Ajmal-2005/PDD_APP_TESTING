import type { Scan } from './db';
import type { Weather } from './weather';

export interface ForecastState {
  riskPercentage: number;
  riskLevel: string;
  advisoryKey: 'highHumidityAdvisory' | 'moderateHumidityAdvisory' | 'safeConditionsAdvisory';
  recommendationKeys: string[];
}

export const DEFAULT_FORECAST: ForecastState = {
  riskPercentage: 0,
  riskLevel: 'SAFE',
  advisoryKey: 'safeConditionsAdvisory',
  recommendationKeys: ['preventiveAction4'],
};

/** Ported from ForecastViewModel.updateForecast. */
export function computeForecast(weather: Weather | null, latest: Scan | null, recent: Scan[]): ForecastState {
  if (!weather) return DEFAULT_FORECAST;

  let risk = 0;
  if (weather.main.humidity > 80) risk += 30;
  else if (weather.main.humidity > 60) risk += 15;

  // 20-30 C is the band where most tomato fungal pathogens sporulate fastest.
  if (weather.main.temp >= 20 && weather.main.temp <= 30) risk += 20;

  if (latest) {
    if (latest.driScore > 7) risk += 30;
    else if (latest.driScore > 4) risk += 15;
  }
  if (recent.some((s) => s.riskLevel === 'HIGH' || s.riskLevel === 'MEDIUM')) risk += 20;

  const riskPercentage = Math.min(risk, 100);
  const riskLevel = riskPercentage >= 75 ? 'HIGH' : riskPercentage >= 50 ? 'MEDIUM' : riskPercentage >= 25 ? 'LOW' : 'SAFE';
  const advisoryKey =
    riskPercentage >= 75 ? 'highHumidityAdvisory' : riskPercentage >= 40 ? 'moderateHumidityAdvisory' : 'safeConditionsAdvisory';
  const recommendationKeys =
    riskPercentage >= 75
      ? ['preventiveAction3', 'preventiveAction2', 'preventiveAction1']
      : riskPercentage >= 40
      ? ['preventiveAction2', 'preventiveAction1']
      : ['preventiveAction4'];

  return { riskPercentage, riskLevel, advisoryKey: advisoryKey as ForecastState['advisoryKey'], recommendationKeys };
}

export const displayLevel = (level: string) => (level === 'SAFE' ? 'SAFE' : `${level} RISK`);
