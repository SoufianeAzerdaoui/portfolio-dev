import { portfolioContentByLocale } from "@/content/portfolio";
import {
  canonicalizeTechnology,
  createTechnologyEntity,
} from "@/features/portfolio-ai/knowledge/build-skills-index";
import {
  PERSON_ID,
  sourceRef,
} from "@/features/portfolio-ai/knowledge/knowledge.sources";
import type {
  KnowledgeEntity,
  KnowledgeFact,
} from "@/features/portfolio-ai/knowledge/knowledge.types";

type ProfileSkillCategory =
  | "data-engineering"
  | "ai-nlp-genai"
  | "databases-bi"
  | "programming-languages"
  | "cloud-devops"
  | "web-development"
  | "design-methods";

type ProfileSkillDefinition = {
  name: string;
  category: ProfileSkillCategory;
  categoryLabel: {
    fr: string;
    en: string;
  };
  aliases?: string[];
};

const PROFILE_SKILL_CATEGORIES: Record<
  ProfileSkillCategory,
  { fr: string; en: string }
> = {
  "data-engineering": {
    fr: "Data Engineering",
    en: "Data Engineering",
  },
  "ai-nlp-genai": {
    fr: "IA / NLP / GenAI",
    en: "AI / NLP / GenAI",
  },
  "databases-bi": {
    fr: "Bases de données & BI",
    en: "Databases & BI",
  },
  "programming-languages": {
    fr: "Langages",
    en: "Programming languages",
  },
  "cloud-devops": {
    fr: "Cloud & DevOps",
    en: "Cloud & DevOps",
  },
  "web-development": {
    fr: "Développement web",
    en: "Web development",
  },
  "design-methods": {
    fr: "Conception & méthodes",
    en: "Design & methods",
  },
};

const PROFILE_TECHNICAL_SKILLS: ProfileSkillDefinition[] = [
  ...[
    "ETL",
    "Data Warehousing",
    "Apache Spark",
    "PySpark",
    "Apache Kafka",
    "Delta Lake",
    "Hadoop",
    "HDFS",
    "MapReduce",
  ].map((name) => ({
    name,
    category: "data-engineering" as const,
    categoryLabel: PROFILE_SKILL_CATEGORIES["data-engineering"],
  })),
  ...[
    "scikit-learn",
    "XGBoost",
    "TensorFlow",
    "PyTorch",
    "Hugging Face Transformers",
    "RAG / LLM Systems",
    "FAISS",
    "Qdrant",
    "Whisper",
    "Ollama",
  ].map((name) => ({
    name,
    category: "ai-nlp-genai" as const,
    categoryLabel: PROFILE_SKILL_CATEGORIES["ai-nlp-genai"],
    ...(name === "RAG / LLM Systems"
      ? {
          aliases: [
            "RAG",
            "LLM",
            "LLMs",
            "RAG/LLM",
            "RAG systems",
            "LLM systems",
          ],
        }
      : {}),
  })),
  ...["SQL Server", "MySQL", "MongoDB", "SQLite", "Power BI", "DAX"].map(
    (name) => ({
      name,
      category: "databases-bi" as const,
      categoryLabel: PROFILE_SKILL_CATEGORIES["databases-bi"],
    }),
  ),
  ...["Python", "SQL", "Java", "PHP", "JavaScript", "TypeScript"].map(
    (name) => ({
      name,
      category: "programming-languages" as const,
      categoryLabel: PROFILE_SKILL_CATEGORIES["programming-languages"],
    }),
  ),
  ...["Docker", "Kubernetes", "DigitalOcean", "Git", "GitHub Actions"].map(
    (name) => ({
      name,
      category: "cloud-devops" as const,
      categoryLabel: PROFILE_SKILL_CATEGORIES["cloud-devops"],
    }),
  ),
  {
    name: "Bitbucket",
    category: "cloud-devops",
    categoryLabel: PROFILE_SKILL_CATEGORIES["cloud-devops"],
    aliases: ["Git / Bitbucket", "Git/Bitbucket"],
  },
  ...["FastAPI", "Spring Boot", "Angular", "React.js", "Next.js"].map(
    (name) => ({
      name,
      category: "web-development" as const,
      categoryLabel: PROFILE_SKILL_CATEGORIES["web-development"],
    }),
  ),
  ...["UML", "Merise", "Data Modeling", "Jira", "Agile / Scrum"].map(
    (name) => ({
      name,
      category: "design-methods" as const,
      categoryLabel: PROFILE_SKILL_CATEGORIES["design-methods"],
    }),
  ),
];

const PROFILE_LANGUAGES = [
  {
    id: "language:arabic",
    canonicalName: "Arabic",
    aliases: ["Arabic", "Arabe", "arabe", "arabic"],
    levelType: "native",
    display: {
      fr: "Langue maternelle",
      en: "Native",
    },
  },
  {
    id: "language:french",
    canonicalName: "French",
    aliases: ["French", "Français", "francais", "french"],
    levelType: "cefr",
    cefrLevel: "B2",
    display: {
      fr: "B2",
      en: "B2",
    },
  },
  {
    id: "language:english",
    canonicalName: "English",
    aliases: ["English", "Anglais", "anglais", "english"],
    levelType: "cefr",
    cefrLevel: "B1",
    display: {
      fr: "B1",
      en: "B1",
    },
  },
  {
    id: "language:german",
    canonicalName: "German",
    aliases: ["German", "Allemand", "allemand", "german"],
    levelType: "cefr",
    cefrLevel: "B1",
    display: {
      fr: "B1",
      en: "B1",
    },
  },
] as const;

function profileEvidence(sourceId: string, field: string) {
  return {
    sourceType: "portfolio" as const,
    sourceId,
    field,
    strength: "primary" as const,
  };
}

export function normalizeProfile() {
  const fr = portfolioContentByLocale.fr;
  const en = portfolioContentByLocale.en;
  const technologyEntities = PROFILE_TECHNICAL_SKILLS.map((skill) => {
    const technology = createTechnologyEntity(skill.name);

    return {
      ...technology,
      aliases: [...technology.aliases, ...(skill.aliases ?? [])],
      sourceRefs: [sourceRef("portfolio", "technical-skills")],
    };
  });
  const languageEntities: KnowledgeEntity[] = PROFILE_LANGUAGES.map((language) => ({
    id: language.id,
    type: "language",
    canonicalName: language.canonicalName,
    aliases: [...language.aliases],
    sourceRefs: [sourceRef("portfolio", "languages")],
    metadata: {
      levelType: language.levelType,
      cefrLevel: "cefrLevel" in language ? language.cefrLevel : undefined,
      display: language.display,
    },
  }));

  const entity: KnowledgeEntity = {
    id: PERSON_ID,
    type: "person",
    canonicalName: fr.identity.name,
    aliases: [fr.identity.name, en.identity.name, "Soufiane", "Azerdaoui"],
    localeContent: {
      fr: {
        title: fr.identity.role,
        summary: fr.about.paragraphs
          .map((paragraph) => paragraph.map((part) => part.text).join(""))
          .join("\n"),
      },
      en: {
        title: en.identity.role,
        summary: en.about.paragraphs
          .map((paragraph) => paragraph.map((part) => part.text).join(""))
          .join("\n"),
      },
    },
    sourceRefs: [
      sourceRef("portfolio", "identity"),
      sourceRef("portfolio", "about"),
    ],
    metadata: {
      displayStats: fr.about.stats.map((stat) => ({
        ...stat,
        status: "derived",
        usage: "display-only",
      })),
    },
  };

  const facts: KnowledgeFact[] = [
    {
      id: "fact:person:soufiane-azerdaoui:role",
      subjectId: PERSON_ID,
      predicate: "hasRole",
      value: fr.identity.role,
      status: "verified",
      evidence: [
        {
          sourceType: "portfolio",
          sourceId: "identity",
          field: "role",
          strength: "primary",
        },
      ],
    },
    {
      id: "fact:person:soufiane-azerdaoui:main-interests",
      subjectId: PERSON_ID,
      predicate: "hasInterest",
      value: fr.about.highlights,
      status: "derived",
      evidence: [
        {
          sourceType: "portfolio",
          sourceId: "about",
          field: "highlights",
          strength: "supporting",
        },
      ],
    },
  ];

  PROFILE_TECHNICAL_SKILLS.forEach((skill) => {
    const technology = canonicalizeTechnology(skill.name);

    facts.push({
      id: `fact:person:soufiane-azerdaoui:profileSkill:${technology.id.replace(
        "tech:",
        "",
      )}`,
      subjectId: PERSON_ID,
      predicate: "hasProfileSkill",
      value: {
        entityId: technology.id,
        name: skill.name,
        category: skill.category,
        categoryLabel: skill.categoryLabel,
      },
      status: "verified",
      evidence: [profileEvidence("technical-skills", skill.category)],
      tags: ["profile-skill", skill.category],
      metadata: {
        provenance: "owner-confirmed-profile",
      },
    });
  });

  PROFILE_LANGUAGES.forEach((language) => {
    facts.push({
      id: `fact:person:soufiane-azerdaoui:speaksLanguage:${language.id.replace(
        "language:",
        "",
      )}`,
      subjectId: PERSON_ID,
      predicate: "speaksLanguage",
      value: {
        languageId: language.id,
        name: language.canonicalName,
        levelType: language.levelType,
        cefrLevel: "cefrLevel" in language ? language.cefrLevel : undefined,
        display: language.display,
      },
      status: "verified",
      evidence: [profileEvidence("languages", language.id.replace("language:", ""))],
      tags: ["profile-language"],
      metadata: {
        provenance: "owner-confirmed-profile",
      },
    });
  });

  return {
    entities: [entity, ...technologyEntities, ...languageEntities],
    facts,
  };
}
