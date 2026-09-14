"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  PORTFOLIO_AI_CLIENT_MAX_MESSAGE_LENGTH,
  isPortfolioAIAbortError,
  normalizePortfolioAIClientError,
  streamPortfolioAIResponse,
  type PortfolioAIClientErrorPayload,
  type PublicPortfolioAISource,
} from "@/features/portfolio-ai/client/portfolio-ai-client";
import {
  appendPortfolioAIAssistantDelta,
  buildBoundedPortfolioAIHistory,
  createPortfolioAIMessageId,
  isPortfolioAIRequestActive,
  updatePortfolioAIAssistantMessage,
  type PortfolioAIConversationMessage,
  type PortfolioAIConversationStatus,
} from "@/features/portfolio-ai/client/conversation-state";
import type { LocaleCode } from "@/types/portfolio";

type UsePortfolioAIOptions = {
  locale: LocaleCode;
};

type SubmitOptions = {
  displayValue?: string;
};

export function usePortfolioAI({ locale }: UsePortfolioAIOptions) {
  const [messages, setMessages] = useState<PortfolioAIConversationMessage[]>([]);
  const [status, setStatus] = useState<PortfolioAIConversationStatus>("idle");
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
  const [lastError, setLastError] =
    useState<PortfolioAIClientErrorPayload | null>(null);
  const messagesRef = useRef(messages);
  const statusRef = useRef(status);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastSubmittedQuestionRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const abort = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      abort();
    };
  }, [abort]);

  const submit = useCallback(
    async (rawQuestion: string, options: SubmitOptions = {}) => {
      const question = rawQuestion
        .trim()
        .slice(0, PORTFOLIO_AI_CLIENT_MAX_MESSAGE_LENGTH);

      if (!question || isPortfolioAIRequestActive(statusRef.current)) {
        return;
      }

      const userMessageId = createPortfolioAIMessageId("user");
      const assistantMessageId = createPortfolioAIMessageId("assistant");
      const history = buildBoundedPortfolioAIHistory(messagesRef.current);
      const controller = new AbortController();

      abortControllerRef.current = controller;
      lastSubmittedQuestionRef.current = options.displayValue ?? question;
      statusRef.current = "submitting";
      setStatus("submitting");
      setLastError(null);
      setCurrentRequestId(null);
      setMessages((current) => [
        ...current,
        {
          id: userMessageId,
          role: "user",
          content: options.displayValue ?? question,
          status: "success",
        },
        {
          id: assistantMessageId,
          role: "assistant",
          content: "",
          status: "pending",
          sources: [],
        },
      ]);

      try {
        await streamPortfolioAIResponse(
          {
            message: question,
            locale,
            history,
          },
          {
            signal: controller.signal,
            onMeta: (meta) => {
              if (!mountedRef.current) {
                return;
              }

              statusRef.current = "streaming";
              setCurrentRequestId(meta.requestId);
              setStatus("streaming");
              setMessages((current) =>
                updatePortfolioAIAssistantMessage(current, assistantMessageId, {
                  requestId: meta.requestId,
                  language: meta.language,
                  status: "streaming",
                }),
              );
            },
            onDelta: ({ text }) => {
              if (!mountedRef.current) {
                return;
              }

              statusRef.current = "streaming";
              setStatus("streaming");
              setMessages((current) =>
                appendPortfolioAIAssistantDelta(
                  current,
                  assistantMessageId,
                  text,
                ),
              );
            },
            onSources: ({ sources }: { sources: PublicPortfolioAISource[] }) => {
              if (!mountedRef.current) {
                return;
              }

              setMessages((current) =>
                updatePortfolioAIAssistantMessage(current, assistantMessageId, {
                  sources,
                }),
              );
            },
            onDone: ({ uncertainty }) => {
              if (!mountedRef.current) {
                return;
              }

              statusRef.current = "success";
              setStatus("success");
              setMessages((current) =>
                updatePortfolioAIAssistantMessage(current, assistantMessageId, {
                  status: "success",
                  uncertainty,
                }),
              );
            },
          },
        );
      } catch (error) {
        if (isPortfolioAIAbortError(error)) {
          return;
        }

        if (!mountedRef.current) {
          return;
        }

        const normalized = normalizePortfolioAIClientError(error);
        const errorPayload: PortfolioAIClientErrorPayload = {
          code: normalized.code,
          message: normalized.message,
          retryable: normalized.retryable,
          requestId: normalized.requestId,
          retryAfterSeconds: normalized.retryAfterSeconds,
          status: normalized.status,
        };

        setLastError(errorPayload);
        statusRef.current = "error";
        setStatus("error");
        setMessages((current) =>
          updatePortfolioAIAssistantMessage(current, assistantMessageId, {
            content: "",
            status: "error",
            error: errorPayload,
          }),
        );
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
      }
    },
    [locale],
  );

  const retryLast = useCallback(() => {
    const lastQuestion = lastSubmittedQuestionRef.current;

    if (lastQuestion) {
      void submit(lastQuestion);
    }
  }, [submit]);

  const reset = useCallback(() => {
    abort();
    statusRef.current = "idle";
    setMessages([]);
    setStatus("idle");
    setCurrentRequestId(null);
    setLastError(null);
    lastSubmittedQuestionRef.current = null;
  }, [abort]);

  return {
    messages,
    status,
    currentRequestId,
    lastError,
    isActive: isPortfolioAIRequestActive(status),
    submit,
    retryLast,
    reset,
    abort,
  };
}
