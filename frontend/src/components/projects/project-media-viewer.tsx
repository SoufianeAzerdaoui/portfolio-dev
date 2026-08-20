"use client";

import Image from "next/image";
import type { KeyboardEvent, PointerEvent } from "react";
import { useEffect, useId, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Maximize2, X } from "lucide-react";

import { resolveProjectMediaUrl } from "@/features/projects/utils/project-media";
import type { ProjectMedia } from "@/types/project";

type MediaTabId = "overview" | "architecture" | "interfaces";

type MediaTab = {
  id: MediaTabId;
  label: string;
  media: ProjectMedia[];
};

type ProjectMediaViewerProps = {
  coverImage: ProjectMedia | null;
  architectureMedia: ProjectMedia[];
  interfaceMedia: ProjectMedia[];
};

const orderedTabIds: MediaTabId[] = ["overview", "architecture", "interfaces"];

function createTabs({
  coverImage,
  architectureMedia,
  interfaceMedia,
}: ProjectMediaViewerProps): MediaTab[] {
  return [
    {
      id: "overview",
      label: "Aperçu",
      media: coverImage ? [coverImage] : [],
    },
    {
      id: "architecture",
      label: "Architecture",
      media: architectureMedia,
    },
    {
      id: "interfaces",
      label: "Interfaces",
      media: interfaceMedia,
    },
  ];
}

function formatSlideLabel(index: number) {
  return String(index + 1).padStart(2, "0");
}

function formatSlideTotal(total: number) {
  return String(total).padStart(2, "0");
}

export function ProjectMediaViewer({
  coverImage,
  architectureMedia,
  interfaceMedia,
}: ProjectMediaViewerProps) {
  const tabs = createTabs({ coverImage, architectureMedia, interfaceMedia });
  const componentId = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const pointerStartX = useRef<number | null>(null);
  const pointerId = useRef<number | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const [activeTab, setActiveTab] = useState<MediaTabId>("overview");
  const [slideIndexes, setSlideIndexes] = useState<Record<MediaTabId, number>>({
    overview: 0,
    architecture: 0,
    interfaces: 0,
  });
  const [expanded, setExpanded] = useState(false);

  const activeTabConfig =
    tabs.find((tab) => tab.id === activeTab) ?? tabs[0];
  const activeMediaList = activeTabConfig.media;
  const activeIndex = Math.min(
    slideIndexes[activeTabConfig.id],
    Math.max(activeMediaList.length - 1, 0),
  );
  const activeMedia = activeMediaList[activeIndex];
  const canNavigate = activeMediaList.length > 1;

  const goToSlide = (nextIndex: number) => {
    if (activeMediaList.length === 0) {
      return;
    }

    setSlideIndexes((current) => ({
      ...current,
      [activeTabConfig.id]:
        (nextIndex + activeMediaList.length) % activeMediaList.length,
    }));
  };

  const goToPrevious = () => {
    goToSlide(activeIndex - 1);
  };

  const goToNext = () => {
    goToSlide(activeIndex + 1);
  };

  const selectTab = (tabId: MediaTabId) => {
    setActiveTab(tabId);
    pointerStartX.current = null;
    pointerId.current = null;
  };

  const handleTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    const currentPosition = orderedTabIds.indexOf(tabs[index]?.id ?? "overview");

    if (event.key === "Home") {
      event.preventDefault();
      selectTab(orderedTabIds[0]);
      tabRefs.current[0]?.focus();
      return;
    }

    if (event.key === "End") {
      const lastIndex = orderedTabIds.length - 1;
      event.preventDefault();
      selectTab(orderedTabIds[lastIndex]);
      tabRefs.current[lastIndex]?.focus();
      return;
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      const direction = event.key === "ArrowRight" ? 1 : -1;
      const nextPosition =
        (currentPosition + direction + orderedTabIds.length) %
        orderedTabIds.length;

      event.preventDefault();
      selectTab(orderedTabIds[nextPosition]);
      tabRefs.current[nextPosition]?.focus();
    }
  };

  const handlePanelKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!canNavigate) {
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goToPrevious();
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      goToNext();
    }
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!canNavigate || event.pointerType === "mouse") {
      return;
    }

    pointerStartX.current = event.clientX;
    pointerId.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const startX = pointerStartX.current;
    const activePointerId = pointerId.current;

    pointerStartX.current = null;
    pointerId.current = null;

    if (
      activePointerId !== null &&
      event.currentTarget.hasPointerCapture(activePointerId)
    ) {
      event.currentTarget.releasePointerCapture(activePointerId);
    }

    if (startX === null || !canNavigate) {
      return;
    }

    const deltaX = event.clientX - startX;

    if (Math.abs(deltaX) < 42) {
      return;
    }

    if (deltaX > 0) {
      goToPrevious();
    } else {
      goToNext();
    }
  };

  const handlePointerCancel = (event: PointerEvent<HTMLDivElement>) => {
    const activePointerId = pointerId.current;

    pointerStartX.current = null;
    pointerId.current = null;

    if (
      activePointerId !== null &&
      event.currentTarget.hasPointerCapture(activePointerId)
    ) {
      event.currentTarget.releasePointerCapture(activePointerId);
    }
  };

  useEffect(() => {
    if (!expanded) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setExpanded(false);
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );

      if (!focusableElements?.length) {
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }

      if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [expanded]);

  return (
    <div className="mx-auto flex h-full w-full max-w-[65rem] flex-col min-[1180px]:mx-0 min-[1180px]:max-w-none">
      <div
        role="tablist"
        aria-label="Galerie du projet"
        className="flex min-w-0 items-center gap-8 border-b border-slate-400/[0.1] text-[0.84rem] font-medium text-[#AAB7C8] sm:gap-12 sm:text-[0.9rem]"
      >
        {tabs.map((tab, index) => {
          const selected = tab.id === activeTab;

          return (
            <button
              key={tab.id}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              id={`${componentId}-${tab.id}-tab`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`${componentId}-${tab.id}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => selectTab(tab.id)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
              className={[
                "relative min-h-14 whitespace-nowrap px-1 text-left transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C8CFF] focus-visible:ring-offset-4 focus-visible:ring-offset-[#080D1A] motion-reduce:transition-none",
                selected
                  ? "text-[#9AA6FF]"
                  : "text-[#AAB7C8] hover:text-[#F8FAFC]",
              ].join(" ")}
            >
              {tab.label}
              <span
                aria-hidden="true"
                className={[
                  "absolute inset-x-0 bottom-0 h-px origin-left bg-[#7C8CFF] transition duration-200 motion-reduce:transition-none",
                  selected ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0",
                ].join(" ")}
              />
            </button>
          );
        })}
      </div>

      <div
        id={`${componentId}-${activeTabConfig.id}-panel`}
        role="tabpanel"
        aria-labelledby={`${componentId}-${activeTabConfig.id}-tab`}
        tabIndex={0}
        onKeyDown={handlePanelKeyDown}
        className="mt-8 outline-none focus-visible:rounded-[14px] focus-visible:ring-2 focus-visible:ring-[#7C8CFF] focus-visible:ring-offset-4 focus-visible:ring-offset-[#080D1A] min-[1180px]:mt-9 min-[1180px]:flex-1"
      >
        <div className="relative flex min-h-[23rem] flex-col overflow-hidden rounded-[14px] border border-slate-400/[0.11] bg-[#060B15]/36 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] sm:min-h-[31rem] sm:p-5 min-[1180px]:h-full min-[1180px]:min-h-[34rem] min-[1180px]:p-6">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-[12%] top-[12%] h-[28%] rounded-full bg-[#7C8CFF]/[0.035] blur-3xl"
          />

          <div
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            className="relative min-h-0 flex-1"
          >
            {activeMedia ? (
              <div
                key={`${activeTabConfig.id}-${activeMedia.id}`}
                className="relative h-full min-h-[18rem] w-full motion-safe:animate-[case-study-media_200ms_ease-out_both]"
              >
                <Image
                  src={resolveProjectMediaUrl(activeMedia)}
                  alt={activeMedia.alt}
                  fill
                  priority={activeTabConfig.id === "overview" && activeIndex === 0}
                  sizes="(min-width: 1600px) 52vw, (min-width: 1180px) 50vw, 94vw"
                  className="object-contain p-2 sm:p-5 min-[1180px]:p-7"
                />
              </div>
            ) : (
              <div className="flex h-full min-h-[18rem] items-center justify-center rounded-[10px] border border-dashed border-slate-400/[0.13] px-6 text-center text-[0.88rem] text-[#94A3B8]">
                Aucun média disponible pour cette catégorie.
              </div>
            )}
          </div>

          {canNavigate ? (
            <MediaCatalog
              media={activeMediaList}
              activeIndex={activeIndex}
              tabLabel={activeTabConfig.label}
              onSelect={goToSlide}
            />
          ) : null}

          <div className="mt-5 grid min-h-12 grid-cols-[1fr_auto_1fr] items-center gap-4">
            <div className="justify-self-end">
              {canNavigate ? (
                <ViewerButton
                  label="Image précédente"
                  onClick={goToPrevious}
                  icon="previous"
                />
              ) : null}
            </div>

            {canNavigate ? (
              <p className="text-center text-[0.72rem] font-medium uppercase tracking-[0.18em] text-[#94A3B8]/70">
                {formatSlideLabel(activeIndex)} /{" "}
                {formatSlideTotal(activeMediaList.length)}
              </p>
            ) : (
              <span aria-hidden="true" />
            )}

            <div className="flex items-center justify-start gap-3">
              {canNavigate ? (
                <ViewerButton
                  label="Image suivante"
                  onClick={goToNext}
                  icon="next"
                />
              ) : null}

              {activeMedia ? (
                <button
                  type="button"
                  aria-label="Agrandir l’image active"
                  onClick={() => setExpanded(true)}
                  className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-[8px] border border-slate-400/[0.08] bg-[#080D1A]/42 text-[#94A3B8] transition duration-200 hover:border-[#7C8CFF]/26 hover:text-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C8CFF] focus-visible:ring-offset-4 focus-visible:ring-offset-[#080D1A] motion-reduce:transition-none"
                >
                  <Maximize2 aria-hidden="true" className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {expanded && activeMedia ? (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label="Aperçu agrandi du média projet"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#030711]/92 p-4 backdrop-blur-md sm:p-8"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setExpanded(false);
            }
          }}
        >
          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Fermer l’aperçu agrandi"
            onClick={() => setExpanded(false)}
            className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-400/[0.12] bg-[#080D1A]/82 text-[#CBD5E1] transition duration-200 hover:border-[#7C8CFF]/35 hover:text-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C8CFF] focus-visible:ring-offset-4 focus-visible:ring-offset-[#030711] motion-reduce:transition-none"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>

          <div className="relative h-full max-h-[86svh] w-full max-w-[86rem]">
            <Image
              src={resolveProjectMediaUrl(activeMedia)}
              alt={activeMedia.alt}
              fill
              sizes="96vw"
              className="object-contain"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MediaCatalog({
  media,
  activeIndex,
  tabLabel,
  onSelect,
}: {
  media: ProjectMedia[];
  activeIndex: number;
  tabLabel: string;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="mt-4 border-t border-slate-400/[0.08] pt-4">
      <div
        aria-label={`Catalogue ${tabLabel}`}
        className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:thin] [scrollbar-color:rgba(148,163,184,0.22)_transparent]"
      >
        {media.map((item, index) => {
          const selected = index === activeIndex;

          return (
            <button
              key={item.id}
              type="button"
              aria-label={`Afficher ${tabLabel.toLowerCase()} ${formatSlideLabel(index)} sur ${formatSlideTotal(media.length)}`}
              aria-current={selected ? "true" : undefined}
              onClick={() => onSelect(index)}
              className={[
                "group/catalog min-w-[6.75rem] rounded-[9px] border bg-[#080D1A]/34 p-1.5 text-left transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C8CFF] focus-visible:ring-offset-4 focus-visible:ring-offset-[#080D1A] motion-reduce:transition-none sm:min-w-[7.8rem]",
                selected
                  ? "border-[#7C8CFF]/58 bg-[#7C8CFF]/[0.075]"
                  : "border-slate-400/[0.09] hover:border-[#7C8CFF]/30 hover:bg-[#101827]/45",
              ].join(" ")}
            >
              <span className="relative block aspect-[16/9] overflow-hidden rounded-[6px] bg-[#030711]/60 ring-1 ring-inset ring-slate-400/[0.05]">
                <Image
                  src={resolveProjectMediaUrl(item)}
                  alt=""
                  fill
                  sizes="128px"
                  className="object-cover opacity-74 transition duration-200 group-hover/catalog:opacity-95 motion-reduce:transition-none"
                />
                <span
                  aria-hidden="true"
                  className={[
                    "absolute inset-0 rounded-[6px] ring-1 ring-inset transition duration-200 motion-reduce:transition-none",
                    selected ? "ring-[#7C8CFF]/60" : "ring-transparent",
                  ].join(" ")}
                />
              </span>
              <span
                className={[
                  "mt-2 block text-[0.68rem] font-medium uppercase tracking-[0.16em] transition duration-200 motion-reduce:transition-none",
                  selected ? "text-[#F8FAFC]" : "text-[#94A3B8]/70",
                ].join(" ")}
              >
                {formatSlideLabel(index)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ViewerButton({
  label,
  onClick,
  icon,
}: {
  label: string;
  onClick: () => void;
  icon: "previous" | "next";
}) {
  const Icon = icon === "previous" ? ArrowLeft : ArrowRight;

  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-400/[0.08] bg-[#111827]/54 text-[#CBD5E1] transition duration-200 hover:border-[#7C8CFF]/30 hover:text-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C8CFF] focus-visible:ring-offset-4 focus-visible:ring-offset-[#080D1A] motion-reduce:transition-none"
    >
      <Icon aria-hidden="true" className="h-4 w-4" />
    </button>
  );
}
