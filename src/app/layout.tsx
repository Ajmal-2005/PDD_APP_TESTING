import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppProvider } from '@/providers/AppProvider';

export const metadata: Metadata = {
  title: { default: 'AgroVision · Smart Fields Better Yields', template: '%s · AgroVision' },
  description: 'Smart fields, better yields. AI-powered farm analytics and crop health forecasting.',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, title: 'AgroVision', statusBarStyle: 'black-translucent' },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f8f7' },
    { media: '(prefers-color-scheme: dark)', color: '#090c0b' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/*
          Applies the stored theme before first paint. Without this the app
          renders in the default dark class and then flips, which is a visible
          flash for anyone who chose light mode.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var d=localStorage.getItem('agrovision.dark');if(d==='false')document.documentElement.classList.remove('dark');var l=localStorage.getItem('agrovision.locale');if(l)document.documentElement.lang=l;}catch(e){}`,
          }}
        />
      </head>
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
