"use client";

import Link from "next/link";
import { GitBranch, Link2, Mail, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { LanguageSwitcher } from "@/components/layout/language-switcher";
import type { LanguageOption, NavigationItem, SocialLink } from "@/types/portfolio";

const socialIcons = {
  github: GitBranch,
  linkedin: Link2,
  mail: Mail,
};

type MobileHeaderProps = {
  identity: {
    name: string;
    role: string;
  };
  navigation: NavigationItem[];
  socialLinks: SocialLink[];
  languages: LanguageOption[];
};

export function MobileHeader({
  identity,
  navigation,
  socialLinks,
  languages,
}: MobileHeaderProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = "";
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled])',
    );
    focusable?.[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }

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
      <header className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-white/8 bg-[#050912]/82 px-4 py-4 backdrop-blur-xl lg:hidden">
        <Link
          href="#accueil"
          className="inline-flex items-center gap-3 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F6BFF]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050912]"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-white/[0.03] text-sm font-semibold tracking-[0.22em] text-slate-50">
            SA
          </span>
          <span className="flex flex-col">
            <span className="text-[0.7rem] uppercase tracking-[0.28em] text-slate-200">
              {identity.name}
            </span>
            <span className="text-xs text-slate-400">{identity.role}</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <LanguageSwitcher languages={languages} className="hidden sm:inline-flex" />
          <button
            ref={triggerRef}
            type="button"
            aria-expanded={open}
            aria-controls="mobile-navigation"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            onClick={() => setOpen((value) => !value)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-100 transition hover:border-white/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F6BFF]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050912]"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {open ? (
        <div className="fixed inset-0 z-50 bg-[#03060d]/80 backdrop-blur-md lg:hidden">
          <div
            id="mobile-navigation"
            ref={panelRef}
            className="ml-auto flex h-full w-[min(90vw,24rem)] flex-col border-l border-white/8 bg-[#060b14] px-6 py-6"
          >
            <div className="flex items-center justify-between">
              <LanguageSwitcher languages={languages} />
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F6BFF]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050912]"
                aria-label="Fermer le menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav aria-label="Navigation mobile" className="mt-10">
              <ul className="space-y-3">
                {navigation.map((item) => (
                  <li key={`${item.label}-${item.href}`}>
                    {item.disabled ? (
                      <button
                        type="button"
                        aria-disabled="true"
                        onClick={() => setOpen(false)}
                        className="block w-full cursor-default rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-4 text-left text-sm uppercase tracking-[0.26em] text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F6BFF]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050912]"
                      >
                        {item.label}
                      </button>
                    ) : (
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="block rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4 text-sm uppercase tracking-[0.26em] text-slate-100 transition hover:border-white/16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F6BFF]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050912]"
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
                const Icon = socialIcons[social.icon];

                return social.disabled ? (
                  <button
                    key={social.label}
                    type="button"
                    aria-label={social.label}
                    aria-disabled="true"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-500"
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
                    onClick={() => setOpen(false)}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-300 transition hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F6BFF]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050912]"
                  >
                    <Icon className="h-4 w-4" />
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
