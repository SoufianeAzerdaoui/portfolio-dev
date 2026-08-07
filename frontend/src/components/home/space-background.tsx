"use client";

import { useEffect, useRef } from "react";

type Star = {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  twinkle: number;
  twinkleDuration: number;
  phase: number;
  depth: number;
};

type Nebula = {
  x: number;
  y: number;
  rx: number;
  ry: number;
  alpha: number;
  phase: number;
  depth: number;
  color: string;
};

type FilamentPoint = {
  x: number;
  y: number;
  phase: number;
  offsetX: number;
  offsetY: number;
};

type Filament = {
  points: FilamentPoint[];
  alpha: number;
  width: number;
  depth: number;
};

type ViewProfile = {
  starCount: number;
  filamentCount: number;
};

const TAU = Math.PI * 2;
const MAX_DPR = 1.5;
const GRAVITY_RADIUS = 280;
const MAX_FILAMENT_PULL = 7;
const POINTER_INERTIA = 0.065;
const STAR_PARALLAX = 4;
const NEBULA_PARALLAX = 6;
const FILAMENT_PARALLAX = 8;

function createRandom(seed: number) {
  let value = seed >>> 0;

  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getProfile(width: number): ViewProfile {
  if (width < 768) {
    return { starCount: 24, filamentCount: 2 };
  }

  if (width < 1024) {
    return { starCount: 36, filamentCount: 3 };
  }

  return { starCount: 52, filamentCount: 4 };
}

function getQuietFactor(x: number, y: number) {
  let factor = 1;

  if (x < 0.22) {
    factor *= 0.72;
  }

  if (x > 0.84 && y < 0.2) {
    factor *= 0.38;
  }

  if (x > 0.42 && x < 0.82 && y > 0.16 && y < 0.76) {
    factor *= 0.58;
  }

  if (x > 0.42 && x < 0.76 && y > 0.72) {
    factor *= 0.66;
  }

  return factor;
}

function createStars() {
  const random = createRandom(0x5a101d);

  return Array.from({ length: 55 }, (): Star => {
    const x = random();
    const y = random();
    const quietFactor = getQuietFactor(x, y);
    const rareBright = random() > 0.9 ? 0.06 : 0;
    const baseRadius = random() > 0.88 ? 0.95 : 0.45 + random() * 0.34;

    return {
      x,
      y,
      radius: baseRadius + random() * 0.22,
      alpha: (0.08 + random() * 0.12 + rareBright) * quietFactor,
      twinkle: random() > 0.48 ? (0.045 + random() * 0.065) * quietFactor : 0,
      twinkleDuration: 6 + random() * 6,
      phase: random() * TAU,
      depth: 0.24 + random() * 0.76,
    };
  });
}

function createNebulae(): Nebula[] {
  return [
    {
      x: 0.72,
      y: 0.2,
      rx: 0.36,
      ry: 0.46,
      alpha: 0.052,
      phase: 0.2,
      depth: 0.72,
      color: "12, 36, 101",
    },
    {
      x: 0.33,
      y: 0.74,
      rx: 0.42,
      ry: 0.36,
      alpha: 0.034,
      phase: 2.1,
      depth: 0.48,
      color: "63, 99, 221",
    },
    {
      x: 0.56,
      y: 0.46,
      rx: 0.28,
      ry: 0.32,
      alpha: 0.026,
      phase: 4.2,
      depth: 0.34,
      color: "124, 140, 255",
    },
  ];
}

function createFilaments(): Filament[] {
  const random = createRandom(0x0c2465);
  const createPoint = (x: number, y: number): FilamentPoint => ({
    x,
    y,
    phase: random() * TAU,
    offsetX: 0,
    offsetY: 0,
  });

  return [
    {
      points: [
        createPoint(-0.08, 0.22),
        createPoint(0.22, 0.16),
        createPoint(0.58, 0.24),
        createPoint(1.08, 0.18),
      ],
      alpha: 0.022,
      width: 0.8,
      depth: 0.54,
    },
    {
      points: [
        createPoint(-0.06, 0.66),
        createPoint(0.28, 0.58),
        createPoint(0.62, 0.7),
        createPoint(1.06, 0.56),
      ],
      alpha: 0.044,
      width: 0.9,
      depth: 0.82,
    },
    {
      points: [
        createPoint(0.12, 1.05),
        createPoint(0.34, 0.78),
        createPoint(0.72, 0.84),
        createPoint(1.08, 0.73),
      ],
      alpha: 0.028,
      width: 0.7,
      depth: 0.66,
    },
    {
      points: [
        createPoint(-0.04, 0.42),
        createPoint(0.26, 0.38),
        createPoint(0.62, 0.44),
        createPoint(1.04, 0.34),
      ],
      alpha: 0.018,
      width: 0.65,
      depth: 0.36,
    },
  ];
}

function drawCubicPath(
  context: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
) {
  context.beginPath();
  context.moveTo(points[0]?.x ?? 0, points[0]?.y ?? 0);
  context.bezierCurveTo(
    points[1]?.x ?? 0,
    points[1]?.y ?? 0,
    points[2]?.x ?? 0,
    points[2]?.y ?? 0,
    points[3]?.x ?? 0,
    points[3]?.y ?? 0,
  );
}

export function SpaceBackground() {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: true });

    if (!root || !canvas || !context) {
      return;
    }

    const stars = createStars();
    const nebulae = createNebulae();
    const filaments = createFilaments();
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointerQuery = window.matchMedia("(pointer: fine)");
    const pointer = {
      targetX: 0.5,
      targetY: 0.5,
      smoothX: 0.5,
      smoothY: 0.5,
      active: false,
      lastMove: 0,
    };

    let width = 1;
    let height = 1;
    let dpr = 1;
    let profile = getProfile(window.innerWidth);
    let frameId = 0;
    let visible = true;
    let pageVisible = document.visibilityState === "visible";
    let reducedMotion = motionQuery.matches;
    let finePointer = pointerQuery.matches;

    const resize = () => {
      width = Math.max(1, window.innerWidth);
      height = Math.max(1, window.innerHeight);
      dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      profile = getProfile(width);

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const drawNebulae = (time: number, parallaxX: number, parallaxY: number) => {
      nebulae.forEach((nebula) => {
        const driftX = reducedMotion ? 0 : Math.cos(time * 0.035 + nebula.phase) * 5;
        const driftY = reducedMotion ? 0 : Math.sin(time * 0.03 + nebula.phase) * 4;
        const centerX =
          nebula.x * width + driftX + parallaxX * NEBULA_PARALLAX * nebula.depth;
        const centerY =
          nebula.y * height + driftY + parallaxY * NEBULA_PARALLAX * nebula.depth;
        const radiusX = nebula.rx * width;
        const radiusY = nebula.ry * height;

        context.save();
        context.translate(centerX, centerY);
        context.scale(radiusX, radiusY);

        const gradient = context.createRadialGradient(0, 0, 0, 0, 0, 1);
        gradient.addColorStop(0, `rgba(${nebula.color}, ${nebula.alpha})`);
        gradient.addColorStop(0.55, `rgba(${nebula.color}, ${nebula.alpha * 0.35})`);
        gradient.addColorStop(1, `rgba(${nebula.color}, 0)`);

        context.fillStyle = gradient;
        context.beginPath();
        context.arc(0, 0, 1, 0, TAU);
        context.fill();
        context.restore();
      });
    };

    const drawCursorField = () => {
      if (reducedMotion || !finePointer || !pointer.active) {
        return;
      }

      const x = pointer.smoothX * width;
      const y = pointer.smoothY * height;
      const radius = width < 768 ? 150 : 210;
      const gradient = context.createRadialGradient(x, y, 0, x, y, radius);

      gradient.addColorStop(0, "rgba(63, 99, 221, 0.04)");
      gradient.addColorStop(0.45, "rgba(12, 36, 101, 0.018)");
      gradient.addColorStop(1, "rgba(12, 36, 101, 0)");

      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);
    };

    const drawStars = (time: number, parallaxX: number, parallaxY: number) => {
      const activeStars = stars.slice(0, profile.starCount);
      const mouseX = pointer.smoothX * width;
      const mouseY = pointer.smoothY * height;

      activeStars.forEach((star) => {
        const x = star.x * width + parallaxX * STAR_PARALLAX * star.depth;
        const y = star.y * height + parallaxY * STAR_PARALLAX * star.depth;
        const twinkle =
          reducedMotion || star.twinkle === 0
            ? 0
            : Math.sin((time / star.twinkleDuration) * TAU + star.phase) * star.twinkle;
        const distance = Math.hypot(x - mouseX, y - mouseY);
        const cursorLift =
          reducedMotion || !finePointer || !pointer.active
            ? 0
            : Math.exp(-distance / 210) * 0.018;
        const alpha = clamp(star.alpha + twinkle + cursorLift, 0.04, 0.32);

        context.beginPath();
        context.fillStyle = `rgba(226, 232, 240, ${alpha})`;
        context.arc(x, y, star.radius, 0, TAU);
        context.fill();
      });
    };

    const drawFilaments = (time: number, parallaxX: number, parallaxY: number) => {
      const activeFilaments = filaments.slice(0, profile.filamentCount);
      const mouseX = pointer.smoothX * width;
      const mouseY = pointer.smoothY * height;
      const canDeform = !reducedMotion && finePointer && pointer.active;

      activeFilaments.forEach((filament) => {
        const points = filament.points.map((point) => {
          const baseX = point.x * width;
          const baseY = point.y * height;
          const breatheX = reducedMotion ? 0 : Math.cos(time * 0.16 + point.phase) * 1.4;
          const breatheY = reducedMotion ? 0 : Math.sin(time * 0.14 + point.phase) * 1.2;
          let targetOffsetX =
            breatheX + parallaxX * FILAMENT_PARALLAX * filament.depth;
          let targetOffsetY =
            breatheY + parallaxY * FILAMENT_PARALLAX * filament.depth;

          if (canDeform) {
            const distance = Math.hypot(mouseX - baseX, mouseY - baseY);
            const influence = Math.exp(-distance / GRAVITY_RADIUS);
            const pull = influence * MAX_FILAMENT_PULL;

            if (distance > 0.001) {
              targetOffsetX += ((mouseX - baseX) / distance) * pull;
              targetOffsetY += ((mouseY - baseY) / distance) * pull;
            }
          }

          point.offsetX += (targetOffsetX - point.offsetX) * 0.055;
          point.offsetY += (targetOffsetY - point.offsetY) * 0.055;

          return {
            x: baseX + point.offsetX,
            y: baseY + point.offsetY,
          };
        });

        drawCubicPath(context, points);
        context.lineCap = "round";
        context.lineJoin = "round";
        context.lineWidth = filament.width + 1.2;
        context.strokeStyle = `rgba(63, 99, 221, ${filament.alpha * 0.24})`;
        context.stroke();

        drawCubicPath(context, points);
        context.lineWidth = filament.width;
        context.strokeStyle = `rgba(124, 140, 255, ${filament.alpha})`;
        context.stroke();

        drawCubicPath(context, points);
        context.lineWidth = Math.max(0.45, filament.width * 0.62);
        context.strokeStyle = `rgba(170, 183, 200, ${filament.alpha * 0.42})`;
        context.stroke();
      });
    };

    const render = (timeMs: number) => {
      const time = timeMs / 1000;

      if (!reducedMotion && finePointer) {
        if (performance.now() - pointer.lastMove > 1600) {
          pointer.targetX += (0.5 - pointer.targetX) * 0.018;
          pointer.targetY += (0.5 - pointer.targetY) * 0.018;
          pointer.active =
            Math.abs(pointer.targetX - 0.5) + Math.abs(pointer.targetY - 0.5) > 0.02;
        }

        pointer.smoothX += (pointer.targetX - pointer.smoothX) * POINTER_INERTIA;
        pointer.smoothY += (pointer.targetY - pointer.smoothY) * POINTER_INERTIA;
      }

      const parallaxX = reducedMotion ? 0 : pointer.smoothX - 0.5;
      const parallaxY = reducedMotion ? 0 : pointer.smoothY - 0.5;

      context.clearRect(0, 0, width, height);
      drawNebulae(time, parallaxX, parallaxY);
      drawFilaments(time, parallaxX, parallaxY);
      drawStars(time, parallaxX, parallaxY);
      drawCursorField();

      if (!reducedMotion && visible && pageVisible) {
        frameId = window.requestAnimationFrame(render);
      }
    };

    const stop = () => {
      if (frameId !== 0) {
        window.cancelAnimationFrame(frameId);
        frameId = 0;
      }
    };

    const start = () => {
      stop();
      frameId = window.requestAnimationFrame(render);
    };

    const syncAnimation = () => {
      stop();

      if (reducedMotion || !visible || !pageVisible) {
        render(performance.now());
        return;
      }

      start();
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (reducedMotion || !finePointer) {
        return;
      }

      pointer.targetX = clamp(event.clientX / width, 0, 1);
      pointer.targetY = clamp(event.clientY / height, 0, 1);
      pointer.active = true;
      pointer.lastMove = performance.now();
    };

    const handleVisibilityChange = () => {
      pageVisible = document.visibilityState === "visible";
      syncAnimation();
    };

    const handleMediaChange = () => {
      reducedMotion = motionQuery.matches;
      finePointer = pointerQuery.matches;
      pointer.targetX = 0.5;
      pointer.targetY = 0.5;
      pointer.smoothX = 0.5;
      pointer.smoothY = 0.5;
      pointer.active = false;
      syncAnimation();
    };

    const handleResize = () => {
      resize();
      syncAnimation();
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(root);

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        visible = entry?.isIntersecting ?? true;
        syncAnimation();
      },
      { threshold: 0.04 },
    );
    const hero = document.querySelector("#accueil");
    intersectionObserver.observe(hero ?? root);

    resize();
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);
    motionQuery.addEventListener("change", handleMediaChange);
    pointerQuery.addEventListener("change", handleMediaChange);
    syncAnimation();

    return () => {
      stop();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      motionQuery.removeEventListener("change", handleMediaChange);
      pointerQuery.removeEventListener("change", handleMediaChange);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block h-full w-full"
      />
    </div>
  );
}
