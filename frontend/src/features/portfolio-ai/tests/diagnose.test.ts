import assert from "node:assert/strict";
import { test } from "node:test";

import { parseDiagnoseArgs } from "@/features/portfolio-ai/tests/diagnose";

test("diagnose runner parses direct FreeLLMAPI provider mode without changing question", () => {
  const parsed = parseDiagnoseArgs([
    "Pourquoi Soufiane serait-il un bon candidat pour un stage Data & AI ?",
    "--provider=freellmapi",
  ]);

  assert.deepEqual(parsed, {
    message:
      "Pourquoi Soufiane serait-il un bon candidat pour un stage Data & AI ?",
    providerMode: "freellmapi",
  });
});

test("diagnose runner default mode preserves existing CLI behavior", () => {
  const parsed = parseDiagnoseArgs(["A-t-il utilisé Kafka ?"]);

  assert.deepEqual(parsed, {
    message: "A-t-il utilisé Kafka ?",
    providerMode: "default",
  });
});

test("diagnose runner rejects unsupported provider modes", () => {
  assert.throws(
    () => parseDiagnoseArgs(["A-t-il utilisé Kafka ?", "--provider=gemini"]),
    /supports only freellmapi/,
  );
});
