import { NextResponse } from "next/server";

import { createPortfolioAIRequestId } from "@/features/portfolio-ai/api/portfolio-ai-api";
import { getPortfolioAIClientRateLimitKey } from "@/features/portfolio-ai/api/rate-limit";
import { createPortfolioAIStreamResponse } from "@/features/portfolio-ai/api/portfolio-ai-stream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = createPortfolioAIRequestId();
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      {
        requestId,
        error: {
          code: "INVALID_REQUEST",
          message: "Request body must be valid JSON.",
          retryable: false,
        },
      },
      { status: 400 },
    );
  }

  const result = createPortfolioAIStreamResponse(payload, {
    requestId,
    clientKey: getPortfolioAIClientRateLimitKey(request),
    signal: request.signal,
  });

  if (result.status !== 200) {
    return NextResponse.json(result.body, { status: result.status });
  }

  return result.response;
}
