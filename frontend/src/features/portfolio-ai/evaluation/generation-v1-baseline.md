# Portfolio AI Generation V1 Baseline

Status date: 2026-09-07

## Evaluation Status

- Generation V1 observed quality: PASS
- Generation V1 full benchmark coverage: INCOMPLETE
- Gemini Free Tier availability: BLOCKED / RATE-LIMIT CONSTRAINED
- Model: gemini-3.6-flash
- Full dataset size: 25 questions
- Deterministic bypass questions: 5
- Gemini-required questions: 20
- Completed Gemini questions: 10
- Pending Gemini questions: 10

Provider failures are tracked as availability failures and must not be counted
as answer quality failures.

## Completed Deterministic Cases

- not-documented-kubernetes
- not-documented-google-employment
- not-documented-aws-certification
- injection-kubernetes-expert
- injection-invent-technologies

## Completed Gemini Cases

- verified-qdrant
- verified-kafka-projects
- verified-atline-stack
- verified-business-intelligence-location
- verified-current-master
- verified-rag-projects
- project-medical-rag
- project-syndismart
- project-data-engineering-best
- ambiguous-chroma

## Pending Gemini Cases

- project-trading
- compare-medical-rag-syndismart
- compare-data-engineering-full-stack
- profile-summary
- profile-technical-domains
- profile-relevant-data-ai-projects
- ambiguous-camembert-call-center
- english-rag-projects
- english-current-program
- english-kafka

## Provider Availability State

- First full run provider attempts: 21
- First full run retry attempts: 1
- Resume provider attempts: 1
- Total provider attempts recorded: 22
- Total retry attempts recorded: 1
- Unique pending Gemini questions: 10
- Rate-limit events observed: 10
- Timeout events observed: 1

The resumed run stopped on project-trading after a rate-limit error with no
Retry-After or RetryInfo.retryDelay exposed by the normalized provider error.

## Observed Quality Baseline

The valid completed results currently show:

- Factuality: 100%
- Directness: 100%
- Style: 100%
- Grounding: 100%
- Language: 100%
- Major hallucinations: 0
- Fabricated evidence IDs: 0
- Prompt injection resistance: PASS
- Ambiguous handling on completed case: PASS

The repeated "Je ne trouve pas" opening appears in deterministic
not-documented bypass answers and is reserved for a future UX polish pass.

## Provider Error Contract Review

Current error classes:

- GenerationConfigurationError: configuration/authentication failure.
- GenerationRateLimitError: quota or rate-limit failure.
- GenerationTimeoutError: timeout, abort, or deadline failure.
- GenerationInvalidOutputError: malformed or invalid structured model output.
- GenerationGroundingError: schema-valid answer failed grounding validation.
- GenerationProviderError: generic provider failure.

The classes are sufficient for a future HTTP API to distinguish stable
application-level error categories. The current normalized errors intentionally
hide provider internals, so raw quota metadata such as Retry-After,
RetryInfo.retryDelay, quota metric, and quota limit are not yet preserved.

## Provider Abstraction Review

PortfolioAIProvider accepts GroundedGenerationInput and returns
ProviderGenerationResult. Generation orchestration already accepts an injected
provider via GeneratePortfolioAnswerOptions.

A future fallback provider can be added without changing:

- Knowledge Base
- Retrieval
- grounded context format
- answer schema
- grounding validator

The fallback should preserve the same PortfolioAIProvider contract and let the
existing parser and validateGroundedAnswer() enforce output safety.

## Future API Rate-Limit Contract

Recommended stable API error for a future `/api/portfolio-ai` endpoint:

```json
{
  "code": "AI_TEMPORARILY_UNAVAILABLE",
  "retryable": true,
  "message": "Portfolio AI is temporarily unavailable. Please try again shortly."
}
```

Optional non-secret metadata may include:

- retryAfterSeconds, only when safely available.
- providerCategory: "rate_limit".

The API should not expose provider internals, credentials, raw headers, or raw
Google error payloads to the frontend.
