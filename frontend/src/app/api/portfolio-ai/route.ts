import { NextResponse } from "next/server";

import {
  createPortfolioAIRequestId,
  handlePortfolioAIRequest,
} from "@/features/portfolio-ai/api/portfolio-ai-api";
import { getPortfolioAIClientRateLimitKey } from "@/features/portfolio-ai/api/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      {
        requestId: createPortfolioAIRequestId(),
        error: {
          code: "INVALID_REQUEST",
          message: "Request body must be valid JSON.",
          retryable: false,
        },
      },
      { status: 400 },
    );
  }

  const result = await handlePortfolioAIRequest(payload, {
    clientKey: getPortfolioAIClientRateLimitKey(request),
  });

  return NextResponse.json(result.body, { status: result.status });
}
