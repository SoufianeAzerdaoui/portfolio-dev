import "server-only";

import {
  createPortfolioAIRequestId,
  acquirePortfolioAIGenerationAccessForTransport,
  generatePublicPortfolioAIResponse,
  mapPortfolioAIErrorToHTTPResult,
  preparePortfolioAIRequest,
  type PortfolioAIHTTPResult,
  type PortfolioAIServiceOptions,
  type PublicPortfolioAIErrorResponse,
  type PublicPortfolioAIResponse,
} from "@/features/portfolio-ai/api/portfolio-ai-api";

type PortfolioAIStreamEventName = "meta" | "delta" | "sources" | "done" | "error";

type PortfolioAIStreamOptions = PortfolioAIServiceOptions & {
  signal?: AbortSignal;
};

type PortfolioAIStreamResult =
  | {
      status: 200;
      response: Response;
    }
  | {
      status: 400 | 429;
      body: PublicPortfolioAIErrorResponse;
    };

const STREAM_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
};

export function encodePortfolioAISSEEvent(
  event: PortfolioAIStreamEventName,
  data: unknown,
) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export function chunkValidatedAnswer(answer: string) {
  const words = answer.match(/\S+\s*/g) ?? [];
  const chunks: string[] = [];
  let current = "";

  for (const word of words) {
    if (current && current.length + word.length > 48) {
      chunks.push(current);
      current = word;
      continue;
    }

    current += word;
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}

function streamPublicError(
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  result: Exclude<PortfolioAIHTTPResult, { status: 200 }>,
) {
  controller.enqueue(
    encoder.encode(
      encodePortfolioAISSEEvent("error", {
        requestId: result.body.requestId,
        ...result.body.error,
      }),
    ),
  );
}

function streamPublicResponse(
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  body: PublicPortfolioAIResponse,
) {
  controller.enqueue(
    encoder.encode(
      encodePortfolioAISSEEvent("meta", {
        requestId: body.requestId,
        language: body.language,
      }),
    ),
  );

  for (const chunk of chunkValidatedAnswer(body.answer)) {
    controller.enqueue(
      encoder.encode(encodePortfolioAISSEEvent("delta", { text: chunk })),
    );
  }

  controller.enqueue(
    encoder.encode(encodePortfolioAISSEEvent("sources", { sources: body.sources })),
  );
  controller.enqueue(
    encoder.encode(
      encodePortfolioAISSEEvent("done", { uncertainty: body.uncertainty }),
    ),
  );
}

export function createPortfolioAIStreamResponse(
  rawPayload: unknown,
  options: PortfolioAIStreamOptions = {},
): PortfolioAIStreamResult {
  const requestId = options.requestId ?? createPortfolioAIRequestId();
  let prepared: ReturnType<typeof preparePortfolioAIRequest>;
  let release = () => {};

  try {
    prepared = preparePortfolioAIRequest(rawPayload);
    release = acquireStreamGenerationAccess(prepared, options);
  } catch (error) {
    const result = mapPortfolioAIErrorToHTTPResult(error, requestId);

    return {
      status: result.status === 429 ? 429 : 400,
      body: result.body as PublicPortfolioAIErrorResponse,
    };
  }

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const close = () => {
        if (!closed) {
          closed = true;
          controller.close();
        }
      };

      if (options.signal?.aborted) {
        close();
        return;
      }

      try {
        const body = await generatePublicPortfolioAIResponse(
          prepared,
          requestId,
          options,
        );

        if (options.signal?.aborted) {
          close();
          return;
        }

        streamPublicResponse(controller, encoder, body);
      } catch (error) {
        if (!options.signal?.aborted) {
          const result = mapPortfolioAIErrorToHTTPResult(error, requestId);
          streamPublicError(
            controller,
            encoder,
            result as Exclude<PortfolioAIHTTPResult, { status: 200 }>,
          );
        }
      } finally {
        release();
        close();
      }
    },
    cancel() {
      release();
      closed = true;
    },
  });

  return {
    status: 200,
    response: new Response(stream, {
      status: 200,
      headers: STREAM_HEADERS,
    }),
  };
}

function acquireStreamGenerationAccess(
  prepared: ReturnType<typeof preparePortfolioAIRequest>,
  options: PortfolioAIStreamOptions,
) {
  return acquirePortfolioAIGenerationAccessForTransport(prepared, options);
}
