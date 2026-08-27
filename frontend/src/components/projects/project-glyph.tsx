"use client";

import type { CSSProperties, ReactElement, SVGProps } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ChartCandlestick,
  Droplets,
  FileSearch,
  GraduationCap,
  Headset,
  HeartPulse,
  Landmark,
  MessageSquareText,
  MousePointerClick,
} from "lucide-react";

import type { ProjectHomeIconKey } from "@/types/project";

type CustomGlyphComponent = (
  props: SVGProps<SVGSVGElement>,
) => ReactElement;

type ProjectGlyphConfig = {
  icon: LucideIcon | CustomGlyphComponent;
  accent: string;
  opticalScale?: number;
};

const PROJECT_GLYPHS: Record<ProjectHomeIconKey, ProjectGlyphConfig> = {
  "medical-rag": {
    icon: FileSearch,
    accent: "#8B80D9",
    opticalScale: 0.96,
  },
  syndismart: {
    icon: MessageSquareText,
    accent: "#5E9B93",
  },
  "call-center": {
    icon: Headset,
    accent: "#B9827A",
    opticalScale: 0.97,
  },
  recommendation: {
    icon: RecommendationGlyph,
    accent: "#7D93BC",
    opticalScale: 1.02,
  },
  "algorithmic-trading": {
    icon: ChartCandlestick,
    accent: "#A58B5D",
    opticalScale: 0.95,
  },
  "realtime-tracking": {
    icon: MousePointerClick,
    accent: "#7D93BC",
    opticalScale: 0.98,
  },
  "bank-decision": {
    icon: Landmark,
    accent: "#8E89A7",
    opticalScale: 0.95,
  },
  "school-analytics": {
    icon: GraduationCap,
    accent: "#8A92C4",
    opticalScale: 0.96,
  },
  "nutrition-analysis": {
    icon: HeartPulse,
    accent: "#7FA2B8",
    opticalScale: 0.96,
  },
  "blood-donation": {
    icon: Droplets,
    accent: "#B27D8E",
    opticalScale: 0.97,
  },
};

type ProjectGlyphProps = {
  iconKey: ProjectHomeIconKey;
};

function RecommendationGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.45"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="7" cy="7" r="2.2" />
      <path d="M4.6 13.15c.82-1.23 1.96-1.9 3.96-1.9 1.02 0 1.84.16 2.5.49" />
      <path d="M12.9 8h5.6" />
      <path d="M12.9 11.5h4.55" />
      <path d="M12.9 15h3.4" />
      <circle cx="11.15" cy="8" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="11.15" cy="11.5" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="11.15" cy="15" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ProjectGlyph({ iconKey }: ProjectGlyphProps) {
  const { icon: Icon, accent, opticalScale = 1 } = PROJECT_GLYPHS[iconKey];

  return (
    <div
      aria-hidden="true"
      className="editorial-project-glyph relative grid h-[3.2rem] w-[3.2rem] place-items-center rounded-full border border-[rgba(180,177,194,0.085)] bg-[rgba(8,13,26,0.2)] md:h-[4.2rem] md:w-[4.2rem]"
      style={
        {
          "--project-glyph-accent": accent,
          "--project-glyph-scale": opticalScale,
        } as CSSProperties
      }
    >
      <span className="editorial-project-glyph-secondary pointer-events-none absolute inset-[0.34rem] rounded-full border border-[rgba(97,86,183,0.082)] md:inset-[0.44rem]" />
      <span className="pointer-events-none absolute inset-[19%] rounded-full border border-[rgba(255,255,255,0.018)]" />
      <Icon className="editorial-project-glyph-icon relative z-[1] h-[1.38rem] w-[1.38rem] stroke-[1.4] md:h-[1.56rem] md:w-[1.56rem]" />
    </div>
  );
}
