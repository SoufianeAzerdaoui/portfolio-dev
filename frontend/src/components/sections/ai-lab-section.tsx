import Link from "next/link";

import type { SectionPreview } from "@/types/portfolio";
import type { SupportedLocale } from "@/types/project";
import type { SocialLink } from "@/types/portfolio";

type AiLabSectionProps = {
  section: SectionPreview;
  locale: SupportedLocale;
  socialLinks?: SocialLink[];
};

const aiLabCopy = {
  fr: {
    status: "Bientôt disponible",
    body: "Un espace dédié à mes expérimentations, prototypes et démonstrations IA.",
    footer: "Disponible pour échanger autour d’une opportunité Data / AI / BI.",
  },
  en: {
    status: "Coming soon",
    body: "A space for AI experiments, prototypes and demonstrations.",
    footer: "Available to discuss Data / AI / BI opportunities.",
  },
} as const satisfies Record<
  SupportedLocale,
  { status: string; body: string; footer: string }
>;

export function AiLabSection({
  section,
  locale,
  socialLinks = [],
}: AiLabSectionProps) {
  const copy = aiLabCopy[locale];

  return (
    <section
      id={section.id}
      aria-labelledby="ai-lab-title"
      className="relative flex min-h-[64svh] scroll-mt-6 items-center overflow-hidden px-5 py-24 sm:px-8 lg:min-h-[72svh] lg:px-[clamp(2rem,4vw,4.5rem)]"
    >
      <div className="relative mx-auto grid w-full max-w-[72rem] gap-12 lg:-translate-x-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(16rem,0.55fr)] lg:items-center lg:gap-24 xl:-translate-x-8 2xl:-translate-x-10">
        <div>
          <p className="text-[0.89rem] font-medium uppercase tracking-[0.42em] text-[var(--accent-muted)]">
            / AI Lab
          </p>
          <h2
            id="ai-lab-title"
            className="mt-5 text-[clamp(2.5rem,4.8vw,4.75rem)] font-medium leading-[0.96] tracking-[-0.055em] text-[var(--foreground)]"
          >
            {section.title}
          </h2>

          <div className="mt-10 max-w-[35rem]">
            <div className="flex items-center gap-4">
              <p className="whitespace-nowrap text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                {copy.status}
              </p>
              <span
                aria-hidden="true"
                className="h-px flex-1 bg-[var(--border-subtle)]"
              />
            </div>
            <p className="mt-5 text-[clamp(1rem,1.05vw,1.08rem)] leading-8 text-[var(--foreground-muted)]">
              {copy.body}
            </p>

            {socialLinks.length > 0 ? (
              <div className="mt-8">
                <p className="text-[0.76rem] font-medium tracking-[0.02em] text-[var(--foreground-secondary)]">
                  {copy.footer}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-[0.76rem] font-medium text-[var(--foreground-muted)]">
                  {socialLinks.map((social) => (
                    <Link
                      key={social.label}
                      href={social.href}
                      target={social.external ? "_blank" : undefined}
                      rel={social.external ? "noopener noreferrer" : undefined}
                      className="selected-project-link inline-flex min-h-7 items-center gap-1.5 border-b border-[rgb(var(--accent-rgb)/0.34)] pb-1 text-[0.74rem] font-medium tracking-[0.04em] text-[var(--home-text-secondary)] focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--home-bg-0)]"
                    >
                      <span>
                        {social.icon === "linkedin"
                          ? "LinkedIn"
                          : social.icon === "github"
                            ? "GitHub"
                            : social.label}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div
          aria-hidden="true"
          className="relative hidden h-[18rem] lg:block"
        >
          <svg
            viewBox="0 0 360 280"
            fill="none"
            className="absolute inset-0 h-full w-full opacity-[0.12]"
          >
            <ellipse
              cx="180"
              cy="140"
              rx="132"
              ry="56"
              stroke="var(--accent)"
              strokeWidth="1"
              strokeDasharray="9 18"
            />
            <ellipse
              cx="180"
              cy="140"
              rx="92"
              ry="122"
              stroke="var(--foreground-muted)"
              strokeWidth="1"
              strokeDasharray="5 16"
              transform="rotate(38 180 140)"
            />
            <circle cx="92" cy="126" r="2.5" fill="var(--accent)" />
            <circle cx="266" cy="169" r="2" fill="var(--foreground-muted)" />
            <path
              d="M117 143C141 103 162 104 180 140C198 176 219 177 243 137"
              stroke="var(--foreground)"
              strokeWidth="1.2"
              strokeLinecap="round"
              opacity="0.42"
            />
          </svg>
        </div>
      </div>
    </section>
  );
}
