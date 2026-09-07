import "server-only";

import { createHash, randomUUID } from "node:crypto";

export const PORTFOLIO_AI_RATE_LIMIT_CONFIG = {
  burst: {
    maxRequests: 3,
    windowMs: 60_000,
  },
  longWindow: {
    maxRequests: 10,
    windowMs: 15 * 60_000,
  },
  maxInFlightGenerations: 2,
} as const;

export type RateLimitResult =
  | {
      allowed: true;
    }
  | {
      allowed: false;
      retryAfterSeconds: number;
      reason: "quota" | "concurrency";
    };

export type PortfolioAIRateLimiter = {
  checkProviderLimit(clientKey: string): RateLimitResult;
  acquireGenerationSlot(clientKey: string): RateLimitResult;
  releaseGenerationSlot(clientKey: string): void;
};

export type PortfolioAIRateLimitConfig = {
  burst: {
    maxRequests: number;
    windowMs: number;
  };
  longWindow: {
    maxRequests: number;
    windowMs: number;
  };
  maxInFlightGenerations: number;
};

type RateLimitClock = {
  now(): number;
};

type ClientState = {
  burstTimestamps: number[];
  longWindowTimestamps: number[];
  inFlightGenerations: number;
  updatedAt: number;
};

const FALLBACK_CLIENT_KEY = "client:fallback";
const CLIENT_KEY_SALT = randomUUID();

function secondsUntil(timestamp: number, now: number) {
  return Math.max(1, Math.ceil((timestamp - now) / 1000));
}

function pruneWindow(
  timestamps: readonly number[],
  now: number,
  windowMs: number,
) {
  const oldestAllowed = now - windowMs;

  return timestamps.filter((timestamp) => timestamp > oldestAllowed);
}

function hashClientIdentifier(identifier: string) {
  return `client:${createHash("sha256")
    .update(CLIENT_KEY_SALT)
    .update(identifier)
    .digest("hex")}`;
}

function isPlausibleClientAddress(value: string) {
  return /^[a-z0-9:. -]{3,80}$/i.test(value);
}

export function getPortfolioAIClientRateLimitKey(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const candidate = forwardedFor?.split(",")[0]?.trim() ?? realIp?.trim();

  if (!candidate || !isPlausibleClientAddress(candidate)) {
    return FALLBACK_CLIENT_KEY;
  }

  return hashClientIdentifier(candidate);
}

export class InMemoryPortfolioAIRateLimiter implements PortfolioAIRateLimiter {
  private readonly stateByClient = new Map<string, ClientState>();

  constructor(
    private readonly clock: RateLimitClock = { now: () => Date.now() },
    private readonly config: PortfolioAIRateLimitConfig =
      PORTFOLIO_AI_RATE_LIMIT_CONFIG,
  ) {}

  private getState(clientKey: string) {
    const now = this.clock.now();
    const existing = this.stateByClient.get(clientKey);

    if (existing) {
      existing.burstTimestamps = pruneWindow(
        existing.burstTimestamps,
        now,
        this.config.burst.windowMs,
      );
      existing.longWindowTimestamps = pruneWindow(
        existing.longWindowTimestamps,
        now,
        this.config.longWindow.windowMs,
      );
      existing.updatedAt = now;

      return existing;
    }

    const state: ClientState = {
      burstTimestamps: [],
      longWindowTimestamps: [],
      inFlightGenerations: 0,
      updatedAt: now,
    };

    this.stateByClient.set(clientKey, state);

    return state;
  }

  private cleanup() {
    const now = this.clock.now();
    const ttl = this.config.longWindow.windowMs;

    for (const [clientKey, state] of this.stateByClient) {
      if (
        state.inFlightGenerations === 0 &&
        state.updatedAt + ttl < now &&
        state.burstTimestamps.length === 0 &&
        state.longWindowTimestamps.length === 0
      ) {
        this.stateByClient.delete(clientKey);
      }
    }
  }

  checkProviderLimit(clientKey: string): RateLimitResult {
    const now = this.clock.now();
    const state = this.getState(clientKey);
    const burstTimestamps = state.burstTimestamps;
    const longWindowTimestamps = state.longWindowTimestamps;

    if (burstTimestamps.length >= this.config.burst.maxRequests) {
      return {
        allowed: false,
        retryAfterSeconds: secondsUntil(
          burstTimestamps[0] + this.config.burst.windowMs,
          now,
        ),
        reason: "quota",
      };
    }

    if (longWindowTimestamps.length >= this.config.longWindow.maxRequests) {
      return {
        allowed: false,
        retryAfterSeconds: secondsUntil(
          longWindowTimestamps[0] + this.config.longWindow.windowMs,
          now,
        ),
        reason: "quota",
      };
    }

    state.burstTimestamps.push(now);
    state.longWindowTimestamps.push(now);
    state.updatedAt = now;
    this.cleanup();

    return { allowed: true };
  }

  acquireGenerationSlot(clientKey: string): RateLimitResult {
    const state = this.getState(clientKey);

    if (state.inFlightGenerations >= this.config.maxInFlightGenerations) {
      return {
        allowed: false,
        retryAfterSeconds: 1,
        reason: "concurrency",
      };
    }

    state.inFlightGenerations += 1;
    state.updatedAt = this.clock.now();

    return { allowed: true };
  }

  releaseGenerationSlot(clientKey: string) {
    const state = this.stateByClient.get(clientKey);

    if (!state) {
      return;
    }

    state.inFlightGenerations = Math.max(0, state.inFlightGenerations - 1);
    state.updatedAt = this.clock.now();
    this.cleanup();
  }

  snapshotForTests() {
    return [...this.stateByClient.entries()].map(([clientKey, state]) => ({
      clientKey,
      burstCount: state.burstTimestamps.length,
      longWindowCount: state.longWindowTimestamps.length,
      inFlightGenerations: state.inFlightGenerations,
    }));
  }
}

export const portfolioAIRateLimiter = new InMemoryPortfolioAIRateLimiter();
