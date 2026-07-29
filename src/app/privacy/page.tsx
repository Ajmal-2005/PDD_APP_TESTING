'use client';

import { LegalPage } from '@/components/LegalPage';
import { useApp } from '@/providers/AppProvider';

// Text ported from ui/legal/PrivacyPolicyScreen.kt.
const SECTIONS = [
  { heading: 'Information We Collect', body: 'AgroVision AI collects data related to tomato leaf images, location for weather accuracy, and basic profile information to provide personalized agricultural insights.' },
  { heading: 'Image Processing', body: 'Images uploaded are processed locally or on secure servers to identify plant diseases. These images may be used to improve our AI models anonymously.' },
  { heading: 'Location Data', body: 'We access your location to provide real-time weather forecasts and regional disease risk alerts. This data is not shared with third parties.' },
  { heading: 'Data Security', body: 'We implement industry-standard security measures to protect your information from unauthorized access.' },
  { heading: 'Contact', body: 'If you have any questions regarding your privacy, please contact support@agrovisionai.com.' },
];

export default function PrivacyPolicyScreen() {
  const { t } = useApp();
  return <LegalPage title={t('privacyPolicy')} sections={SECTIONS} footer="Last updated: July 2026" />;
}
