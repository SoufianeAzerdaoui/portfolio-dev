"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent } from "react";

import {
  PORTFOLIO_SECTION_IDS,
  type NavigationItem,
  type SectionId,
} from "@/types/portfolio";

const DEFAULT_SECTION_ID: SectionId = "home";
const ACTIVE_SECTION_ROOT_MARGIN = "-35% 0px -55% 0px";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const ACTIVE_READING_LINE_RATIO = 0.36;

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
  historyMode?: "push" | "replace";
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
  const activeSectionRef = useRef<SectionId>(DEFAULT_SECTION_ID);
  const programmaticTargetRef = useRef<SectionId | null>(null);
  const programmaticFallbackTimeoutRef = useRef<number | null>(null);

  const commitActiveSection = useCallback((nextSection: SectionId) => {
    if (activeSectionRef.current === nextSection) {
      return;
    }

    activeSectionRef.current = nextSection;
    setActiveSection(nextSection);
  }, []);

  const clearProgrammaticFallbackTimer = useCallback(() => {
    if (programmaticFallbackTimeoutRef.current !== null) {
      window.clearTimeout(programmaticFallbackTimeoutRef.current);
      programmaticFallbackTimeoutRef.current = null;
    }
  }, []);

  const releaseProgrammaticTarget = useCallback(() => {
    clearProgrammaticFallbackTimer();
    programmaticTargetRef.current = null;
  }, [clearProgrammaticFallbackTimer]);

  const navigateToSection = useCallback(
    (sectionId: SectionId, options: NavigateOptions = {}) => {
      const element = document.getElementById(sectionId);

      if (!element) {
        return;
      }

      programmaticTargetRef.current = sectionId;
      clearProgrammaticFallbackTimer();
      activeSectionRef.current = sectionId;
      setActiveSection(sectionId);

      if (options.updateUrl ?? true) {
        if (options.historyMode === "replace") {
          const nextHash = `#${sectionId}`;

          if (window.location.hash !== nextHash) {
            window.history.replaceState(
              null,
              "",
              `${window.location.pathname}${window.location.search}${nextHash}`,
            );
          }
        } else {
          updateHash(sectionId);
        }
      }

      element.scrollIntoView({
        behavior: options.behavior ?? getScrollBehavior(),
        block: "start",
      });

      programmaticFallbackTimeoutRef.current = window.setTimeout(() => {
        programmaticTargetRef.current = null;
        programmaticFallbackTimeoutRef.current = null;
      }, 1400);
    },
    [clearProgrammaticFallbackTimer],
  );

  const handleNavClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>, item: NavigationItem) => {
      event.preventDefault();
      navigateToSection(item.id);
    },
    [navigateToSection],
  );

  useEffect(() => {
    const observedSections = new Map<SectionId, IntersectionObserverEntry>();
    const activationY = () => window.innerHeight * ACTIVE_READING_LINE_RATIO;

    const isProgrammaticTargetReached = (sectionId: SectionId) => {
      const element = document.getElementById(sectionId);

      if (!element) {
        return true;
      }

      const rect = element.getBoundingClientRect();
      const readingLine = activationY();

      return rect.top <= readingLine && rect.bottom >= readingLine;
    };

    const resolveActiveSection = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 8) {
        return sectionIds.at(-1) ?? DEFAULT_SECTION_ID;
      }

      const readingLine = activationY();
      const candidates = sectionIds
        .map((sectionId) => observedSections.get(sectionId))
        .filter(
          (entry): entry is IntersectionObserverEntry =>
            Boolean(entry?.isIntersecting),
        );

      if (candidates.length === 0) {
        return undefined;
      }

      const containingLine = candidates
        .filter(
          (entry) =>
            entry.boundingClientRect.top <= readingLine &&
            entry.boundingClientRect.bottom >= readingLine,
        )
        .sort(
          (a, b) => b.boundingClientRect.top - a.boundingClientRect.top,
        )[0];

      if (containingLine?.target.id) {
        return containingLine.target.id as SectionId;
      }

      const nearest = candidates.sort((a, b) => {
        const aDistance = Math.abs(a.boundingClientRect.top - readingLine);
        const bDistance = Math.abs(b.boundingClientRect.top - readingLine);

        if (aDistance === bDistance) {
          return (
            sectionIds.indexOf(a.target.id as SectionId) -
            sectionIds.indexOf(b.target.id as SectionId)
          );
        }

        return aDistance - bDistance;
      })[0];

      return nearest?.target.id
        ? (nearest.target.id as SectionId)
        : undefined;
    };

    const commitResolvedActiveSection = () => {
      const programmaticTarget = programmaticTargetRef.current;

      if (programmaticTarget) {
        if (isProgrammaticTargetReached(programmaticTarget)) {
          releaseProgrammaticTarget();
          commitActiveSection(programmaticTarget);
        }

        return;
      }

      const nextSection = resolveActiveSection();

      if (nextSection) {
        commitActiveSection(nextSection);
      }
    };

    const syncHashToSection = (behavior: ScrollBehavior) => {
      const sectionId = getHashSectionId(window.location.hash, sectionIds);

      if (sectionId) {
        navigateToSection(sectionId, {
          updateUrl: false,
          behavior,
          historyMode: "replace",
        });
        return;
      }

      releaseProgrammaticTarget();
      commitActiveSection(DEFAULT_SECTION_ID);
    };

    const frame = window.requestAnimationFrame(() => {
      syncHashToSection("auto");
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const sectionId = getHashSectionId(entry.target.id, sectionIds);

          if (!sectionId) {
            return;
          }

          observedSections.set(sectionId, entry);
        });

        commitResolvedActiveSection();
      },
      {
        rootMargin: ACTIVE_SECTION_ROOT_MARGIN,
        threshold: [0, 0.08, 0.18, 0.32, 0.48],
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

    const handleScroll = () => {
      commitResolvedActiveSection();
    };

    const cancelProgrammaticScroll = () => {
      if (programmaticTargetRef.current) {
        releaseProgrammaticTarget();
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" && event.pointerType !== "touch" && event.pointerType !== "pen") {
        return;
      }

      cancelProgrammaticScroll();
    };

    const handleWheel = () => {
      cancelProgrammaticScroll();
    };

    const handleTouchStart = () => {
      cancelProgrammaticScroll();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "PageUp" ||
        event.key === "PageDown" ||
        event.key === "ArrowUp" ||
        event.key === "ArrowDown" ||
        event.key === "Home" ||
        event.key === "End" ||
        event.key === " " ||
        event.key === "Spacebar"
      ) {
        cancelProgrammaticScroll();
      }
    };

    window.addEventListener("hashchange", handleHistoryNavigation);
    window.addEventListener("popstate", handleHistoryNavigation);
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("wheel", handleWheel, { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, {
      passive: true,
    });
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      clearProgrammaticFallbackTimer();
      window.removeEventListener("hashchange", handleHistoryNavigation);
      window.removeEventListener("popstate", handleHistoryNavigation);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    clearProgrammaticFallbackTimer,
    commitActiveSection,
    navigateToSection,
    releaseProgrammaticTarget,
    sectionIds,
  ]);

  return {
    activeSection,
    handleNavClick,
    navigateToSection,
  };
}
