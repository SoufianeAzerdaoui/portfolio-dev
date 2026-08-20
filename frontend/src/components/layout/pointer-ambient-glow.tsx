"use client";

import { useEffect, useRef } from "react";

import { usePreferences } from "@/components/providers/preferences-provider";

const GLOW_SIZE = 360;
const INERTIA = 0.1;

export function PointerAmbientGlow() {
  const glowRef = useRef<HTMLDivElement>(null);
  const { reduceMotion } = usePreferences();

  useEffect(() => {
    const element = glowRef.current;

    if (!element || reduceMotion) {
      if (element) {
        element.style.opacity = "0";
      }
      return;
    }

    const pointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    let rafId = 0;
    let listenersActive = false;
    let hasPointer = false;
    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;
    let currentOpacity = 0;
    let targetOpacity = 0;

    const stopLoop = () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
    };

    const tick = () => {
      currentX += (targetX - currentX) * INERTIA;
      currentY += (targetY - currentY) * INERTIA;
      currentOpacity += (targetOpacity - currentOpacity) * 0.12;

      element.style.transform = `translate3d(${currentX - GLOW_SIZE / 2}px, ${
        currentY - GLOW_SIZE / 2
      }px, 0)`;
      element.style.opacity = currentOpacity.toFixed(3);

      rafId = window.requestAnimationFrame(tick);
    };

    const startLoop = () => {
      if (!rafId && !document.hidden) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    const showGlow = (event: PointerEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;

      if (!hasPointer) {
        currentX = targetX;
        currentY = targetY;
        hasPointer = true;
      }

      targetOpacity = 1;
      startLoop();
    };

    const hideGlow = () => {
      targetOpacity = 0;
      startLoop();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        targetOpacity = 0;
        element.style.opacity = "0";
        stopLoop();
        return;
      }

      if (pointerQuery.matches && hasPointer) {
        startLoop();
      }
    };

    const addPointerListeners = () => {
      if (listenersActive) {
        return;
      }

      window.addEventListener("pointermove", showGlow, { passive: true });
      window.addEventListener("blur", hideGlow);
      document.documentElement.addEventListener("mouseleave", hideGlow);
      listenersActive = true;
    };

    const removePointerListeners = () => {
      if (!listenersActive) {
        return;
      }

      window.removeEventListener("pointermove", showGlow);
      window.removeEventListener("blur", hideGlow);
      document.documentElement.removeEventListener("mouseleave", hideGlow);
      listenersActive = false;
      targetOpacity = 0;
      element.style.opacity = "0";
      stopLoop();
    };

    const syncPointerMode = () => {
      if (pointerQuery.matches && !document.hidden) {
        addPointerListeners();
        return;
      }

      removePointerListeners();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    pointerQuery.addEventListener("change", syncPointerMode);
    syncPointerMode();

    return () => {
      removePointerListeners();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      pointerQuery.removeEventListener("change", syncPointerMode);
      stopLoop();
    };
  }, [reduceMotion]);

  return <div ref={glowRef} aria-hidden="true" className="pointer-ambient-glow" />;
}
