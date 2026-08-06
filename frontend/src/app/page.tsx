import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { MobileHeader } from "@/components/layout/mobile-header";
import { HeroSection } from "@/components/home/hero-section";
import { portfolioContent } from "@/content/portfolio";

export default function Home() {
  return (
    <>
      <DesktopSidebar
        navigation={portfolioContent.navigation}
        socialLinks={portfolioContent.socialLinks}
      />
      <MobileHeader
        identity={portfolioContent.identity}
        navigation={portfolioContent.navigation}
        socialLinks={portfolioContent.socialLinks}
        languages={portfolioContent.languages}
      />
      <main
        id="main-content"
        className="relative overflow-x-clip lg:pl-[88px] xl:pl-[92px]"
      >
        <HeroSection content={portfolioContent} />
      </main>
    </>
  );
}
