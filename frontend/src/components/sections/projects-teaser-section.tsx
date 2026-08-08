import Link from "next/link";
import { ArrowRight, FolderOpen } from "lucide-react";

import { SelectedProjectRow } from "@/components/projects/selected-project-row";
import { getFeaturedProjects } from "@/features/projects/queries/project.queries";
import type { SectionPreview } from "@/types/portfolio";

type ProjectsTeaserSectionProps = {
  section: SectionPreview;
};

export async function ProjectsTeaserSection({ section }: ProjectsTeaserSectionProps) {
  const featuredProjects = await getFeaturedProjects(3);

  return (
    <section
      id={section.id}
      aria-labelledby="projects-title"
      className="relative scroll-mt-6 overflow-hidden px-5 py-24 sm:px-8 lg:min-h-[88svh] lg:px-[clamp(2rem,4vw,4.5rem)]"
    >
      <div className="mx-auto w-full max-w-[72rem] lg:-translate-x-5 xl:-translate-x-8 2xl:-translate-x-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-[42rem]">
            <p className="text-[0.89rem] font-medium uppercase tracking-[0.42em] text-[#7C8CFF]/70">
              / Projets
            </p>
            <h2
              id="projects-title"
              className="mt-5 text-[clamp(2.5rem,4.8vw,4.75rem)] font-medium leading-[0.96] tracking-[-0.055em] text-slate-50"
            >
              {/* Projets sélectionnés */}
            </h2>
            {/* <p className="mt-6 max-w-[39rem] text-[clamp(1rem,1.05vw,1.1rem)] leading-8 text-[#CBD5E1]/82">
              {section.description}
            </p> */}
          </div>

          <Link
            href="/projects"
            className="group inline-flex min-h-[46px] w-fit items-center justify-center gap-2 rounded-[6px] border border-[#7C8CFF]/36 bg-[rgba(8,13,26,0.5)] px-6 py-2.5 text-[0.83rem] font-medium text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition duration-200 hover:-translate-y-px hover:border-[#7C8CFF]/70 hover:bg-[#3F63DD]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F6BFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080D1A] active:translate-y-0 motion-reduce:transition-none"
          >
            Voir tous les projets
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-[3px] motion-reduce:transition-none" />
          </Link>
        </div>

        {featuredProjects.length > 0 ? (
          <div className="mt-10 lg:mt-12">
            {featuredProjects.map((project, index) => (
              <SelectedProjectRow
                key={project.slug}
                project={project}
                index={index}
              />
            ))}
          </div>
        ) : (
          <div className="mt-12 rounded-[14px] border border-slate-400/10 bg-[#090F1C]/42 px-6 py-10">
            <div className="flex max-w-[44rem] flex-col gap-4 sm:flex-row sm:items-start">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] border border-[#7C8CFF]/20 bg-[#7C8CFF]/8">
                <FolderOpen
                  aria-hidden="true"
                  className="h-5 w-5 text-[#7C8CFF]/78"
                />
              </div>
              <div>
                <h3 className="text-lg font-semibold tracking-[-0.03em] text-slate-50">
                  Sélection en préparation
                </h3>
                {/* <p className="mt-2 text-sm leading-6 text-[#94A3B8]">
                  Les projets sélectionnés seront bientôt disponibles. La
                  page complète restera prête pour explorer la collection dès sa
                  publication.
                </p> */}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
