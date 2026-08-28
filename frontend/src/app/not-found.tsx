import Link from "next/link";
import { cookies } from "next/headers";

export default async function NotFound() {
  const cookieStore = await cookies();
  const locale = cookieStore.get("portfolio-locale")?.value === "en" ? "en" : "fr";

  const copy =
    locale === "en"
      ? {
          eyebrow: "/ Not found",
          title: "Page not found",
          body: "The page you are looking for is not available.",
          home: "Back to home",
          projects: "Browse projects",
        }
      : {
          eyebrow: "/ Introuvable",
          title: "Page introuvable",
          body: "La page que vous cherchez n'est pas disponible.",
          home: "Retour à l'accueil",
          projects: "Voir les projets",
        };

  return (
    <main className="relative min-h-svh bg-[var(--background)] px-5 py-24 text-[var(--text-primary)] sm:px-8 lg:px-12">
      <div className="mx-auto flex min-h-[70svh] max-w-[42rem] flex-col justify-center">
        <p className="text-[0.74rem] font-medium uppercase tracking-[0.24em] text-[var(--accent-muted)]">
          {copy.eyebrow}
        </p>
        <h1 className="mt-4 text-[clamp(2.4rem,4vw,4rem)] font-semibold leading-[1.02] tracking-[-0.05em] text-[var(--foreground)]">
          {copy.title}
        </h1>
        <p className="mt-4 max-w-[32rem] text-[0.96rem] leading-7 text-[var(--foreground-muted)]">
          {copy.body}
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            href="/"
            className="selected-project-link inline-flex min-h-8 items-center gap-1.5 border-b border-[rgb(var(--accent-rgb)/0.42)] pb-1 text-[0.78rem] font-medium tracking-[0.04em] text-[var(--home-text-secondary)] focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--home-bg-0)]"
          >
            {copy.home}
          </Link>
          <Link
            href="/projects"
            className="selected-project-link inline-flex min-h-8 items-center gap-1.5 border-b border-[rgb(var(--accent-rgb)/0.42)] pb-1 text-[0.78rem] font-medium tracking-[0.04em] text-[var(--home-text-secondary)] focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--home-bg-0)]"
          >
            {copy.projects}
          </Link>
        </div>
      </div>
    </main>
  );
}
