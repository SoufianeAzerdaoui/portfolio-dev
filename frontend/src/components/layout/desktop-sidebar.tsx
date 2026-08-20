"use client";

import Link from "next/link";
import type { MouseEvent } from "react";

import { SocialIcon } from "@/components/layout/social-icons";
import type { NavigationItem, SectionId, SocialLink } from "@/types/portfolio";

type DesktopSidebarProps = {
  navigation: NavigationItem[];
  socialLinks: SocialLink[];
  activeSection: SectionId;
  onNavClick: (
    event: MouseEvent<HTMLAnchorElement>,
    item: NavigationItem,
  ) => void;
};

export function DesktopSidebar({
  navigation,
  socialLinks,
  activeSection,
  onNavClick,
}: DesktopSidebarProps) {
  return (
    <aside className="fixed inset-y-0 left-[5vw] z-40 hidden h-svh w-[16.25rem] min-w-0 bg-transparent px-5 pt-7 pb-6 lg:grid xl:left-[9vw] xl:w-[17.5rem] 2xl:left-[10vw] 2xl:w-[18rem]">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-10 bottom-10 w-px bg-[var(--home-line)]"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-[13.5rem] h-1 w-1 -translate-x-1/2 rounded-full bg-[var(--home-accent-2)] opacity-70"
      />
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
                      className="group flex min-h-[52px] w-full cursor-default items-center gap-3 pr-3 text-left text-[15px] leading-[1.2] font-normal whitespace-nowrap text-[var(--home-muted)] opacity-60 transition-[color,opacity] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-[var(--home-text-secondary)] hover:opacity-80 xl:text-[16px] motion-reduce:transition-none"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-px h-px w-11 shrink-0 origin-left scale-x-[0.45] rounded-full bg-[var(--home-line)] opacity-75 transition-[transform,background-color,opacity] duration-[260ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-[0.65] group-hover:bg-[var(--home-accent-2)] group-hover:opacity-80 motion-reduce:transition-none"
                      />
                      <span>{item.label}</span>
                    </button>
                  ) : (
                    <Link
                      href={item.href}
                      scroll={false}
                      aria-current={isActive ? "location" : undefined}
                      onClick={(event) => onNavClick(event, item)}
                      className={[
                        "group flex min-h-[52px] w-full items-center gap-3 pr-3 text-left leading-[1.2] whitespace-nowrap transition-[color,opacity,font-size] duration-[240ms] ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-accent-2)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--home-bg-0)] active:text-[var(--home-text)] motion-reduce:transition-none",
                        isActive
                          ? "text-[19px] font-medium text-[var(--home-text)] opacity-100 xl:text-[21px]"
                          : "text-[15px] font-normal text-[var(--home-muted)] opacity-[0.72] hover:text-[#B9B6C6] hover:opacity-100 xl:text-[16px]",
                      ].join(" ")}
                    >
                      <span
                        aria-hidden="true"
                        className={[
                          "mt-px h-px w-11 shrink-0 origin-left rounded-full transition-[transform,background-color,opacity] duration-[260ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
                          isActive
                            ? "scale-x-100 bg-[var(--home-accent-2)] opacity-95 group-hover:opacity-100"
                            : "scale-x-[0.45] bg-[var(--home-line)] opacity-75 group-hover:scale-x-[0.65] group-hover:bg-[var(--home-accent-2)] group-hover:opacity-80",
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
            return social.disabled ? (
              <button
                key={social.label}
                type="button"
                aria-label={social.label}
                aria-disabled="true"
                tabIndex={-1}
                className="inline-grid h-7 w-7 place-items-center text-[var(--home-muted)] opacity-75"
              >
                <SocialIcon icon={social.icon} className="h-4 w-4" />
              </button>
            ) : (
              <Link
                key={social.label}
                href={social.href}
                target={social.external ? "_blank" : undefined}
                rel={social.external ? "noopener noreferrer" : undefined}
                aria-label={social.label}
                className="inline-grid h-7 w-7 place-items-center text-[var(--home-muted)] transition-[color,transform] duration-150 hover:-translate-y-0.5 hover:text-[var(--home-accent-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-accent-2)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--home-bg-0)]"
              >
                <SocialIcon icon={social.icon} className="h-4 w-4" />
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
