"use client";

import {
  Activity,
  Languages,
  RotateCcw,
  SunMoon,
  type LucideIcon,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { usePreferences } from "@/components/providers/preferences-provider";
import type {
  LocaleCode,
  MotionPreference,
  ThemePreference,
} from "@/types/portfolio";

type PreferenceOption<T extends string> = {
  value: T;
  label: string;
  shortLabel: string;
};

type MainSector = "language" | "appearance" | "motion" | "reset";

type RadialCopy = {
  button: string;
  title: string;
  language: string;
  appearance: string;
  motion: string;
  reset: string;
  languageOptions: PreferenceOption<LocaleCode>[];
  themeOptions: PreferenceOption<ThemePreference>[];
  motionOptions: PreferenceOption<MotionPreference>[];
};

const HOVER_OPEN_DELAY = 180;
const CLOSE_DELAY = 260;
const EXIT_DURATION = 150;

const copyByLocale = {
  fr: {
    button: "Ouvrir les préférences",
    title: "Préférences",
    language: "Langue",
    appearance: "Apparence",
    motion: "Mouvement",
    reset: "Reset",
    languageOptions: [
      { value: "fr", label: "Français", shortLabel: "FR" },
      { value: "en", label: "English", shortLabel: "EN" },
    ],
    themeOptions: [
      { value: "dark", label: "Sombre", shortLabel: "Dark" },
      { value: "light", label: "Clair", shortLabel: "Light" },
      { value: "system", label: "Système", shortLabel: "System" },
    ],
    motionOptions: [
      { value: "system", label: "Système", shortLabel: "System" },
      { value: "reduced", label: "Réduit", shortLabel: "Reduced" },
    ],
  },
  en: {
    button: "Open preferences",
    title: "Preferences",
    language: "Language",
    appearance: "Appearance",
    motion: "Motion",
    reset: "Reset",
    languageOptions: [
      { value: "fr", label: "Français", shortLabel: "FR" },
      { value: "en", label: "English", shortLabel: "EN" },
    ],
    themeOptions: [
      { value: "dark", label: "Dark", shortLabel: "Dark" },
      { value: "light", label: "Light", shortLabel: "Light" },
      { value: "system", label: "System", shortLabel: "System" },
    ],
    motionOptions: [
      { value: "system", label: "System", shortLabel: "System" },
      { value: "reduced", label: "Reduced", shortLabel: "Reduced" },
    ],
  },
} satisfies Record<LocaleCode, RadialCopy>;

const arcRotationBySector = {
  language: -112,
  appearance: -22,
  motion: 68,
  reset: 158,
} satisfies Record<MainSector, number>;

type SectorDefinition = {
  id: MainSector;
  label: string;
  Icon: LucideIcon;
  className: string;
};

function DialIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="h-[18px] w-[18px]"
      fill="none"
    >
      <circle cx="10" cy="10" r="3.1" stroke="currentColor" strokeWidth="1.45" />
      <circle cx="10" cy="3.2" r="1.15" fill="currentColor" />
      <circle cx="16.8" cy="10" r="1.15" fill="currentColor" />
      <circle cx="10" cy="16.8" r="1.15" fill="currentColor" />
      <circle cx="3.2" cy="10" r="1.15" fill="currentColor" />
      <path
        d="M10 5.4v1.4M14.6 10h-1.4M10 14.6v-1.4M5.4 10h1.4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.35"
      />
    </svg>
  );
}

function CenterMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 42 42"
      className="h-6 w-6 text-[#8B80D9]"
      fill="none"
    >
      <circle cx="21" cy="21" r="6.5" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="21" cy="21" r="1.8" fill="currentColor" />
      <path
        d="M21 5.8v5.4M36.2 21h-5.4M21 36.2v-5.4M5.8 21h5.4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.1"
      />
    </svg>
  );
}

function RadialOptionGroup<T extends string>({
  sector,
  label,
  options,
  value,
  onChange,
  onSelect,
  className,
}: {
  sector: MainSector;
  label: string;
  options: PreferenceOption<T>[];
  value: T;
  onChange: (value: T) => void;
  onSelect: () => void;
  className: string;
}) {
  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (
      event.key !== "ArrowLeft" &&
      event.key !== "ArrowRight" &&
      event.key !== "ArrowUp" &&
      event.key !== "ArrowDown"
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const direction =
      event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
    const currentIndex = options.findIndex((option) => option.value === value);
    const nextIndex =
      (currentIndex + direction + options.length) % options.length;
    onChange(options[nextIndex].value);
  };

  return (
    <div
      aria-label={label}
      role="group"
      data-sector={sector}
      onKeyDown={handleKeyDown}
      className={[
        "radial-submenu absolute z-20 flex items-center gap-1.5",
        className,
      ].join(" ")}
    >
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            role="menuitemradio"
            aria-checked={selected}
            data-selected={selected ? "true" : undefined}
            onClick={() => {
              onChange(option.value);
              onSelect();
            }}
            className="radial-submenu-option"
          >
            <span>{option.shortLabel}</span>
            <span aria-hidden="true" className="radial-submenu-dot" />
          </button>
        );
      })}
    </div>
  );
}

export function PreferencesPanel({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [rendered, setRendered] = useState(false);
  const [closing, setClosing] = useState(false);
  const [lockedOpen, setLockedOpen] = useState(false);
  const [activeSector, setActiveSector] = useState<MainSector | null>(null);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const hoverOpenTimeoutRef = useRef<number | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);
  const exitTimeoutRef = useRef<number | null>(null);
  const actionRefs = useRef<Record<MainSector, HTMLButtonElement | null>>({
    language: null,
    appearance: null,
    motion: null,
    reset: null,
  });
  const {
    locale,
    theme,
    motion,
    setLocale,
    setTheme,
    setMotion,
    resetPreferences,
    reduceMotion,
  } = usePreferences();
  const copy = copyByLocale[locale];

  const sectors: SectorDefinition[] = [
    {
      id: "language",
      label: copy.language,
      Icon: Languages,
      className: "left-1/2 top-3 -translate-x-1/2",
    },
    {
      id: "appearance",
      label: copy.appearance,
      Icon: SunMoon,
      className: "right-3 top-1/2 -translate-y-1/2",
    },
    {
      id: "motion",
      label: copy.motion,
      Icon: Activity,
      className: "bottom-3 left-1/2 -translate-x-1/2",
    },
    {
      id: "reset",
      label: copy.reset,
      Icon: RotateCcw,
      className: "left-3 top-1/2 -translate-y-1/2",
    },
  ];

  const clearHoverOpenTimer = () => {
    if (hoverOpenTimeoutRef.current) {
      window.clearTimeout(hoverOpenTimeoutRef.current);
      hoverOpenTimeoutRef.current = null;
    }
  };

  const clearCloseTimer = () => {
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const clearExitTimer = () => {
    if (exitTimeoutRef.current) {
      window.clearTimeout(exitTimeoutRef.current);
      exitTimeoutRef.current = null;
    }
  };

  const focusSector = (sector: MainSector) => {
    window.requestAnimationFrame(() => {
      actionRefs.current[sector]?.focus();
    });
  };

  const openMenu = useCallback(
    ({
      locked = false,
      initialSector = "language",
      focus = false,
    }: {
      locked?: boolean;
      initialSector?: MainSector;
      focus?: boolean;
    } = {}) => {
      clearHoverOpenTimer();
      clearCloseTimer();
      clearExitTimer();
      setRendered(true);
      setClosing(false);
      setOpen(true);
      setLockedOpen(locked);
      setActiveSector(initialSector);
      if (focus) {
        focusSector(initialSector);
      }
    },
    [],
  );

  const closeMenu = useCallback(
    (restoreFocus = false) => {
      clearHoverOpenTimer();
      clearCloseTimer();
      setOpen(false);
      setLockedOpen(false);
      setActiveSector(null);

      if (reduceMotion) {
        setClosing(false);
        setRendered(false);
        if (restoreFocus) {
          triggerRef.current?.focus();
        }
        return;
      }

      setClosing(true);
      clearExitTimer();
      exitTimeoutRef.current = window.setTimeout(() => {
        setClosing(false);
        setRendered(false);
        exitTimeoutRef.current = null;
        if (restoreFocus) {
          triggerRef.current?.focus();
        }
      }, EXIT_DURATION);
    },
    [reduceMotion],
  );

  const scheduleHoverOpen = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse") {
      return;
    }

    clearHoverOpenTimer();
    clearCloseTimer();

    if (open || rendered) {
      return;
    }

    hoverOpenTimeoutRef.current = window.setTimeout(() => {
      openMenu({ locked: false, initialSector: "language" });
    }, HOVER_OPEN_DELAY);
  };

  const scheduleHoverClose = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse") {
      return;
    }

    clearHoverOpenTimer();

    if (lockedOpen) {
      return;
    }

    clearCloseTimer();
    closeTimeoutRef.current = window.setTimeout(() => {
      closeMenu();
    }, CLOSE_DELAY);
  };

  const handleTriggerClick = () => {
    if (open && lockedOpen) {
      closeMenu();
      return;
    }

    openMenu({ locked: true, initialSector: "language" });
  };

  const handleTriggerKeyDown = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
  ) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    if (open && lockedOpen) {
      closeMenu(true);
      return;
    }

    openMenu({ locked: true, initialSector: "language", focus: true });
  };

  const handleMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu(true);
      return;
    }

    const nextSector =
      event.key === "ArrowUp"
        ? "language"
        : event.key === "ArrowRight"
          ? "appearance"
          : event.key === "ArrowDown"
            ? "motion"
            : event.key === "ArrowLeft"
              ? "reset"
              : null;

    if (!nextSector) {
      return;
    }

    event.preventDefault();
    setActiveSector(nextSector);
    focusSector(nextSector);
  };

  const activateSector = (sector: MainSector) => {
    setActiveSector(sector);

    if (sector === "reset") {
      resetPreferences();
      closeMenu();
    }
  };

  const handleSelection = () => {
    closeMenu();
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        closeMenu(true);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu(true);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeMenu, open]);

  useEffect(() => {
    return () => {
      clearHoverOpenTimer();
      clearCloseTimer();
      clearExitTimer();
    };
  }, []);

  const centerContent =
    activeSector === "language"
      ? locale.toUpperCase()
      : activeSector === "appearance"
        ? theme === "system"
          ? "AUTO"
          : theme.toUpperCase()
        : activeSector === "motion"
          ? motion === "reduced"
            ? "REDUCED"
            : "AUTO"
          : activeSector === "reset"
            ? "RESET"
            : null;

  return (
    <div
      ref={rootRef}
      className={["radial-preferences-root relative inline-flex", className]
        .join(" ")
        .trim()}
      onPointerEnter={scheduleHoverOpen}
      onPointerLeave={scheduleHoverClose}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-label={copy.button}
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="menu"
        onClick={handleTriggerClick}
        onKeyDown={handleTriggerKeyDown}
        className="preferences-trigger inline-grid h-[42px] w-[42px] place-items-center rounded-full border transition-[background-color,border-color,color] duration-[160ms] ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-accent-2)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--home-bg-0)] motion-reduce:transition-none"
      >
        <DialIcon />
      </button>

      {rendered ? (
        <div
          id={menuId}
          role="menu"
          aria-label={copy.title}
          data-active-sector={activeSector ?? "idle"}
          className={[
            "radial-preferences-menu absolute right-14 top-[calc(100%+1rem)] z-50 rounded-full",
            closing
              ? "motion-safe:animate-[radial-menu-out_150ms_ease-in_forwards]"
              : "motion-safe:animate-[radial-menu-in_240ms_cubic-bezier(0.2,0.8,0.2,1)_both]",
          ].join(" ")}
          onKeyDown={handleMenuKeyDown}
        >
          <div aria-hidden="true" className="radial-sector-bloom" />

          <svg
            aria-hidden="true"
            viewBox="0 0 184 184"
            className="absolute inset-0 h-full w-full"
            fill="none"
          >
            <circle className="radial-outer-ring" cx="92" cy="92" r="86" />
            <circle className="radial-inner-ring" cx="92" cy="92" r="31" />
            <path className="radial-tick" d="M92 7v9" />
            <path className="radial-tick" d="M177 92h-9" />
            <path className="radial-tick" d="M92 177v-9" />
            <path className="radial-tick" d="M7 92h9" />
            {activeSector ? (
              <g
                className="radial-active-indicator"
                style={{
                  transform: `rotate(${arcRotationBySector[activeSector]}deg)`,
                }}
              >
                <circle
                  className="radial-active-arc"
                  cx="92"
                  cy="92"
                  r="85"
                  pathLength="100"
                />
                <circle className="radial-active-node" cx="92" cy="7" r="2" />
              </g>
            ) : null}
          </svg>

          <div className="radial-center-hub">
            <div
              key={centerContent ?? "idle"}
              className="radial-center-content motion-safe:animate-[radial-center-shift_140ms_ease-out_both]"
            >
              {centerContent ? (
                <span>{centerContent}</span>
              ) : (
                <CenterMark />
              )}
            </div>
          </div>

          {sectors.map(({ id, label, Icon, className: positionClass }) => (
            <button
              key={id}
              ref={(node) => {
                actionRefs.current[id] = node;
              }}
              type="button"
              role="menuitem"
              aria-label={label}
              data-sector={id}
              data-active={activeSector === id ? "true" : undefined}
              onMouseEnter={() => setActiveSector(id)}
              onFocus={() => setActiveSector(id)}
              onClick={() => activateSector(id)}
              className={[
                "radial-main-action absolute z-30 grid h-11 w-11 place-items-center rounded-full sm:h-10 sm:w-10",
                positionClass,
              ].join(" ")}
            >
              <Icon aria-hidden="true" className="h-[17px] w-[17px]" />
              <span className="radial-action-label">{label}</span>
            </button>
          ))}

          {activeSector === "language" ? (
            <RadialOptionGroup
              sector="language"
              label={copy.language}
              options={copy.languageOptions}
              value={locale}
              onChange={setLocale}
              onSelect={handleSelection}
              className="left-1/2 top-[-28px] -translate-x-1/2"
            />
          ) : null}

          {activeSector === "appearance" ? (
            <RadialOptionGroup
              sector="appearance"
              label={copy.appearance}
              options={copy.themeOptions}
              value={theme}
              onChange={setTheme}
              onSelect={handleSelection}
              className="left-[calc(100%+0.35rem)] top-[calc(50%+1.45rem)] w-[96px] flex-col items-start"
            />
          ) : null}

          {activeSector === "motion" ? (
            <RadialOptionGroup
              sector="motion"
              label={copy.motion}
              options={copy.motionOptions}
              value={motion}
              onChange={setMotion}
              onSelect={handleSelection}
              className="bottom-[-36px] left-1/2 -translate-x-1/2"
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
