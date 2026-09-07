import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import type { ComponentType, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { HeroActions } from "@/components/home/hero-actions";
import { PreferencesProvider } from "@/components/providers/preferences-provider";
import { portfolioContentByLocale } from "@/content/portfolio";
import {
  PORTFOLIO_AI_STREAM_ENDPOINT,
  PortfolioAIClientError,
  createPortfolioAISSEParser,
  streamPortfolioAIResponse,
  type PortfolioAIStreamEvent,
} from "@/features/portfolio-ai/client/portfolio-ai-client";
import {
  buildBoundedPortfolioAIHistory,
  type PortfolioAIConversationMessage,
} from "@/features/portfolio-ai/client/conversation-state";
import { getPortfolioAIErrorDisplayMessage } from "@/features/portfolio-ai/client/display";
import { PortfolioAIConsole } from "@/features/portfolio-ai/components/portfolio-ai-console";
import { PortfolioAIEmptyState } from "@/features/portfolio-ai/components/portfolio-ai-empty-state";
import { PortfolioAISources } from "@/features/portfolio-ai/components/portfolio-ai-sources";

const TestPreferencesProvider = PreferencesProvider as ComponentType<{
  children?: ReactNode;
  initialLocale?: "fr" | "en";
}>;

function sse(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function streamFromChunks(chunks: string[]) {
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }

      controller.close();
    },
  });
}

async function expectClientError(
  action: () => Promise<void>,
): Promise<PortfolioAIClientError> {
  try {
    await action();
  } catch (error) {
    assert.ok(error instanceof PortfolioAIClientError);
    return error;
  }

  throw new Error("Expected PortfolioAIClientError.");
}

test("Portfolio AI CTA renders as the existing dialog trigger", () => {
  const content = portfolioContentByLocale.fr;
  const markup = renderToStaticMarkup(
    createElement(
      TestPreferencesProvider,
      { initialLocale: "fr" },
      createElement(HeroActions, {
        ctas: content.ctas,
        onPortfolioAIOpen: () => {},
      }),
    ),
  );

  assert.match(markup, /aria-haspopup="dialog"/);
  assert.match(markup, /aria-controls="portfolio-ai-console"/);
  assert.match(markup, /Interroger mon portfolio avec l&#x27;IA/);
  assert.doesNotMatch(markup, /href="#ai-lab"/);
});

test("Portfolio AI empty state renders localized suggestions", () => {
  const content = portfolioContentByLocale.fr.aiConsole;
  const markup = renderToStaticMarkup(
    createElement(PortfolioAIEmptyState, {
      content,
      disabled: false,
      onSuggestion: () => {},
    }),
  );

  assert.match(markup, /PORTFOLIO AI/);
  assert.match(markup, /Quels sont ses projets les plus pertinents en IA/);
  assert.match(markup, /Quelle est son expérience avec le RAG/);
});

test("stream client POSTs to the streaming endpoint and handles events", async () => {
  const events: PortfolioAIStreamEvent[] = [];
  let requestedUrl = "";
  let requestedInit: RequestInit | undefined;
  const answer = "Oui, Qdrant est documenté dans Medical RAG.";
  const fetcher: typeof fetch = async (input, init) => {
    requestedUrl = String(input);
    requestedInit = init;

    return new Response(
      streamFromChunks([
        sse("meta", { requestId: "pai_test", language: "fr" }),
        sse("delta", { text: "Oui, Qdrant " }),
        sse("delta", { text: "est documenté dans Medical RAG." }),
        sse("sources", {
          sources: [
            {
              id: "project:medical-rag-platform:fact:stack:1",
              entityId: "medical-rag-platform",
              type: "project",
              label: "Medical RAG Platform",
              score: 1,
            },
          ],
        }),
        sse("done", { uncertainty: "none" }),
      ]),
      {
        headers: { "Content-Type": "text/event-stream; charset=utf-8" },
        status: 200,
      },
    );
  };

  await streamPortfolioAIResponse(
    {
      message: "A-t-il utilisé Qdrant ?",
      locale: "fr",
      history: [{ role: "user", content: "Quels projets utilisent du RAG ?" }],
    },
    {
      fetcher,
      onMeta: (data) => events.push({ event: "meta", data }),
      onDelta: (data) => events.push({ event: "delta", data }),
      onSources: (data) => events.push({ event: "sources", data }),
      onDone: (data) => events.push({ event: "done", data }),
    },
  );

  assert.equal(requestedUrl, PORTFOLIO_AI_STREAM_ENDPOINT);
  assert.equal(requestedInit?.method, "POST");
  assert.equal(
    (requestedInit?.headers as Record<string, string>)["Accept"],
    "text/event-stream",
  );
  assert.equal(
    JSON.parse(String(requestedInit?.body)).history.length,
    1,
  );
  assert.deepEqual(events.map((event) => event.event), [
    "meta",
    "delta",
    "delta",
    "sources",
    "done",
  ]);
  assert.equal(
    events
      .filter((event) => event.event === "delta")
      .map((event) => event.data.text)
      .join(""),
    answer,
  );
  assert.equal(
    events.find((event) => event.event === "sources")?.data.sources[0]?.label,
    "Medical RAG Platform",
  );
});

test("SSE parser handles partial byte and event boundaries", () => {
  const events: PortfolioAIStreamEvent[] = [];
  const parser = createPortfolioAISSEParser((event) => events.push(event));

  parser.feed("event: meta\ndata: {\"request");
  parser.feed("Id\":\"pai_split\",\"language\":\"fr\"}\n\n");
  parser.feed("event: delta\ndata: {\"text\":\"Bon");
  parser.feed("jour\"}\n\nevent: done\ndata: {\"uncertainty\":\"none\"}");
  parser.flush();

  assert.deepEqual(events.map((event) => event.event), [
    "meta",
    "delta",
    "done",
  ]);
  assert.equal(events[1]?.event === "delta" ? events[1].data.text : "", "Bonjour");
});

test("source rendering exposes labels and types, not evidence ids", () => {
  const content = portfolioContentByLocale.fr.aiConsole;
  const markup = renderToStaticMarkup(
    createElement(PortfolioAISources, {
      content,
      sources: [
        {
          id: "project:medical-rag-platform:fact:stack:1",
          entityId: "medical-rag-platform",
          type: "project",
          label: "Medical RAG Platform",
        },
      ],
    }),
  );

  assert.match(markup, /Projet/);
  assert.match(markup, /Medical RAG Platform/);
  assert.doesNotMatch(markup, /project:medical-rag-platform:fact:stack:1/);
  assert.doesNotMatch(markup, /medical-rag-platform/);
});

test("HTTP RATE_LIMITED error remains public and retryable", async () => {
  const fetcher: typeof fetch = async () =>
    new Response(
      JSON.stringify({
        requestId: "pai_rate",
        error: {
          code: "RATE_LIMITED",
          message: "Too many internal requests.",
          retryable: true,
          retryAfterSeconds: 14,
        },
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 429,
      },
    );
  const error = await expectClientError(() =>
    streamPortfolioAIResponse(
      { message: "Bonjour", locale: "fr" },
      { fetcher },
    ),
  );

  assert.equal(error.code, "RATE_LIMITED");
  assert.equal(error.retryable, true);
  assert.equal(error.retryAfterSeconds, 14);
});

test("frontend error copy maps provider availability without raw internals", () => {
  const content = portfolioContentByLocale.fr.aiConsole;

  assert.equal(
    getPortfolioAIErrorDisplayMessage(content, {
      code: "AI_TEMPORARILY_UNAVAILABLE",
      message: "Gemini RESOURCE_EXHAUSTED raw",
      retryable: true,
    }),
    "Le service IA est momentanément indisponible. Réessayez un peu plus tard.",
  );
  assert.equal(
    getPortfolioAIErrorDisplayMessage(content, {
      code: "AI_TIMEOUT",
      message: "deadline raw",
      retryable: true,
    }),
    "La réponse prend plus de temps que prévu. Vous pouvez réessayer.",
  );
  assert.equal(
    getPortfolioAIErrorDisplayMessage(content, {
      code: "AI_RESPONSE_INVALID",
      message: "schema raw",
      retryable: true,
    }),
    "Je n'ai pas pu produire une réponse suffisamment fiable. Essayez de reformuler votre question.",
  );
});

test("network failure is sanitized and does not retry automatically", async () => {
  let fetchCount = 0;
  const fetcher: typeof fetch = async () => {
    fetchCount += 1;
    throw new Error("Gemini RESOURCE_EXHAUSTED raw provider detail");
  };
  const error = await expectClientError(() =>
    streamPortfolioAIResponse(
      { message: "Bonjour", locale: "fr" },
      { fetcher },
    ),
  );

  assert.equal(fetchCount, 1);
  assert.equal(error.code, "NETWORK_ERROR");
  assert.equal(error.message.includes("Gemini"), false);
  assert.equal(error.message.includes("RESOURCE_EXHAUSTED"), false);
});

test("history is bounded to recent successful user and assistant messages only", () => {
  const messages: PortfolioAIConversationMessage[] = Array.from(
    { length: 8 },
    (_, index) => ({
      id: `msg_${index}`,
      role: index % 2 === 0 ? "user" : "assistant",
      content: `message ${index}`,
      status: "success",
      sources:
        index === 5
          ? [
              {
                id: "secret:evidence",
                entityId: "secret-entity",
                type: "project",
                label: "Secret",
              },
            ]
          : undefined,
    }),
  );

  messages.push({
    id: "msg_error",
    role: "assistant",
    content: "failed message",
    status: "error",
  });

  const history = buildBoundedPortfolioAIHistory(messages);

  assert.equal(history.length, 6);
  assert.equal(history[0]?.content, "message 2");
  assert.equal(history.at(-1)?.content, "message 7");
  assert.equal(JSON.stringify(history).includes("secret:evidence"), false);
  assert.equal(JSON.stringify(history).includes("failed message"), false);
});

test("stream client forwards AbortSignal to fetch", async () => {
  const controller = new AbortController();
  let forwardedSignal: AbortSignal | undefined;
  const fetcher: typeof fetch = async (_input, init) => {
    forwardedSignal = init?.signal ?? undefined;

    return new Response(
      streamFromChunks([
        sse("meta", { requestId: "pai_abort", language: "fr" }),
        sse("done", { uncertainty: "none" }),
      ]),
      { status: 200 },
    );
  };

  await streamPortfolioAIResponse(
    { message: "Bonjour", locale: "fr" },
    { fetcher, signal: controller.signal },
  );

  assert.equal(forwardedSignal, controller.signal);
});

test("open console renders as modal and reduced motion omits panel animation", () => {
  const content = portfolioContentByLocale.en.aiConsole;
  const markup = renderToStaticMarkup(
    createElement(PortfolioAIConsole, {
      open: true,
      locale: "en",
      content,
      reduceMotion: true,
      onClose: () => {},
    }),
  );

  assert.match(markup, /role="dialog"/);
  assert.match(markup, /aria-modal="true"/);
  assert.match(markup, /Ask a question about the portfolio/);
  assert.doesNotMatch(markup, /portfolio-ai-console-in/);
});

test("closed console renders nothing", () => {
  const markup = renderToStaticMarkup(
    createElement(PortfolioAIConsole, {
      open: false,
      locale: "fr",
      content: portfolioContentByLocale.fr.aiConsole,
      reduceMotion: false,
      onClose: () => {},
    }),
  );

  assert.equal(markup, "");
});
