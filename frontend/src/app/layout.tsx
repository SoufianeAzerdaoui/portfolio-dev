import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const themeStorageKey = "portfolio-theme";
const themeInitScript = `
(function(){
  try {
    var stored = localStorage.getItem("${themeStorageKey}");
    var theme = stored === "light" || stored === "dark" ? stored : "dark";
    var root = document.documentElement;
    root.setAttribute("data-theme", theme);
    root.style.colorScheme = theme;
  } catch (error) {
    document.documentElement.setAttribute("data-theme", "dark");
    document.documentElement.style.colorScheme = "dark";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      data-theme="dark"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--text-primary)]">
        <a
          href="#main-content"
          className="skip-link sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-[var(--foreground)] focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-[var(--background)] focus:outline-none"
        >
          Aller au contenu
        </a>
        {children}
      </body>
    </html>
  );
}
