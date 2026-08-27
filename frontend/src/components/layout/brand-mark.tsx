"use client";

import Image from "next/image";
import Link from "next/link";
import type { MouseEvent } from "react";

import type { SectionId } from "@/types/portfolio";

type BrandMarkProps = {
  label: string;
  navigateToSection: (sectionId: SectionId) => void;
};

export function BrandMark({ label, navigateToSection }: BrandMarkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    navigateToSection("home");
  };

  return (
    <Link
      href="#home"
      scroll={false}
      aria-label={label}
      onClick={handleClick}
      className="fixed left-[5vw] top-11 z-50 hidden h-12 w-[95px] items-center justify-start rounded-[6px] opacity-[0.88] transition-[opacity,transform] duration-150 hover:-translate-y-px hover:opacity-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-accent-2)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--home-bg-0)] motion-reduce:transition-none lg:flex xl:left-[9vw] xl:w-[99px] 2xl:left-[10vw] 2xl:w-24"
    >
      <Image
        src="/assets/logo-animation/sa-logo-static.webp"
        alt=""
        width={96}
        height={54}
        sizes="(min-width: 1536px) 101px, (min-width: 1280px) 92px, 88px"
        className="h-auto w-full object-contain"
        priority
      />
    </Link>
  );
}
