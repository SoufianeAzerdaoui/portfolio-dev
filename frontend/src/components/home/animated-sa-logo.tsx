"use client";

import { CSSProperties, useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { useReducedMotion } from "motion/react";

import { usePreferences } from "@/components/providers/preferences-provider";

gsap.registerPlugin(MotionPathPlugin);

const S_ASSET_SRC = "/assets/logo-animation/sa-s-clean.png";
const A_ASSET_SRC = "/assets/logo-animation/sa-a-clean.png";
const FINAL_CORE_ASSET_SRC = "/assets/logo-animation/sa-core-clean.png";
const CORE_IMAGE_WIDTH = 765;
const CORE_IMAGE_HEIGHT = 365;
const SHINE_START_PERCENT = -135;
const SHINE_END_PERCENT = 135;
const ORBIT_IDLE_OPACITIES = [0.24, 0.21, 0.18] as const;
const S_CLIP_X = 0;
const S_CLIP_WIDTH = 565;
const A_CLIP_X = 381;
const A_CLIP_WIDTH = 355;
type LabelOrbitTrack = "a" | "b";
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

const getOrbitIdleOpacity = (index: number) =>
  ORBIT_IDLE_OPACITIES[index] ?? ORBIT_IDLE_OPACITIES.at(-1) ?? 0.18;

const labelOrbitTracks: Record<
  LabelOrbitTrack,
  { rx: number; ry: number; yBias: number; duration: number; direction: 1 | -1 }
> = {
  a: { rx: 0.43, ry: 0.235, yBias: 0.01, duration: 46, direction: 1 },
  b: { rx: 0.5, ry: 0.275, yBias: -0.015, duration: 56, direction: -1 },
};

const satellites = [
  {
    label: "DATA SCIENCE",
    track: "a" as const,
    phase: 220,
    rxScale: 1,
    ryScale: 0.88,
    yOffset: -0.035,
    visibilityClassName: "",
    alignment: "left" as const,
    lineLength: 28,
  },
  {
    label: "MACHINE LEARNING",
    track: "a" as const,
    phase: 94,
    rxScale: 0.92,
    ryScale: 0.78,
    yOffset: 0.085,
    visibilityClassName: "",
    alignment: "right" as const,
    lineLength: 34,
  },
  {
    label: "DEEP LEARNING",
    track: "b" as const,
    phase: 302,
    rxScale: 0.98,
    ryScale: 0.9,
    yOffset: -0.095,
    visibilityClassName: "hidden md:block",
    alignment: "right" as const,
    lineLength: 24,
  },
  {
    label: "NLP",
    track: "a" as const,
    phase: 350,
    rxScale: 1.08,
    ryScale: 0.86,
    yOffset: -0.005,
    visibilityClassName: "hidden md:block",
    alignment: "left" as const,
    lineLength: 22,
  },
  {
    label: "RAG / LLM SYSTEMS",
    track: "b" as const,
    phase: 178,
    rxScale: 1.09,
    ryScale: 0.86,
    yOffset: 0,
    visibilityClassName: "",
    alignment: "left" as const,
    lineLength: 32,
  },
  {
    label: "DATA ENGINEERING",
    track: "b" as const,
    phase: 32,
    rxScale: 1.13,
    ryScale: 0.74,
    yOffset: 0.065,
    visibilityClassName: "hidden md:block",
    alignment: "right" as const,
    lineLength: 38,
  },
] satisfies Array<{
  label: string;
  track: LabelOrbitTrack;
  phase: number;
  rxScale: number;
  ryScale: number;
  yOffset: number;
  visibilityClassName: string;
  alignment: "left" | "right";
  lineLength: number;
}>;

export function AnimatedSALogo() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const shineRef = useRef<HTMLDivElement>(null);
  const systemReducedMotion = useReducedMotion();
  const { reduceMotion } = usePreferences();
  const reducedMotion = systemReducedMotion || reduceMotion;

  useLayoutEffect(() => {
    const sceneElement = sceneRef.current;
    let intersectionObserver: IntersectionObserver | undefined;
    let logoResizeObserver: ResizeObserver | undefined;
    let handleVisibilityChange: (() => void) | undefined;
    let labelOrbitMediaQuery: MediaQueryList | undefined;
    let handleLabelOrbitMediaChange: (() => void) | undefined;
    let handleScenePointerEnter: (() => void) | undefined;
    let handleScenePointerLeave: (() => void) | undefined;

    if (!sceneElement) {
      return;
    }

    const context = gsap.context(() => {
      const orbitGroups = gsap.utils.toArray<SVGGElement>(".orbit-group");
      const satelliteNodes = gsap.utils.toArray<HTMLElement>(".satellite");
      const satelliteDots = gsap.utils.toArray<HTMLElement>(".satellite-dot");
      const satelliteLines = gsap.utils.toArray<HTMLElement>(".satellite-line");
      const satelliteCopies = gsap.utils.toArray<HTMLElement>(".satellite-copy");
      const circuitPaths = gsap.utils.toArray<SVGPathElement>(".circuit-path");
      const circuitNodes = gsap.utils.toArray<SVGCircleElement>(".circuit-node");
      const pulseDots = gsap.utils.toArray<SVGGElement>(".circuit-pulse");
      const particles = gsap.utils.toArray<SVGCircleElement>(".ambient-particle");
      const stars = gsap.utils.toArray<SVGPathElement>(".ambient-star");
      const continuousAnimations: gsap.core.Animation[] = [];
      const labelOrbitAnimations: gsap.core.Animation[] = [];
      const satelliteOrbitAnimations: gsap.core.Animation[] = [];
      const leftCircuitPaths = circuitPaths.slice(0, 3);
      const rightCircuitPaths = circuitPaths.slice(3);
      const leftCircuitNodes = circuitNodes.slice(0, 3);
      const rightCircuitNodes = circuitNodes.slice(3);
      const infinityPath = sceneElement.querySelector<SVGPathElement>(
        "#infinity-energy-path",
      );
      const sClipRect = sceneElement.querySelector<SVGRectElement>(
        ".clip-rect-s",
      );
      const aClipRect = sceneElement.querySelector<SVGRectElement>(
        ".clip-rect-a",
      );
      const shineLayer = shineRef.current;

      if (
        !infinityPath ||
        !shineLayer ||
        !sClipRect ||
        !aClipRect
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
        s: [".core-reveal-s", ".core-handoff-pulse"],
        a: [".core-reveal-a"],
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

      const getSatelliteConfig = (node: HTMLElement) =>
        satellites.find((satellite) => satellite.label === node.dataset.skill);

      const getSatellitePoint = (
        config: (typeof satellites)[number],
        angle: number,
      ) => {
        const sceneWidth = sceneElement.clientWidth || 620;
        const sceneHeight = sceneElement.clientHeight || 388;
        const metrics = labelOrbitTracks[config.track];
        const responsiveScale =
          sceneWidth < 430 ? 0.62 : sceneWidth < 520 ? 0.78 : sceneWidth < 600 ? 0.9 : 1;
        const radians = (angle * Math.PI) / 180;
        const x =
          Math.cos(radians) *
          sceneWidth *
          metrics.rx *
          config.rxScale *
          responsiveScale;
        const y =
          Math.sin(radians) *
            sceneHeight *
            metrics.ry *
            config.ryScale *
            responsiveScale +
          sceneHeight * (metrics.yBias + config.yOffset);

        return {
          x,
          y,
        };
      };

      const setSatellitePosition = (
        node: HTMLElement,
        config: (typeof satellites)[number],
        angle: number,
      ) => {
        const point = getSatellitePoint(config, angle);

        gsap.set(node, {
          x: point.x,
          y: point.y,
          xPercent: -50,
          yPercent: -50,
          rotate: 0,
        });
      };

      const resetSatellitePositions = () => {
        satelliteNodes.forEach((node) => {
          const config = getSatelliteConfig(node);
          const angle = Number(node.dataset.angle ?? config?.phase ?? 0);

          if (config) {
            setSatellitePosition(node, config, angle);
          }
        });
      };

      const pathLength = infinityPath.getTotalLength();
      let introComplete = reducedMotion;
      let sceneInView = true;
      let pageVisible = document.visibilityState === "visible";
      let labelOrbitEnabled = false;

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

        labelOrbitAnimations.forEach((animation) => {
          if (shouldRun && labelOrbitEnabled) {
            animation.resume();
            return;
          }

          animation.pause();
        });

        if (!labelOrbitEnabled) {
          resetSatellitePositions();
        }
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
      gsap.set(sClipRect, {
        attr: { width: reducedMotion ? S_CLIP_WIDTH : 0 },
      });
      gsap.set(aClipRect, {
        attr: { width: reducedMotion ? A_CLIP_WIDTH : 0 },
      });
      gsap.set(
        ".core-reveal-s, .core-reveal-a",
        {
          autoAlpha: 0,
          scale: 1,
          transformOrigin: "50% 50%",
        },
      );
      gsap.set(".core-full-image", {
        autoAlpha: reducedMotion ? 1 : 0,
      });
      setFrontStart(".core-handoff-pulse", "#s-a-handoff-path");
      gsap.set(
        ".core-handoff-pulse",
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
        autoAlpha: reducedMotion ? 1 : 0,
        xPercent: -50,
        yPercent: -50,
        rotate: 0,
      });
      gsap.set(".satellite-card", {
        y: reducedMotion ? 0 : 4,
        scale: 1,
        opacity: 1,
        transformOrigin: "50% 50%",
      });
      gsap.set(satelliteLines, {
        opacity: reducedMotion ? 0.28 : 0,
        scaleX: reducedMotion ? 1 : 0,
        transformOrigin: "50% 50%",
      });
      gsap.set(satelliteCopies, {
        opacity: reducedMotion ? 1 : 0,
        x: reducedMotion ? 0 : -2,
      });
      gsap.set(satelliteDots, {
        opacity: reducedMotion ? 0.84 : 0,
      });
      resetSatellitePositions();
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

      if ("ResizeObserver" in window) {
        logoResizeObserver = new ResizeObserver(resetSatellitePositions);
        logoResizeObserver.observe(sceneElement);
      }

      labelOrbitMediaQuery = window.matchMedia("(min-width: 768px)");
      labelOrbitEnabled = labelOrbitMediaQuery.matches;
      handleLabelOrbitMediaChange = () => {
        labelOrbitEnabled = labelOrbitMediaQuery?.matches ?? false;
        syncContinuousAnimations();
      };
      labelOrbitMediaQuery.addEventListener("change", handleLabelOrbitMediaChange);

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
            ".core-reveal-s",
            {
              autoAlpha: 1,
              duration: 0.01,
            },
            "sReveal",
          )
          .to(
            sClipRect,
            {
              attr: { width: S_CLIP_WIDTH },
              duration: 0.56,
              ease: "power1.inOut",
            },
            "sReveal",
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
            ".core-reveal-a",
            {
              autoAlpha: 1,
              duration: 0.01,
            },
            "aReveal",
          )
          .to(
            aClipRect,
            {
              attr: { width: A_CLIP_WIDTH },
              duration: 0.58,
              ease: "power1.inOut",
            },
            "aReveal+=0.04",
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
            ".core-reveal-s, .core-reveal-a, .core-handoff-pulse",
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
            ".satellite",
            {
              autoAlpha: 1,
              duration: 0.32,
              stagger: 0.06,
            },
            "skills",
          )
          .to(
            ".satellite-line",
            {
              opacity: 0.28,
              scaleX: 1,
              duration: 0.28,
              stagger: 0.06,
              ease: "power2.out",
            },
            "skills",
          )
          .to(
            ".satellite-dot",
            {
              opacity: 0.84,
              duration: 0.22,
              stagger: 0.06,
              ease: "power2.out",
            },
            "skills+=0.04",
          )
          .to(
            ".satellite-copy",
            {
              opacity: 1,
              x: 0,
              duration: 0.36,
              stagger: 0.06,
              ease: "power2.out",
            },
            "skills+=0.06",
          )
          .to(
            ".satellite-card",
            {
              y: 0,
              duration: 0.36,
              stagger: 0.06,
              ease: "power2.out",
            },
            "skills+=0.04",
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

        satelliteNodes.forEach((node) => {
          const config = getSatelliteConfig(node);

          if (!config) {
            return;
          }

          const track = labelOrbitTracks[config.track];
          const state = { angle: config.phase };
          node.dataset.angle = String(state.angle);
          setSatellitePosition(node, config, state.angle);

          const orbitAnimation = gsap.to(state, {
            angle: config.phase + track.direction * 360,
            duration: track.duration,
            ease: "none",
            repeat: -1,
            paused: true,
            onUpdate: () => {
              node.dataset.angle = String(state.angle);
              setSatellitePosition(node, config, state.angle);
            },
          });

          labelOrbitAnimations.push(orbitAnimation);
        });

        orbitGroups.forEach((group, index) => {
          const durations = [42, 54, 68];
          const directions = [1, -1, 1];

          const orbitAnimation = gsap.to(group, {
            rotate: directions[index] * 360,
            transformOrigin: "50% 50%",
            duration: durations[index],
            ease: "none",
            repeat: -1,
          });

          satelliteOrbitAnimations.push(orbitAnimation);
          registerContinuousAnimation(orbitAnimation);
        });

        handleScenePointerEnter = () => {
          if (!introComplete) {
            return;
          }

          satelliteOrbitAnimations.forEach((animation) => animation.timeScale(1.05));
          gsap.to(satelliteDots, {
            opacity: 0.92,
            duration: 0.42,
            ease: "sine.out",
          });
          gsap.to(orbitGroups, {
            autoAlpha: (index) => Math.min(getOrbitIdleOpacity(index) + 0.012, 0.3),
            duration: 0.42,
            ease: "sine.out",
          });
        };

        handleScenePointerLeave = () => {
          if (!introComplete) {
            return;
          }

          satelliteOrbitAnimations.forEach((animation) => animation.timeScale(1));
          gsap.to(satelliteDots, {
            opacity: 0.84,
            duration: 0.52,
            ease: "sine.out",
          });
          gsap.to(orbitGroups, {
            autoAlpha: (index) => getOrbitIdleOpacity(index),
            duration: 0.52,
            ease: "sine.out",
          });
        };

        sceneElement.addEventListener("pointerenter", handleScenePointerEnter);
        sceneElement.addEventListener("pointerleave", handleScenePointerLeave);

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
      logoResizeObserver?.disconnect();

      if (handleScenePointerEnter) {
        sceneElement.removeEventListener("pointerenter", handleScenePointerEnter);
      }

      if (handleScenePointerLeave) {
        sceneElement.removeEventListener("pointerleave", handleScenePointerLeave);
      }

      if (handleVisibilityChange) {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }

      if (labelOrbitMediaQuery && handleLabelOrbitMediaChange) {
        labelOrbitMediaQuery.removeEventListener("change", handleLabelOrbitMediaChange);
      }

      context.revert();
    };
  }, [reducedMotion]);

  return (
    <div
      ref={sceneRef}
      className="relative isolate mx-auto aspect-[16/10] w-full max-w-[380px] overflow-visible opacity-0 sm:max-w-[460px] lg:max-w-[620px]"
    >
      <div className="pointer-events-none absolute inset-0 z-0 rounded-full bg-[radial-gradient(circle_at_50%_44%,rgb(var(--accent-rgb)/0.08),transparent_52%)] blur-[36px]" />

      <svg
        viewBox="0 0 1536 1024"
        aria-hidden="true"
        focusable="false"
        className="absolute inset-0 z-10 h-full w-full overflow-visible"
        fill="none"
      >
        <g className="orbit-group opacity-0" stroke="var(--accent)" strokeWidth="1.5">
          <ellipse
            id="orbit-inner"
            cx="768"
            cy="520"
            rx="430"
            ry="145"
            transform="rotate(-8 768 520)"
          />
        </g>
        <g className="orbit-group opacity-0" stroke="var(--accent)" strokeWidth="1.5">
          <ellipse
            id="orbit-middle"
            cx="768"
            cy="520"
            rx="510"
            ry="205"
            transform="rotate(7 768 520)"
          />
        </g>
        <g className="orbit-group opacity-0 max-md:hidden" stroke="var(--accent)" strokeWidth="1.5">
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
          stroke="var(--accent)"
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
          stroke="var(--foreground-muted)"
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
          stroke="var(--foreground-muted)"
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
            <circle r="2.4" fill="var(--silver)" />
            <circle r="5.2" fill="var(--accent)" opacity="0.12" />
          </g>
          <g className="circuit-pulse" data-path="circuit-left-3">
            <circle r="2.2" fill="var(--silver)" />
            <circle r="4.8" fill="var(--accent)" opacity="0.1" />
          </g>
          <g className="circuit-pulse" data-path="signature-circuit">
            <circle r="2.4" fill="var(--silver)" />
            <circle r="5.2" fill="var(--accent)" opacity="0.12" />
          </g>
          <g className="circuit-pulse" data-path="circuit-right-1">
            <circle r="2.2" fill="var(--silver)" />
            <circle r="4.8" fill="var(--accent)" opacity="0.1" />
          </g>
        </g>

        <g id="particles" fill="var(--silver)">
          <circle className="ambient-particle" cx="375" cy="640" r="3" />
          <circle className="ambient-particle" cx="520" cy="730" r="2" />
          <circle className="ambient-particle max-md:hidden" cx="760" cy="790" r="3" />
          <circle className="ambient-particle" cx="1050" cy="690" r="2.5" />
          <circle className="ambient-particle" cx="1190" cy="390" r="2" />
        </g>
        <g id="stars" stroke="var(--foreground)" strokeLinecap="round">
          <path className="ambient-star" d="M360 610v24M348 622h24" strokeWidth="2.5" />
          <path className="ambient-star max-md:hidden" d="M1120 600v20M1110 610h20" strokeWidth="2" />
        </g>

        <g className="comet opacity-0">
          <circle cx="0" cy="0" r="6" fill="var(--silver)" />
          <circle cx="-10" cy="0" r="10" fill="url(#cometGlow)" opacity="0.28" />
        </g>
        <g className="core-energy-left opacity-0">
          <circle cx="0" cy="0" r="2.4" fill="var(--silver)" />
          <circle cx="-4" cy="0" r="5.2" fill="var(--accent)" opacity="0.12" />
        </g>
        <g className="core-energy-right opacity-0">
          <circle cx="0" cy="0" r="2.4" fill="var(--silver)" />
          <circle cx="-4" cy="0" r="5.2" fill="var(--accent)" opacity="0.12" />
        </g>
        <g className="infinity-data-pulse opacity-0">
          <circle cx="0" cy="0" r="2.6" fill="var(--silver)" />
          <circle cx="-5" cy="0" r="4.8" fill="var(--accent)" opacity="0.14" />
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
            <stop stopColor="var(--accent)" />
            <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
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
        <div
          key={satellite.label}
          data-skill={satellite.label}
          data-track={satellite.track}
          aria-hidden="true"
          className={[
            "satellite pointer-events-auto absolute left-1/2 top-1/2 z-40 cursor-default select-none",
            satellite.visibilityClassName,
          ].join(" ")}
        >
          <div
            className="satellite-card group text-[10px] font-medium uppercase tracking-[0.13em] text-[#B7BAC6] transition-colors duration-200 ease-out hover:text-[#ECEAF5] md:text-[10.5px] lg:text-[11px]"
          >
            <span
              className={[
                "inline-flex items-center gap-2 whitespace-nowrap",
                satellite.alignment === "left" ? "flex-row-reverse text-right" : "",
              ].join(" ")}
            >
              <span
                className="satellite-line h-px bg-[#8B80D9] opacity-[0.28] transition-opacity duration-200 ease-out group-hover:opacity-60"
                style={{
                  width: `${satellite.lineLength}px`,
                  transformOrigin:
                    satellite.alignment === "left" ? "right center" : "left center",
                }}
              />
              <span className="satellite-dot h-[3px] w-[3px] rounded-full bg-[#8B80D9] opacity-80 transition-opacity duration-200 ease-out group-hover:opacity-100" />
              <span className="satellite-copy">{satellite.label}</span>
            </span>
          </div>
        </div>
      ))}

      <div className="sa-core-wrap absolute inset-x-[21%] top-[20%] z-30 aspect-[1.35/1]">
        <div className="pointer-events-none absolute inset-[16%] rounded-full bg-[radial-gradient(circle,rgb(var(--background-rgb)/0.08),transparent_68%)] blur-3xl" />
        <div className="pointer-events-none absolute inset-[18%] rounded-full bg-[radial-gradient(circle,rgb(var(--accent-rgb)/0.08),transparent_72%)] blur-3xl" />
        <div className="sa-lock-glow pointer-events-none absolute inset-[20%] rounded-full bg-[radial-gradient(circle,var(--hero-glow),transparent_72%)] blur-[48px]" />
        <svg
          viewBox={`0 0 ${CORE_IMAGE_WIDTH} ${CORE_IMAGE_HEIGHT}`}
          aria-hidden="true"
          focusable="false"
          className="absolute inset-0 h-full w-full overflow-visible"
          fill="none"
        >
          <defs>
            <path id="s-a-handoff-path" d="M536 294C506 267 459 226 418 188" />
            <clipPath id="sa-core-clip-s" clipPathUnits="userSpaceOnUse">
              <rect
                className="clip-rect-s"
                x={S_CLIP_X}
                y="0"
                width="0"
                height={CORE_IMAGE_HEIGHT}
              />
            </clipPath>
            <clipPath id="sa-core-clip-a" clipPathUnits="userSpaceOnUse">
              <rect
                className="clip-rect-a"
                x={A_CLIP_X}
                y="0"
                width="0"
                height={CORE_IMAGE_HEIGHT}
              />
            </clipPath>

            <linearGradient id="sa-shine-gradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
              <stop offset="42%" stopColor="#FFFFFF" stopOpacity="0" />
              <stop offset="48%" stopColor="#FFFFFF" stopOpacity="0.06" />
              <stop offset="52%" stopColor="var(--foreground)" stopOpacity="0.22" />
              <stop offset="56%" stopColor="var(--silver)" stopOpacity="0.12" />
              <stop offset="62%" stopColor="#FFFFFF" stopOpacity="0" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="reveal-front-glow" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="var(--foreground)" stopOpacity="0.74" />
              <stop offset="45%" stopColor="var(--silver)" stopOpacity="0.32" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
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
          <g className="core-reveal-s" clipPath="url(#sa-core-clip-s)">
            <image
              href={S_ASSET_SRC}
              x="0"
              y="0"
              width={CORE_IMAGE_WIDTH}
              height={CORE_IMAGE_HEIGHT}
              preserveAspectRatio="none"
            />
          </g>
          <g className="core-reveal-a" clipPath="url(#sa-core-clip-a)">
            <image
              href={A_ASSET_SRC}
              x="0"
              y="0"
              width={CORE_IMAGE_WIDTH}
              height={CORE_IMAGE_HEIGHT}
              preserveAspectRatio="none"
            />
          </g>
          <g className="core-handoff-pulse opacity-0" filter="url(#sa-front-glow-filter)">
            <circle r="2.2" fill="var(--silver)" />
            <circle r="6.5" fill="url(#reveal-front-glow)" opacity="0.12" />
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
