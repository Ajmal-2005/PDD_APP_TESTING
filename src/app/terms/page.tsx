'use client';

import { LegalPage } from '@/components/LegalPage';
import { useApp } from '@/providers/AppProvider';

// Text ported from ui/legal/TermsOfServiceScreen.kt.
const SECTIONS = [
  { heading: 'Acceptance of Terms', body: 'By using AgroVision AI, you agree to comply with these terms. The app is provided to assist in tomato leaf disease detection but should not be the sole basis for critical agricultural decisions.' },
  { heading: 'User Responsibilities', body: 'Users are responsible for the accuracy of the images provided and for following local agricultural regulations when applying suggested treatments.' },
  { heading: 'Limitation of Liability', body: 'AgroVision AI is not liable for any crop loss or financial damage resulting from the use of its predictions or weather data.' },
  { heading: 'Intellectual Property', body: 'All content, including AI models and UI design, is the property of AgroVision AI.' },
  { heading: 'Account Suspension', body: 'We reserve the right to suspend accounts that violate our terms or misuse the application.' },
];

export default function TermsOfServiceScreen() {
  const { t } = useApp();
  return <LegalPage title={t('termsOfService')} sections={SECTIONS} footer="Last updated: July 2026" />;
}
