import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import type { Locale } from "@/i18n/messages";
import { ThemeProvider, THEME_BOOT_SCRIPT } from "@/theme/ThemeProvider";

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
      // Theme boot script writes here on the server-rendered HTML, then the
      // inline <script> runs pre-paint to set the right `.dark` class.
      suppressHydrationWarning
    >
      <head>
        {/* No-FOUC theme boot — must run BEFORE the body paints. */}
        <script
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <LocaleProvider initialLocale={initialLocale}>
            {children}
          </LocaleProvider>
          <Toaster
            richColors
            closeButton
            position="bottom-right"
            theme="system"
            toastOptions={{
              classNames: {
                toast:
                  'border border-slate-200 dark:border-slate-700 shadow-[0_8px_30px_-4px_rgba(15,23,42,0.12)]',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
