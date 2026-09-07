"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

import { PortfolioAIComposer } from "@/features/portfolio-ai/components/portfolio-ai-composer";
import { PortfolioAIConversation } from "@/features/portfolio-ai/components/portfolio-ai-conversation";
import { PortfolioAIHeader } from "@/features/portfolio-ai/components/portfolio-ai-header";
import { usePortfolioAI } from "@/features/portfolio-ai/hooks/use-portfolio-ai";
import type { LocaleCode, PortfolioAIConsoleContent } from "@/types/portfolio";

type PortfolioAIConsoleProps = {
  open: boolean;
  locale: LocaleCode;
  content: PortfolioAIConsoleContent;
  reduceMotion: boolean;
  onClose: () => void;
};

const CLOSE_ANIMATION_MS = 170;
const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function PortfolioAIConsole({
  open,
  locale,
  content,
  reduceMotion,
  onClose,
}: PortfolioAIConsoleProps) {
  const {
    messages,
    status,
    isActive,
    submit,
    retryLast,
    reset,
    abort,
  } = usePortfolioAI({ locale });
  const [draft, setDraft] = useState("");
  const [rendered, setRendered] = useState(open);
  const [closing, setClosing] = useState(false);
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const close = useCallback(() => {
    abort();
    onClose();
  }, [abort, onClose]);

  const submitDraft = useCallback(() => {
    const question = draft.trim();

    if (!question) {
      return;
    }

    setDraft("");
    void submit(question);
  }, [draft, submit]);

  const submitSuggestion = useCallback(
    (question: string) => {
      setDraft(question);
      window.requestAnimationFrame(() => {
        setDraft("");
        void submit(question, { displayValue: question });
      });
    },
    [submit],
  );

  useEffect(() => {
    let frame = 0;
    let timeout = 0;

    if (open) {
      frame = window.requestAnimationFrame(() => {
        setRendered(true);
        setClosing(false);
      });

      return () => window.cancelAnimationFrame(frame);
    }

    if (!rendered) {
      return;
    }

    abort();

    if (reduceMotion) {
      frame = window.requestAnimationFrame(() => {
        setClosing(false);
        setRendered(false);
        reset();
        setDraft("");
      });

      return () => window.cancelAnimationFrame(frame);
    }

    frame = window.requestAnimationFrame(() => {
      setClosing(true);
    });

    timeout = window.setTimeout(() => {
      setRendered(false);
      setClosing(false);
      reset();
      setDraft("");
    }, CLOSE_ANIMATION_MS);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [abort, open, reduceMotion, rendered, reset]);

  useEffect(() => {
    if (!rendered) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    if (open) {
      window.requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements =
        dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);

      if (!focusableElements?.length) {
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }

      if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [close, open, rendered]);

  if (!rendered) {
    return null;
  }

  return (
    <div
      className={[
        "fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(10,10,14,0.68)] p-0 sm:p-6 lg:p-10",
        reduceMotion ? "" : "transition-opacity duration-150",
        closing ? "opacity-0" : "opacity-100",
      ].join(" ")}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          close();
        }
      }}
    >
      <div
        id="portfolio-ai-console"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-busy={isActive}
        className={[
          "flex h-[100dvh] w-full flex-col overflow-hidden border border-[var(--home-line)] bg-[#17161C] shadow-[0_24px_80px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.035)] sm:h-[min(720px,calc(100dvh-48px))] sm:w-[min(1000px,calc(100vw-48px))] sm:rounded-[14px] lg:h-[min(720px,calc(100dvh-80px))] lg:w-[min(1000px,calc(100vw-80px))]",
          reduceMotion
            ? ""
            : closing
              ? "motion-safe:animate-[portfolio-ai-console-out_170ms_ease-in_both]"
              : "motion-safe:animate-[portfolio-ai-console-in_180ms_cubic-bezier(0.22,1,0.36,1)_both]",
        ].join(" ")}
      >
        <h2 id={titleId} className="sr-only">
          {content.ariaLabel}
        </h2>
        <PortfolioAIHeader content={content} onClose={close} />
        <PortfolioAIConversation
          content={content}
          messages={messages}
          status={status}
          isActive={isActive}
          onSuggestion={submitSuggestion}
          onRetry={retryLast}
        />
        <PortfolioAIComposer
          content={content}
          value={draft}
          disabled={isActive}
          inputRef={inputRef}
          onChange={setDraft}
          onSubmit={submitDraft}
        />
      </div>
    </div>
  );
}
