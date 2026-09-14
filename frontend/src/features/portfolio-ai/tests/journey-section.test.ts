import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { JourneySection } from "@/components/sections/journey-section";
import {
  journeyContentByLocale,
  journeyExperiencesByLocale,
} from "@/content/journey";
import { portfolioContentByLocale } from "@/content/portfolio";

function renderJourney(locale: "fr" | "en" = "fr") {
  const journey = journeyContentByLocale[locale];

  return renderToStaticMarkup(
    createElement(JourneySection, {
      section: portfolioContentByLocale[locale].sections.find(
        (section) => section.id === "journey",
      )!,
      experiences: journey.experiences,
      typeLabels: journey.typeLabels,
      labels: journey.labels,
    }),
  );
}

test("Journey section renders the expected section structure", () => {
  const markup = renderJourney("fr");

  assert.match(markup, /<section[^>]*id="journey"/);
  assert.match(markup, /aria-labelledby="journey-title"/);
  assert.match(markup, /<ol/);
  assert.equal((markup.match(/<article/g) ?? []).length, 5);
  assert.match(markup, /\/ Parcours/);
  assert.match(markup, /Parcours professionnel/);
});

test("Journey experiences keep the approved chronological order", () => {
  assert.deepEqual(
    journeyExperiencesByLocale.fr.map((experience) => experience.id),
    [
      "atline-alternance-2025",
      "chu-mohammed-vi-pfe-2026",
      "atline-stage-2025",
      "pfe-business-intelligence-2024",
      "epg-stage-2023",
    ],
  );
});

test("Journey dates use canonical compact ranges", () => {
  assert.deepEqual(
    journeyExperiencesByLocale.fr.map((experience) => experience.period),
    [
      "OCT. 2025 — JUIL. 2026",
      "FÉVR. 2026 — JUIN 2026",
      "JUIN 2025 — SEPT. 2025",
      "AVR. 2024 — JUIN 2024",
      "MARS 2023 — AVR. 2023",
    ],
  );
  assert.deepEqual(
    journeyExperiencesByLocale.en.map((experience) => experience.period),
    [
      "OCT. 2025 — JUL. 2026",
      "FEB. 2026 — JUN. 2026",
      "JUN. 2025 — SEPT. 2025",
      "APR. 2024 — JUN. 2024",
      "MAR. 2023 — APR. 2023",
    ],
  );
});

test("Journey renders CHU, SEND SPACE, both ATLINE entries, and EPG", () => {
  const markup = renderJourney("fr");

  assert.match(markup, /ATLINE SERVICES/);
  assert.equal((markup.match(/ATLINE SERVICES/g) ?? []).length, 2);
  assert.match(markup, /Stage PFE — Data &amp; IA/);
  assert.match(markup, /CHU Mohammed VI/);
  assert.match(markup, /Stage de fin d’études — Business Intelligence/);
  assert.match(markup, /SEND SPACE/);
  assert.match(markup, /Développement Full Stack/);
  assert.match(markup, /EPG/);
});

test("Journey content uses final French and English copy without mixed localization", () => {
  const frMarkup = renderJourney("fr");
  const enMarkup = renderJourney("en");

  assert.match(
    frMarkup,
    /Conception d’une plateforme RAG multimodale pour l’exploitation de rapports médicaux/,
  );
  assert.match(
    frMarkup,
    /Conception d’une solution décisionnelle pour le suivi et l’analyse des ventes de smartphones/,
  );
  assert.match(enMarkup, /Design of a multimodal RAG platform for medical reports/);
  assert.match(enMarkup, /Design of a Business Intelligence solution/);
  assert.doesNotMatch(enMarkup, /Conception d/);
});

test("Journey technology stacks are complete and do not inject unsupported technologies", () => {
  const stacks = new Map(
    journeyExperiencesByLocale.fr.map((experience) => [
      experience.id,
      experience.displayTechnologies ?? experience.technologies ?? [],
    ]),
  );

  assert.deepEqual(stacks.get("atline-alternance-2025"), [
    "Angular",
    "PHP",
    "MySQL",
    "Git/Bitbucket",
    "Jira",
    "Scrum",
  ]);
  assert.deepEqual(stacks.get("chu-mohammed-vi-pfe-2026"), [
    "Python",
    "FastAPI",
    "Qdrant",
    "Llama",
    "Next.js",
  ]);
  assert.deepEqual(stacks.get("pfe-business-intelligence-2024"), [
    "SQL Server",
    "Python",
    "Pandas",
    "NumPy",
    "Power BI",
    "DAX",
    "ETL",
  ]);

  const allTechnologies = [...stacks.values()].flat();

  ["Docker", "Kubernetes", "Pinecone", "Kafka"].forEach((technology) => {
    assert.equal(allTechnologies.includes(technology), false);
  });
});

test("Journey technology tags are metadata, not fake buttons", () => {
  const markup = renderJourney("fr");

  assert.match(markup, /aria-label="Compétences utilisées"/);
  assert.match(markup, /journey-experience-tech rounded-\[6px\]/);
  assert.match(markup, /Qdrant/);
  assert.match(markup, /Power BI/);
  assert.doesNotMatch(markup, /<button[^>]*>Qdrant/);
  assert.doesNotMatch(markup, /tabIndex/);
  assert.doesNotMatch(markup, /role="button"/);
});

test("Journey ms.fr CTA is a secure external link with visible arrow", () => {
  const markup = renderJourney("fr");

  assert.equal((markup.match(/href="https:\/\/v3\.marches-securises\.fr\/"/g) ?? []).length, 2);
  assert.match(markup, /target="_blank"/);
  assert.match(markup, /rel="noopener noreferrer"/);
  assert.match(markup, /Voir ms\.fr 3\.0/);
  assert.match(markup, /↗/);
  assert.doesNotMatch(markup, /<svg/);
});

test("Journey layout keeps mobile single-column before desktop timeline columns", () => {
  const source = fs.readFileSync(
    "src/components/sections/journey-section.tsx",
    "utf8",
  );

  assert.match(source, /grid cursor-default gap-4/);
  assert.match(source, /md:grid-cols-\[9rem_minmax\(0,1fr\)\]/);
  assert.match(source, /lg:grid-cols-\[11rem_minmax\(0,1fr\)\]/);
  assert.match(source, /flex flex-wrap/);
});

test("Journey animations are motion-safe and reduced-motion safe", () => {
  const source = fs.readFileSync(
    "src/components/sections/journey-section.tsx",
    "utf8",
  );
  const css = fs.readFileSync("src/app/globals.css", "utf8");

  assert.match(source, /motion-safe:animate-\[journey-rise/);
  assert.match(source, /motion-reduce:transition-none/);
  assert.match(css, /html\[data-motion="reduce"\] \.journey-experience-row/);
});
