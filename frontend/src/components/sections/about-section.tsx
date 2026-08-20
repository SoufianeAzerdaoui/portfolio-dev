import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { AboutSectionContent } from "@/types/portfolio";

type AboutSectionProps = {
  content: AboutSectionContent;
};

export function AboutSection({ content }: AboutSectionProps) {
  return (
    <section
      id={content.id}
      aria-labelledby="about-title"
      className="relative scroll-mt-6 overflow-hidden px-5 py-24 sm:px-8 lg:min-h-[100svh] lg:px-[clamp(2rem,4vw,4.5rem)] lg:py-32"
    >
      <div className="relative mx-auto grid w-full max-w-[72rem] gap-14 lg:-translate-x-5 lg:grid-cols-[minmax(0,1.02fr)_minmax(20.5rem,0.68fr)] lg:gap-28 xl:-translate-x-8 2xl:-translate-x-10">
        <div className="max-w-[42rem]">
          <div className="inline-flex items-center gap-3 text-[0.68rem] font-medium uppercase tracking-[0.42em] text-[var(--accent-muted)]">
            <span aria-hidden="true" className="h-px w-6 bg-[var(--accent)] opacity-60" />
            <span>{content.eyebrow}</span>
          </div>

          <h2
            id="about-title"
            className="mt-5 text-[clamp(3rem,4.75vw,4.75rem)] font-medium leading-[0.96] tracking-[-0.055em] text-[var(--foreground)]"
          >
            {content.title}
          </h2>

          <div className="mt-11 max-w-[38rem] space-y-8 text-[clamp(1rem,1.05vw,1.1rem)] leading-8 text-[var(--foreground-muted)]">
            {content.paragraphs.map((paragraph, paragraphIndex) => (
              <p key={`about-paragraph-${paragraphIndex}`}>
                {paragraph.map((segment, segmentIndex) => (
                  <span
                    key={`${segment.text}-${segmentIndex}`}
                    className={
                      segment.tone === "strong"
                        ? "font-semibold text-[var(--foreground)]"
                        : segment.tone === "accent"
                          ? "font-medium text-[var(--accent)]"
                          : undefined
                    }
                  >
                    {segment.text}
                  </span>
                ))}
              </p>
            ))}
          </div>

          <div className="mt-[3.25rem] h-px max-w-[38rem] bg-[linear-gradient(90deg,var(--border-subtle),var(--border-muted),transparent)]" />

          <dl className="mt-9 grid max-w-[38rem] grid-cols-3 gap-5">
            {content.stats.map((stat) => (
              <div key={stat.label} className="grid">
                <dt className="order-2 text-[0.58rem] font-medium uppercase tracking-[0.16em] text-[var(--foreground-subtle)]">
                  {stat.label}
                </dt>
                <dd className="order-1 mb-2 text-[clamp(1.48rem,1.85vw,1.65rem)] font-semibold leading-none tracking-[-0.03em] text-[var(--foreground)]">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>

          <ul
            aria-label="Domaines principaux"
            className="mt-10 flex max-w-[38rem] flex-wrap gap-x-2.5 gap-y-2"
          >
            {content.highlights.map((highlight) => (
              <li
                key={highlight}
                className="inline-flex min-h-8 items-center gap-2 rounded-full border border-[var(--border-muted)] bg-[var(--surface-elevated)] px-3.5 text-[0.72rem] font-medium tracking-[0.12em] text-[var(--foreground-muted)]"
              >
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] opacity-80"
                />
                {highlight}
              </li>
            ))}
          </ul>

          <Link
            href={content.cta.href}
            className="group mt-11 inline-flex min-h-[46px] items-center justify-center gap-2 rounded-[6px] border border-[var(--button-secondary-border)] bg-[var(--button-secondary-bg)] px-6 py-2.5 text-[0.83rem] font-medium text-[var(--foreground)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition duration-200 hover:-translate-y-px hover:border-[var(--accent-muted)] hover:bg-[var(--button-secondary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--focus-ring-offset)] active:translate-y-0 motion-reduce:transition-none"
          >
            <span>{content.cta.label}</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-[3px] motion-reduce:transition-none" />
          </Link>
        </div>

        <figure className="relative mx-auto w-full max-w-[23rem] lg:mx-0 lg:ml-auto lg:mt-24">
          <svg
            aria-hidden="true"
            viewBox="0 0 440 520"
            fill="none"
            className="pointer-events-none absolute -right-8 -top-10 hidden h-[32rem] w-[26rem] opacity-[0.08] lg:block"
          >
            <ellipse
              cx="218"
              cy="252"
              rx="186"
              ry="228"
              stroke="var(--accent)"
              strokeDasharray="8 16"
              strokeWidth="1.2"
            />
            <circle cx="372" cy="145" r="2.5" fill="var(--accent)" />
          </svg>

          <div className="group relative overflow-hidden rounded-[18px] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-3 shadow-[var(--shadow-portrait)] transition duration-200 hover:-translate-y-px hover:border-[var(--border-strong)] motion-reduce:transition-none">
            <div className="mb-3 px-1">
              <p className="text-[0.6rem] font-medium uppercase tracking-[0.3em] text-[var(--foreground-muted)] opacity-75">
                AI / Data Profile
              </p>
            </div>

            <div className="relative aspect-square overflow-hidden rounded-[13px] border border-[var(--border-muted)] bg-[var(--media-frame)]">
              <Image
                src={content.image.src}
                alt={content.image.alt}
                fill
                sizes="(min-width: 1280px) 420px, (min-width: 1024px) 380px, min(88vw, 368px)"
                quality={100}
                className="object-cover object-center"
                priority={false}
              />
            </div>

            <div className="px-1 pb-1 pt-4">
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  {content.signature}
                </p>
                <p className="mt-1 text-xs font-medium tracking-[0.12em] text-[var(--foreground-muted)]">
                  M2 SIAD · ISIMA
                </p>
              </div>
            </div>
          </div>

          <figcaption className="sr-only">{content.image.alt}</figcaption>
        </figure>
      </div>
    </section>
  );
}
