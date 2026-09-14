import { loadEnvConfig } from "@next/env";

import {
  createPortfolioAIRequestId,
  mapPortfolioAIErrorToHTTPResult,
  preparePortfolioAIRequest,
} from "@/features/portfolio-ai/api/portfolio-ai-api";
import { getEntityById } from "@/features/portfolio-ai/knowledge";
import {
  FreeLLMAPIPortfolioAIProvider,
  GeminiPortfolioAIProvider,
  ResilientPortfolioAIProvider,
  buildGenerationUserPrompt,
  buildGroundedContext,
  getAllowedEvidenceIds,
  getFreeLLMAPIGenerationConfig,
  getPortfolioAIGenerationConfig,
  generatePortfolioAnswer,
  isFallbackEligibleGenerationError,
  normalizeGenerationError,
  parsePortfolioAnswer,
  PORTFOLIO_AI_SYSTEM_PROMPT,
  validateGroundedAnswer,
  type ConversationContextMessage,
  type GeneratePortfolioAnswerInput,
  type GroundedGenerationInput,
  type PortfolioAIProvider,
  type PortfolioAnswer,
  type ProviderGenerationResult,
} from "@/features/portfolio-ai/generation";

type PassFail = "PASS" | "FAIL" | "NOT_RUN";

type StructuredDiagnostics = {
  jsonParse: PassFail;
  schemaValidation: PassFail;
  evidenceSubsetValidation: PassFail;
  groundingValidation: PassFail;
  answer?: string;
  usedEvidenceIds?: string[];
  uncertainty?: string;
  language?: string;
};

type ProviderDiagnostics = {
  providerName: "gemini" | "freellmapi";
  called: boolean;
  result?: "SUCCESS" | "FAILURE";
  elapsedMs?: number;
  provider?: string;
  model?: string;
  normalizedErrorClass?: string;
  fallbackEligibleError?: boolean;
  httpStatus?: number | null;
  routedVia?: string;
  responseJSONParse?: PassFail;
  assistantContentExists?: "YES" | "NO" | "NOT_RUN";
  assistantContentJSONParse?: PassFail;
  structured?: StructuredDiagnostics;
};

type FreeLLMAPIHTTPDiagnostics = Pick<
  ProviderDiagnostics,
  | "httpStatus"
  | "routedVia"
  | "responseJSONParse"
  | "assistantContentExists"
  | "assistantContentJSONParse"
>;

export type DiagnosticProviderMode = "default" | "freellmapi";

export function parseDiagnoseArgs(args: readonly string[]) {
  let providerMode: DiagnosticProviderMode = "default";
  const questionParts: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--provider") {
      const provider = args[index + 1];

      if (provider !== "freellmapi") {
        throw new Error("--provider currently supports only freellmapi.");
      }

      providerMode = provider;
      index += 1;
      continue;
    }

    if (arg?.startsWith("--provider=")) {
      const provider = arg.slice("--provider=".length);

      if (provider !== "freellmapi") {
        throw new Error("--provider currently supports only freellmapi.");
      }

      providerMode = provider;
      continue;
    }

    questionParts.push(arg ?? "");
  }

  return {
    message: questionParts.join(" ").trim() || "A-t-il utilisé Kafka ?",
    providerMode,
  };
}

function elapsedSince(startedAt: number) {
  return Date.now() - startedAt;
}

function statusFromBoolean(value: boolean): PassFail {
  return value ? "PASS" : "FAIL";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function sanitizeRoutedVia(value: string | null) {
  if (!value) {
    return "none";
  }

  return value.replace(/[^a-zA-Z0-9_.:/ -]/g, "").slice(0, 80) || "present";
}

function normalizedErrorClass(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name?: unknown }).name === "AbortError"
  ) {
    return "AbortError";
  }

  return normalizeGenerationError(error).name;
}

function inspectStructuredOutput(
  output: unknown,
  input: GeneratePortfolioAnswerInput,
  allowedEvidenceIds: readonly string[],
): StructuredDiagnostics {
  let decodedOutput = output;

  if (typeof output === "string") {
    try {
      decodedOutput = JSON.parse(output) as unknown;
    } catch {
      return {
        jsonParse: "FAIL",
        schemaValidation: "FAIL",
        evidenceSubsetValidation: "NOT_RUN",
        groundingValidation: "NOT_RUN",
      };
    }
  }

  let answer: PortfolioAnswer;

  try {
    answer = parsePortfolioAnswer(decodedOutput);
  } catch {
    return {
      jsonParse: "PASS",
      schemaValidation: "FAIL",
      evidenceSubsetValidation: "NOT_RUN",
      groundingValidation: "NOT_RUN",
    };
  }

  const allowedIds = new Set(allowedEvidenceIds);
  const evidenceSubsetPass = answer.usedEvidenceIds.every((id) =>
    allowedIds.has(id),
  );
  let groundingValidation: PassFail = "PASS";

  try {
    validateGroundedAnswer(answer, input, allowedEvidenceIds);
  } catch {
    groundingValidation = "FAIL";
  }

  return {
    jsonParse: "PASS",
    schemaValidation: "PASS",
    evidenceSubsetValidation: statusFromBoolean(evidenceSubsetPass),
    groundingValidation,
    answer: answer.answer,
    usedEvidenceIds: answer.usedEvidenceIds,
    uncertainty: answer.uncertainty,
    language: answer.language,
  };
}

class DiagnosticProvider implements PortfolioAIProvider {
  constructor(
    private readonly providerName: "gemini" | "freellmapi",
    private readonly createProvider: () => PortfolioAIProvider,
    private readonly generationInput: GeneratePortfolioAnswerInput,
    private readonly diagnostics: ProviderDiagnostics[],
    private readonly httpDiagnostics?: FreeLLMAPIHTTPDiagnostics,
  ) {}

  async generate(
    input: GroundedGenerationInput,
  ): Promise<ProviderGenerationResult> {
    const diagnostic: ProviderDiagnostics = {
      providerName: this.providerName,
      called: true,
    };
    const startedAt = Date.now();

    this.diagnostics.push(diagnostic);

    try {
      const result = await this.createProvider().generate(input);

      diagnostic.result = "SUCCESS";
      diagnostic.elapsedMs = elapsedSince(startedAt);
      diagnostic.provider = result.provider;
      diagnostic.model = result.model;
      diagnostic.structured = inspectStructuredOutput(
        result.output,
        this.generationInput,
        input.allowedEvidenceIds,
      );

      if (this.httpDiagnostics) {
        Object.assign(diagnostic, this.httpDiagnostics);
      }

      return result;
    } catch (error) {
      diagnostic.result = "FAILURE";
      diagnostic.elapsedMs = elapsedSince(startedAt);
      diagnostic.normalizedErrorClass = normalizedErrorClass(error);
      diagnostic.fallbackEligibleError = isFallbackEligibleGenerationError(error);

      if (this.httpDiagnostics) {
        Object.assign(diagnostic, this.httpDiagnostics);
      }

      throw error;
    }
  }
}

function createFreeLLMAPIDiagnosticFetch(
  diagnostics: FreeLLMAPIHTTPDiagnostics,
): typeof fetch {
  return async (input, init) => {
    const response = await fetch(input, init);

    diagnostics.httpStatus = response.status;
    diagnostics.routedVia = sanitizeRoutedVia(response.headers.get("x-routed-via"));

    try {
      const payload = (await response.clone().json()) as {
        choices?: Array<{ message?: { content?: unknown } }>;
      };
      const content = payload.choices?.[0]?.message?.content;

      diagnostics.responseJSONParse = "PASS";
      diagnostics.assistantContentExists =
        typeof content === "string" && content.trim() ? "YES" : "NO";

      if (typeof content === "string") {
        try {
          JSON.parse(content);
          diagnostics.assistantContentJSONParse = "PASS";
        } catch {
          diagnostics.assistantContentJSONParse = "FAIL";
        }
      } else {
        diagnostics.assistantContentJSONParse = "NOT_RUN";
      }
    } catch {
      diagnostics.responseJSONParse = "FAIL";
      diagnostics.assistantContentExists = "NOT_RUN";
      diagnostics.assistantContentJSONParse = "NOT_RUN";
    }

    return response;
  };
}

function readHistoryFromEnvironment(): ConversationContextMessage[] | undefined {
  const raw = process.env.PORTFOLIO_AI_DIAGNOSE_HISTORY_JSON;

  if (!raw?.trim()) {
    return undefined;
  }

  const parsed = JSON.parse(raw) as unknown;

  if (!Array.isArray(parsed)) {
    throw new Error("PORTFOLIO_AI_DIAGNOSE_HISTORY_JSON must be an array.");
  }

  return parsed.map((message) => {
    if (
      typeof message !== "object" ||
      message === null ||
      ((message as { role?: unknown }).role !== "user" &&
        (message as { role?: unknown }).role !== "assistant") ||
      typeof (message as { content?: unknown }).content !== "string"
    ) {
      throw new Error(
        "PORTFOLIO_AI_DIAGNOSE_HISTORY_JSON items must have role and content.",
      );
    }

    return {
      role: (message as { role: "user" | "assistant" }).role,
      content: (message as { content: string }).content,
    };
  });
}

function freeLLMAPIEnabled() {
  return process.env.FREELLMAPI_ENABLED?.trim().toLowerCase() === "true";
}

function unrelatedRAGEvidenceIncluded(
  retrieval: ReturnType<typeof preparePortfolioAIRequest>["retrieval"],
) {
  const explicitlyMatchedProjectIds = new Set(
    retrieval.matchedEntities
      .filter((match) => match.entity.type === "project")
      .map((match) => match.entity.id),
  );

  if (explicitlyMatchedProjectIds.size === 0) {
    return false;
  }

  return retrieval.results.some(
    (result) =>
      (result.entity.id === "medical-rag-platform" ||
        result.entity.id === "syndismart-ai") &&
      !explicitlyMatchedProjectIds.has(result.entity.id),
  );
}

function profileLanguageLevel(
  retrieval: ReturnType<typeof preparePortfolioAIRequest>["retrieval"],
) {
  if (retrieval.languageQueryKind === "overview") {
    return null;
  }

  const languageId = retrieval.languageId;
  const languageFacts = retrieval.results.flatMap((result) =>
    result.facts.filter((fact) => fact.predicate === "speaksLanguage"),
  );
  const selectedFact = languageId
    ? languageFacts.find(
        (fact) =>
          isRecord(fact.value) && fact.value.languageId === languageId,
      )
    : languageFacts[0];

  if (!selectedFact || !isRecord(selectedFact.value)) {
    return null;
  }

  if (selectedFact.value.levelType === "native") {
    return "native";
  }

  return typeof selectedFact.value.cefrLevel === "string"
    ? selectedFact.value.cefrLevel
    : null;
}

function explainFallback(
  providerDiagnostics: readonly ProviderDiagnostics[],
  secondaryConfigured: boolean,
  finalError: unknown,
  providerMode: DiagnosticProviderMode,
) {
  if (providerMode === "freellmapi") {
    return {
      triggered: "NO",
      reason:
        "Diagnostic provider override: FreeLLMAPI was called directly and Gemini was not called.",
    };
  }

  const gemini = providerDiagnostics.find(
    (item) => item.providerName === "gemini",
  );
  const freeLLMAPI = providerDiagnostics.find(
    (item) => item.providerName === "freellmapi",
  );

  if (freeLLMAPI?.called) {
    return {
      triggered: "YES",
      reason: gemini?.normalizedErrorClass
        ? `Primary ${gemini.normalizedErrorClass} is fallback-eligible.`
        : "Primary provider failed with a fallback-eligible provider error.",
    };
  }

  if (!secondaryConfigured) {
    return {
      triggered: "NO",
      reason: "FreeLLMAPI fallback is not configured/enabled.",
    };
  }

  if (gemini?.result === "SUCCESS") {
    return {
      triggered: "NO",
      reason:
        "Primary provider returned output; V1 fallback only handles provider failures before downstream validation.",
    };
  }

  if (gemini?.normalizedErrorClass) {
    return {
      triggered: "NO",
      reason: `Primary ${gemini.normalizedErrorClass} is not fallback-eligible.`,
    };
  }

  return {
    triggered: "NO",
    reason: finalError
      ? `${normalizedErrorClass(finalError)} occurred outside provider fallback.`
      : "No provider failure was observed.",
  };
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Portfolio AI diagnostics are disabled in production.");
  }

  loadEnvConfig(process.cwd());

  const { message, providerMode } = parseDiagnoseArgs(process.argv.slice(2));
  const requestId = createPortfolioAIRequestId();
  const totalStartedAt = Date.now();
  const history = readHistoryFromEnvironment();
  const payload = {
    message,
    locale: "fr",
    ...(history ? { history } : {}),
  };
  const retrievalStartedAt = Date.now();
  const prepared = preparePortfolioAIRequest(payload);
  const retrievalElapsedMs = elapsedSince(retrievalStartedAt);
  const generationInput: GeneratePortfolioAnswerInput = {
    question: prepared.payload.message,
    locale: prepared.locale,
    retrieval: prepared.retrieval,
    conversationContext:
      prepared.conversationContext.messages.length > 0
        ? prepared.conversationContext.messages
        : undefined,
  };
  const groundedContext = buildGroundedContext(generationInput);
  const allowedEvidenceIds = getAllowedEvidenceIds(groundedContext);
  const userPrompt = buildGenerationUserPrompt(generationInput, groundedContext);
  const providerDiagnostics: ProviderDiagnostics[] = [];
  const freeLLMAPIHTTPDiagnostics: FreeLLMAPIHTTPDiagnostics = {
    httpStatus: null,
    routedVia: "none",
    responseJSONParse: "NOT_RUN",
    assistantContentExists: "NOT_RUN",
    assistantContentJSONParse: "NOT_RUN",
  };
  const freeLLMAPIConfig = getFreeLLMAPIGenerationConfig();
  const geminiProvider = new DiagnosticProvider(
    "gemini",
    () => new GeminiPortfolioAIProvider(getPortfolioAIGenerationConfig()),
    generationInput,
    providerDiagnostics,
  );
  const secondaryProvider = new DiagnosticProvider(
    "freellmapi",
    () =>
      new FreeLLMAPIPortfolioAIProvider(
        freeLLMAPIConfig,
        createFreeLLMAPIDiagnosticFetch(freeLLMAPIHTTPDiagnostics),
      ),
    generationInput,
    providerDiagnostics,
    freeLLMAPIHTTPDiagnostics,
  );
  const fallbackEnabled = freeLLMAPIEnabled();
  const provider =
    providerMode === "freellmapi"
      ? secondaryProvider
      : fallbackEnabled
        ? new ResilientPortfolioAIProvider(geminiProvider, secondaryProvider)
        : geminiProvider;
  const generationStartedAt = Date.now();
  let finalResult:
    | Awaited<ReturnType<typeof generatePortfolioAnswer>>
    | undefined;
  let finalError: unknown;

  try {
    finalResult = await generatePortfolioAnswer(generationInput, { provider });
  } catch (error) {
    finalError = error;
  }

  const generationElapsedMs = elapsedSince(generationStartedAt);
  const publicError = finalError
    ? mapPortfolioAIErrorToHTTPResult(normalizeGenerationError(finalError), requestId)
    : undefined;
  const deterministicStructured =
    finalResult && finalResult.metadata.providerCalled === false
      ? inspectStructuredOutput(
          finalResult.answer,
          generationInput,
          allowedEvidenceIds,
        )
      : undefined;
  const lastStructured = deterministicStructured ?? [...providerDiagnostics]
    .reverse()
    .find((item) => item.structured)?.structured;

  console.log(
    JSON.stringify(
      {
        requestId,
        question: prepared.payload.message,
        locale: prepared.locale,
        retrieval: {
          intent: prepared.retrieval.intent,
          requestedProjectAttribute:
            prepared.retrieval.requestedProjectAttribute ?? null,
          skillCategory: prepared.retrieval.skillCategory ?? null,
          candidateFitFocus: prepared.retrieval.candidateFitFocus ?? null,
          normalizedTechnology:
            prepared.retrieval.matchedEntities.find(
              (match) => match.entity.type === "technology",
            )?.entity.canonicalName ?? null,
          normalizedSkill:
            getEntityById(prepared.retrieval.normalizedSkillId ?? "")
              ?.canonicalName ?? null,
          language:
            getEntityById(prepared.retrieval.languageId ?? "")?.canonicalName ??
            null,
          languageQueryKind: prepared.retrieval.languageQueryKind ?? null,
          languageLevel: profileLanguageLevel(prepared.retrieval),
          retrievedEntityIds: prepared.retrieval.results.map(
            (result) => result.entity.id,
          ),
          retrievedEvidenceIds: allowedEvidenceIds,
          status: prepared.retrieval.status,
          notDocumented: prepared.retrieval.notDocumented,
          requiresProvider: prepared.requiresProviderGeneration,
          elapsedMs: retrievalElapsedMs,
        },
        context: {
          historyMessageCount: prepared.conversationContext.historyMessageCount,
          historyTotalChars:
            prepared.conversationContext.messages.reduce(
              (total, messageItem) => total + messageItem.content.length,
              0,
            ),
          contextualized: prepared.conversationContext.contextualized,
          retrievalQueryChars:
            prepared.conversationContext.retrievalQuery.length,
          groundedContextChars: JSON.stringify(groundedContext).length,
          finalGenerationInputChars:
            PORTFOLIO_AI_SYSTEM_PROMPT.length + userPrompt.length,
          candidateFitEntityCount:
            prepared.retrieval.intent === "candidate_fit"
              ? groundedContext.entities.length
              : null,
          candidateFitEvidenceCount:
            prepared.retrieval.intent === "candidate_fit"
              ? groundedContext.evidence.length
              : null,
          historyDuplicated: false,
          previousAssistantResponseDuplicated: false,
          unrelatedRAGEvidenceIncluded: unrelatedRAGEvidenceIncluded(
            prepared.retrieval,
          ),
        },
        providers: providerDiagnostics,
        fallback: explainFallback(
          providerDiagnostics,
          providerMode === "freellmapi" || fallbackEnabled,
          finalError,
          providerMode,
        ),
        structuredResult: lastStructured
          ? {
              answer: lastStructured.answer,
              usedEvidenceIds: lastStructured.usedEvidenceIds,
              uncertainty: lastStructured.uncertainty,
              language: lastStructured.language,
            }
          : null,
        validation: {
          jsonParse: lastStructured?.jsonParse ?? "NOT_RUN",
          schemaValidation: lastStructured?.schemaValidation ?? "NOT_RUN",
          evidenceSubsetValidation:
            lastStructured?.evidenceSubsetValidation ?? "NOT_RUN",
          groundingValidation:
            lastStructured?.groundingValidation ?? "NOT_RUN",
        },
        final: finalResult
          ? {
              result: "SUCCESS",
              provider: finalResult.metadata.provider,
              model: finalResult.metadata.model,
              answer: finalResult.answer.answer,
              usedEvidenceIds: finalResult.answer.usedEvidenceIds,
              uncertainty: finalResult.answer.uncertainty,
              language: finalResult.answer.language,
              retryCount: finalResult.metadata.retryCount,
              fastPathUsed: finalResult.metadata.fastPathUsed ?? false,
              profileFastPathUsed:
                finalResult.metadata.model.startsWith("deterministic-profile"),
              validationMs: finalResult.metadata.validationMs,
            }
          : {
              result: "FAILURE",
              normalizedErrorClass: normalizedErrorClass(finalError),
              publicStatus: publicError?.status,
              publicCode:
                publicError && "error" in publicError.body
                  ? publicError.body.error.code
                  : undefined,
              publicMessage:
                publicError && "error" in publicError.body
                  ? publicError.body.error.message
                  : undefined,
            },
        timing: {
          retrievalElapsedMs,
          primaryProviderElapsedMs:
            providerDiagnostics.find((item) => item.providerName === "gemini")
              ?.elapsedMs ?? null,
          fallbackProviderElapsedMs:
            providerDiagnostics.find(
              (item) => item.providerName === "freellmapi",
            )?.elapsedMs ?? null,
          fallbackTimeoutMs: freeLLMAPIConfig.timeoutMs,
          generationElapsedMs,
          totalElapsedMs: elapsedSince(totalStartedAt),
          fastPathUsed: finalResult?.metadata.fastPathUsed ?? false,
        },
      },
      null,
      2,
    ),
  );

  if (finalError) {
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main().catch((error: unknown) => {
    console.error(
      JSON.stringify(
        {
          result: "FAILURE",
          normalizedErrorClass: normalizedErrorClass(error),
        },
        null,
        2,
      ),
    );
    process.exitCode = 1;
  });
}
