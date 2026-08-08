import type { SectionPreview } from "@/types/portfolio";

type SectionPlaceholderProps = {
  section: SectionPreview;
};

export function SectionPlaceholder({ section }: SectionPlaceholderProps) {
  return (
    <section
      id={section.id}
      aria-labelledby={`${section.id}-title`}
      className="relative flex min-h-[78svh] scroll-mt-6 items-center overflow-hidden px-5 py-24 sm:px-8 lg:min-h-[86svh] lg:px-[clamp(2rem,4vw,4.5rem)]"
    >
      <div className="mx-auto w-full max-w-[57.5rem] border-t border-slate-400/10 pt-10 lg:-translate-x-5 xl:-translate-x-8 2xl:-translate-x-10">
        <p className="text-xs uppercase tracking-[0.42em] text-[#7C8CFF]/70">
          Section future
        </p>
        <h2
          id={`${section.id}-title`}
          className="mt-5 text-[clamp(2rem,4vw,4.5rem)] font-medium leading-[0.98] tracking-[-0.04em] text-slate-50"
        >
          {section.title}
        </h2>
        <p className="mt-5 max-w-[39rem] text-[clamp(0.95rem,1.15vw,1.08rem)] leading-8 text-slate-400">
          {section.description}
        </p>
      </div>
    </section>
  );
}
