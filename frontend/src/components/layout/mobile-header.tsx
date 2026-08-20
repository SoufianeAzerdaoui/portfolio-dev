"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";

import { PreferencesPanel } from "@/components/layout/preferences-panel";
import { SocialIcon } from "@/components/layout/social-icons";
import { usePreferences } from "@/components/providers/preferences-provider";
import type {
  NavigationItem,
  SectionId,
  SocialLink,
} from "@/types/portfolio";

const mobileCopy = {
  fr: {
    openMenu: "Ouvrir le menu",
    closeMenu: "Fermer le menu",
    navigation: "Navigation mobile",
  },
  en: {
    openMenu: "Open menu",
    closeMenu: "Close menu",
    navigation: "Mobile navigation",
  },
} as const;

type MobileHeaderProps = {
  identity: {
    name: string;
    role: string;
  };
  navigation: NavigationItem[];
  socialLinks: SocialLink[];
  activeSection: SectionId;
  navigateToSection: (sectionId: SectionId) => void;
};

export function MobileHeader({
  identity,
  navigation,
  socialLinks,
  activeSection,
  navigateToSection,
}: MobileHeaderProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { locale } = usePreferences();
  const copy = mobileCopy[locale];

  const handleMobileNavigation = (
    event: MouseEvent<HTMLAnchorElement>,
    sectionId: SectionId,
  ) => {
    event.preventDefault();
    setOpen(false);
    window.requestAnimationFrame(() => {
      navigateToSection(sectionId);
    });
  };

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = "";
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const getFocusable = () =>
      panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      );
    getFocusable()?.[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }

      const focusable = getFocusable();

      if (event.key !== "Tab" || !focusable || focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-[var(--home-line-muted)] bg-[rgb(var(--home-bg-0-rgb)/0.84)] px-4 py-4 backdrop-blur-xl lg:hidden">
        <Link
          href="#home"
          scroll={false}
          onClick={(event) => handleMobileNavigation(event, "home")}
          className="inline-flex items-center gap-3 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-accent-2)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--home-bg-0)]"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--home-line)] bg-[rgb(var(--home-bg-1-rgb)/0.42)] text-sm font-semibold tracking-[0.22em] text-[var(--home-text)]">
            SA
          </span>
          <span className="flex flex-col">
            <span className="text-[0.7rem] uppercase tracking-[0.28em] text-[var(--home-text-secondary)]">
              {identity.name}
            </span>
            <span className="text-xs text-[var(--home-muted)]">{identity.role}</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <PreferencesPanel />
          <button
            ref={triggerRef}
            type="button"
            aria-expanded={open}
            aria-controls="mobile-navigation"
            aria-label={open ? copy.closeMenu : copy.openMenu}
            onClick={() => setOpen((value) => !value)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--home-line)] bg-transparent text-[var(--home-text)] transition hover:border-[var(--home-accent)] hover:bg-[var(--home-button-secondary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-accent-2)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--home-bg-0)]"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {open ? (
        <div className="fixed inset-0 z-50 bg-[rgb(var(--home-bg-0-rgb)/0.78)] backdrop-blur-md lg:hidden">
          <div
            id="mobile-navigation"
            ref={panelRef}
            className="ml-auto flex h-full w-[min(90vw,24rem)] flex-col border-l border-[var(--home-line)] bg-[var(--home-bg-0)] px-6 py-6"
          >
            <div className="flex items-center justify-between">
              <PreferencesPanel />
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--home-line)] bg-transparent text-[var(--home-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-accent-2)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--home-bg-0)]"
                aria-label={copy.closeMenu}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav aria-label={copy.navigation} className="mt-10">
              <ul className="space-y-3">
                {navigation.map((item) => (
                  <li key={`${item.label}-${item.href}`}>
                    {item.disabled ? (
                      <button
                        type="button"
                        aria-disabled="true"
                        onClick={() => setOpen(false)}
                        className="block w-full cursor-default rounded-2xl border border-[var(--home-line-muted)] bg-[rgb(var(--home-bg-1-rgb)/0.34)] px-4 py-4 text-left text-sm uppercase tracking-[0.26em] text-[var(--home-muted)] opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-accent-2)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--home-bg-0)]"
                      >
                        {item.label}
                      </button>
                    ) : (
                      <Link
                        href={item.href}
                        scroll={false}
                        aria-current={
                          activeSection === item.id ? "location" : undefined
                        }
                        onClick={(event) => handleMobileNavigation(event, item.id)}
                        className={[
                          "block rounded-2xl border px-4 py-4 text-sm uppercase tracking-[0.26em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-accent-2)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--home-bg-0)]",
                          activeSection === item.id
                            ? "border-[var(--home-line-strong)] bg-[rgb(var(--home-accent-rgb)/0.08)] text-[var(--home-text)]"
                            : "border-[var(--home-line-muted)] bg-[rgb(var(--home-bg-1-rgb)/0.34)] text-[var(--home-text-secondary)] hover:border-[var(--home-line)]",
                        ].join(" ")}
                      >
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>

            <div className="mt-auto flex items-center gap-3 pt-8">
              {socialLinks.map((social) => {
                return social.disabled ? (
                  <button
                    key={social.label}
                    type="button"
                    aria-label={social.label}
                    aria-disabled="true"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--home-line)] bg-transparent text-[var(--home-muted)] opacity-60"
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
                    onClick={() => setOpen(false)}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--home-line)] bg-transparent text-[var(--home-muted)] transition hover:text-[var(--home-accent-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-accent-2)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--home-bg-0)]"
                  >
                    <SocialIcon icon={social.icon} className="h-4 w-4" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
