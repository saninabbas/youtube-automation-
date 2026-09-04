import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppShell } from '@/components/AppShell';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#07080b',
};

export const metadata: Metadata = {
  title: 'AutoVideo.ai — Turn Ideas into 1080p YouTube Videos in 60 Seconds',
  description:
    'Autonomous AI video generator with neural voiceover, cinematic B-roll composition, dynamic subtitles, custom thumbnails, and 30-day scheduled YouTube publishing.',
  keywords: [
    'AI Video Generator',
    'YouTube Automation',
    'FFmpeg 1080p',
    'Video Studio',
    'Neural Voiceover',
    'Content Calendar',
    'AutoVideo',
  ],
  authors: [{ name: 'AutoVideo.ai Team' }],
  openGraph: {
    title: 'AutoVideo.ai — Autonomous AI Video Studio & YouTube Autopilot',
    description:
      'Create and auto-publish broadcast-quality 1080p YouTube videos on a 30-day autopilot calendar with viral scripts, neural voices, and native FFmpeg rendering.',
    type: 'website',
    url: 'https://autovideo.ai',
    siteName: 'AutoVideo.ai',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AutoVideo.ai — Turn Ideas into 1080p YouTube Videos in 60 Seconds',
    description:
      'Autonomous AI video generation with neural voiceovers, dynamic subtitles, and 30-day YouTube auto-publishing.',
  },
  icons: {
    icon: '/favicon.ico',
  },
};

import { ToastProvider } from '@/components/Toast';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <AppShell>{children}</AppShell>
        </ToastProvider>
      </body>
    </html>
  );
}
