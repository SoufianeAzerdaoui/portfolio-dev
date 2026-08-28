"use client";

import {
  ArrowLeft,
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
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MutableRefObject,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { usePreferences } from "@/components/providers/preferences-provider";
import { FEATURES } from "@/config/features";
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
type ConfigSector = Exclude<MainSector, "reset">;
type PreferenceAvailability = "available" | "coming-soon";

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
const CLOSE_DELAY = 160;
const EXIT_DURATION = 150;
const LIGHT_FEEDBACK_DURATION = 1200;
const ACTION_RADIUS = 50;
const SUB_OPTION_RADIUS = 50;
const ARC_HALF_ANGLE = 15;

const THEME_AVAILABILITY = {
  dark: "available",
  light: FEATURES.lightTheme ? "available" : "coming-soon",
  system: "available",
} satisfies Record<ThemePreference, PreferenceAvailability>;

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

type SectorDefinition = {
  id: MainSector;
  label: string;
  Icon: LucideIcon;
  angle: number;
};

type RadialStyle = CSSProperties & {
  "--radial-x": string;
  "--radial-y": string;
};

type RadialContext = {
  label: string;
  value?: string;
  tone?: "default" | "coming-soon";
};

function getPolarStyle(angle: number, radius: number): RadialStyle {
  const radians = (angle * Math.PI) / 180;

  return {
    "--radial-x": `${Number((Math.cos(radians) * radius).toFixed(3))}px`,
    "--radial-y": `${Number((Math.sin(radians) * radius).toFixed(3))}px`,
  };
}

function DialIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="h-4 w-4"
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
      className="h-5 w-5 text-[#8B80D9]"
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

function getOptionLabel<T extends string>(
  options: PreferenceOption<T>[],
  value: T,
) {
  return options.find((option) => option.value === value)?.label ?? value;
}

function getDisplayTheme(theme: ThemePreference): ThemePreference {
  return theme === "light" && !FEATURES.lightTheme ? "dark" : theme;
}

function getLightComingSoonCopy(locale: LocaleCode) {
  return locale === "fr"
    ? {
        label: "Mode clair",
        value: "bientôt disponible",
        ariaLabel: "Mode clair, bientôt disponible",
      }
    : {
        label: "Light mode",
        value: "coming soon",
        ariaLabel: "Light mode, coming soon",
      };
}

function getSubModeLabel(mode: ConfigSector) {
  return mode === "language"
    ? "LANG"
    : mode === "appearance"
      ? "THEME"
      : "MOTION";
}

function RadialSubModeOptions<T extends string>({
  label,
  options,
  value,
  optionAngles,
  optionRefs,
  onFocusOption,
  onSelectOption,
  getAvailability,
  getOptionAriaLabel,
  statusId,
}: {
  label: string;
  options: PreferenceOption<T>[];
  value: T;
  optionAngles: number[];
  optionRefs: MutableRefObject<Array<HTMLButtonElement | null>>;
  onFocusOption: (index: number) => void;
  onSelectOption: (value: T, index: number) => void;
  getAvailability?: (value: T) => PreferenceAvailability;
  getOptionAriaLabel?: (
    option: PreferenceOption<T>,
    availability: PreferenceAvailability,
  ) => string;
  statusId?: string;
}) {
  return (
    <div
      aria-label={label}
      role="group"
      className="radial-submode-layer absolute inset-0 z-30"
    >
      {options.map((option, index) => {
        const selected = option.value === value;
        const availability = getAvailability?.(option.value) ?? "available";
        const ariaLabel =
          getOptionAriaLabel?.(option, availability) ?? option.label;

        return (
          <button
            key={option.value}
            ref={(node) => {
              optionRefs.current[index] = node;
            }}
            type="button"
            role="menuitemradio"
            aria-checked={selected}
            aria-describedby={
              availability === "coming-soon" ? statusId : undefined
            }
            aria-label={ariaLabel}
            data-availability={availability}
            data-selected={selected ? "true" : undefined}
            onFocus={() => onFocusOption(index)}
            onMouseEnter={() => onFocusOption(index)}
            onClick={() => {
              onSelectOption(option.value, index);
            }}
            style={getPolarStyle(
              optionAngles[index] ?? -90,
              SUB_OPTION_RADIUS,
            )}
            className="radial-sub-option"
          >
            <span aria-hidden="true" className="radial-sub-option-dot" />
            <span>{option.shortLabel}</span>
            {availability === "coming-soon" ? (
              <span
                aria-hidden="true"
                className="radial-sub-option-soon-dot"
              />
            ) : null}
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
  const [subMode, setSubMode] = useState<ConfigSector | null>(null);
  const [subOptionIndex, setSubOptionIndex] = useState(0);
  const [lightComingSoonFeedback, setLightComingSoonFeedback] = useState(false);
  const menuId = useId();
  const statusId = `${menuId}-status`;
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const hoverOpenTimeoutRef = useRef<number | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);
  const exitTimeoutRef = useRef<number | null>(null);
  const lightFeedbackTimeoutRef = useRef<number | null>(null);
  const actionRefs = useRef<Record<MainSector, HTMLButtonElement | null>>({
    language: null,
    appearance: null,
    motion: null,
    reset: null,
  });
  const subOptionRefs = useRef<Array<HTMLButtonElement | null>>([]);
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
      angle: -90,
    },
    {
      id: "appearance",
      label: copy.appearance,
      Icon: SunMoon,
      angle: 0,
    },
    {
      id: "motion",
      label: copy.motion,
      Icon: Activity,
      angle: 90,
    },
    {
      id: "reset",
      label: copy.reset,
      Icon: RotateCcw,
      angle: 180,
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

  const clearLightFeedbackTimer = useCallback(() => {
    if (lightFeedbackTimeoutRef.current) {
      window.clearTimeout(lightFeedbackTimeoutRef.current);
      lightFeedbackTimeoutRef.current = null;
    }
  }, []);

  const clearLightComingSoonFeedback = useCallback(() => {
    clearLightFeedbackTimer();
    setLightComingSoonFeedback(false);
  }, [clearLightFeedbackTimer]);

  const focusSector = (sector: MainSector) => {
    window.requestAnimationFrame(() => {
      actionRefs.current[sector]?.focus();
    });
  };

  const focusSubOption = (index: number) => {
    window.requestAnimationFrame(() => {
      subOptionRefs.current[index]?.focus();
    });
  };

  const getInitialSubOptionIndex = (mode: ConfigSector) => {
    if (mode === "language") {
      return copy.languageOptions.findIndex((option) => option.value === locale);
    }

    if (mode === "appearance") {
      return copy.themeOptions.findIndex(
        (option) => option.value === getDisplayTheme(theme),
      );
    }

    return copy.motionOptions.findIndex((option) => option.value === motion);
  };

  const getSubOptionCount = (mode: ConfigSector) => {
    if (mode === "language") {
      return copy.languageOptions.length;
    }

    if (mode === "appearance") {
      return copy.themeOptions.length;
    }

    return copy.motionOptions.length;
  };

  const enterSubMode = (mode: ConfigSector, focus = true) => {
    const initialIndex = Math.max(0, getInitialSubOptionIndex(mode));

    clearCloseTimer();
    clearLightComingSoonFeedback();
    subOptionRefs.current = [];
    setActiveSector(mode);
    setSubMode(mode);
    setSubOptionIndex(initialIndex);

    if (focus) {
      focusSubOption(initialIndex);
    }
  };

  const returnToMainMode = (focus = false) => {
    const previousMode = subMode;

    clearLightComingSoonFeedback();
    subOptionRefs.current = [];
    setSubMode(null);
    setSubOptionIndex(0);
    setActiveSector(previousMode);

    if (focus && previousMode) {
      focusSector(previousMode);
    }
  };

  const handleBack = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    returnToMainMode(true);
  };

  const openMenu = useCallback(
    ({
      locked = false,
      initialSector = null,
      focus = false,
    }: {
      locked?: boolean;
      initialSector?: MainSector | null;
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
      setSubMode(null);
      setSubOptionIndex(0);
      clearLightComingSoonFeedback();
      if (focus && initialSector) {
        focusSector(initialSector);
      }
    },
    [clearLightComingSoonFeedback],
  );

  const closeMenu = useCallback(
    (restoreFocus = false) => {
      clearHoverOpenTimer();
      clearCloseTimer();
      setOpen(false);
      setLockedOpen(false);
      setActiveSector(null);
      setSubMode(null);
      setSubOptionIndex(0);
      clearLightComingSoonFeedback();

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
    [clearLightComingSoonFeedback, reduceMotion],
  );

  const scheduleHoverOpen = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse") {
      return;
    }

    clearHoverOpenTimer();
    clearCloseTimer();

    if (open) {
      return;
    }

    if (closing) {
      clearExitTimer();
      setClosing(false);
      setOpen(true);
      setRendered(true);
      return;
    }

    if (rendered) {
      return;
    }

    hoverOpenTimeoutRef.current = window.setTimeout(() => {
      openMenu({ locked: false });
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

    openMenu({ locked: true });
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
    const isArrowKey =
      event.key === "ArrowLeft" ||
      event.key === "ArrowRight" ||
      event.key === "ArrowUp" ||
      event.key === "ArrowDown";

    if (subMode) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        returnToMainMode(true);
        return;
      }

      if (!isArrowKey) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const direction =
        event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
      const optionCount = getSubOptionCount(subMode);
      const nextIndex = (subOptionIndex + direction + optionCount) % optionCount;

      setSubOptionIndex(nextIndex);
      focusSubOption(nextIndex);
      return;
    }

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

    if (!nextSector || !isArrowKey) {
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
      setSubMode(null);
      setSubOptionIndex(0);
      focusSector("reset");
      return;
    }

    enterSubMode(sector);
  };

  const handleSubModeSelection = (sector: ConfigSector, index: number) => {
    clearLightComingSoonFeedback();
    setSubOptionIndex(index);
    setSubMode(null);
    setActiveSector(sector);
    focusSector(sector);
  };

  const showLightComingSoonFeedback = (index: number) => {
    clearCloseTimer();
    clearLightFeedbackTimer();
    setActiveSector("appearance");
    setSubMode("appearance");
    setSubOptionIndex(index);
    setLightComingSoonFeedback(true);
    focusSubOption(index);

    lightFeedbackTimeoutRef.current = window.setTimeout(() => {
      setLightComingSoonFeedback(false);
      lightFeedbackTimeoutRef.current = null;
    }, LIGHT_FEEDBACK_DURATION);
  };

  const handleLanguageSelection = (value: LocaleCode, index: number) => {
    setLocale(value);
    handleSubModeSelection("language", index);
  };

  const handleThemeSelection = (value: ThemePreference, index: number) => {
    if (value === "light" && !FEATURES.lightTheme) {
      showLightComingSoonFeedback(index);
      return;
    }

    setTheme(value);
    handleSubModeSelection("appearance", index);
  };

  const handleMotionSelection = (value: MotionPreference, index: number) => {
    setMotion(value);
    handleSubModeSelection("motion", index);
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
        if (subMode) {
          event.preventDefault();
          clearLightComingSoonFeedback();
          setSubMode(null);
          setSubOptionIndex(0);
          setActiveSector(subMode);
          focusSector(subMode);
          return;
        }

        closeMenu(true);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [clearLightComingSoonFeedback, closeMenu, open, subMode]);

  useEffect(() => {
    return () => {
      clearHoverOpenTimer();
      clearCloseTimer();
      clearExitTimer();
      clearLightFeedbackTimer();
    };
  }, [clearLightFeedbackTimer]);

  const displayTheme = getDisplayTheme(theme);
  const selectedLanguageLabel = getOptionLabel(copy.languageOptions, locale);
  const selectedThemeLabel = getOptionLabel(copy.themeOptions, displayTheme);
  const selectedMotionLabel = getOptionLabel(copy.motionOptions, motion);
  const focusedLanguage =
    copy.languageOptions[subOptionIndex] ?? copy.languageOptions[0];
  const focusedTheme = copy.themeOptions[subOptionIndex] ?? copy.themeOptions[0];
  const focusedMotion = copy.motionOptions[subOptionIndex] ?? copy.motionOptions[0];
  const lightComingSoonCopy = getLightComingSoonCopy(locale);
  const resetHint =
    locale === "fr" ? "Réinitialiser les préférences" : "Reset preferences";
  const contextLabel: RadialContext | null =
    subMode === "language"
      ? { label: copy.language, value: focusedLanguage.label }
      : subMode === "appearance" &&
          focusedTheme.value === "light" &&
          THEME_AVAILABILITY.light === "coming-soon"
        ? {
            label: lightComingSoonCopy.label,
            value: lightComingSoonCopy.value,
            tone: "coming-soon",
          }
        : subMode === "appearance"
          ? { label: copy.appearance, value: focusedTheme.label }
          : subMode === "motion"
            ? { label: copy.motion, value: focusedMotion.label }
            : activeSector === "language"
              ? { label: copy.language, value: selectedLanguageLabel }
              : activeSector === "appearance"
                ? { label: copy.appearance, value: selectedThemeLabel }
                : activeSector === "motion"
                  ? { label: copy.motion, value: selectedMotionLabel }
                  : activeSector === "reset"
                    ? { label: resetHint }
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
        className="preferences-trigger inline-grid h-10 w-10 place-items-center rounded-full border transition-[background-color,border-color,color] duration-[160ms] ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-accent-2)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--home-bg-0)] motion-reduce:transition-none"
      >
        <DialIcon />
      </button>

      {rendered ? (
        <div
          id={menuId}
          role="menu"
          aria-label={copy.title}
          data-active-sector={activeSector ?? "idle"}
          data-feedback={lightComingSoonFeedback ? "light-soon" : undefined}
          data-mode={subMode ? "sub" : "main"}
          className={[
            "radial-preferences-menu absolute right-0 top-[calc(100%+0.625rem)] z-50 rounded-full",
            closing
              ? "motion-safe:animate-[radial-menu-out_150ms_ease-in_forwards]"
              : "motion-safe:animate-[radial-menu-in_210ms_cubic-bezier(0.2,0.8,0.2,1)_both]",
          ].join(" ")}
          onKeyDown={handleMenuKeyDown}
        >
          {activeSector ? (
            <div
              aria-hidden="true"
              className="radial-sector-bloom"
              style={getPolarStyle(
                sectors.find((sector) => sector.id === activeSector)?.angle ??
                  -90,
                ACTION_RADIUS,
              )}
            />
          ) : null}

          <svg
            aria-hidden="true"
            viewBox="0 0 156 156"
            className="absolute inset-0 h-full w-full"
            fill="none"
          >
            <circle className="radial-outer-ring" cx="78" cy="78" r="73" />
            <circle className="radial-inner-ring" cx="78" cy="78" r="26" />
            {activeSector ? (
              <g
                className="radial-active-indicator"
                style={{
                  transform: `rotate(${
                    (sectors.find((sector) => sector.id === activeSector)
                      ?.angle ?? -90) - ARC_HALF_ANGLE
                  }deg)`,
                }}
              >
                <circle
                  className="radial-active-arc"
                  cx="78"
                  cy="78"
                  r="72"
                  pathLength="100"
                />
                <circle className="radial-active-node" cx="78" cy="6" r="2" />
              </g>
            ) : null}
          </svg>

          <div className="radial-center-hub">
            {lightComingSoonFeedback ? (
              <div className="radial-center-feedback" role="status">
                SOON
              </div>
            ) : subMode ? (
              <button
                type="button"
                role="menuitem"
                aria-label={
                  locale === "fr"
                    ? "Retour"
                    : "Back"
                }
                onPointerDown={(event) => {
                  event.stopPropagation();
                }}
                onClick={handleBack}
                className="radial-center-back"
              >
                <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
                <span>{getSubModeLabel(subMode)}</span>
              </button>
            ) : (
              <div className="radial-center-content motion-safe:animate-[radial-center-shift_120ms_ease-out_both]">
                <CenterMark />
              </div>
            )}
          </div>

          {!subMode ? (
            <div className="radial-main-layer absolute inset-0 z-30">
              {sectors.map(({ id, label, Icon, angle }) => (
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
                  style={getPolarStyle(angle, ACTION_RADIUS)}
                  className="radial-main-action absolute grid h-[38px] w-[38px] place-items-center rounded-full"
                >
                  <Icon aria-hidden="true" className="h-4 w-4" />
                </button>
              ))}
            </div>
          ) : null}

          {subMode === "language" ? (
            <RadialSubModeOptions
              label={copy.language}
              options={copy.languageOptions}
              value={locale}
              optionAngles={[180, 0]}
              optionRefs={subOptionRefs}
              onFocusOption={setSubOptionIndex}
              onSelectOption={handleLanguageSelection}
            />
          ) : null}

          {subMode === "appearance" ? (
            <RadialSubModeOptions
              label={copy.appearance}
              options={copy.themeOptions}
              value={displayTheme}
              optionAngles={[-90, 30, 150]}
              optionRefs={subOptionRefs}
              onFocusOption={setSubOptionIndex}
              onSelectOption={handleThemeSelection}
              getAvailability={(value) => THEME_AVAILABILITY[value]}
              getOptionAriaLabel={(option, availability) =>
                availability === "coming-soon"
                  ? lightComingSoonCopy.ariaLabel
                  : option.label
              }
              statusId={statusId}
            />
          ) : null}

          {subMode === "motion" ? (
            <RadialSubModeOptions
              label={copy.motion}
              options={copy.motionOptions}
              value={motion}
              optionAngles={[-90, 90]}
              optionRefs={subOptionRefs}
              onFocusOption={setSubOptionIndex}
              onSelectOption={handleMotionSelection}
            />
          ) : null}

          {contextLabel ? (
            <p
              id={statusId}
              className="radial-context-label"
              data-tone={contextLabel.tone}
              aria-live="polite"
            >
              <span>{contextLabel.label}</span>
              {contextLabel.value ? (
                <>
                  <span className="radial-context-separator"> · </span>
                  <span className="radial-context-value">
                    {contextLabel.value}
                  </span>
                </>
              ) : null}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
