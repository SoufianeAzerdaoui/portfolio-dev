"use client";

import type { ReactNode } from "react";

import { BrandMark } from "@/components/layout/brand-mark";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { MobileHeader } from "@/components/layout/mobile-header";
import { PreferencesPanel } from "@/components/layout/preferences-panel";
import { usePreferences } from "@/components/providers/preferences-provider";
import { useSectionNavigation } from "@/hooks/use-section-navigation";
import type { PortfolioContent } from "@/types/portfolio";

type PortfolioShellProps = {
  content: PortfolioContent;
  children: ReactNode;
};

export function PortfolioShell({ content, children }: PortfolioShellProps) {
  const { locale } = usePreferences();
  const { activeSection, handleNavClick, navigateToSection } =
    useSectionNavigation(content.navigation);
  const brandLabel =
    locale === "fr" ? "Retour à l'accueil" : "Back to home";

  return (
    <>
      <MobileHeader
        identity={content.identity}
        navigation={content.navigation}
        socialLinks={content.socialLinks}
        activeSection={activeSection}
        navigateToSection={navigateToSection}
      />

      <BrandMark label={brandLabel} navigateToSection={navigateToSection} />

      <div className="pointer-events-auto fixed right-[clamp(3.25rem,3.3vw,4rem)] top-[42px] z-50 hidden items-center lg:flex">
        <PreferencesPanel />
      </div>

      <div className="relative z-10 lg:ml-[5vw] lg:mr-8 lg:grid lg:min-h-[100svh] lg:grid-cols-[16.25rem_minmax(0,1fr)] lg:gap-x-12 xl:ml-[9vw] xl:mr-[4vw] xl:grid-cols-[17.5rem_minmax(0,1fr)] xl:gap-x-16 2xl:ml-[10vw] 2xl:grid-cols-[18rem_minmax(0,1fr)] 2xl:gap-x-20">
        <div>
          <DesktopSidebar
            navigation={content.navigation}
            socialLinks={content.socialLinks}
            activeSection={activeSection}
            onNavClick={handleNavClick}
          />
        </div>
        <main id="main-content" className="relative min-w-0 overflow-x-clip">
          {children}
        </main>
      </div>
    </>
  );
}
