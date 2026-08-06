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
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[88px] flex-col border-r border-white/8 bg-[linear-gradient(180deg,rgba(5,9,18,0.97),rgba(6,11,20,0.9))] px-4 py-[1.15rem] shadow-[inset_-1px_0_0_rgba(255,255,255,0.03)] backdrop-blur-xl lg:flex">
      <Link
        href="#accueil"
        className="group mt-2 inline-flex items-center rounded-sm text-[0.68rem] uppercase tracking-[0.34em] text-slate-200/82 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F6BFF]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050912]"
      >
        <span className="text-[1.28rem] font-extralight tracking-[0.18em] text-slate-50/94">
          SA
        </span>
      </Link>

      <nav aria-label="Navigation principale" className="mt-[3.7rem]">
        <ul className="space-y-[1.05rem]">
          {navigation.map((item) => {
            const isActive = item.href === activeHash;

            return (
              <li key={`${item.label}-${item.href}`}>
                {item.disabled ? (
                  <button
                    type="button"
                    aria-disabled="true"
                    className="group flex items-center gap-2 rounded-full py-1 text-[0.55rem] tracking-[0.01em] text-slate-500"
                  >
                    <span
                      aria-hidden="true"
                      className="h-1.5 w-1.5 rounded-full bg-white/10"
                    />
                    <span>{item.label}</span>
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={[
                      "group flex items-center gap-2 rounded-full py-1.5 text-[0.58rem] tracking-[0.01em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F6BFF]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050912]",
                      "group flex items-center gap-2 rounded-full py-1 text-[0.55rem] tracking-[0.01em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F6BFF]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050912]",
                      isActive
                        ? "text-slate-50"
                        : "text-slate-400 hover:text-slate-200",
                    ].join(" ")}
                  >
                    <span
                      aria-hidden="true"
                      className={[
                        "h-1.5 w-1.5 rounded-full transition-all",
                        isActive
                          ? "bg-[#7C5CFC] shadow-[0_0_14px_rgba(124,92,252,0.9)]"
                          : "bg-white/10 group-hover:bg-[#4F6BFF]/70",
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

      <div className="mt-auto flex items-center gap-3 pb-1 pt-8">
        {socialLinks.map((social) => {
          const Icon = socialIcons[social.icon];

          return social.disabled ? (
            <button
              key={social.label}
              type="button"
              aria-label={social.label}
              aria-disabled="true"
              className="inline-flex h-4 w-4 items-center justify-center text-slate-500"
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          ) : (
            <Link
              key={social.label}
              href={social.href}
              target={social.external ? "_blank" : undefined}
              rel={social.external ? "noopener noreferrer" : undefined}
              aria-label={social.label}
              className="inline-flex h-4 w-4 items-center justify-center text-slate-400 transition hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F6BFF]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050912]"
            >
              <Icon className="h-3.5 w-3.5" />
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
