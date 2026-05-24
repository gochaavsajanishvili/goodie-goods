import {
  DM_Sans,
  Fraunces,
  JetBrains_Mono,
  Noto_Sans_Georgian,
  Noto_Serif_Georgian,
} from 'next/font/google';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import './globals.css';

const georgianSerif = Noto_Serif_Georgian({
  weight: ['400', '500', '600', '700'],
  subsets: ['georgian', 'latin'],
  variable: '--font-georgian-serif',
  display: 'swap',
});

const georgianSans = Noto_Sans_Georgian({
  weight: ['300', '400', '500', '600'],
  subsets: ['georgian', 'latin'],
  variable: '--font-georgian-sans',
  display: 'swap',
});

const fraunces = Fraunces({
  weight: ['300', '400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
});

const dmSans = DM_Sans({
  weight: ['400', '500'],
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  weight: ['400', '500'],
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'კარგი ამბები',
  description: 'მხოლოდ თბილი, სასიამოვნო და სასარგებლო ამბები ambebi.ge-დან.',
  robots: { index: true, follow: false },
};

const THEME_BOOT_SCRIPT = `
  (function () {
    try {
      var stored = localStorage.getItem('goodie-goods-theme');
      var preferred = stored === 'light' || stored === 'dark'
        ? stored
        : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      document.documentElement.dataset.theme = preferred;
    } catch (e) {
      document.documentElement.dataset.theme = 'light';
    }
  })();
`;

export default function RootLayout({ children }: { readonly children: ReactNode }) {
  const fontClasses = [
    georgianSerif.variable,
    georgianSans.variable,
    fraunces.variable,
    dmSans.variable,
    jetbrainsMono.variable,
  ].join(' ');

  return (
    <html lang="ka" className={fontClasses} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
