"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { MouseEvent } from "react";

import {
  PORTFOLIO_SECTION_IDS,
  type NavigationItem,
  type SectionId,
} from "@/types/portfolio";

const DEFAULT_SECTION_ID: SectionId = "home";
const ACTIVE_SECTION_ROOT_MARGIN = "-30% 0px -60% 0px";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function isSectionId(value: string, sectionIds: readonly SectionId[]) {
  return sectionIds.includes(value as SectionId);
}

function getHashSectionId(
  hash: string,
  sectionIds: readonly SectionId[],
): SectionId | undefined {
  const value = hash.startsWith("#") ? hash.slice(1) : hash;

  return isSectionId(value, sectionIds) ? (value as SectionId) : undefined;
}

function getScrollBehavior(): ScrollBehavior {
  if (typeof window === "undefined") {
    return "auto";
  }

  const userReducedMotion =
    document.documentElement.dataset.motion === "reduce";

  return userReducedMotion || window.matchMedia(REDUCED_MOTION_QUERY).matches
    ? "auto"
    : "smooth";
}

function updateHash(sectionId: SectionId) {
  const nextHash = `#${sectionId}`;

  if (window.location.hash === nextHash) {
    return;
  }

  window.history.pushState(
    null,
    "",
    `${window.location.pathname}${window.location.search}${nextHash}`,
  );
}

type NavigateOptions = {
  updateUrl?: boolean;
  behavior?: ScrollBehavior;
};

export function useSectionNavigation(navigation: NavigationItem[]) {
  const sectionIds = useMemo(
    () =>
      PORTFOLIO_SECTION_IDS.filter((sectionId) =>
        navigation.some((item) => item.id === sectionId && !item.disabled),
      ),
    [navigation],
  );
  const [activeSection, setActiveSection] =
    useState<SectionId>(DEFAULT_SECTION_ID);

  const navigateToSection = useCallback(
    (sectionId: SectionId, options: NavigateOptions = {}) => {
      const element = document.getElementById(sectionId);

      if (!element) {
        return;
      }

      setActiveSection(sectionId);

      if (options.updateUrl ?? true) {
        updateHash(sectionId);
      }

      element.scrollIntoView({
        behavior: options.behavior ?? getScrollBehavior(),
        block: "start",
      });
    },
    [],
  );

  const handleNavClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>, item: NavigationItem) => {
      event.preventDefault();
      navigateToSection(item.id);
    },
    [navigateToSection],
  );

  useEffect(() => {
    const syncHashToSection = (behavior: ScrollBehavior) => {
      const sectionId = getHashSectionId(window.location.hash, sectionIds);

      if (sectionId) {
        navigateToSection(sectionId, { updateUrl: false, behavior });
        return;
      }

      setActiveSection(DEFAULT_SECTION_ID);
    };

    const frame = window.requestAnimationFrame(() => {
      syncHashToSection("auto");
    });

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visibleEntry?.target.id) {
          const sectionId = getHashSectionId(
            visibleEntry.target.id,
            sectionIds,
          );

          if (sectionId) {
            setActiveSection(sectionId);
          }
        }
      },
      {
        rootMargin: ACTIVE_SECTION_ROOT_MARGIN,
        threshold: [0, 0.01],
      },
    );

    sectionIds.forEach((sectionId) => {
      const element = document.getElementById(sectionId);

      if (element) {
        observer.observe(element);
      }
    });

    const handleHistoryNavigation = () => {
      syncHashToSection(getScrollBehavior());
    };

    window.addEventListener("hashchange", handleHistoryNavigation);
    window.addEventListener("popstate", handleHistoryNavigation);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("hashchange", handleHistoryNavigation);
      window.removeEventListener("popstate", handleHistoryNavigation);
    };
  }, [navigateToSection, sectionIds]);

  return {
    activeSection,
    handleNavClick,
    navigateToSection,
  };
}
