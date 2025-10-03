import type {Metadata} from 'next';
import './globals.css';
import {Toaster} from '@/components/ui/toaster';
import { TranslationProvider } from '@/contexts/translation-context';

export const metadata: Metadata = {
  title: 'PDF Summarizer',
  description: 'AI-powered PDF document summarization.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Overpass:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <TranslationProvider>
          {children}
          <Toaster />
        </TranslationProvider>
      </body>
    </html>
  );
}
