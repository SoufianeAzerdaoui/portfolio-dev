import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import { createElement, isValidElement } from "react";
import type { ComponentType, ReactElement, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { HeroActions } from "@/components/home/hero-actions";
import { PreferencesProvider } from "@/components/providers/preferences-provider";
import {
  ProjectCard,
  getProjectAnchorId,
} from "@/components/projects/project-card";
import { resolveProjectHashTarget } from "@/components/projects/projects-explorer";
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
import {
  PortfolioAIConsole,
  restorePortfolioAIConsoleMobileMode,
  togglePortfolioAIConsoleExpandedMode,
  togglePortfolioAIConsoleMinimizedMode,
} from "@/features/portfolio-ai/components/portfolio-ai-console";
import { PortfolioAIComposer } from "@/features/portfolio-ai/components/portfolio-ai-composer";
import { PortfolioAIConversation } from "@/features/portfolio-ai/components/portfolio-ai-conversation";
import { PortfolioAIEmptyState } from "@/features/portfolio-ai/components/portfolio-ai-empty-state";
import { PortfolioAIHeader } from "@/features/portfolio-ai/components/portfolio-ai-header";
import {
  PortfolioAISources,
  getPortfolioAIProjectSourceHref,
} from "@/features/portfolio-ai/components/portfolio-ai-sources";
import type { Project } from "@/types/project";

const TestPreferencesProvider = PreferencesProvider as ComponentType<{
  children?: ReactNode;
  initialLocale?: "fr" | "en";
}>;

type TestReactElement = ReactElement<Record<string, unknown>>;

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

function findElements(
  node: ReactNode,
  predicate: (element: TestReactElement) => boolean,
): TestReactElement[] {
  if (node === null || node === undefined || typeof node === "boolean") {
    return [];
  }

  if (Array.isArray(node)) {
    return node.flatMap((child) => findElements(child, predicate));
  }

  if (!isValidElement(node)) {
    return [];
  }

  const element = node as TestReactElement;
  const children = element.props.children as ReactNode;
  const matches = predicate(element) ? [element] : [];

  return matches.concat(findElements(children, predicate));
}

const medicalProjectFixture = {
  id: "medical-rag-platform",
  slug: "medical-rag-platform",
  status: "published",
  type: "academic",
  domain: "ai-ml",
  content: {
    fr: {
      title: "Plateforme intelligente RAG",
      shortDescription: "Plateforme RAG avec Qdrant.",
    },
    en: {
      title: "Medical RAG Platform",
      shortDescription: "RAG platform with Qdrant.",
    },
  },
  categories: [{ id: "rag", slug: "rag", name: "RAG" }],
  technologies: [{ id: "qdrant", slug: "qdrant", name: "Qdrant" }],
  coverImage: null,
  gallery: [],
  links: [],
  year: 2026,
  featured: true,
  featuredOrder: 1,
  publishedAt: "2026-01-01",
} satisfies Project;

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

test("Portfolio AI header uses approved quiet mark and macOS controls", () => {
  const content = portfolioContentByLocale.fr.aiConsole;
  const markup = renderToStaticMarkup(
    createElement(PortfolioAIHeader, {
      content,
      mode: "normal",
      isActive: false,
      onClose: () => {},
      onToggleMinimized: () => {},
      onToggleExpanded: () => {},
    }),
  );

  assert.match(markup, /SA/);
  assert.match(markup, /PORTFOLIO_AI/);
  assert.match(markup, /FR/);
  assert.match(markup, /portfolio-ai-window-control-red/);
  assert.match(markup, /portfolio-ai-window-control-yellow/);
  assert.match(markup, /portfolio-ai-window-control-green/);
  assert.match(markup, /aria-label="Fermer Portfolio AI"/);
  assert.match(markup, /aria-label="Réduire Portfolio AI"/);
  assert.doesNotMatch(markup, /GROUNDED/);
  assert.doesNotMatch(markup, /Données vérifiées/);
});

test("Portfolio AI window controls dispatch close, minimize, and expand actions", () => {
  const content = portfolioContentByLocale.en.aiConsole;
  let closeCount = 0;
  let minimizeCount = 0;
  let expandCount = 0;
  const tree = PortfolioAIHeader({
    content,
    mode: "normal",
    isActive: false,
    onClose: () => {
      closeCount += 1;
    },
    onToggleMinimized: () => {
      minimizeCount += 1;
    },
    onToggleExpanded: () => {
      expandCount += 1;
    },
  });

  const closeControl = findElements(
    tree,
    (element) => element.props["aria-label"] === "Close Portfolio AI",
  )[0];
  const expandControl = findElements(
    tree,
    (element) => element.props["aria-label"] === "Expand Portfolio AI",
  )[0];
  const minimizeControl = findElements(
    tree,
    (element) => element.props["aria-label"] === "Minimize Portfolio AI",
  )[0];

  const closeOnClick = closeControl?.props.onClick;
  const minimizeOnClick = minimizeControl?.props.onClick;
  const expandOnClick = expandControl?.props.onClick;

  assert.equal(typeof closeOnClick, "function");
  assert.equal(typeof minimizeOnClick, "function");
  assert.equal(typeof expandOnClick, "function");

  if (typeof closeOnClick === "function") {
    closeOnClick();
  }

  if (typeof minimizeOnClick === "function") {
    minimizeOnClick();
  }

  if (typeof expandOnClick === "function") {
    expandOnClick();
  }

  assert.equal(closeCount, 1);
  assert.equal(minimizeCount, 1);
  assert.equal(expandCount, 1);
});

test("Portfolio AI yellow control minimizes and restores without conflicting with green", () => {
  const fromNormal = togglePortfolioAIConsoleMinimizedMode({
    mode: "normal",
    restoreMode: "normal",
  });
  const restoredNormal = togglePortfolioAIConsoleMinimizedMode(fromNormal);
  const fromExpanded = togglePortfolioAIConsoleMinimizedMode({
    mode: "expanded",
    restoreMode: "expanded",
  });
  const restoredExpanded = togglePortfolioAIConsoleMinimizedMode(fromExpanded);
  const greenFromMinimized = togglePortfolioAIConsoleExpandedMode(fromNormal);

  assert.deepEqual(fromNormal, { mode: "minimized", restoreMode: "normal" });
  assert.deepEqual(restoredNormal, { mode: "normal", restoreMode: "normal" });
  assert.deepEqual(fromExpanded, { mode: "minimized", restoreMode: "expanded" });
  assert.deepEqual(restoredExpanded, {
    mode: "expanded",
    restoreMode: "expanded",
  });
  assert.deepEqual(greenFromMinimized, {
    mode: "expanded",
    restoreMode: "expanded",
  });
  assert.deepEqual(restorePortfolioAIConsoleMobileMode(fromNormal), {
    mode: "normal",
    restoreMode: "normal",
  });
});

test("Portfolio AI minimized header is keyboard accessible and shows request state", () => {
  const content = portfolioContentByLocale.fr.aiConsole;
  const markup = renderToStaticMarkup(
    createElement(PortfolioAIHeader, {
      content,
      mode: "minimized",
      isActive: true,
      onClose: () => {},
      onToggleMinimized: () => {},
      onToggleExpanded: () => {},
    }),
  );

  assert.match(markup, /Conversation en cours/);
  assert.match(markup, /aria-label="Restaurer Portfolio AI"/);
  assert.match(markup, /aria-label="Fermer Portfolio AI"/);
  assert.match(markup, /aria-label="Agrandir Portfolio AI"/);
  assert.match(markup, /portfolio-ai-window-control-yellow/);
  assert.doesNotMatch(markup, /portfolio-ai-window-control-mobile-hidden/);
});

test("Portfolio AI minimize is non-destructive while close still aborts", () => {
  const source = fs.readFileSync(
    "src/features/portfolio-ai/components/portfolio-ai-console.tsx",
    "utf8",
  );
  const closeHandler = source.match(/const close = useCallback\(\(\) => \{[\s\S]*?\}, \[abort, onClose\]\);/)?.[0] ?? "";
  const minimizeHandler =
    source.match(/const toggleMinimized = useCallback\(\(\) => \{[\s\S]*?\}, \[\]\);/)?.[0] ?? "";

  assert.match(closeHandler, /abort\(\);/);
  assert.match(closeHandler, /onClose\(\);/);
  assert.match(minimizeHandler, /setModeState\(togglePortfolioAIConsoleMinimizedMode\);/);
  assert.doesNotMatch(minimizeHandler, /abort\(/);
  assert.doesNotMatch(minimizeHandler, /reset\(/);
  assert.doesNotMatch(minimizeHandler, /setDraft\(/);
});

test("Portfolio AI empty state renders approved localized copy and suggestions", () => {
  const content = portfolioContentByLocale.fr.aiConsole;
  const frMarkup = renderToStaticMarkup(
    createElement(PortfolioAIEmptyState, {
      content,
      disabled: false,
      onSuggestion: () => {},
    }),
  );
  const enMarkup = renderToStaticMarkup(
    createElement(PortfolioAIEmptyState, {
      content: portfolioContentByLocale.en.aiConsole,
      disabled: false,
      onSuggestion: () => {},
    }),
  );

  assert.match(frMarkup, /INTERROGER LE PORTFOLIO/);
  assert.match(frMarkup, /Interrogez mon portfolio/);
  assert.match(frMarkup, /Parcours, projets, compétences/);
  assert.match(frMarkup, /Quels sont ses projets les plus pertinents en IA/);
  assert.match(frMarkup, /Quelle est son expérience avec le RAG/);
  assert.match(enMarkup, /ASK THE PORTFOLIO/);
  assert.match(enMarkup, /Ask my portfolio/);
  assert.match(enMarkup, /Experience, projects, skills/);
  assert.doesNotMatch(frMarkup, /Posez une question sur mon parcours, mes projets ou mes compétences/);
});

test("suggestion rows retain click behavior and editorial hover rail", () => {
  const content = portfolioContentByLocale.fr.aiConsole;
  let selected = "";
  const tree = PortfolioAIEmptyState({
    content,
    disabled: false,
    onSuggestion: (question) => {
      selected = question;
    },
  });
  const suggestionControls = findElements(
    tree,
    (element) => element.type === "button",
  );
  const firstControl = suggestionControls[0];

  assert.equal(suggestionControls.length, content.suggestions.length);
  assert.match(String(firstControl?.props.className), /hover:bg-\[rgba\(97,85,185,0\.045\)\]/);
  assert.match(renderToStaticMarkup(tree), /left-0 top-4 w-px bg-\[#8B80D9\]/);

  const firstOnClick = firstControl?.props.onClick;

  if (typeof firstOnClick === "function") {
    firstOnClick();
  }

  assert.equal(selected, content.suggestions[0]);
});

test("composer uses approved prompt prefix and directional send glyph", () => {
  const content = portfolioContentByLocale.en.aiConsole;
  const markup = renderToStaticMarkup(
    createElement(PortfolioAIComposer, {
      content,
      value: "What did he build with RAG?",
      disabled: false,
      inputRef: { current: null },
      onChange: () => {},
      onSubmit: () => {},
    }),
  );

  assert.match(markup, /›/);
  assert.match(markup, /→/);
  assert.match(markup, /Ask a question about the portfolio/);
  assert.doesNotMatch(markup, /paper/i);
  assert.doesNotMatch(markup, /plane/i);
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
  const projectSource = {
    id: "project:medical-rag-platform:fact:stack:1",
    entityId: "medical-rag-platform",
    type: "project",
    label: "Medical RAG Platform",
  };
  const markup = renderToStaticMarkup(
    createElement(PortfolioAISources, {
      content,
      sources: [projectSource],
    }),
  );

  assert.match(markup, /SOURCES/);
  assert.match(markup, /Projet/);
  assert.match(markup, /Medical RAG Platform/);
  assert.match(markup, /VOIR LE PROJET/);
  assert.match(markup, /href="\/projects#medical-rag-platform"/);
  assert.doesNotMatch(markup, /project:medical-rag-platform:fact:stack:1/);
  assert.equal(
    getPortfolioAIProjectSourceHref(projectSource),
    "/projects#medical-rag-platform",
  );
});

test("project source CTA is localized and remains visible on mobile layout", () => {
  const markup = renderToStaticMarkup(
    createElement(PortfolioAISources, {
      content: portfolioContentByLocale.en.aiConsole,
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

  assert.match(markup, /VIEW PROJECT/);
  assert.match(markup, /grid-cols-1/);
  assert.match(markup, /sm:grid-cols-\[minmax\(0,1fr\)_auto\]/);
  assert.match(markup, /inline-flex[^"]*justify-self-start[^"]*"[^>]*><span[^>]*>VIEW PROJECT/);
});

test("non-project source remains non-clickable", () => {
  const content = portfolioContentByLocale.en.aiConsole;
  const markup = renderToStaticMarkup(
    createElement(PortfolioAISources, {
      content,
      sources: [
        {
          id: "education:education-isima-siad-2026:programme",
          entityId: "education-isima-siad-2026",
          type: "education",
          label: "ISIMA - SIAD",
        },
      ],
    }),
  );

  assert.match(markup, /Education/);
  assert.match(markup, /ISIMA - SIAD/);
  assert.doesNotMatch(markup, /VIEW PROJECT/);
  assert.doesNotMatch(markup, /VOIR LE PROJET/);
  assert.doesNotMatch(markup, /href=/);
  assert.doesNotMatch(markup, /education:education-isima-siad-2026:programme/);
});

test("project source URL uses canonical project entity id", () => {
  assert.equal(
    getPortfolioAIProjectSourceHref({
      id: "project:medical-rag-platform:fact:stack:1",
      entityId: medicalProjectFixture.id,
      type: "project",
      label: "Medical RAG Platform",
    }),
    "/projects#medical-rag-platform",
  );
});

test("project cards expose stable ids and temporary Portfolio AI target cue", () => {
  const markup = renderToStaticMarkup(
    createElement(ProjectCard, {
      project: medicalProjectFixture,
      view: "grid",
      locale: "fr",
      highlighted: true,
    }),
  );

  assert.equal(getProjectAnchorId(medicalProjectFixture), "medical-rag-platform");
  assert.match(markup, /id="medical-rag-platform"/);
  assert.match(markup, /data-project-id="medical-rag-platform"/);
  assert.match(markup, /data-portfolio-ai-highlighted="true"/);
  assert.match(markup, /portfolio-ai-project-target-active/);
  assert.match(markup, /scroll-mt-24/);
});

test("project hash navigation resolves known canonical targets only", () => {
  const knownProjectIds = new Set([medicalProjectFixture.id]);

  assert.equal(
    resolveProjectHashTarget("#medical-rag-platform", knownProjectIds),
    "medical-rag-platform",
  );
  assert.equal(
    resolveProjectHashTarget(
      `#${encodeURIComponent(medicalProjectFixture.id)}`,
      knownProjectIds,
    ),
    "medical-rag-platform",
  );
  assert.equal(resolveProjectHashTarget("#unknown-project", knownProjectIds), null);
  assert.equal(resolveProjectHashTarget("", knownProjectIds), null);
});

test("project target cue has reduced-motion-safe CSS", () => {
  const css = fs.readFileSync("src/app/globals.css", "utf8");

  assert.match(css, /\.portfolio-ai-project-target-active/);
  assert.match(css, /background: rgba\(97, 85, 185, 0\.055\)/);
  assert.match(css, /html\[data-motion="reduce"\] \.portfolio-ai-project-target/);
  assert.match(css, /animation: none/);
});

test("conversation scroll area reserves composer clearance for final sources", () => {
  const content = portfolioContentByLocale.fr.aiConsole;
  const markup = renderToStaticMarkup(
    createElement(PortfolioAIConversation, {
      content,
      messages: [
        {
          id: "msg_user",
          role: "user",
          content: "Quels sont ses projets IA ?",
          status: "success",
        },
        {
          id: "msg_assistant",
          role: "assistant",
          content: "Voici les projets IA documentés.",
          status: "success",
          sources: [
            {
              id: "source_medical",
              entityId: "medical-rag-platform",
              type: "project",
              label: "Medical RAG Platform",
            },
            {
              id: "source_recommendation",
              entityId: "personalized-recommendation-system",
              type: "project",
              label: "Personalized Recommendation System",
            },
          ],
        },
      ],
      status: "success",
      isActive: false,
      onSuggestion: () => {},
      onRetry: () => {},
    }),
  );

  assert.match(markup, /scroll-pb-\[var\(--portfolio-ai-composer-clearance\)\]/);
  assert.match(markup, /pb-\[var\(--portfolio-ai-composer-clearance\)\]/);
  assert.match(markup, /Personalized Recommendation System/);
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
  assert.equal(
    getPortfolioAIErrorDisplayMessage(content, {
      code: "AI_UNAVAILABLE",
      message: "credential raw",
      retryable: false,
    }),
    "Portfolio AI est momentanément indisponible.",
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

test("aborted stream does not dispatch a stale client error", async () => {
  let onErrorCalled = false;
  let abortThrown = false;
  const abortError = Object.assign(new Error("The operation was aborted."), {
    name: "AbortError",
  });
  const fetcher: typeof fetch = async () => {
    throw abortError;
  };

  try {
    await streamPortfolioAIResponse(
      { message: "Bonjour", locale: "fr" },
      {
        fetcher,
        onError: () => {
          onErrorCalled = true;
        },
      },
    );
  } catch (error) {
    abortThrown = true;
    assert.equal(error, abortError);
  }

  assert.equal(abortThrown, true);
  assert.equal(onErrorCalled, false);
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
  assert.match(markup, /--portfolio-ai-composer-clearance/);
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
