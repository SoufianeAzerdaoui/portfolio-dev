import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { MobileHeader } from "@/components/layout/mobile-header";
import { HeroSection } from "@/components/home/hero-section";
import { SpaceBackground } from "@/components/home/space-background";
import { AiLabSection } from "@/components/sections/ai-lab-section";
import { AboutSection } from "@/components/sections/about-section";
import { JourneySection } from "@/components/sections/journey-section";
import { ProjectsTeaserSection } from "@/components/sections/projects-teaser-section";
import { journeyExperiences } from "@/content/journey";
import { portfolioContent } from "@/content/portfolio";

export default function Home() {
  return (
    <>
      <MobileHeader
        identity={portfolioContent.identity}
        navigation={portfolioContent.navigation}
        socialLinks={portfolioContent.socialLinks}
        languages={portfolioContent.languages}
      />
      <SpaceBackground variant="home" />
      <div className="relative z-10 lg:ml-[5vw] lg:mr-8 lg:grid lg:min-h-[100svh] lg:grid-cols-[16.25rem_minmax(0,1fr)] lg:gap-x-12 xl:ml-[9vw] xl:mr-[4vw] xl:grid-cols-[17.5rem_minmax(0,1fr)] xl:gap-x-16 2xl:ml-[10vw] 2xl:grid-cols-[18rem_minmax(0,1fr)] 2xl:gap-x-20">
        <div>
          <DesktopSidebar
            navigation={portfolioContent.navigation}
            socialLinks={portfolioContent.socialLinks}
          />
        </div>
        <main id="main-content" className="relative min-w-0 overflow-x-clip">
          <HeroSection content={portfolioContent} />
          <AboutSection content={portfolioContent.about} />
          {portfolioContent.sections.map((section) =>
            section.id === "projects" ? (
              <ProjectsTeaserSection key={section.id} section={section} />
            ) : section.id === "journey" ? (
              <JourneySection
                key={section.id}
                experiences={journeyExperiences}
              />
            ) : section.id === "ai-lab" ? (
              <AiLabSection key={section.id} section={section} />
            ) : (
              null
            ),
          )}
        </main>
      </div>
    </>
  );
}
