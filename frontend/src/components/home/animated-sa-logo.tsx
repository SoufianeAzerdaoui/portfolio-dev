"use client";

import { CSSProperties, useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { useReducedMotion } from "motion/react";

gsap.registerPlugin(MotionPathPlugin);

const S_ASSET_SRC = "/assets/logo-animation/sa-s-clean.png";
const A_ASSET_SRC = "/assets/logo-animation/sa-a-clean.png";
const FINAL_CORE_ASSET_SRC = "/assets/logo-animation/sa-core-clean.png";
const CORE_IMAGE_WIDTH = 765;
const CORE_IMAGE_HEIGHT = 365;
const SHINE_START_PERCENT = -135;
const SHINE_END_PERCENT = 135;
const ORBIT_IDLE_OPACITIES = [0.24, 0.21, 0.18] as const;
type DebugLogoLayer =
  | "all"
  | "infinity"
  | "s"
  | "a"
  | "final-core"
  | "circuits"
  | "orbits"
  | "particles"
  | "skills"
  | "shine";
const DEBUG_LOGO_LAYER: DebugLogoLayer = "all";
const CORE_PATHS = {
  sUpper:
    "M94 176C70 122 92 72 151 47C210 22 282 39 338 91C388 138 436 203 493 263C512 284 531 298 551 304",
  sLower:
    "M386 276C340 318 283 333 219 324C154 315 100 284 85 236C76 208 85 181 111 167C145 149 197 158 251 170C299 181 339 187 374 180",
  aTop: "M418 188C458 141 496 99 541 64C589 27 649 24 684 55",
  aLeg: "M684 55C710 78 716 111 716 150C718 202 728 282 746 350",
  aBar: "M492 194L623 194",
} as const;
const CORE_STROKES = {
  sUpper: 68,
  sLower: 68,
  aTop: 62,
  aLeg: 60,
  aBar: 44,
} as const;

const getOrbitIdleOpacity = (index: number) =>
  ORBIT_IDLE_OPACITIES[index] ?? ORBIT_IDLE_OPACITIES.at(-1) ?? 0.18;

const satellites = [
  {
    label: "Data Science",
    orbitClassName: "orbit-wrapper orbit-outer pointer-events-none absolute inset-0 z-40",
    labelClassName:
      "absolute left-[40%] top-[28%] -translate-x-1/2 -translate-y-1/2",
    visibilityClassName: "hidden md:block",
    duration: 51,
    initialRotation: 0,
    direction: 1,
    arcStart: -8,
    arcEnd: 12,
    arcDuration: 28,
    prominence: "primary" as const,
    alignment: "left" as const,
  },
  {
    label: "Machine Learning",
    orbitClassName: "orbit-wrapper orbit-middle pointer-events-none absolute inset-0 z-40",
    labelClassName:
      "absolute left-[76%] top-[35%] -translate-x-1/2 -translate-y-1/2",
    visibilityClassName: "",
    duration: 37,
    initialRotation: 6,
    direction: -1,
    arcStart: 8,
    arcEnd: -10,
    arcDuration: 32,
    prominence: "primary" as const,
    alignment: "right" as const,
  },
  {
    label: "NLP",
    orbitClassName: "orbit-wrapper orbit-inner pointer-events-none absolute inset-0 z-40",
    labelClassName:
      "absolute left-[74%] top-[64%] -translate-x-1/2 -translate-y-1/2",
    visibilityClassName: "",
    duration: 29,
    initialRotation: -10,
    direction: -1,
    arcStart: -8,
    arcEnd: 12,
    arcDuration: 34,
    prominence: "primary" as const,
    alignment: "right" as const,
  },
  {
    label: "RAG Systems",
    orbitClassName: "orbit-wrapper orbit-middle pointer-events-none absolute inset-0 z-40",
    labelClassName:
      "absolute left-[29%] top-[67%] -translate-x-1/2 -translate-y-1/2",
    visibilityClassName: "hidden lg:block",
    duration: 43,
    initialRotation: 4,
    direction: 1,
    arcStart: 10,
    arcEnd: -12,
    arcDuration: 30,
    prominence: "secondary" as const,
    alignment: "left" as const,
  },
];

export function AnimatedSALogo() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const shineRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useLayoutEffect(() => {
    const sceneElement = sceneRef.current;
    let intersectionObserver: IntersectionObserver | undefined;
    let handleVisibilityChange: (() => void) | undefined;

    if (!sceneElement) {
      return;
    }

    const context = gsap.context(() => {
      const orbitGroups = gsap.utils.toArray<SVGGElement>(".orbit-group");
      const orbitWrappers = gsap.utils.toArray<HTMLElement>(".orbit-wrapper");
      const orbitLabels = gsap.utils.toArray<HTMLElement>(".orbit-label");
      const circuitPaths = gsap.utils.toArray<SVGPathElement>(".circuit-path");
      const circuitNodes = gsap.utils.toArray<SVGCircleElement>(".circuit-node");
      const pulseDots = gsap.utils.toArray<SVGGElement>(".circuit-pulse");
      const particles = gsap.utils.toArray<SVGCircleElement>(".ambient-particle");
      const stars = gsap.utils.toArray<SVGPathElement>(".ambient-star");
      const continuousAnimations: gsap.core.Animation[] = [];
      const leftCircuitPaths = circuitPaths.slice(0, 3);
      const rightCircuitPaths = circuitPaths.slice(3);
      const leftCircuitNodes = circuitNodes.slice(0, 3);
      const rightCircuitNodes = circuitNodes.slice(3);
      const infinityPath = sceneElement.querySelector<SVGPathElement>(
        "#infinity-energy-path",
      );
      const sUpperMaskPath = sceneElement.querySelector<SVGPathElement>(
        ".mask-path-s-upper",
      );
      const sLowerMaskPath = sceneElement.querySelector<SVGPathElement>(
        ".mask-path-s-lower",
      );
      const aTopMaskPath = sceneElement.querySelector<SVGPathElement>(
        ".mask-path-a-top",
      );
      const aLegMaskPath = sceneElement.querySelector<SVGPathElement>(
        ".mask-path-a-leg",
      );
      const aBarMaskPath = sceneElement.querySelector<SVGPathElement>(
        ".mask-path-a-bar",
      );
      const shineLayer = shineRef.current;

      if (
        !infinityPath ||
        !shineLayer ||
        !sUpperMaskPath ||
        !sLowerMaskPath ||
        !aTopMaskPath ||
        !aLegMaskPath ||
        !aBarMaskPath
      ) {
        return;
      }

      const registerContinuousAnimation = <T extends gsap.core.Animation>(
        animation: T,
      ) => {
        continuousAnimations.push(animation);
        return animation;
      };

      const debugSelectors: Record<Exclude<DebugLogoLayer, "all">, string[]> = {
        infinity: [
          ".infinity-trace",
          ".infinity-trace-accent",
          ".infinity-cross-highlight",
          ".infinity-data-pulse",
          ".core-energy-left",
          ".core-energy-right",
        ],
        s: [".core-reveal-s-upper", ".core-reveal-s-lower", ".core-handoff-pulse", ".reveal-front-s-upper", ".reveal-front-s-lower"],
        a: [".core-reveal-a-top", ".core-reveal-a-leg", ".core-reveal-a-bar", ".reveal-front-a-top", ".reveal-front-a-leg", ".reveal-front-a-bar"],
        "final-core": [".core-full-image"],
        circuits: [".circuit-path", ".circuit-node", ".circuit-pulse"],
        orbits: [".orbit-group", ".comet"],
        particles: [".ambient-particle", ".ambient-star"],
        skills: [".satellite"],
        shine: [".sa-metal-shine", ".sa-metal-shine-sweep"],
      };

      const applyDebugLayerMode = () => {
        if (DEBUG_LOGO_LAYER === "all") {
          return;
        }

        const active = new Set(debugSelectors[DEBUG_LOGO_LAYER]);
        Object.entries(debugSelectors).forEach(([layer, selectors]) => {
          if (layer === DEBUG_LOGO_LAYER) {
            return;
          }

          selectors.forEach((selector) => {
            if (!active.has(selector)) {
              gsap.set(selector, { autoAlpha: 0 });
            }
          });
        });
      };

      const getSatelliteBaseOpacity = (target: gsap.TweenTarget) =>
        target instanceof HTMLElement && target.dataset.prominence === "secondary"
          ? 0.46
          : 0.52;

      const getSatellitePeakOpacity = (target: gsap.TweenTarget) =>
        target instanceof HTMLElement && target.dataset.prominence === "secondary"
          ? 0.54
          : 0.6;

      const getSatelliteRevealOpacity = (target: gsap.TweenTarget) =>
        target instanceof HTMLElement && target.dataset.prominence === "secondary"
          ? 0.64
          : 0.7;

      const setRevealPath = (path: SVGPathElement) => {
        const length = path.getTotalLength();
        const hiddenLength = length + 4;
        gsap.set(path, {
          strokeDasharray: hiddenLength,
          strokeDashoffset: reducedMotion ? 0 : hiddenLength,
        });
      };

      const setFrontStart = (selector: string, path: string) => {
        gsap.set(selector, {
          motionPath: {
            path,
            align: path,
            autoRotate: false,
            alignOrigin: [0.5, 0.5],
            start: 0,
            end: 0,
          },
        });
      };

      const pathLength = infinityPath.getTotalLength();
      let introComplete = reducedMotion;
      let sceneInView = true;
      let pageVisible = document.visibilityState === "visible";

      const syncContinuousAnimations = () => {
        const shouldRun =
          !reducedMotion && introComplete && sceneInView && pageVisible;

        continuousAnimations.forEach((animation) => {
          if (shouldRun) {
            animation.resume();
            return;
          }

          animation.pause();
        });
      };

      gsap.set(".infinity-trace", {
        opacity: reducedMotion ? 0.18 : 0,
        strokeDasharray: pathLength,
        strokeDashoffset: reducedMotion ? 0 : pathLength,
      });
      gsap.set(".infinity-trace-accent", {
        opacity: reducedMotion ? 0.03 : 0,
      });
      gsap.set(".infinity-cross-highlight", {
        opacity: 0,
        scale: reducedMotion ? 1 : 0.74,
        transformOrigin: "50% 50%",
      });
      gsap.set(".infinity-data-pulse", {
        opacity: 0,
        scale: 0.84,
        transformOrigin: "50% 50%",
      });
      gsap.set(".core-energy-left, .core-energy-right", {
        opacity: 0,
        scale: 0.7,
        transformOrigin: "50% 50%",
      });
      setRevealPath(sUpperMaskPath);
      setRevealPath(sLowerMaskPath);
      setRevealPath(aTopMaskPath);
      setRevealPath(aLegMaskPath);
      setRevealPath(aBarMaskPath);
      gsap.set(
        ".core-reveal-s-upper, .core-reveal-s-lower, .core-reveal-a-top, .core-reveal-a-leg, .core-reveal-a-bar",
        {
          autoAlpha: 0,
          scale: 1,
          transformOrigin: "50% 50%",
        },
      );
      gsap.set(".core-full-image", {
        autoAlpha: reducedMotion ? 1 : 0,
      });
      setFrontStart(".reveal-front-s-upper", "#s-upper-guide-path");
      setFrontStart(".reveal-front-s-lower", "#s-lower-guide-path");
      setFrontStart(".reveal-front-a-top", "#a-top-guide-path");
      setFrontStart(".reveal-front-a-leg", "#a-leg-guide-path");
      setFrontStart(".reveal-front-a-bar", "#a-bar-guide-path");
      setFrontStart(".core-handoff-pulse", "#s-a-handoff-path");
      gsap.set(
        ".core-handoff-pulse, .reveal-front-s-upper, .reveal-front-s-lower, .reveal-front-a-top, .reveal-front-a-leg, .reveal-front-a-bar",
        {
          autoAlpha: 0,
          scale: 0.84,
          transformOrigin: "50% 50%",
        },
      );
      gsap.set(".sa-metal-shine-sweep", {
        xPercent: SHINE_START_PERCENT,
        autoAlpha: 0,
      });
      gsap.set(".sa-lock-glow", {
        opacity: 0,
        scale: reducedMotion ? 1 : 0.92,
        transformOrigin: "50% 50%",
      });
      gsap.set(".sa-core-wrap", {
        scale: 1,
        y: 0,
        filter: "blur(0px)",
      });
      gsap.set(".satellite", {
        autoAlpha: reducedMotion
          ? (_index, target) => getSatelliteBaseOpacity(target)
          : 0,
        y: reducedMotion ? 0 : 8,
        scale: reducedMotion ? 1 : 0.96,
      });
      gsap.set(sceneElement, { autoAlpha: 0 });

      circuitPaths.forEach((path) => {
        const length = path.getTotalLength();
        gsap.set(path, {
          autoAlpha: reducedMotion ? 0.36 : 0,
          strokeDasharray: length,
          strokeDashoffset: reducedMotion ? 0 : length,
        });
      });

      gsap.set(circuitNodes, {
        autoAlpha: reducedMotion ? 0.84 : 0,
        scale: reducedMotion ? 1 : 0.5,
        transformOrigin: "50% 50%",
      });
      gsap.set(orbitGroups, {
        autoAlpha: reducedMotion ? (index) => getOrbitIdleOpacity(index) : 0,
        scale: reducedMotion ? 1 : 0.97,
        transformOrigin: "50% 50%",
      });
      gsap.set(".comet", {
        autoAlpha: reducedMotion ? 0.9 : 0,
        transformOrigin: "50% 50%",
      });
      gsap.set(".comet", {
        motionPath: {
          path: "#infinity-energy-path",
          align: "#infinity-energy-path",
          autoRotate: false,
          alignOrigin: [0.5, 0.5],
          start: 0.18,
          end: 0.18,
        },
      });
      gsap.set(particles, { autoAlpha: reducedMotion ? 0.22 : 0.14, scale: 1 });
      gsap.set(stars, { autoAlpha: reducedMotion ? 0.26 : 0.1 });
      applyDebugLayerMode();
      gsap.set(sceneElement, { autoAlpha: 1 });

      if (!reducedMotion) {
        const introTimeline = gsap.timeline({
          defaults: { ease: "power2.out" },
        });

        introTimeline
          .addLabel("infinity", 0)
          .addLabel("coreEnergy", 0.52)
          .addLabel("sReveal", 0.6)
          .addLabel("handoff", 1.08)
          .addLabel("aReveal", 1.16)
          .addLabel("coreComplete", 1.86)
          .addLabel("saLock", 2)
          .addLabel("energySplit", 2.14)
          .addLabel("circuits", 2.18)
          .addLabel("nodes", 2.46)
          .addLabel("orbits", 2.58)
          .addLabel("skills", 2.66)
          .addLabel("ecosystem", 2.58)
          .addLabel("idle", 2.92)
          .to(
            ".infinity-trace",
            {
              opacity: 0.36,
              strokeDashoffset: 0,
              duration: 0.92,
            },
            "infinity",
          )
          .to(
            ".infinity-data-pulse",
            {
              opacity: 0.84,
              duration: 0.08,
              ease: "power1.out",
            },
            "infinity+=0.24",
          )
          .to(
            ".infinity-data-pulse",
            {
              duration: 0.88,
              ease: "none",
              motionPath: {
                path: "#infinity-signature-path",
                align: "#infinity-signature-path",
                autoRotate: false,
                alignOrigin: [0.5, 0.5],
              },
            },
            "infinity+=0.24",
          )
          .to(
            ".infinity-trace-accent",
            {
              opacity: 0.18,
              duration: 0.34,
            },
            "sReveal-=0.16",
          )
          .to(
            ".infinity-cross-highlight",
            {
              opacity: 0.18,
              scale: 1,
              duration: 0.22,
              ease: "power1.out",
            },
            "sReveal-=0.05",
          )
          .to(
            ".core-reveal-s-upper",
            {
              autoAlpha: 1,
              duration: 0.01,
            },
            "sReveal",
          )
          .to(
            sUpperMaskPath,
            {
              strokeDashoffset: 0,
              duration: 0.52,
              ease: "power3.out",
            },
            "sReveal",
          )
          .to(
            ".reveal-front-s-upper",
            {
              autoAlpha: 0.58,
              scale: 1,
              duration: 0.06,
              ease: "power1.out",
            },
            "sReveal",
          )
          .to(
            ".reveal-front-s-upper",
            {
              duration: 0.52,
              ease: "none",
              motionPath: {
                path: "#s-upper-guide-path",
                align: "#s-upper-guide-path",
                autoRotate: false,
                alignOrigin: [0.5, 0.5],
                start: 0,
                end: 1,
              },
            },
            "sReveal",
          )
          .to(
            ".core-reveal-s-lower",
            {
              autoAlpha: 1,
              duration: 0.01,
            },
            "sReveal+=0.07",
          )
          .to(
            sLowerMaskPath,
            {
              strokeDashoffset: 0,
              duration: 0.46,
              ease: "power3.out",
            },
            "sReveal+=0.07",
          )
          .to(
            ".reveal-front-s-lower",
            {
              autoAlpha: 0.46,
              scale: 1,
              duration: 0.06,
              ease: "power1.out",
            },
            "sReveal+=0.07",
          )
          .to(
            ".reveal-front-s-lower",
            {
              duration: 0.46,
              ease: "none",
              motionPath: {
                path: "#s-lower-guide-path",
                align: "#s-lower-guide-path",
                autoRotate: false,
                alignOrigin: [0.5, 0.5],
                start: 0,
                end: 1,
              },
            },
            "sReveal+=0.07",
          )
          .to(
            ".reveal-front-s-upper, .reveal-front-s-lower",
            {
              autoAlpha: 0,
              duration: 0.08,
            },
            "sReveal+=0.52",
          )
          .to(
            ".core-handoff-pulse",
            {
              autoAlpha: 0.5,
              scale: 1,
              duration: 0.04,
              ease: "power1.out",
            },
            "handoff",
          )
          .to(
            ".core-handoff-pulse",
            {
              duration: 0.1,
              ease: "none",
              motionPath: {
                path: "#s-a-handoff-path",
                align: "#s-a-handoff-path",
                autoRotate: false,
                alignOrigin: [0.5, 0.5],
                start: 0,
                end: 1,
              },
            },
            "handoff",
          )
          .to(
            ".core-handoff-pulse",
            {
              autoAlpha: 0,
              duration: 0.06,
              ease: "power1.in",
            },
            "handoff+=0.08",
          )
          .to(
            ".sa-lock-glow",
            {
              opacity: 0.09,
              scale: 0.98,
              duration: 0.22,
              ease: "power1.out",
            },
            "sReveal+=0.04",
          )
          .to(
            ".infinity-trace",
            {
              opacity: 0.11,
              duration: 0.42,
              ease: "power1.out",
            },
            "sReveal+=0.04",
          )
          .to(
            ".infinity-trace-accent",
            {
              opacity: 0.015,
              duration: 0.38,
              ease: "power1.out",
            },
            "sReveal+=0.04",
          )
          .to(
            ".core-reveal-a-top",
            {
              autoAlpha: 1,
              duration: 0.01,
            },
            "aReveal",
          )
          .to(
            aTopMaskPath,
            {
              strokeDashoffset: 0,
              duration: 0.24,
              ease: "power1.inOut",
            },
            "aReveal+=0.04",
          )
          .to(
            ".reveal-front-a-top",
            {
              autoAlpha: 0.48,
              scale: 1,
              duration: 0.06,
              ease: "power1.out",
            },
            "aReveal+=0.04",
          )
          .to(
            ".reveal-front-a-top",
            {
              duration: 0.24,
              ease: "none",
              motionPath: {
                path: "#a-top-guide-path",
                align: "#a-top-guide-path",
                autoRotate: false,
                alignOrigin: [0.5, 0.5],
                start: 0,
                end: 1,
              },
            },
            "aReveal+=0.04",
          )
          .to(
            ".core-reveal-a-leg",
            {
              autoAlpha: 1,
              duration: 0.01,
            },
            "aReveal+=0.28",
          )
          .to(
            aLegMaskPath,
            {
              strokeDashoffset: 0,
              duration: 0.26,
              ease: "power1.inOut",
            },
            "aReveal+=0.28",
          )
          .to(
            ".reveal-front-a-leg",
            {
              autoAlpha: 0.46,
              scale: 1,
              duration: 0.05,
              ease: "power1.out",
            },
            "aReveal+=0.28",
          )
          .to(
            ".reveal-front-a-leg",
            {
              duration: 0.26,
              ease: "none",
              motionPath: {
                path: "#a-leg-guide-path",
                align: "#a-leg-guide-path",
                autoRotate: false,
                alignOrigin: [0.5, 0.5],
                start: 0,
                end: 1,
              },
            },
            "aReveal+=0.28",
          )
          .to(
            ".core-reveal-a-bar",
            {
              autoAlpha: 1,
              duration: 0.01,
            },
            "aReveal+=0.54",
          )
          .to(
            aBarMaskPath,
            {
              strokeDashoffset: 0,
              duration: 0.15,
              ease: "power2.out",
            },
            "aReveal+=0.54",
          )
          .to(
            ".reveal-front-a-bar",
            {
              autoAlpha: 0.42,
              scale: 1,
              duration: 0.05,
              ease: "power1.out",
            },
            "aReveal+=0.54",
          )
          .to(
            ".reveal-front-a-bar",
            {
              duration: 0.15,
              ease: "none",
              motionPath: {
                path: "#a-bar-guide-path",
                align: "#a-bar-guide-path",
                autoRotate: false,
                alignOrigin: [0.5, 0.5],
                start: 0,
                end: 1,
              },
            },
            "aReveal+=0.54",
          )
          .to(
            ".reveal-front-a-top, .reveal-front-a-leg, .reveal-front-a-bar",
            {
              autoAlpha: 0,
              duration: 0.08,
            },
            "aReveal+=0.68",
          )
          .to(
            ".infinity-cross-highlight",
            {
              opacity: 0.14,
              scale: 1.02,
              duration: 0.16,
              ease: "power1.out",
              repeat: 1,
              yoyo: true,
            },
            "aReveal+=0.1",
          )
          .to(
            ".core-full-image",
            {
              autoAlpha: 1,
              duration: 0.12,
              ease: "power1.out",
            },
            "coreComplete",
          )
          .to(
            ".core-reveal-s-upper, .core-reveal-s-lower, .core-reveal-a-top, .core-reveal-a-leg, .core-reveal-a-bar, .core-handoff-pulse, .reveal-front-s-upper, .reveal-front-s-lower, .reveal-front-a-top, .reveal-front-a-leg, .reveal-front-a-bar",
            {
              autoAlpha: 0,
              duration: 0.12,
              ease: "power1.out",
            },
            "coreComplete",
          )
          .to(
            ".sa-lock-glow",
            {
              opacity: 0.18,
              scale: 1,
              duration: 0.14,
              ease: "power1.out",
              repeat: 1,
              yoyo: true,
            },
            "saLock",
          )
          .to(
            ".sa-core-wrap",
            {
              scale: 1.005,
              duration: 0.1,
              ease: "power1.out",
              repeat: 1,
              yoyo: true,
            },
            "saLock",
          )
          .to(
            ".infinity-cross-highlight",
            {
              opacity: 0.22,
              scale: 1.04,
              duration: 0.12,
              ease: "power1.out",
              repeat: 1,
              yoyo: true,
            },
            "saLock",
          )
          .to(
            ".infinity-data-pulse",
            {
              opacity: 0,
              duration: 0.08,
              ease: "power1.in",
            },
            "circuits-=0.12",
          )
          .to(
            ".core-energy-left",
            {
              opacity: 0.84,
              scale: 1,
              duration: 0.08,
              ease: "power1.out",
            },
            "energySplit",
          )
          .to(
            ".core-energy-right",
            {
              opacity: 0.84,
              scale: 1,
              duration: 0.08,
              ease: "power1.out",
            },
            "energySplit+=0.04",
          )
          .to(
            ".core-energy-left",
            {
              duration: 0.22,
              ease: "power1.out",
              motionPath: {
                path: "#core-split-left-path",
                align: "#core-split-left-path",
                autoRotate: false,
                alignOrigin: [0.5, 0.5],
              },
            },
            "energySplit",
          )
          .to(
            ".core-energy-right",
            {
              duration: 0.22,
              ease: "power1.out",
              motionPath: {
                path: "#core-split-right-path",
                align: "#core-split-right-path",
                autoRotate: false,
                alignOrigin: [0.5, 0.5],
              },
            },
            "energySplit+=0.04",
          )
          .to(
            leftCircuitPaths,
            {
              autoAlpha: 0.72,
              stroke: "#AAB7C8",
              strokeDashoffset: 0,
              duration: 0.58,
              stagger: 0.05,
            },
            "circuits",
          )
          .to(
            rightCircuitPaths,
            {
              autoAlpha: 0.72,
              stroke: "#AAB7C8",
              strokeDashoffset: 0,
              duration: 0.6,
              stagger: 0.05,
            },
            "circuits+=0.06",
          )
          .to(
            circuitPaths,
            {
              autoAlpha: 0.36,
              stroke: "#94A3B8",
              duration: 0.42,
              ease: "power1.out",
            },
            "nodes+=0.24",
          )
          .to(
            ".core-energy-left, .core-energy-right",
            {
              opacity: 0,
              duration: 0.1,
            },
            "circuits+=0.18",
          )
          .to(
            leftCircuitNodes,
            {
              autoAlpha: 0.84,
              scale: 1.12,
              duration: 0.2,
              stagger: 0.05,
            },
            "nodes",
          )
          .to(
            leftCircuitNodes,
            {
              scale: 1,
              duration: 0.14,
              stagger: 0.05,
            },
            "nodes+=0.14",
          )
          .to(
            rightCircuitNodes,
            {
              autoAlpha: 0.84,
              scale: 1.12,
              duration: 0.2,
              stagger: 0.05,
            },
            "nodes+=0.08",
          )
          .to(
            rightCircuitNodes,
            {
              scale: 1,
              duration: 0.14,
              stagger: 0.05,
            },
            "nodes+=0.22",
          )
          .to(
            orbitGroups,
            {
              autoAlpha: (index) => getOrbitIdleOpacity(index),
              scale: 1,
              duration: 0.42,
              stagger: 0.06,
            },
            "orbits",
          )
          .to(
            ".comet",
            {
              autoAlpha: 1,
              duration: 0.32,
            },
            "orbits+=0.08",
          )
          .to(
            ".infinity-cross-highlight",
            {
              opacity: 0,
              duration: 0.26,
              ease: "power1.out",
            },
            "saLock+=0.14",
          )
          .to(
            ".satellite[data-skill='Data Science']",
            {
              autoAlpha: (_index, target) => getSatelliteRevealOpacity(target),
              y: 0,
              scale: 1,
              duration: 0.42,
            },
            "skills",
          )
          .to(
            ".satellite[data-skill='Machine Learning']",
            {
              autoAlpha: (_index, target) => getSatelliteRevealOpacity(target),
              y: 0,
              scale: 1,
              duration: 0.42,
            },
            "skills+=0.12",
          )
          .to(
            ".satellite[data-skill='NLP']",
            {
              autoAlpha: (_index, target) => getSatelliteRevealOpacity(target),
              y: 0,
              scale: 1,
              duration: 0.42,
            },
            "skills+=0.24",
          )
          .to(
            ".satellite[data-skill='RAG Systems']",
            {
              autoAlpha: (_index, target) => getSatelliteRevealOpacity(target),
              y: 0,
              scale: 1,
              duration: 0.42,
            },
            "skills+=0.36",
          )
          .to(
            ".satellite",
            {
              autoAlpha: (_index, target) => getSatelliteBaseOpacity(target),
              duration: 0.34,
              ease: "sine.out",
            },
            "idle-=0.1",
          )
          .to(
            ".sa-metal-shine-sweep",
            {
              autoAlpha: 0.28,
              duration: 0.12,
              ease: "power1.out",
            },
            "skills+=0.14",
          )
          .to(
            ".sa-metal-shine-sweep",
            {
              xPercent: SHINE_END_PERCENT,
              autoAlpha: 0.28,
              duration: 0.86,
              ease: "power2.inOut",
            },
            "<",
          )
          .to(
            ".sa-metal-shine-sweep",
            {
              autoAlpha: 0,
              duration: 0.16,
              ease: "power1.out",
            },
            "-=0.12",
          )
          .set(".sa-metal-shine-sweep", {
            xPercent: SHINE_START_PERCENT,
            autoAlpha: 0,
          });

        introTimeline.eventCallback("onComplete", () => {
          introComplete = true;
          syncContinuousAnimations();
        });

        registerContinuousAnimation(
          gsap.to(".sa-core-wrap", {
            y: -2,
            x: 1,
            duration: 9.2,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
          }),
        );

        orbitGroups.forEach((group, index) => {
          const durations = [31, 40, 50];
          const directions = [1, -1, 1];

          registerContinuousAnimation(
            gsap.to(group, {
              rotate: directions[index] * 360,
              transformOrigin: "50% 50%",
              duration: durations[index],
              ease: "none",
              repeat: -1,
            }),
          );
        });

        orbitWrappers.forEach((wrapper, index) => {
          const config = satellites[index];

          if (!config) {
            return;
          }

          gsap.set(wrapper, { rotate: config.arcStart });
          registerContinuousAnimation(
            gsap.to(wrapper, {
              rotate: config.arcEnd,
              transformOrigin: "50% 50%",
              duration: config.arcDuration,
              ease: "sine.inOut",
              repeat: -1,
              yoyo: true,
            }),
          );
        });

        orbitLabels.forEach((label, index) => {
          const config = satellites[index];

          if (!config) {
            return;
          }

          gsap.set(label, { rotate: -config.arcStart });
          registerContinuousAnimation(
            gsap.to(label, {
              rotate: -config.arcEnd,
              transformOrigin: "50% 50%",
              duration: config.arcDuration,
              ease: "sine.inOut",
              repeat: -1,
              yoyo: true,
            }),
          );
        });

        registerContinuousAnimation(
          gsap.to(".comet", {
            duration: 8.2,
            ease: "none",
            repeat: -1,
            motionPath: {
              path: "#infinity-energy-path",
              align: "#infinity-energy-path",
              autoRotate: false,
              alignOrigin: [0.5, 0.5],
            },
          }),
        );

        pulseDots.forEach((pulse, index) => {
          const pathId = pulse.dataset.path;

          if (!pathId) {
            return;
          }

          const delay = [1.8, 6.2, 10.9, 15.4][index] ?? index * 4.6;
          const repeatDelay = [7.4, 8.2, 8.9, 9.1][index] ?? 8.1;

          gsap.set(pulse, {
            autoAlpha: 0,
            scale: 0.62,
            transformOrigin: "50% 50%",
          });

          const pulseTimeline = gsap.timeline({
            repeat: -1,
            repeatDelay,
            delay,
          });

          pulseTimeline
            .set(pulse, {
              autoAlpha: 0,
              scale: 0.62,
            })
            .to(pulse, {
              autoAlpha: 0.62,
              scale: 1,
              duration: 0.12,
              ease: "power1.out",
            })
            .to(
              pulse,
              {
                duration: 1.08,
                ease: "none",
                motionPath: {
                  path: `#${pathId}`,
                  align: `#${pathId}`,
                  autoRotate: false,
                  alignOrigin: [0.5, 0.5],
                  start: 0.06,
                  end: 0.94,
                },
              },
              "<",
            )
            .to(
              pulse,
              {
                autoAlpha: 0,
                scale: 0.72,
                duration: 0.16,
                ease: "power1.in",
              },
              ">-0.16",
            );

          registerContinuousAnimation(pulseTimeline);
        });

        particles.forEach((particle, index) => {
          registerContinuousAnimation(
            gsap.to(particle, {
              opacity: 0.16 + (index % 3) * 0.06,
              scale: 1.08,
              duration: 5.4 + index * 0.65,
              repeat: -1,
              yoyo: true,
              ease: "sine.inOut",
              transformOrigin: "50% 50%",
              delay: index * 0.45,
            }),
          );
        });

        stars.forEach((star, index) => {
          registerContinuousAnimation(
            gsap.to(star, {
              opacity: 0.15 + index * 0.05,
              duration: 6.4 + index * 1.3,
              repeat: -1,
              yoyo: true,
              ease: "sine.inOut",
              delay: index * 0.85,
            }),
          );
        });

        gsap.utils.toArray<HTMLElement>(".satellite").forEach((chip, index) => {
          registerContinuousAnimation(
            gsap.to(chip, {
              opacity: getSatellitePeakOpacity(chip),
              duration: 6.8 + index * 0.9,
              repeat: -1,
              yoyo: true,
              ease: "sine.inOut",
              delay: index * 0.55,
            }),
          );
        });

        const signaturePulse = gsap.timeline({
          repeat: -1,
          repeatDelay: 8.2,
          delay: 6.8,
        });

        signaturePulse
          .set(".infinity-data-pulse", {
            opacity: 0,
            scale: 0.84,
          })
          .to(".infinity-data-pulse", {
            opacity: 0.82,
            duration: 0.1,
            ease: "power1.out",
          })
          .to(
            ".infinity-data-pulse",
            {
              duration: 1.18,
              ease: "none",
              motionPath: {
                path: "#infinity-signature-path",
                align: "#infinity-signature-path",
                autoRotate: false,
                alignOrigin: [0.5, 0.5],
              },
            },
            "<",
          )
          .to(
            ".infinity-data-pulse",
            {
              opacity: 0,
              duration: 0.12,
              ease: "power1.in",
            },
            ">-0.12",
          )
          .to(
            "#signature-circuit",
            {
              opacity: 0.84,
              duration: 0.22,
              ease: "power1.out",
              repeat: 1,
              yoyo: true,
            },
            ">-0.04",
          )
          .to(
            ".signature-node",
            {
              opacity: 1,
              scale: 1.14,
              duration: 0.16,
              ease: "power1.out",
              transformOrigin: "50% 50%",
              repeat: 1,
              yoyo: true,
            },
            "<",
          );

        registerContinuousAnimation(signaturePulse);

        const idleShine = gsap.timeline({
          repeat: -1,
          repeatDelay: 14.2,
          delay: 5.6,
        });

        idleShine
          .set(".sa-metal-shine-sweep", {
            xPercent: SHINE_START_PERCENT,
            autoAlpha: 0,
          })
          .to(".sa-metal-shine-sweep", {
            autoAlpha: 0.24,
            duration: 0.1,
            ease: "power1.out",
          })
          .to(
            ".sa-metal-shine-sweep",
            {
              xPercent: SHINE_END_PERCENT,
              autoAlpha: 0.24,
              duration: 0.88,
              ease: "power2.inOut",
            },
            "<",
          )
          .to(".sa-metal-shine-sweep", {
            autoAlpha: 0,
            duration: 0.14,
            ease: "power1.out",
          });

        registerContinuousAnimation(idleShine);
        continuousAnimations.forEach((animation) => animation.pause());

        if ("IntersectionObserver" in window) {
          intersectionObserver = new IntersectionObserver(
            ([entry]) => {
              sceneInView = entry?.isIntersecting ?? true;
              syncContinuousAnimations();
            },
            {
              threshold: [0, 0.18, 0.4],
            },
          );

          intersectionObserver.observe(sceneElement);
        }

        handleVisibilityChange = () => {
          pageVisible = document.visibilityState === "visible";
          syncContinuousAnimations();
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
      } else {
        introComplete = true;
      }
    }, sceneRef);

    return () => {
      intersectionObserver?.disconnect();

      if (handleVisibilityChange) {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }

      context.revert();
    };
  }, [reducedMotion]);

  return (
    <div
      ref={sceneRef}
      className="relative isolate mx-auto aspect-[16/10] w-full max-w-[380px] overflow-visible opacity-0 sm:max-w-[460px] lg:max-w-[620px]"
    >
      <div className="pointer-events-none absolute inset-0 z-0 rounded-full bg-[radial-gradient(circle_at_50%_44%,rgba(124,140,255,0.08),transparent_52%)] blur-[36px]" />

      <svg
        viewBox="0 0 1536 1024"
        aria-hidden="true"
        focusable="false"
        className="absolute inset-0 z-10 h-full w-full overflow-visible"
        fill="none"
      >
        <g className="orbit-group opacity-0" stroke="#7C8CFF" strokeWidth="1.5">
          <ellipse
            id="orbit-inner"
            cx="768"
            cy="520"
            rx="430"
            ry="145"
            transform="rotate(-8 768 520)"
          />
        </g>
        <g className="orbit-group opacity-0" stroke="#7C8CFF" strokeWidth="1.5">
          <ellipse
            id="orbit-middle"
            cx="768"
            cy="520"
            rx="510"
            ry="205"
            transform="rotate(7 768 520)"
          />
        </g>
        <g className="orbit-group opacity-0 max-md:hidden" stroke="#7C8CFF" strokeWidth="1.5">
          <ellipse
            id="orbit-outer"
            cx="768"
            cy="520"
            rx="585"
            ry="255"
            transform="rotate(-12 768 520)"
          />
        </g>

        <path
          id="infinity-energy-path"
          className="infinity-trace"
          d="M468 510C468 424 560 390 644 390C729 390 779 454 829 510C877 563 925 628 1007 628C1089 628 1165 574 1165 510C1165 446 1089 392 1007 392C924 392 876 454 829 510C778 568 724 630 644 630C565 630 468 586 468 510Z"
          stroke="#7C8CFF"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity="0.34"
          fill="none"
          filter="url(#infinityGlow)"
        />
        <path
          id="core-split-left-path"
          d="M829 510C764 508 664 480 544 446"
          fill="none"
          stroke="transparent"
          strokeWidth="1"
        />
        <path
          id="core-split-right-path"
          d="M829 510C902 502 986 484 1081 430"
          fill="none"
          stroke="transparent"
          strokeWidth="1"
        />
        <path
          id="infinity-signature-path"
          d="M468 510C468 424 560 390 644 390C729 390 779 454 829 510C876 454 924 392 1007 392C1089 392 1165 446 1165 510"
          fill="none"
          stroke="transparent"
          strokeWidth="1"
        />
        <path
          className="infinity-trace-accent"
          d="M468 510C468 424 560 390 644 390C729 390 779 454 829 510C877 563 925 628 1007 628C1089 628 1165 574 1165 510C1165 446 1089 392 1007 392C924 392 876 454 829 510C778 568 724 630 644 630C565 630 468 586 468 510Z"
          stroke="#D7DEFF"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity="0.52"
          fill="none"
        />
        <circle
          className="infinity-cross-highlight"
          cx="829"
          cy="510"
          r="38"
          fill="url(#crossHighlightGlow)"
        />

        <g
          id="circuits-left"
          stroke="#94A3B8"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path
            className="circuit-path"
            id="circuit-left-1"
            d="M250 455H345L372 430H455"
          />
          <path
            className="circuit-path"
            id="circuit-left-2"
            d="M300 505H390L420 480H500"
          />
          <path
            className="circuit-path"
            id="circuit-left-3"
            d="M330 555H420L445 530H520"
          />
          <circle className="circuit-node" cx="250" cy="455" r="8" />
          <circle className="circuit-node" cx="300" cy="505" r="8" />
          <circle className="circuit-node" cx="330" cy="555" r="8" />
        </g>
        <g
          id="circuits-right"
          stroke="#94A3B8"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path
            className="circuit-path"
            id="circuit-right-1"
            d="M1286 455H1191L1164 430H1081"
          />
          <path
            className="circuit-path"
            id="signature-circuit"
            d="M1236 505H1146L1116 480H1036"
          />
          <path
            className="circuit-path"
            id="circuit-right-3"
            d="M1206 555H1116L1091 530H1016"
          />
          <circle className="circuit-node" cx="1286" cy="455" r="8" />
          <circle className="circuit-node signature-node" cx="1236" cy="505" r="8" />
          <circle className="circuit-node" cx="1206" cy="555" r="8" />
        </g>

        <g id="circuit-pulses">
          <g className="circuit-pulse" data-path="circuit-left-1">
            <circle r="2.4" fill="#E2E8F0" />
            <circle r="5.2" fill="#7C8CFF" opacity="0.12" />
          </g>
          <g className="circuit-pulse" data-path="circuit-left-3">
            <circle r="2.2" fill="#E2E8F0" />
            <circle r="4.8" fill="#7C8CFF" opacity="0.1" />
          </g>
          <g className="circuit-pulse" data-path="signature-circuit">
            <circle r="2.4" fill="#E2E8F0" />
            <circle r="5.2" fill="#7C8CFF" opacity="0.12" />
          </g>
          <g className="circuit-pulse" data-path="circuit-right-1">
            <circle r="2.2" fill="#E2E8F0" />
            <circle r="4.8" fill="#7C8CFF" opacity="0.1" />
          </g>
        </g>

        <g id="particles" fill="#E2E8F0">
          <circle className="ambient-particle" cx="375" cy="640" r="3" />
          <circle className="ambient-particle" cx="520" cy="730" r="2" />
          <circle className="ambient-particle max-md:hidden" cx="760" cy="790" r="3" />
          <circle className="ambient-particle" cx="1050" cy="690" r="2.5" />
          <circle className="ambient-particle" cx="1190" cy="390" r="2" />
        </g>
        <g id="stars" stroke="#F8FAFC" strokeLinecap="round">
          <path className="ambient-star" d="M360 610v24M348 622h24" strokeWidth="2.5" />
          <path className="ambient-star max-md:hidden" d="M1120 600v20M1110 610h20" strokeWidth="2" />
        </g>

        <g className="comet opacity-0">
          <circle cx="0" cy="0" r="6" fill="#E2E8F0" />
          <circle cx="-10" cy="0" r="10" fill="url(#cometGlow)" opacity="0.28" />
        </g>
        <g className="core-energy-left opacity-0">
          <circle cx="0" cy="0" r="2.4" fill="#E2E8F0" />
          <circle cx="-4" cy="0" r="5.2" fill="#7C8CFF" opacity="0.12" />
        </g>
        <g className="core-energy-right opacity-0">
          <circle cx="0" cy="0" r="2.4" fill="#E2E8F0" />
          <circle cx="-4" cy="0" r="5.2" fill="#7C8CFF" opacity="0.12" />
        </g>
        <g className="infinity-data-pulse opacity-0">
          <circle cx="0" cy="0" r="2.6" fill="#E2E8F0" />
          <circle cx="-5" cy="0" r="4.8" fill="#7C8CFF" opacity="0.14" />
        </g>

        <defs>
          <filter
            id="infinityGlow"
            x="430"
            y="350"
            width="780"
            height="320"
            filterUnits="userSpaceOnUse"
          >
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient
            id="cometGlow"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(0 0) rotate(90) scale(20 22)"
          >
            <stop stopColor="#7C8CFF" />
            <stop offset="1" stopColor="#7C8CFF" stopOpacity="0" />
          </radialGradient>
          <radialGradient
            id="crossHighlightGlow"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(829 510) rotate(90) scale(42 42)"
          >
            <stop stopColor="#D7DEFF" stopOpacity="0.34" />
            <stop offset="1" stopColor="#D7DEFF" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>

      {satellites.map((satellite) => (
        <div key={satellite.label} className={satellite.orbitClassName}>
          <div className={`orbit-label ${satellite.labelClassName}`}>
            <div
              data-skill={satellite.label}
              data-prominence={satellite.prominence}
              className={[
                "satellite rounded-[8px] border border-[rgba(148,163,184,0.08)] bg-[rgba(8,13,26,0.28)] px-[9px] py-[5px] text-[11px] font-[450] tracking-[0.01em] text-[rgba(226,232,240,0.78)] transition-[border-color,color,opacity] duration-200 md:text-[12px]",
                satellite.visibilityClassName,
              ].join(" ")}
            >
              <span
                className={[
                  "inline-flex items-center gap-2 whitespace-nowrap",
                  satellite.alignment === "left" ? "flex-row-reverse text-right" : "",
                ].join(" ")}
              >
                <span className="h-px w-5 bg-[rgba(148,163,184,0.24)]" />
                <span className="h-[4px] w-[4px] rounded-full bg-[#7C8CFF]" />
                <span>{satellite.label}</span>
              </span>
            </div>
          </div>
        </div>
      ))}

      <div className="sa-core-wrap absolute inset-x-[21%] top-[20%] z-30 aspect-[1.35/1]">
        <div className="pointer-events-none absolute inset-[16%] rounded-full bg-[radial-gradient(circle,rgba(226,232,240,0.12),transparent_68%)] blur-3xl" />
        <div className="pointer-events-none absolute inset-[18%] rounded-full bg-[radial-gradient(circle,rgba(79,107,255,0.08),transparent_72%)] blur-3xl" />
        <div className="sa-lock-glow pointer-events-none absolute inset-[20%] rounded-full bg-[radial-gradient(circle,rgba(12,36,101,0.28),transparent_72%)] blur-[48px]" />
        <svg
          viewBox={`0 0 ${CORE_IMAGE_WIDTH} ${CORE_IMAGE_HEIGHT}`}
          aria-hidden="true"
          focusable="false"
          className="absolute inset-0 h-full w-full overflow-visible"
          fill="none"
        >
          <defs>
            <path id="s-upper-guide-path" d={CORE_PATHS.sUpper} />
            <path id="s-lower-guide-path" d={CORE_PATHS.sLower} />
            <path id="s-a-handoff-path" d="M536 294C506 267 459 226 418 188" />
            <path id="a-top-guide-path" d={CORE_PATHS.aTop} />
            <path id="a-leg-guide-path" d={CORE_PATHS.aLeg} />
            <path id="a-bar-guide-path" d={CORE_PATHS.aBar} />

            <mask
              id="sa-core-mask-s-upper"
              maskUnits="userSpaceOnUse"
              maskContentUnits="userSpaceOnUse"
              style={{ maskType: "luminance" } as CSSProperties}
            >
              <rect width={CORE_IMAGE_WIDTH} height={CORE_IMAGE_HEIGHT} fill="black" />
              <path
                className="mask-path-s-upper"
                d={CORE_PATHS.sUpper}
                stroke="white"
                strokeWidth={CORE_STROKES.sUpper}
                strokeLinecap="butt"
                strokeLinejoin="round"
              />
            </mask>
            <mask
              id="sa-core-mask-s-lower"
              maskUnits="userSpaceOnUse"
              maskContentUnits="userSpaceOnUse"
              style={{ maskType: "luminance" } as CSSProperties}
            >
              <rect width={CORE_IMAGE_WIDTH} height={CORE_IMAGE_HEIGHT} fill="black" />
              <path
                className="mask-path-s-lower"
                d={CORE_PATHS.sLower}
                stroke="white"
                strokeWidth={CORE_STROKES.sLower}
                strokeLinecap="butt"
                strokeLinejoin="round"
              />
            </mask>
            <mask
              id="sa-core-mask-a-top"
              maskUnits="userSpaceOnUse"
              maskContentUnits="userSpaceOnUse"
              style={{ maskType: "luminance" } as CSSProperties}
            >
              <rect width={CORE_IMAGE_WIDTH} height={CORE_IMAGE_HEIGHT} fill="black" />
              <path
                className="mask-path-a-top"
                d={CORE_PATHS.aTop}
                stroke="white"
                strokeWidth={CORE_STROKES.aTop}
                strokeLinecap="butt"
                strokeLinejoin="round"
              />
            </mask>
            <mask
              id="sa-core-mask-a-leg"
              maskUnits="userSpaceOnUse"
              maskContentUnits="userSpaceOnUse"
              style={{ maskType: "luminance" } as CSSProperties}
            >
              <rect width={CORE_IMAGE_WIDTH} height={CORE_IMAGE_HEIGHT} fill="black" />
              <path
                className="mask-path-a-leg"
                d={CORE_PATHS.aLeg}
                stroke="white"
                strokeWidth={CORE_STROKES.aLeg}
                strokeLinecap="butt"
                strokeLinejoin="round"
              />
            </mask>
            <mask
              id="sa-core-mask-a-bar"
              maskUnits="userSpaceOnUse"
              maskContentUnits="userSpaceOnUse"
              style={{ maskType: "luminance" } as CSSProperties}
            >
              <rect width={CORE_IMAGE_WIDTH} height={CORE_IMAGE_HEIGHT} fill="black" />
              <path
                className="mask-path-a-bar"
                d={CORE_PATHS.aBar}
                stroke="white"
                strokeWidth={CORE_STROKES.aBar}
                strokeLinecap="butt"
                strokeLinejoin="round"
              />
            </mask>

            <linearGradient id="sa-shine-gradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
              <stop offset="42%" stopColor="#FFFFFF" stopOpacity="0" />
              <stop offset="48%" stopColor="#FFFFFF" stopOpacity="0.06" />
              <stop offset="52%" stopColor="#F8FAFC" stopOpacity="0.22" />
              <stop offset="56%" stopColor="#E2E8F0" stopOpacity="0.12" />
              <stop offset="62%" stopColor="#FFFFFF" stopOpacity="0" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="reveal-front-glow" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#F8FAFC" stopOpacity="0.74" />
              <stop offset="45%" stopColor="#E2E8F0" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#7C8CFF" stopOpacity="0" />
            </radialGradient>
            <filter
              id="sa-front-glow-filter"
              x="-60"
              y="-60"
              width={CORE_IMAGE_WIDTH + 120}
              height={CORE_IMAGE_HEIGHT + 120}
              filterUnits="userSpaceOnUse"
            >
              <feGaussianBlur stdDeviation="3.5" />
            </filter>
          </defs>

          <g className="core-full-image">
            <image
              href={FINAL_CORE_ASSET_SRC}
              x="0"
              y="0"
              width={CORE_IMAGE_WIDTH}
              height={CORE_IMAGE_HEIGHT}
              preserveAspectRatio="none"
            />
          </g>
          <g className="core-reveal-s-upper" mask="url(#sa-core-mask-s-upper)">
            <image
              href={S_ASSET_SRC}
              x="0"
              y="0"
              width={CORE_IMAGE_WIDTH}
              height={CORE_IMAGE_HEIGHT}
              preserveAspectRatio="none"
            />
          </g>
          <g className="core-reveal-s-lower" mask="url(#sa-core-mask-s-lower)">
            <image
              href={S_ASSET_SRC}
              x="0"
              y="0"
              width={CORE_IMAGE_WIDTH}
              height={CORE_IMAGE_HEIGHT}
              preserveAspectRatio="none"
            />
          </g>
          <g className="core-reveal-a-top" mask="url(#sa-core-mask-a-top)">
            <image
              href={A_ASSET_SRC}
              x="0"
              y="0"
              width={CORE_IMAGE_WIDTH}
              height={CORE_IMAGE_HEIGHT}
              preserveAspectRatio="none"
            />
          </g>
          <g className="core-reveal-a-leg" mask="url(#sa-core-mask-a-leg)">
            <image
              href={A_ASSET_SRC}
              x="0"
              y="0"
              width={CORE_IMAGE_WIDTH}
              height={CORE_IMAGE_HEIGHT}
              preserveAspectRatio="none"
            />
          </g>
          <g className="core-reveal-a-bar" mask="url(#sa-core-mask-a-bar)">
            <image
              href={A_ASSET_SRC}
              x="0"
              y="0"
              width={CORE_IMAGE_WIDTH}
              height={CORE_IMAGE_HEIGHT}
              preserveAspectRatio="none"
            />
          </g>

          <g className="reveal-front-s-upper opacity-0" filter="url(#sa-front-glow-filter)">
            <circle r="3.2" fill="#E2E8F0" />
            <circle r="10" fill="url(#reveal-front-glow)" opacity="0.22" />
          </g>
          <g className="reveal-front-s-lower opacity-0" filter="url(#sa-front-glow-filter)">
            <circle r="2.8" fill="#E2E8F0" />
            <circle r="8.5" fill="url(#reveal-front-glow)" opacity="0.16" />
          </g>
          <g className="core-handoff-pulse opacity-0" filter="url(#sa-front-glow-filter)">
            <circle r="2.2" fill="#E2E8F0" />
            <circle r="6.5" fill="url(#reveal-front-glow)" opacity="0.12" />
          </g>
          <g className="reveal-front-a-top opacity-0" filter="url(#sa-front-glow-filter)">
            <circle r="3" fill="#E2E8F0" />
            <circle r="9.5" fill="url(#reveal-front-glow)" opacity="0.2" />
          </g>
          <g className="reveal-front-a-leg opacity-0" filter="url(#sa-front-glow-filter)">
            <circle r="3" fill="#E2E8F0" />
            <circle r="9.5" fill="url(#reveal-front-glow)" opacity="0.2" />
          </g>
          <g className="reveal-front-a-bar opacity-0" filter="url(#sa-front-glow-filter)">
            <circle r="2.8" fill="#E2E8F0" />
            <circle r="8.8" fill="url(#reveal-front-glow)" opacity="0.18" />
          </g>

        </svg>
        <div
          aria-hidden="true"
          className="sa-metal-shine pointer-events-none absolute inset-0 z-30 overflow-hidden"
          style={
            {
              mixBlendMode: "screen",
              WebkitMaskImage: `url(${FINAL_CORE_ASSET_SRC})`,
              maskImage: `url(${FINAL_CORE_ASSET_SRC})`,
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
              maskPosition: "center",
              WebkitMaskSize: "contain",
              maskSize: "contain",
            } satisfies CSSProperties
          }
        >
          <div
            ref={shineRef}
            className="sa-metal-shine-sweep absolute inset-0"
            style={
              {
                background:
                  "linear-gradient(100deg, transparent 40%, rgba(255,255,255,0.05) 48%, rgba(248,250,252,0.22) 52%, rgba(226,232,240,0.12) 56%, transparent 64%)",
                willChange: "transform, opacity",
              } satisfies CSSProperties
            }
          />
        </div>
      </div>
    </div>
  );
}
