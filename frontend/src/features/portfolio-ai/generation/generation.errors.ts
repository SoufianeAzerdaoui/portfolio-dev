export class GenerationConfigurationError extends Error {
  constructor(message = "Portfolio AI generation is not configured.") {
    super(message);
    this.name = "GenerationConfigurationError";
  }
}

export class GenerationProviderError extends Error {
  constructor(message = "Portfolio AI provider generation failed.") {
    super(message);
    this.name = "GenerationProviderError";
  }
}

export class GenerationTimeoutError extends Error {
  constructor(message = "Portfolio AI generation timed out.") {
    super(message);
    this.name = "GenerationTimeoutError";
  }
}

export class GenerationRateLimitError extends Error {
  constructor(message = "Portfolio AI generation rate limit was reached.") {
    super(message);
    this.name = "GenerationRateLimitError";
  }
}

export class GenerationInvalidOutputError extends Error {
  constructor(message = "Portfolio AI provider returned invalid output.") {
    super(message);
    this.name = "GenerationInvalidOutputError";
  }
}

export class GenerationGroundingError extends Error {
  constructor(message = "Portfolio AI answer failed grounding validation.") {
    super(message);
    this.name = "GenerationGroundingError";
  }
}

function hasStatusCode(error: unknown, statusCode: number) {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const candidate = error as {
    status?: unknown;
    code?: unknown;
    statusCode?: unknown;
  };

  return [candidate.status, candidate.code, candidate.statusCode].some(
    (value) => value === statusCode || value === String(statusCode),
  );
}

function errorText(error: unknown) {
  if (error instanceof Error) {
    return `${error.name} ${error.message}`;
  }

  return String(error);
}

export function normalizeGenerationError(error: unknown): Error {
  if (
    error instanceof GenerationConfigurationError ||
    error instanceof GenerationProviderError ||
    error instanceof GenerationTimeoutError ||
    error instanceof GenerationRateLimitError ||
    error instanceof GenerationInvalidOutputError ||
    error instanceof GenerationGroundingError
  ) {
    return error;
  }

  const text = errorText(error).toLowerCase();

  if (
    hasStatusCode(error, 401) ||
    hasStatusCode(error, 403) ||
    text.includes("api key") ||
    text.includes("apikey") ||
    text.includes("unauthorized") ||
    text.includes("permission denied") ||
    text.includes("forbidden")
  ) {
    return new GenerationConfigurationError(
      "Gemini API authentication is not configured correctly.",
    );
  }

  if (
    hasStatusCode(error, 429) ||
    text.includes("quota") ||
    text.includes("rate limit") ||
    text.includes("resource_exhausted")
  ) {
    return new GenerationRateLimitError();
  }

  if (
    text.includes("abort") ||
    text.includes("timeout") ||
    text.includes("deadline")
  ) {
    return new GenerationTimeoutError();
  }

  return new GenerationProviderError();
}

export function isRetryableGenerationError(error: unknown) {
  const normalized = normalizeGenerationError(error);

  return (
    normalized instanceof GenerationProviderError ||
    normalized instanceof GenerationTimeoutError ||
    normalized instanceof GenerationInvalidOutputError
  );
}
