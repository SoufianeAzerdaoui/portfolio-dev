import "server-only";

type DebugValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | readonly string[];

export function isPortfolioAIDebugEnabled() {
  return process.env.PORTFOLIO_AI_DEBUG?.trim().toLowerCase() === "true";
}

export function logPortfolioAIDebug(
  event: string,
  payload: Record<string, DebugValue>,
) {
  if (!isPortfolioAIDebugEnabled()) {
    return;
  }

  console.info(
    "[portfolio-ai]",
    JSON.stringify({
      event,
      ...payload,
    }),
  );
}
