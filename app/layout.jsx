
import 'leaflet/dist/leaflet.css';
import './globals.css';
import { Fraunces, Inter } from 'next/font/google';

export const metadata = {
  title: 'Savdochi | B2B ulgurji savdo',
  description: 'Ulgurji savdo platformasi',
};

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export default function RootLayout({ children }) {
  return (
    <html lang="uz">
      <body className={`${fraunces.variable} ${inter.variable}`}>
        {children}
      </body>
    </html>
  );
}
