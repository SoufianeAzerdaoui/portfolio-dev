import type { PortfolioAIClientErrorPayload } from "@/features/portfolio-ai/client/portfolio-ai-client";
import type {
  PortfolioAIConsoleContent,
  PortfolioAIConsolePublicErrorCode,
} from "@/types/portfolio";

export function getPortfolioAIErrorDisplayMessage(
  content: PortfolioAIConsoleContent,
  error: PortfolioAIClientErrorPayload,
) {
  const code = error.code as PortfolioAIConsolePublicErrorCode;
  const message =
    content.errorMessages[code] ??
    content.errorMessages.NETWORK_ERROR;

  if (
    error.code === "RATE_LIMITED" &&
    typeof error.retryAfterSeconds === "number"
  ) {
    return `${message} ${error.retryAfterSeconds} ${content.retryAfterSuffix}.`;
  }

  return message;
}

export function getPortfolioAISourceTypeLabel(
  content: PortfolioAIConsoleContent,
  type: string,
) {
  return (
    content.sourceTypeLabels[type] ??
    content.sourceTypeLabels.default ??
    "Source"
  );
}
