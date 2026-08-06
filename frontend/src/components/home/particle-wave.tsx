"use client";

import { motion, useReducedMotion } from "motion/react";

const dots = [
  { x: 40, y: 182, r: 2.4, delay: 0 },
  { x: 88, y: 170, r: 1.8, delay: 0.8 },
  { x: 134, y: 154, r: 2.2, delay: 0.3 },
  { x: 184, y: 142, r: 1.6, delay: 1.2 },
  { x: 234, y: 130, r: 2, delay: 0.5 },
  { x: 286, y: 120, r: 1.5, delay: 1.5 },
  { x: 340, y: 113, r: 2.3, delay: 0.7 },
  { x: 392, y: 106, r: 1.8, delay: 1.8 },
  { x: 444, y: 101, r: 2.1, delay: 1.1 },
  { x: 498, y: 98, r: 1.7, delay: 2 },
  { x: 548, y: 102, r: 2.2, delay: 1.4 },
  { x: 596, y: 118, r: 1.8, delay: 2.1 },
];

export function ParticleWave() {
  const reducedMotion = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute bottom-[-2.8rem] right-[-9vw] hidden w-[min(50vw,42rem)] opacity-[0.92] md:block"
    >
      <svg
        viewBox="0 0 640 240"
        className="h-auto w-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M22 194C96 153 151 141 222 129C309 114 382 86 460 95C518 102 561 127 621 164"
          stroke="url(#wave-stroke)"
          strokeWidth="1.1"
          strokeOpacity="0.44"
        />
        <path
          d="M48 220C130 176 220 154 297 145C401 133 498 138 608 184"
          stroke="url(#wave-stroke)"
          strokeWidth="1"
          strokeOpacity="0.22"
        />
        <path
          d="M10 160C84 138 161 131 226 123C304 114 390 88 464 84C531 81 587 94 634 126"
          stroke="url(#wave-glow)"
          strokeWidth="28"
          strokeLinecap="round"
          strokeOpacity="0.1"
        />
        <path
          d="M120 214C214 166 309 147 404 146C492 145 558 159 628 191"
          stroke="url(#wave-glow-soft)"
          strokeWidth="42"
          strokeLinecap="round"
          strokeOpacity="0.06"
        />

        {dots.map((dot) => (
          <motion.circle
            key={`${dot.x}-${dot.y}`}
            cx={dot.x}
            cy={dot.y}
            r={dot.r}
            fill="#C9D6FF"
            initial={reducedMotion ? false : { opacity: 0.22, scale: 0.9 }}
            animate={
              reducedMotion
                ? { opacity: 0.72, scale: 1 }
                : {
                    opacity: [0.22, 0.9, 0.32],
                    scale: [0.92, 1.18, 1],
                  }
            }
            transition={
              reducedMotion
                ? { duration: 0 }
                : {
                    duration: 4.6,
                    repeat: Infinity,
                    repeatType: "mirror",
                    ease: "easeInOut",
                    delay: dot.delay,
                  }
            }
          />
        ))}

        <defs>
          <linearGradient id="wave-stroke" x1="34" y1="80" x2="610" y2="196" gradientUnits="userSpaceOnUse">
            <stop stopColor="#4F6BFF" stopOpacity="0.12" />
            <stop offset="0.48" stopColor="#93A8FF" stopOpacity="0.44" />
            <stop offset="1" stopColor="#7C5CFC" stopOpacity="0.16" />
          </linearGradient>
          <linearGradient id="wave-glow" x1="46" y1="118" x2="620" y2="162" gradientUnits="userSpaceOnUse">
            <stop stopColor="#4F6BFF" />
            <stop offset="1" stopColor="#7C5CFC" />
          </linearGradient>
          <linearGradient id="wave-glow-soft" x1="130" y1="148" x2="630" y2="196" gradientUnits="userSpaceOnUse">
            <stop stopColor="#243C9B" />
            <stop offset="0.58" stopColor="#5E73FF" />
            <stop offset="1" stopColor="#7C5CFC" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
