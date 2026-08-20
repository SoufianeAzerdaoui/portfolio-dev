"use client";

import Image from "next/image";
import type { KeyboardEvent, PointerEvent } from "react";
import { useId, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { resolveProjectMediaUrl } from "@/features/projects/utils/project-media";
import type { ProjectMedia } from "@/types/project";

type ProjectMediaCarouselProps = {
  media: ProjectMedia[];
  label: string;
  priorityFirst?: boolean;
};

function formatCounter(value: number) {
  return String(value).padStart(2, "0");
}

function getAspectRatio(media: ProjectMedia) {
  if (media.width && media.height) {
    return `${media.width} / ${media.height}`;
  }

  return "16 / 9";
}

export function ProjectMediaCarousel({
  media,
  label,
  priorityFirst = false,
}: ProjectMediaCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const descriptionId = useId();
  const pointerStartX = useRef<number | null>(null);
  const pointerId = useRef<number | null>(null);

  if (media.length === 0) {
    return null;
  }

  const activeMedia = media[activeIndex] ?? media[0];
  const count = media.length;
  const canNavigate = count > 1;

  const goToPrevious = () => {
    setActiveIndex((current) => (current - 1 + count) % count);
  };

  const goToNext = () => {
    setActiveIndex((current) => (current + 1) % count);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
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
    if (event.pointerType === "mouse") {
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

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      aria-describedby={descriptionId}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="group/carousel outline-none focus-visible:rounded-[16px] focus-visible:ring-2 focus-visible:ring-[#7C8CFF] focus-visible:ring-offset-4 focus-visible:ring-offset-[#080D1A]"
    >
      <p id={descriptionId} className="sr-only">
        Utilisez les flèches gauche et droite lorsque la galerie est focalisée
        pour naviguer entre les images.
      </p>

      {canNavigate ? (
        <div className="mb-3 hidden items-center justify-end gap-4 md:flex">
          <p className="text-[0.72rem] font-medium uppercase tracking-[0.18em] text-[#94A3B8]/72">
            {formatCounter(activeIndex + 1)} / {formatCounter(count)}
          </p>
        </div>
      ) : null}

      <div className="relative">
        {canNavigate ? (
          <CarouselButton
            direction="previous"
            label="Image précédente"
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 z-10 hidden -translate-y-1/2 md:inline-flex lg:left-3"
          />
        ) : null}

        <div
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          className="relative overflow-hidden rounded-[16px] border border-slate-400/[0.1] bg-[#090F1C]/42 p-3 shadow-[0_20px_64px_rgba(0,0,0,0.18)] sm:p-4 lg:p-[18px]"
        >
          <div
            className="relative overflow-hidden rounded-[11px] bg-[#050912]/35 ring-1 ring-inset ring-slate-400/[0.05]"
            style={{ aspectRatio: getAspectRatio(media[0]) }}
          >
            <div
              key={activeMedia.id}
              className="relative h-full w-full motion-safe:animate-[case-study-media_220ms_ease-out_both]"
            >
              <Image
                src={resolveProjectMediaUrl(activeMedia)}
                alt={activeMedia.alt}
                fill
                priority={priorityFirst && activeIndex === 0}
                sizes="(min-width: 1440px) 1120px, (min-width: 1024px) 72vw, 94vw"
                className="object-contain"
              />
            </div>
          </div>
        </div>

        {canNavigate ? (
          <CarouselButton
            direction="next"
            label="Image suivante"
            onClick={goToNext}
            className="absolute right-2 top-1/2 z-10 hidden -translate-y-1/2 md:inline-flex lg:right-3"
          />
        ) : null}
      </div>

      {activeMedia.caption ? (
        <p className="mt-3 text-center text-[0.82rem] leading-6 text-[#94A3B8]">
          {activeMedia.caption}
        </p>
      ) : null}

      {canNavigate ? (
        <div className="mt-4 flex items-center justify-between gap-4 md:hidden">
          <CarouselButton
            direction="previous"
            label="Image précédente"
            onClick={goToPrevious}
          />
          <p className="text-[0.72rem] font-medium uppercase tracking-[0.18em] text-[#94A3B8]/72">
            {formatCounter(activeIndex + 1)} / {formatCounter(count)}
          </p>
          <CarouselButton
            direction="next"
            label="Image suivante"
            onClick={goToNext}
          />
        </div>
      ) : null}
    </div>
  );
}

function CarouselButton({
  direction,
  label,
  onClick,
  className = "",
}: {
  direction: "previous" | "next";
  label: string;
  onClick: () => void;
  className?: string;
}) {
  const Icon = direction === "previous" ? ChevronLeft : ChevronRight;

  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={[
        "inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-400/[0.12] bg-[#080D1A]/82 text-[#CBD5E1] backdrop-blur-sm transition duration-200 hover:border-[#7C8CFF]/35 hover:text-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C8CFF] focus-visible:ring-offset-4 focus-visible:ring-offset-[#080D1A] motion-reduce:transition-none md:h-10 md:w-10",
        className,
      ].join(" ")}
    >
      <Icon aria-hidden="true" className="h-4 w-4" />
    </button>
  );
}
