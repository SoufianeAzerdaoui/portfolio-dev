"use client";

import Link from "next/link";
import { GitBranch, Link2, Mail } from "lucide-react";

import { useSectionNavigation } from "@/hooks/use-section-navigation";
import type { NavigationItem, SocialLink } from "@/types/portfolio";

const socialIcons = {
  github: GitBranch,
  linkedin: Link2,
  mail: Mail,
};

type DesktopSidebarProps = {
  navigation: NavigationItem[];
  socialLinks: SocialLink[];
};

export function DesktopSidebar({
  navigation,
  socialLinks,
}: DesktopSidebarProps) {
  const { activeSection, handleNavClick } = useSectionNavigation(navigation);

  return (
    <aside className="sticky top-0 z-30 hidden h-svh w-full min-w-0 bg-transparent px-5 pt-7 pb-6 lg:grid">
      <div className="grid h-full w-full max-w-[14.5rem] grid-rows-[1fr_auto_1fr]">
        <nav aria-label="Navigation principale" className="row-start-2 w-full self-center pl-3">
          <ul className="flex flex-col gap-1">
            {navigation.map((item) => {
              const isActive = item.id === activeSection;

              return (
                <li key={`${item.label}-${item.href}`}>
                  {item.disabled ? (
                    <button
                      type="button"
                      aria-disabled="true"
                      tabIndex={-1}
                      className="group flex min-h-[52px] w-full cursor-default items-center gap-3 pr-3 text-left text-[15px] leading-[1.2] font-normal whitespace-nowrap text-[#94A3B8] opacity-50 transition-[color,opacity] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-[#CBD5E1] hover:opacity-80 xl:text-[16px] motion-reduce:transition-none"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-px h-px w-11 shrink-0 origin-left scale-x-[0.45] rounded-full bg-[#64748B] opacity-45 transition-[transform,background-color,opacity] duration-[260ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-[0.65] group-hover:bg-[#7C8CFF] group-hover:opacity-70 motion-reduce:transition-none"
                      />
                      <span>{item.label}</span>
                    </button>
                  ) : (
                    <Link
                      href={item.href}
                      scroll={false}
                      aria-current={isActive ? "location" : undefined}
                      onClick={(event) => handleNavClick(event, item)}
                      className={[
                        "group flex min-h-[52px] w-full items-center gap-3 pr-3 text-left leading-[1.2] whitespace-nowrap transition-[color,opacity,font-size] duration-[240ms] ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C8CFF] focus-visible:ring-offset-4 focus-visible:ring-offset-[#050912] active:text-[#F8FAFC] motion-reduce:transition-none",
                        isActive
                          ? "text-[19px] font-medium text-[#F8FAFC] opacity-100 xl:text-[21px]"
                          : "text-[15px] font-normal text-[#94A3B8] opacity-50 hover:text-[#CBD5E1] hover:opacity-80 xl:text-[16px]",
                      ].join(" ")}
                    >
                      <span
                        aria-hidden="true"
                        className={[
                          "mt-px h-px w-11 shrink-0 origin-left rounded-full transition-[transform,background-color,opacity] duration-[260ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
                          isActive
                            ? "scale-x-100 bg-[#7C8CFF] opacity-95 group-hover:opacity-100"
                            : "scale-x-[0.45] bg-[#64748B] opacity-45 group-hover:scale-x-[0.65] group-hover:bg-[#7C8CFF] group-hover:opacity-75",
                        ].join(" ")}
                      />
                      <span>{item.label}</span>
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="row-start-3 flex self-end items-center gap-5 pt-10">
          {socialLinks.map((social) => {
            const Icon = socialIcons[social.icon];

            return social.disabled ? (
              <button
                key={social.label}
                type="button"
                aria-label={social.label}
                aria-disabled="true"
                tabIndex={-1}
                className="inline-grid h-7 w-7 place-items-center text-[#64748B]"
              >
                <Icon className="h-4 w-4" />
              </button>
            ) : (
              <Link
                key={social.label}
                href={social.href}
                target={social.external ? "_blank" : undefined}
                rel={social.external ? "noopener noreferrer" : undefined}
                aria-label={social.label}
                className="inline-grid h-7 w-7 place-items-center text-[#94A3B8] transition-[color,transform] duration-150 hover:-translate-y-0.5 hover:text-[#E2E8F0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C8CFF] focus-visible:ring-offset-4 focus-visible:ring-offset-[#050912]"
              >
                <Icon className="h-4 w-4" />
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
