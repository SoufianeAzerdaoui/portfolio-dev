import type { Metadata } from "next";
import localFont from "next/font/local";
import { cookies } from "next/headers";

import { PointerAmbientGlow } from "@/components/layout/pointer-ambient-glow";
import { PreferencesProvider } from "@/components/providers/preferences-provider";
import type {
  LocaleCode,
  MotionPreference,
  ThemePreference,
} from "@/types/portfolio";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const themeStorageKey = "portfolio-theme";
const localeStorageKey = "portfolio-locale";
const motionStorageKey = "portfolio-motion";
const themeInitScript = `
(function(){
  try {
    function readCookie(key) {
      return document.cookie
        .split("; ")
        .find(function(row) { return row.indexOf(key + "=") === 0; })
        ?.split("=")[1];
    }
    var storedTheme = readCookie("${themeStorageKey}") || localStorage.getItem("${themeStorageKey}");
    var themePreference = storedTheme === "light" || storedTheme === "dark" || storedTheme === "system" ? storedTheme : "dark";
    var storedLocale = readCookie("${localeStorageKey}") || localStorage.getItem("${localeStorageKey}");
    var locale = storedLocale === "en" ? "en" : "fr";
    var storedMotion = readCookie("${motionStorageKey}") || localStorage.getItem("${motionStorageKey}");
    var motionPreference = storedMotion === "reduced" ? "reduced" : "system";
    var systemTheme = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    var theme = themePreference === "system" ? systemTheme : themePreference;
    var reduceMotion = motionPreference === "reduced" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var root = document.documentElement;
    root.lang = locale;
    root.setAttribute("data-locale", locale);
    root.setAttribute("data-theme", theme);
    root.setAttribute("data-theme-preference", themePreference);
    root.setAttribute("data-motion", reduceMotion ? "reduce" : "system");
    root.setAttribute("data-motion-preference", motionPreference);
    root.style.colorScheme = theme;
  } catch (error) {
    var fallbackRoot = document.documentElement;
    fallbackRoot.lang = "fr";
    fallbackRoot.setAttribute("data-locale", "fr");
    fallbackRoot.setAttribute("data-theme", "dark");
    fallbackRoot.setAttribute("data-theme-preference", "dark");
    fallbackRoot.setAttribute("data-motion", "system");
    fallbackRoot.setAttribute("data-motion-preference", "system");
    fallbackRoot.style.colorScheme = "dark";
  }
})();
`;

const geistSans = localFont({
  src: [
    {
      path: "../../node_modules/next/dist/next-devtools/server/font/geist-latin.woff2",
      weight: "100 900",
      style: "normal",
    },
    {
      path: "../../node_modules/next/dist/next-devtools/server/font/geist-latin-ext.woff2",
      weight: "100 900",
      style: "normal",
    },
  ],
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = localFont({
  src: [
    {
      path: "../../node_modules/next/dist/next-devtools/server/font/geist-mono-latin.woff2",
      weight: "100 900",
      style: "normal",
    },
    {
      path: "../../node_modules/next/dist/next-devtools/server/font/geist-mono-latin-ext.woff2",
      weight: "100 900",
      style: "normal",
    },
  ],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Soufiane Azerdaoui - AI & Data Engineer",
    template: "%s | Soufiane Azerdaoui",
  },
  description:
    "Portfolio de Soufiane Azerdaoui, AI & Data Engineer specialise en Data Science, Machine Learning et NLP.",
  authors: [{ name: "Soufiane Azerdaoui" }],
  openGraph: {
    title: "Soufiane Azerdaoui - AI & Data Engineer",
    description:
      "Portfolio de Soufiane Azerdaoui, AI & Data Engineer specialise en Data Science, Machine Learning et NLP.",
    type: "website",
    locale: "fr_FR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Soufiane Azerdaoui - AI & Data Engineer",
    description:
      "Portfolio de Soufiane Azerdaoui, AI & Data Engineer specialise en Data Science, Machine Learning et NLP.",
  },
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
};

function resolveInitialLocale(value: string | undefined): LocaleCode {
  return value === "en" ? "en" : "fr";
}

function resolveInitialTheme(value: string | undefined): ThemePreference {
  return value === "light" || value === "system" ? value : "dark";
}

function resolveInitialMotion(value: string | undefined): MotionPreference {
  return value === "reduced" ? "reduced" : "system";
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const initialLocale = resolveInitialLocale(
    cookieStore.get(localeStorageKey)?.value,
  );
  const initialTheme = resolveInitialTheme(
    cookieStore.get(themeStorageKey)?.value,
  );
  const initialMotion = resolveInitialMotion(
    cookieStore.get(motionStorageKey)?.value,
  );
  const initialResolvedTheme = initialTheme === "light" ? "light" : "dark";

  return (
    <html
      lang={initialLocale}
      data-locale={initialLocale}
      data-theme={initialResolvedTheme}
      data-theme-preference={initialTheme}
      data-motion={initialMotion === "reduced" ? "reduce" : "system"}
      data-motion-preference={initialMotion}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--text-primary)]">
        <PreferencesProvider
          initialLocale={initialLocale}
          initialTheme={initialTheme}
          initialMotion={initialMotion}
        >
          <PointerAmbientGlow />
          <a
            href="#main-content"
            className="skip-link sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-[var(--foreground)] focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-[var(--background)] focus:outline-none"
          >
            Aller au contenu
          </a>
          {children}
        </PreferencesProvider>
      </body>
    </html>
  );
}
