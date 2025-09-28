import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Forr First",
  description: "RCRB Car Price by Forr First",
  icons: {
    icon: [
      { url: '/logoNobg.png', sizes: '16x16', type: 'image/png' },
      { url: '/logoNobg.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/logoNobg.png',
    apple: '/logoNobg.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
