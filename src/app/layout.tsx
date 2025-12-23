import type { Metadata } from 'next';
import { Comfortaa } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const comfortaa = Comfortaa({
  variable: '--font-comfortaa',
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  preload: true
});

export const metadata: Metadata = {
  title: 'GiaoDien Admin',
  description: 'Modern admin dashboard built with Next.js'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${comfortaa.variable} font-sans antialiased`} suppressHydrationWarning>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
