import type { LocaleCode } from "@/types/portfolio";

export const PORTFOLIO_AI_STREAM_ENDPOINT = "/api/portfolio-ai/stream";

export const PORTFOLIO_AI_CLIENT_MAX_MESSAGE_LENGTH = 2_000;
export const PORTFOLIO_AI_CLIENT_MAX_HISTORY_MESSAGES = 6;
export const PORTFOLIO_AI_CLIENT_MAX_HISTORY_MESSAGE_LENGTH = 1_500;
export const PORTFOLIO_AI_CLIENT_MAX_HISTORY_TOTAL_LENGTH = 6_000;

export type PortfolioAIHistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

export type PortfolioAIRequestPayload = {
  message: string;
  locale?: LocaleCode;
  history?: PortfolioAIHistoryMessage[];
};

export type PublicPortfolioAISource = {
  id: string;
  entityId: string;
  type: string;
  label: string;
};

export type PortfolioAIBackendErrorCode =
  | "INVALID_REQUEST"
  | "RATE_LIMITED"
  | "AI_TEMPORARILY_UNAVAILABLE"
  | "AI_TIMEOUT"
  | "AI_UNAVAILABLE"
  | "AI_RESPONSE_INVALID"
  | "AI_PROVIDER_ERROR";

export type PortfolioAIClientErrorCode =
  | PortfolioAIBackendErrorCode
  | "NETWORK_ERROR"
  | "STREAM_PROTOCOL_ERROR";

export type PortfolioAIClientErrorPayload = {
  code: PortfolioAIClientErrorCode;
  message: string;
  retryable: boolean;
  requestId?: string;
  retryAfterSeconds?: number;
  status?: number;
};

export type PortfolioAIStreamEvent =
  | {
      event: "meta";
      data: {
        requestId: string;
        language: LocaleCode;
      };
    }
  | {
      event: "delta";
      data: {
        text: string;
      };
    }
  | {
      event: "sources";
      data: {
        sources: PublicPortfolioAISource[];
      };
    }
  | {
      event: "done";
      data: {
        uncertainty: string;
      };
    }
  | {
      event: "error";
      data: PortfolioAIClientErrorPayload;
    };

type PortfolioAIStreamCallbacks = {
  onMeta?: (data: Extract<PortfolioAIStreamEvent, { event: "meta" }>["data"]) => void;
  onDelta?: (data: Extract<PortfolioAIStreamEvent, { event: "delta" }>["data"]) => void;
  onSources?: (
    data: Extract<PortfolioAIStreamEvent, { event: "sources" }>["data"],
  ) => void;
  onDone?: (data: Extract<PortfolioAIStreamEvent, { event: "done" }>["data"]) => void;
  onError?: (error: PortfolioAIClientErrorPayload) => void;
};

type StreamPortfolioAIResponseOptions = PortfolioAIStreamCallbacks & {
  signal?: AbortSignal;
  fetcher?: typeof fetch;
};

type SSEParser = {
  feed: (chunk: string) => void;
  flush: () => void;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(record: Record<string, unknown>, key: string) {
  const value = record[key];

  return typeof value === "string" ? value : undefined;
}

function readBoolean(record: Record<string, unknown>, key: string) {
  const value = record[key];

  return typeof value === "boolean" ? value : undefined;
}

function readNumber(record: Record<string, unknown>, key: string) {
  const value = record[key];

  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function isLocaleCode(value: unknown): value is LocaleCode {
  return value === "fr" || value === "en";
}

function isBackendErrorCode(value: unknown): value is PortfolioAIBackendErrorCode {
  return (
    value === "INVALID_REQUEST" ||
    value === "RATE_LIMITED" ||
    value === "AI_TEMPORARILY_UNAVAILABLE" ||
    value === "AI_TIMEOUT" ||
    value === "AI_UNAVAILABLE" ||
    value === "AI_RESPONSE_INVALID" ||
    value === "AI_PROVIDER_ERROR"
  );
}

function safeMessageForError(code: PortfolioAIClientErrorCode) {
  switch (code) {
    case "INVALID_REQUEST":
      return "Invalid Portfolio AI request.";
    case "RATE_LIMITED":
      return "Too many Portfolio AI requests.";
    case "AI_TIMEOUT":
      return "Portfolio AI timed out.";
    case "AI_RESPONSE_INVALID":
      return "Portfolio AI produced an invalid response.";
    case "NETWORK_ERROR":
      return "Portfolio AI network request failed.";
    case "STREAM_PROTOCOL_ERROR":
      return "Portfolio AI stream could not be parsed.";
    case "AI_UNAVAILABLE":
    case "AI_TEMPORARILY_UNAVAILABLE":
    case "AI_PROVIDER_ERROR":
      return "Portfolio AI is unavailable.";
  }
}

export class PortfolioAIClientError extends Error {
  readonly code: PortfolioAIClientErrorCode;
  readonly retryable: boolean;
  readonly requestId?: string;
  readonly retryAfterSeconds?: number;
  readonly status?: number;

  constructor(payload: PortfolioAIClientErrorPayload) {
    super(safeMessageForError(payload.code));
    this.name = "PortfolioAIClientError";
    this.code = payload.code;
    this.retryable = payload.retryable;
    this.requestId = payload.requestId;
    this.retryAfterSeconds = payload.retryAfterSeconds;
    this.status = payload.status;
  }
}

export function isPortfolioAIAbortError(error: unknown) {
  return (
    isRecord(error) &&
    readString(error, "name") === "AbortError"
  );
}

export function normalizePortfolioAIClientError(
  error: unknown,
): PortfolioAIClientError {
  if (error instanceof PortfolioAIClientError) {
    return error;
  }

  if (isPortfolioAIAbortError(error)) {
    return new PortfolioAIClientError({
      code: "NETWORK_ERROR",
      message: safeMessageForError("NETWORK_ERROR"),
      retryable: true,
    });
  }

  return new PortfolioAIClientError({
    code: "NETWORK_ERROR",
    message: safeMessageForError("NETWORK_ERROR"),
    retryable: true,
  });
}

function parsePublicSource(value: unknown): PublicPortfolioAISource | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = readString(value, "id");
  const entityId = readString(value, "entityId");
  const type = readString(value, "type");
  const label = readString(value, "label");

  if (!id || !entityId || !type || !label) {
    return null;
  }

  return {
    id,
    entityId,
    type,
    label,
  };
}

function parseErrorPayload(
  value: unknown,
  fallbackCode: PortfolioAIClientErrorCode = "STREAM_PROTOCOL_ERROR",
  status?: number,
): PortfolioAIClientErrorPayload {
  if (!isRecord(value)) {
    return {
      code: fallbackCode,
      message: safeMessageForError(fallbackCode),
      retryable: fallbackCode !== "INVALID_REQUEST",
      status,
    };
  }

  const rawCode = readString(value, "code");
  const code: PortfolioAIClientErrorCode = isBackendErrorCode(rawCode)
    ? rawCode
    : fallbackCode;

  return {
    code,
    message: safeMessageForError(code),
    retryable: readBoolean(value, "retryable") ?? code !== "INVALID_REQUEST",
    requestId: readString(value, "requestId"),
    retryAfterSeconds: readNumber(value, "retryAfterSeconds"),
    status,
  };
}

export function decodePortfolioAISSEEvent(
  eventName: string,
  rawData: string,
): PortfolioAIStreamEvent | null {
  let parsed: unknown;

  try {
    parsed = rawData ? (JSON.parse(rawData) as unknown) : {};
  } catch {
    throw new PortfolioAIClientError({
      code: "STREAM_PROTOCOL_ERROR",
      message: safeMessageForError("STREAM_PROTOCOL_ERROR"),
      retryable: true,
    });
  }

  if (!isRecord(parsed)) {
    throw new PortfolioAIClientError({
      code: "STREAM_PROTOCOL_ERROR",
      message: safeMessageForError("STREAM_PROTOCOL_ERROR"),
      retryable: true,
    });
  }

  if (eventName === "meta") {
    const requestId = readString(parsed, "requestId");
    const language = parsed.language;

    if (!requestId || !isLocaleCode(language)) {
      throw new PortfolioAIClientError({
        code: "STREAM_PROTOCOL_ERROR",
        message: safeMessageForError("STREAM_PROTOCOL_ERROR"),
        retryable: true,
      });
    }

    return {
      event: "meta",
      data: {
        requestId,
        language,
      },
    };
  }

  if (eventName === "delta") {
    const text = readString(parsed, "text");

    if (text === undefined) {
      throw new PortfolioAIClientError({
        code: "STREAM_PROTOCOL_ERROR",
        message: safeMessageForError("STREAM_PROTOCOL_ERROR"),
        retryable: true,
      });
    }

    return {
      event: "delta",
      data: { text },
    };
  }

  if (eventName === "sources") {
    const rawSources = Array.isArray(parsed.sources) ? parsed.sources : [];

    return {
      event: "sources",
      data: {
        sources: rawSources
          .map(parsePublicSource)
          .filter((source): source is PublicPortfolioAISource => source !== null),
      },
    };
  }

  if (eventName === "done") {
    const uncertainty = readString(parsed, "uncertainty") ?? "unknown";

    return {
      event: "done",
      data: { uncertainty },
    };
  }

  if (eventName === "error") {
    return {
      event: "error",
      data: parseErrorPayload(parsed),
    };
  }

  return null;
}

function dispatchSSEBlock(
  block: string,
  onEvent: (event: PortfolioAIStreamEvent) => void,
) {
  const lines = block.split("\n");
  let eventName = "message";
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("event:")) {
      eventName = line.slice("event:".length).replace(/^ /, "");
    }

    if (line.startsWith("data:")) {
      dataLines.push(line.slice("data:".length).replace(/^ /, ""));
    }
  }

  const decoded = decodePortfolioAISSEEvent(eventName, dataLines.join("\n"));

  if (decoded) {
    onEvent(decoded);
  }
}

export function createPortfolioAISSEParser(
  onEvent: (event: PortfolioAIStreamEvent) => void,
): SSEParser {
  let buffer = "";

  const drain = () => {
    buffer = buffer.replace(/\r\n/g, "\n");

    let separatorIndex = buffer.indexOf("\n\n");

    while (separatorIndex !== -1) {
      const block = buffer.slice(0, separatorIndex);
      buffer = buffer.slice(separatorIndex + 2);

      if (block.trim()) {
        dispatchSSEBlock(block, onEvent);
      }

      separatorIndex = buffer.indexOf("\n\n");
    }
  };

  return {
    feed(chunk: string) {
      buffer += chunk;
      drain();
    },
    flush() {
      buffer = buffer.replace(/\r\n/g, "\n");

      if (buffer.trim()) {
        dispatchSSEBlock(buffer, onEvent);
      }

      buffer = "";
    },
  };
}

async function parseHTTPError(
  response: Response,
): Promise<PortfolioAIClientError> {
  const status = response.status;

  try {
    const body = (await response.json()) as unknown;

    if (isRecord(body) && isRecord(body.error)) {
      return new PortfolioAIClientError(
        parseErrorPayload(
          {
            requestId: readString(body, "requestId"),
            ...body.error,
          },
          status === 400 ? "INVALID_REQUEST" : "AI_PROVIDER_ERROR",
          status,
        ),
      );
    }
  } catch {
    // Fall through to a stable public client error.
  }

  return new PortfolioAIClientError({
    code: status === 400 ? "INVALID_REQUEST" : "AI_PROVIDER_ERROR",
    message: safeMessageForError(
      status === 400 ? "INVALID_REQUEST" : "AI_PROVIDER_ERROR",
    ),
    retryable: status !== 400,
    status,
  });
}

function dispatchPortfolioAIStreamEvent(
  event: PortfolioAIStreamEvent,
  callbacks: PortfolioAIStreamCallbacks,
) {
  if (event.event === "meta") {
    callbacks.onMeta?.(event.data);
  }

  if (event.event === "delta") {
    callbacks.onDelta?.(event.data);
  }

  if (event.event === "sources") {
    callbacks.onSources?.(event.data);
  }

  if (event.event === "done") {
    callbacks.onDone?.(event.data);
  }

  if (event.event === "error") {
    callbacks.onError?.(event.data);
    throw new PortfolioAIClientError(event.data);
  }
}

export async function streamPortfolioAIResponse(
  payload: PortfolioAIRequestPayload,
  options: StreamPortfolioAIResponseOptions = {},
) {
  const fetcher = options.fetcher ?? fetch;
  let response: Response;

  try {
    response = await fetcher(PORTFOLIO_AI_STREAM_ENDPOINT, {
      method: "POST",
      headers: {
        Accept: "text/event-stream",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: options.signal,
    });
  } catch (error) {
    if (isPortfolioAIAbortError(error)) {
      throw error;
    }

    throw new PortfolioAIClientError({
      code: "NETWORK_ERROR",
      message: safeMessageForError("NETWORK_ERROR"),
      retryable: true,
    });
  }

  if (!response.ok) {
    throw await parseHTTPError(response);
  }

  if (!response.body) {
    throw new PortfolioAIClientError({
      code: "STREAM_PROTOCOL_ERROR",
      message: safeMessageForError("STREAM_PROTOCOL_ERROR"),
      retryable: true,
      status: response.status,
    });
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const parser = createPortfolioAISSEParser((event) => {
    dispatchPortfolioAIStreamEvent(event, options);
  });

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      parser.feed(decoder.decode(value, { stream: true }));
    }

    const finalText = decoder.decode();

    if (finalText) {
      parser.feed(finalText);
    }

    parser.flush();
  } finally {
    reader.releaseLock();
  }
}
