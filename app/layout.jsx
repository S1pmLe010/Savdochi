import "./globals.css";
import { Fraunces, Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
});

export const metadata = {
  title: "Savdochi — B2B ulgurji savdo platformasi",
  description:
    "Ishlab chiqaruvchilar va yetkazib beruvchilar uchun ulgurji savdo platformasi.",
};

export default function Layout({ children }) {
  return (
    <html lang="uz">
      <body className={`${inter.variable} ${fraunces.variable}`}>
        {children}
      </body>
    </html>
  );
}
