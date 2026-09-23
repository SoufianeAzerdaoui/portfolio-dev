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
  | "ml-deep-learning"
  | "nlp-llm-rag"
  | "data-analysis-bi"
  | "databases"
  | "programming-languages"
  | "cloud-devops"
  | "web-api"
  | "design-agile";

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
  "ml-deep-learning": {
    fr: "ML & Deep Learning",
    en: "ML & Deep Learning",
  },
  "nlp-llm-rag": {
    fr: "NLP, LLM & RAG",
    en: "NLP, LLM & RAG",
  },
  "data-analysis-bi": {
    fr: "Data Analysis & BI",
    en: "Data Analysis & BI",
  },
  databases: {
    fr: "Bases de données",
    en: "Databases",
  },
  "programming-languages": {
    fr: "Langages",
    en: "Programming Languages",
  },
  "cloud-devops": {
    fr: "Cloud & DevOps",
    en: "Cloud & DevOps",
  },
  "web-api": {
    fr: "Web & API",
    en: "Web & API",
  },
  "design-agile": {
    fr: "Conception & Agile",
    en: "Design & Agile",
  },
};

const PROFILE_TECHNICAL_SKILLS: ProfileSkillDefinition[] = [
  ...[
    "scikit-learn",
    "XGBoost",
    "TensorFlow",
    "PyTorch",
  ].map((name) => ({
    name,
    category: "ml-deep-learning" as const,
    categoryLabel: PROFILE_SKILL_CATEGORIES["ml-deep-learning"],
    ...(name === "scikit-learn"
      ? {
          aliases: ["Scikit-learn", "sklearn"],
        }
      : {}),
  })),
  ...[
    "Hugging Face Transformers",
    "RAG / LLM Systems",
    "Ollama",
  ].map((name) => ({
    name,
    category: "nlp-llm-rag" as const,
    categoryLabel: PROFILE_SKILL_CATEGORIES["nlp-llm-rag"],
    ...(name === "Hugging Face Transformers"
      ? {
          aliases: ["Transformers", "Hugging Face"],
        }
      : {}),
    ...(name === "RAG / LLM Systems"
      ? {
          aliases: [
            "RAG",
            "LLM",
            "LLMs",
            "RAG/LLM",
            "RAG systems",
            "LLM systems",
            "retrieval augmented generation",
            "retrieval-augmented generation",
            "large language model",
            "large language models",
          ],
        }
      : {}),
  })),
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
    ...(name === "Apache Spark"
      ? {
          aliases: ["Spark", "Spark/PySpark"],
        }
      : {}),
    ...(name === "PySpark"
      ? {
          aliases: ["Spark/PySpark"],
        }
      : {}),
    ...(name === "Apache Kafka"
      ? {
          aliases: ["Kafka"],
        }
      : {}),
    ...(name === "Hadoop"
      ? {
          aliases: ["Hadoop/HDFS"],
        }
      : {}),
    ...(name === "HDFS"
      ? {
          aliases: ["Hadoop/HDFS"],
        }
      : {}),
  })),
  ...["Pandas", "NumPy", "Power BI", "DAX"].map(
    (name) => ({
      name,
      category: "data-analysis-bi" as const,
      categoryLabel: PROFILE_SKILL_CATEGORIES["data-analysis-bi"],
      ...(name === "Power BI"
        ? {
            aliases: ["PowerBI"],
          }
        : {}),
    }),
  ),
  ...["SQL Server", "MySQL", "MongoDB", "SQLite", "Qdrant"].map((name) => ({
    name,
    category: "databases" as const,
    categoryLabel: PROFILE_SKILL_CATEGORIES.databases,
  })),
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
      ...(name === "Kubernetes"
        ? {
            aliases: ["K8s"],
          }
        : {}),
      ...(name === "GitHub Actions"
        ? {
            aliases: ["CI/CD", "GitHub Actions"],
          }
        : {}),
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
      category: "web-api" as const,
      categoryLabel: PROFILE_SKILL_CATEGORIES["web-api"],
      ...(name === "React.js"
        ? {
            aliases: ["React"],
          }
        : {}),
      ...(name === "Next.js"
        ? {
            aliases: ["Next"],
          }
        : {}),
    }),
  ),
  ...[
    "UML",
    "Merise",
    "Software modeling",
    "Data Modeling",
    "Jira",
    "Agile / Scrum",
  ].map(
    (name) => ({
      name,
      category: "design-agile" as const,
      categoryLabel: PROFILE_SKILL_CATEGORIES["design-agile"],
      ...(name === "Software modeling"
        ? {
            aliases: ["modélisation logicielle", "modelisation logicielle"],
          }
        : {}),
      ...(name === "Data Modeling"
        ? {
            aliases: ["modélisation de données", "modelisation de donnees"],
          }
        : {}),
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

const PROFILE_CERTIFICATIONS = [
  {
    id: "certification:data-engineer-in-python-datacamp",
    title: "Data Engineer in Python",
    issuer: "DataCamp",
    aliases: [
      "Data Engineer in Python",
      "certification Data Engineering",
      "certification Data Engineer",
      "DataCamp Data Engineer in Python",
    ],
  },
  {
    id: "certification:introduction-big-data-spark-hadoop-coursera",
    title: "Introduction to Big Data with Spark and Hadoop",
    issuer: "Coursera",
    aliases: [
      "Introduction to Big Data with Spark and Hadoop",
      "certification Spark",
      "certification Hadoop",
      "Spark certification",
      "Hadoop certification",
      "Coursera Spark Hadoop",
    ],
  },
  {
    id: "certification:data-cleaning-preprocessing-pandas-365",
    title: "Data Cleaning and Preprocessing with pandas",
    issuer: "365 Data Science",
    aliases: [
      "Data Cleaning and Preprocessing with pandas",
      "certification pandas",
      "pandas certification",
      "365 Data Science pandas",
    ],
  },
  {
    id: "certification:python-data-structures-coursera",
    title: "Python Data Structures",
    issuer: "Coursera",
    aliases: [
      "Python Data Structures",
      "certification Python",
      "Python certification",
      "Coursera Python Data Structures",
    ],
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
  const certificationEntities: KnowledgeEntity[] = PROFILE_CERTIFICATIONS.map(
    (certification) => ({
      id: certification.id,
      type: "certification",
      canonicalName: certification.title,
      aliases: [
        certification.title,
        certification.issuer,
        ...certification.aliases,
      ],
      localeContent: {
        fr: {
          title: certification.title,
          summary: certification.issuer,
        },
        en: {
          title: certification.title,
          summary: certification.issuer,
        },
      },
      sourceRefs: [sourceRef("portfolio", "certifications")],
      metadata: {
        issuer: certification.issuer,
      },
    }),
  );

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
    {
      id: "fact:person:soufiane-azerdaoui:availability",
      subjectId: PERSON_ID,
      predicate: "hasAvailability",
      value: {
        internship: {
          status: "documented",
          availableFrom: {
            fr: "avril 2027",
            en: "April 2027",
          },
          targetAreas: ["Data", "AI", "Cloud"],
        },
        apprenticeship: {
          status: "not-documented",
        },
        fullTime: {
          status: "not-documented",
        },
      },
      status: "verified",
      evidence: [profileEvidence("availability", "career-availability")],
      tags: ["profile-availability"],
      metadata: {
        provenance: "owner-confirmed-profile",
      },
    },
    {
      id: "fact:person:soufiane-azerdaoui:career-target",
      subjectId: PERSON_ID,
      predicate: "hasCareerTarget",
      value: {
        opportunityType: "internship",
        targetRoles: ["Data Engineer", "AI Engineer", "Data & AI Engineer"],
      },
      status: "verified",
      evidence: [profileEvidence("career-target", "target-roles")],
      tags: ["profile-career-target"],
      metadata: {
        provenance: "owner-confirmed-profile",
      },
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

  PROFILE_CERTIFICATIONS.forEach((certification) => {
    facts.push(
      {
        id: `fact:${certification.id}:title`,
        subjectId: certification.id,
        predicate: "certificationTitle",
        value: certification.title,
        status: "verified",
        evidence: [profileEvidence("certifications", certification.id)],
        tags: ["profile-certification"],
        metadata: {
          provenance: "owner-confirmed-profile",
        },
      },
      {
        id: `fact:${certification.id}:issuer`,
        subjectId: certification.id,
        predicate: "certificationIssuer",
        value: certification.issuer,
        status: "verified",
        evidence: [profileEvidence("certifications", certification.id)],
        tags: ["profile-certification"],
        metadata: {
          provenance: "owner-confirmed-profile",
        },
      },
    );
  });

  return {
    entities: [
      entity,
      ...technologyEntities,
      ...languageEntities,
      ...certificationEntities,
    ],
    facts,
  };
}
