"use client";

import { HeroSection } from "@/components/home/hero-section";
import { SpaceBackground } from "@/components/home/space-background";
import { PortfolioShell } from "@/components/layout/portfolio-shell";
import { AboutSection } from "@/components/sections/about-section";
import { AiLabSection } from "@/components/sections/ai-lab-section";
import { JourneySection } from "@/components/sections/journey-section";
import { ProjectsTeaserSection } from "@/components/sections/projects-teaser-section";
import { usePreferences } from "@/components/providers/preferences-provider";
import { journeyContentByLocale } from "@/content/journey";
import { portfolioContentByLocale } from "@/content/portfolio";
import type { SectionId, SectionPreview } from "@/types/portfolio";
import type { Project } from "@/types/project";

type PortfolioHomeProps = {
  featuredProjects: Project[];
};

function getSection(
  sections: readonly SectionPreview[],
  sectionId: Exclude<SectionId, "home" | "about">,
) {
  const section = sections.find((item) => item.id === sectionId);

  if (!section) {
    throw new Error(`Missing portfolio section: ${sectionId}`);
  }

  return section;
}

export function PortfolioHome({ featuredProjects }: PortfolioHomeProps) {
  const { locale } = usePreferences();
  const content = portfolioContentByLocale[locale];
  const journeyContent = journeyContentByLocale[locale];

  return (
    <>
      <SpaceBackground variant="home" />
      <PortfolioShell content={content}>
        <HeroSection content={content} />
        <AboutSection content={content.about} />
        <JourneySection
          section={getSection(content.sections, "journey")}
          experiences={journeyContent.experiences}
          typeLabels={journeyContent.typeLabels}
          labels={journeyContent.labels}
        />
        <ProjectsTeaserSection
          section={getSection(content.sections, "projects")}
          projects={featuredProjects}
          locale={locale}
        />
        <AiLabSection
          section={getSection(content.sections, "ai-lab")}
          locale={locale}
        />
      </PortfolioShell>
    </>
  );
}
