import { loadEnvConfig } from "@next/env";

const question = "A-t-il utilisé Qdrant ?";

function sanitizeError(error: unknown) {
  if (error instanceof Error) {
    return {
      type: error.name,
      reason: error.name,
      message: error.message,
    };
  }

  return {
    type: "UnknownError",
    reason: "UnknownError",
    message: "Unknown error",
  };
}

async function main() {
  const envLoadResult = loadEnvConfig(process.cwd());
  const { DEFAULT_PORTFOLIO_AI_MODEL } = await import(
    "@/features/portfolio-ai/generation"
  );
  const model = process.env.PORTFOLIO_AI_MODEL ?? DEFAULT_PORTFOLIO_AI_MODEL;
  const credentialDetected = process.env.GEMINI_API_KEY?.trim() ? "YES" : "NO";
  const environmentLoaded =
    envLoadResult.loadedEnvFiles.length > 0 || credentialDetected === "YES"
      ? "PASS"
      : "FAIL";

  console.log(`GEMINI_API_KEY detected: ${credentialDetected}`);
  console.log(`PORTFOLIO_AI_MODEL: ${model}`);

  if (!process.env.GEMINI_API_KEY?.trim()) {
    console.log(
      JSON.stringify(
        {
          environmentLoaded,
          geminiCredentialDetected: credentialDetected,
          model,
          provider: "failure",
          retrievalEntityIds: [],
          finalAnswer: null,
          uncertainty: null,
          usedEvidenceIds: [],
          groundingValidation: "FAIL",
          latencyMs: 0,
          tokenUsage: null,
          sanitizedError: {
            type: "GenerationConfigurationError",
            reason: "MissingCredential",
            message: "GEMINI_API_KEY is unavailable.",
          },
        },
        null,
        2,
      ),
    );
    process.exitCode = 1;
    return;
  }

  const { retrievePortfolioKnowledge } = await import(
    "@/features/portfolio-ai/retrieval"
  );
  const { generatePortfolioAnswer } = await import(
    "@/features/portfolio-ai/generation"
  );
  const retrieval = retrievePortfolioKnowledge(question, {
    locale: "fr",
    topK: 5,
  });

  try {
    const result = await generatePortfolioAnswer({
      question,
      locale: "fr",
      retrieval,
    });

    console.log(
      JSON.stringify(
        {
          environmentLoaded,
          geminiCredentialDetected: credentialDetected,
          model: result.metadata.model,
          provider: result.metadata.provider,
          providerSuccess: true,
          retrievalEntityIds: retrieval.results.map((group) => group.entity.id),
          finalAnswer: result.answer.answer,
          uncertainty: result.answer.uncertainty,
          usedEvidenceIds: result.answer.usedEvidenceIds,
          groundingValidation: "PASS",
          latencyMs: result.metadata.latencyMs,
          tokenUsage: result.metadata.usage ?? null,
          sanitizedError: null,
          smoke: "SMOKE PASS",
        },
        null,
        2,
      ),
    );
  } catch (error: unknown) {
    console.log(
      JSON.stringify(
        {
          environmentLoaded,
          geminiCredentialDetected: credentialDetected,
          model,
          provider: "failure",
          providerSuccess: false,
          retrievalEntityIds: retrieval.results.map((group) => group.entity.id),
          finalAnswer: null,
          uncertainty: null,
          usedEvidenceIds: [],
          groundingValidation: "FAIL",
          latencyMs: 0,
          tokenUsage: null,
          sanitizedError: sanitizeError(error),
        },
        null,
        2,
      ),
    );
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(JSON.stringify({ sanitizedError: sanitizeError(error) }, null, 2));
  process.exitCode = 1;
});
