import { loadEnvConfig } from "@next/env";
import type { GroundedContext } from "@/features/portfolio-ai/generation";

function detected(value: string | undefined) {
  return value?.trim() ? "YES" : "NO";
}

function sanitizeRoutedVia(value: string | null) {
  if (!value) {
    return "none";
  }

  return value.replace(/[^a-zA-Z0-9_.:/ -]/g, "").slice(0, 80) || "present";
}

function sanitizeError(error: unknown) {
  if (error instanceof Error) {
    return {
      type: error.name,
      message: error.message,
    };
  }

  return {
    type: "UnknownError",
    message: "Unknown error",
  };
}

async function main() {
  const envLoadResult = loadEnvConfig(process.cwd());
  const {
    FreeLLMAPIPortfolioAIProvider,
    PORTFOLIO_AI_SYSTEM_PROMPT,
    getFreeLLMAPIGenerationConfig,
  } = await import("@/features/portfolio-ai/generation");
  const environmentLoaded =
    envLoadResult.loadedEnvFiles.length > 0 ||
    detected(process.env.FREELLMAPI_API_KEY) === "YES"
      ? "PASS"
      : "FAIL";
  const config = getFreeLLMAPIGenerationConfig();

  console.log(`environment loaded: ${environmentLoaded}`);
  console.log(`FREELLMAPI_ENABLED: ${config.enabled ? "YES" : "NO"}`);
  console.log(
    `FREELLMAPI_API_KEY detected: ${detected(process.env.FREELLMAPI_API_KEY)}`,
  );
  console.log(`FREELLMAPI_MODEL: ${config.model}`);

  if (!config.enabled || !process.env.FREELLMAPI_API_KEY?.trim()) {
    console.log(
      JSON.stringify(
        {
          providerResult: "SKIPPED",
          httpStatus: null,
          routedVia: "none",
          structuredOutputParsed: false,
        },
        null,
        2,
      ),
    );
    return;
  }

  let httpStatus: number | null = null;
  let routedVia: string | null = null;
  const fetcher: typeof fetch = async (input, init) => {
    const response = await fetch(input, init);

    httpStatus = response.status;
    routedVia = response.headers.get("x-routed-via");

    return response;
  };
  const provider = new FreeLLMAPIPortfolioAIProvider(config, fetcher);
  const groundedContext: GroundedContext = {
    intent: "manual_smoke",
    status: "not_documented",
    notDocumented: true,
    entities: [],
    evidence: [],
    policy: {
      verified: "May be stated as a fact.",
      derived: "Use only for classification or framing.",
      ambiguous: "Mention as not sufficiently verified, never as confirmed.",
      notDocumented: "State that the portfolio does not document it.",
    },
  };

  try {
    const result = await provider.generate({
      question: "Reply exactly with OK.",
      locale: "en",
      model: config.model,
      groundedContext,
      allowedEvidenceIds: [],
      systemPrompt: PORTFOLIO_AI_SYSTEM_PROMPT,
      userPrompt: JSON.stringify(
        {
          task: "Return only strict JSON matching the requested output schema.",
          outputSchema: {
            answer: "string",
            usedEvidenceIds: "string[]",
            uncertainty: ["none", "ambiguous", "not-documented"],
            language: ["fr", "en"],
          },
          requiredAnswer: {
            answer: "OK",
            usedEvidenceIds: [],
            uncertainty: "none",
            language: "en",
          },
          userQuestion: "Reply exactly with OK.",
          portfolioData: groundedContext,
        },
        null,
        2,
      ),
    });

    console.log(
      JSON.stringify(
        {
          providerResult: "SUCCESS",
          httpStatus,
          model: result.model,
          routedVia: sanitizeRoutedVia(routedVia),
          structuredOutputParsed: true,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    console.log(
      JSON.stringify(
        {
          providerResult: "FAILURE",
          httpStatus,
          model: config.model,
          routedVia: sanitizeRoutedVia(routedVia),
          structuredOutputParsed: false,
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
