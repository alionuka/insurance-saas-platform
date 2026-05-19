import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import type { Locale } from "@/i18n/messages";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: "InsurSaaS — Insurance SaaS Platform",
  description: "AI-powered insurance SaaS platform for companies, agents, and clients.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read locale from cookie on the server so the initial HTML is rendered in
  // the right language (no English-flash on Ukrainian sessions).
  const cookieStore = await cookies();
  const initialLocale: Locale =
    cookieStore.get('locale')?.value === 'uk' ? 'uk' : 'en';

  return (
    <html
      lang={initialLocale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LocaleProvider initialLocale={initialLocale}>
          {children}
        </LocaleProvider>
        <Toaster richColors position="bottom-right" theme="dark" />
      </body>
    </html>
  );
}
