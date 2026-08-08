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
          <div className="inline-flex items-center gap-3 text-[0.68rem] font-medium uppercase tracking-[0.42em] text-[#7C8CFF]/70">
            <span aria-hidden="true" className="h-px w-6 bg-[#7C8CFF]/60" />
            <span>{content.eyebrow}</span>
          </div>

          <h2
            id="about-title"
            className="mt-5 text-[clamp(3rem,4.75vw,4.75rem)] font-medium leading-[0.96] tracking-[-0.055em] text-slate-50"
          >
            {content.title}
          </h2>

          <div className="mt-11 max-w-[38rem] space-y-8 text-[clamp(1rem,1.05vw,1.1rem)] leading-8 text-[#CBD5E1]/88">
            {content.paragraphs.map((paragraph, paragraphIndex) => (
              <p key={`about-paragraph-${paragraphIndex}`}>
                {paragraph.map((segment, segmentIndex) => (
                  <span
                    key={`${segment.text}-${segmentIndex}`}
                    className={
                      segment.tone === "strong"
                        ? "font-semibold text-slate-50"
                        : segment.tone === "accent"
                          ? "font-medium text-[#7C8CFF]"
                          : undefined
                    }
                  >
                    {segment.text}
                  </span>
                ))}
              </p>
            ))}
          </div>

          <div className="mt-[3.25rem] h-px max-w-[38rem] bg-[linear-gradient(90deg,rgba(148,163,184,0.1),rgba(148,163,184,0.04),transparent)]" />

          <dl className="mt-9 grid max-w-[38rem] grid-cols-3 gap-5">
            {content.stats.map((stat) => (
              <div key={stat.label} className="grid">
                <dt className="order-2 text-[0.58rem] font-medium uppercase tracking-[0.16em] text-[#64748B]/95">
                  {stat.label}
                </dt>
                <dd className="order-1 mb-2 text-[clamp(1.48rem,1.85vw,1.65rem)] font-semibold leading-none tracking-[-0.03em] text-[#D8E1EC]">
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
                className="inline-flex min-h-8 items-center gap-2 rounded-full border border-slate-400/8 bg-slate-900/20 px-3.5 text-[0.72rem] font-medium tracking-[0.12em] text-[#AAB7C8]/76"
              >
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 rounded-full bg-[#7C8CFF]/80"
                />
                {highlight}
              </li>
            ))}
          </ul>

          <Link
            href={content.cta.href}
            className="group mt-11 inline-flex min-h-[46px] items-center justify-center gap-2 rounded-[6px] border border-[#7C8CFF]/36 bg-[rgba(8,13,26,0.5)] px-6 py-2.5 text-[0.83rem] font-medium text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition duration-200 hover:-translate-y-px hover:border-[#7C8CFF]/70 hover:bg-[#3F63DD]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F6BFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080D1A] active:translate-y-0 motion-reduce:transition-none"
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
              stroke="#7C8CFF"
              strokeDasharray="8 16"
              strokeWidth="1.2"
            />
            <circle cx="372" cy="145" r="2.5" fill="#7C8CFF" />
          </svg>

          <div className="group relative overflow-hidden rounded-[18px] border border-slate-400/10 bg-slate-900/42 p-3 shadow-[0_22px_60px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.035)] transition duration-200 hover:-translate-y-px hover:border-slate-400/14 motion-reduce:transition-none">
            <div className="mb-3 px-1">
              <p className="text-[0.6rem] font-medium uppercase tracking-[0.3em] text-[#94A3B8]/68">
                AI / Data Profile
              </p>
            </div>

            <div className="relative aspect-[4/5] overflow-hidden rounded-[13px] border border-slate-400/8 bg-[#050912]">
              <Image
                src={content.image.src}
                alt={content.image.alt}
                fill
                sizes="(min-width: 1280px) 340px, (min-width: 1024px) 320px, min(88vw, 368px)"
                className="object-cover object-center brightness-[0.93] contrast-[1.02] saturate-[0.92] transition duration-300 group-hover:brightness-[0.95] motion-reduce:transition-none"
                priority={false}
              />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(8,13,26,0.07)_0%,rgba(8,13,26,0.04)_48%,rgba(8,13,26,0.24)_100%)]" />
            </div>

            <div className="px-1 pb-1 pt-4">
              <div>
                <p className="text-sm font-semibold text-slate-50">
                  {content.signature}
                </p>
                <p className="mt-1 text-xs font-medium tracking-[0.12em] text-[#94A3B8]/78">
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
