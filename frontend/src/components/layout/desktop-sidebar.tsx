"use client";

import Link from "next/link";
import { GitBranch, Link2, Mail } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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

function getCurrentHash(items: NavigationItem[]) {
  if (typeof window === "undefined") {
    return items[0]?.href ?? "#accueil";
  }

  return items.some((item) => item.href === window.location.hash)
    ? window.location.hash
    : items[0]?.href ?? "#accueil";
}

export function DesktopSidebar({
  navigation,
  socialLinks,
}: DesktopSidebarProps) {
  const sectionIds = useMemo(
    () => navigation.map((item) => item.href.replace("#", "")),
    [navigation],
  );
  const [activeHash, setActiveHash] = useState<string>(
    navigation[0]?.href ?? "#accueil",
  );

  useEffect(() => {
    const syncHash = () => {
      setActiveHash(getCurrentHash(navigation));
    };

    const frame = window.requestAnimationFrame(syncHash);

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visibleEntry) {
          setActiveHash(`#${visibleEntry.target.id}`);
        }
      },
      {
        rootMargin: "-28% 0px -45% 0px",
        threshold: [0.2, 0.45, 0.7],
      },
    );

    sectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    window.addEventListener("hashchange", syncHash);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", syncHash);
      observer.disconnect();
    };
  }, [navigation, sectionIds]);

  return (
    <aside className="sticky top-0 z-30 hidden h-svh w-full min-w-0 bg-transparent px-5 pt-7 pb-6 lg:grid">
      <div className="grid h-full w-full max-w-[14.5rem] grid-rows-[1fr_auto_1fr]">
        <nav aria-label="Navigation principale" className="row-start-2 w-full self-center">
          <ul className="flex flex-col gap-8">
            {navigation.map((item) => {
              const isActive = item.href === activeHash;

              return (
                <li key={`${item.label}-${item.href}`}>
                  {item.disabled ? (
                    <button
                      type="button"
                      aria-disabled="true"
                      tabIndex={-1}
                      className="group flex w-full items-center gap-3 pr-3 text-left text-[20px] font-normal leading-[1.2] whitespace-nowrap text-slate-500"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-px h-px w-5 shrink-0 rounded-full bg-[#273550]"
                      />
                      <span>{item.label}</span>
                    </button>
                  ) : (
                    <Link
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      className={[
                        "group flex w-full items-center gap-3 pr-3 text-left text-[20px] font-normal leading-[1.2] whitespace-nowrap transition-[color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C8CFF] focus-visible:ring-offset-4 focus-visible:ring-offset-[#050912]",
                        isActive
                          ? "text-[#F8FAFC]"
                          : "text-[#64748B] hover:text-[#CBD5E1]",
                      ].join(" ")}
                    >
                      <span
                        aria-hidden="true"
                        className={[
                          "mt-px h-px shrink-0 rounded-full transition-all duration-150",
                          isActive
                            ? "w-6 bg-[#7C8CFF] shadow-[0_0_9px_rgba(124,140,255,0.55)]"
                            : "w-4 bg-[#273550] group-hover:w-5 group-hover:bg-[#4F6BFF]/70",
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
