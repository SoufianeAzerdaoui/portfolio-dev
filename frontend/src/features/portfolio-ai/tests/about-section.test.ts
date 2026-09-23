import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { AboutSection } from "@/components/sections/about-section";
import { portfolioContentByLocale } from "@/content/portfolio";
import type { AboutSectionContent } from "@/types/portfolio";

function flattenAboutText(content: AboutSectionContent) {
  return content.paragraphs
    .map((paragraph) => paragraph.map((segment) => segment.text).join(""))
    .join("\n\n");
}

test("About section renders expected id and a single heading", () => {
  const markup = renderToStaticMarkup(
    createElement(AboutSection, {
      content: portfolioContentByLocale.fr.about,
    }),
  );

  assert.match(markup, /<section[^>]*id="about"/);
  assert.match(markup, /aria-labelledby="about-title"/);
  assert.equal((markup.match(/<h2/g) ?? []).length, 1);
  assert.match(markup, /id="about-title"/);
  assert.match(markup, /À propos/);
});

test("About section uses final French copy with accurate current Master 2 status", () => {
  const text = flattenAboutText(portfolioContentByLocale.fr.about);

  assert.equal(
    text,
    [
      "Je suis Soufiane Azerdaoui, étudiant en Master 2 SIAD à l’ISIMA – Université Clermont Auvergne, avec un parcours orienté Data Engineering et Intelligence Artificielle.",
      "Je conçois des solutions Data & IA allant du traitement et de l’exploitation des données jusqu’au développement de systèmes de Machine Learning, Deep Learning, NLP et RAG.",
      "Je m’intéresse particulièrement à la conception de pipelines de données, aux modèles d’apprentissage automatique et aux systèmes d’IA capables de transformer des données complexes en informations exploitables.",
      "J’aime partir d’un besoin métier, comprendre les données disponibles, expérimenter différentes approches et construire une solution fiable, concrète et exploitable par l’utilisateur.",
    ].join("\n\n"),
  );
  assert.doesNotMatch(text, /dipl[oô]m[eé]|completed|senior|expert/i);
});

test("About section uses natural English copy without mixed French UI content", () => {
  const text = flattenAboutText(portfolioContentByLocale.en.about);
  const markup = renderToStaticMarkup(
    createElement(AboutSection, {
      content: portfolioContentByLocale.en.about,
    }),
  );

  assert.equal(
    text,
    [
      "I’m Soufiane Azerdaoui, currently pursuing a Master 2 in Information Systems and Decision Support at ISIMA – Université Clermont Auvergne.",
      "I design Data & AI solutions that turn complex data into actionable insights and decision-support tools.",
      "I’m particularly interested in Data Science, Machine Learning, Deep Learning and NLP.",
      "I enjoy starting from a real business need, understanding the available data, exploring different approaches and building a practical solution that users can actually rely on.",
    ].join("\n\n"),
  );
  assert.match(markup, /About/);
  assert.match(markup, /Profile/);
  assert.doesNotMatch(markup, /À propos/);
  assert.doesNotMatch(markup, /Je conçois/);
});

test("About CTA links to the journey section and stays keyboard accessible", () => {
  const markup = renderToStaticMarkup(
    createElement(AboutSection, {
      content: portfolioContentByLocale.fr.about,
    }),
  );

  assert.match(markup, /href="#journey"/);
  assert.match(markup, /Mon parcours/);
  assert.match(markup, /focus-visible:ring-2/);
  assert.doesNotMatch(markup, /role="button"/);
});

test("About profile image and decorative graphics are accessible", () => {
  const markup = renderToStaticMarkup(
    createElement(AboutSection, {
      content: portfolioContentByLocale.fr.about,
    }),
  );

  assert.match(markup, /alt="Portrait de Soufiane Azerdaoui"/);
  assert.match(markup, /sizes="\(min-width: 1280px\) 420px/);
  assert.match(markup, /AI \/ DATA PROFILE/);
  assert.match(markup, /M2 SIAD · ISIMA/);
  assert.match(markup, /<svg[^>]*aria-hidden="true"[^>]*focusable="false"/);
});

test("About skills are informational metadata, not fake buttons", () => {
  const markup = renderToStaticMarkup(
    createElement(AboutSection, {
      content: portfolioContentByLocale.fr.about,
    }),
  );

  assert.match(markup, /aria-label="Domaines principaux"/);
  assert.match(markup, /Data Science/);
  assert.match(markup, /Machine Learning/);
  assert.match(markup, /Deep Learning/);
  assert.match(markup, /NLP/);
  assert.match(markup, /rounded-\[6px\]/);
  assert.doesNotMatch(markup, /<button[^>]*>Data Science/);
  assert.doesNotMatch(markup, /role="button"/);
});

test("About stats keep verified values and current academic positioning", () => {
  const content = portfolioContentByLocale.fr.about;
  const markup = renderToStaticMarkup(
    createElement(AboutSection, {
      content,
    }),
  );

  assert.deepEqual(content.stats, [
    { value: "1+", label: "An d’expérience" },
    { value: "10+", label: "Projets Data/IA" },
    { value: "M2", label: "SIAD · ISIMA" },
  ]);
  assert.match(markup, /<dl/);
  assert.match(markup, /1\+/);
  assert.match(markup, /10\+/);
  assert.match(markup, /M2/);
});
