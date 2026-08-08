import "server-only";

import type { Project } from "@/features/projects/domain/project.types";

// Temporary local source of truth until a database-backed repository replaces it.
// Add only real, verified projects here. Keep draft projects as status: "draft".
export const PROJECTS = [
  {
    id: "medical-rag-platform",
    slug: "medical-rag-platform",
    status: "published",
    type: "academic",
    content: {
      fr: {
        title:
          "Plateforme intelligente RAG pour l’exploitation de rapports d’analyses médicales",
        shortDescription:
          "Développement d’un système intelligent permettant d’extraire, structurer et interroger des rapports d’analyses médicales multimodaux grâce à une architecture RAG.",
        caseStudy: {
          overview:
            "Projet de fin d’études de Master 2 réalisé en binôme.",
          context: "Projet de fin d’études de Master 2.",
          problem:
            "Les automates d’analyses médicales génèrent fréquemment des rapports PDF non structurés combinant texte, tableaux, résultats biologiques et éléments visuels tels que des graphiques ou des courbes. Ces documents sont difficiles à exploiter automatiquement. Le projet cherche à transformer ces rapports en une base de connaissances structurée et interrogeable en langage naturel.",
          objectives: [
            "Extraire automatiquement le texte et les images des rapports PDF.",
            "Structurer les données médicales : résultats, unités, valeurs de référence, etc.",
            "Indexer les informations extraites pour permettre une recherche intelligente.",
            "Permettre à l’utilisateur de poser des questions en langage naturel.",
            "Générer des réponses contextualisées à partir des données récupérées.",
            "Associer les réponses à leurs sources.",
          ],
          role: "Co-développement en binôme",
          approach:
            "Le modèle d’embeddings principal configuré est BAAI/bge-m3, avec intfloat/multilingual-e5-base comme fallback.",
          architecture:
            "Architecture RAG multimodale reposant sur l’extraction de contenus issus de rapports PDF, leur structuration et leur indexation afin de permettre une recherche intelligente. Le contexte récupéré est ensuite transmis au modèle de langage afin de produire une réponse contextualisée accompagnée de ses sources.",
        },
      },
      en: {
        title: "Medical RAG Platform",
        shortDescription:
          "Development of an intelligent system for extracting, structuring, and querying medical reports using RAG architectures.",
      },
    },
    categories: [
      {
        id: "rag",
        slug: "rag",
        name: "RAG",
      },
      {
        id: "nlp",
        slug: "nlp",
        name: "NLP",
      },
      {
        id: "generative-ai",
        slug: "generative-ai",
        name: "Generative AI",
      },
      {
        id: "multimodal-ai",
        slug: "multimodal-ai",
        name: "Multimodal AI",
      },
    ],
    technologies: [
      {
        id: "python",
        slug: "python",
        name: "Python",
        icon: "/assets/tech/python.svg",
      },
      {
        id: "fastapi",
        slug: "fastapi",
        name: "FastAPI",
        icon: "/assets/tech/fastapi.svg",
      },
      {
        id: "next-js",
        slug: "next-js",
        name: "Next.js",
      },
      {
        id: "sqlite",
        slug: "sqlite",
        name: "SQLite",
      },
      {
        id: "qdrant",
        slug: "qdrant",
        name: "Qdrant",
        icon: "/assets/tech/qdrant.svg",
      },
      {
        id: "ollama",
        slug: "ollama",
        name: "Ollama",
      },
      {
        id: "llama-3-2",
        slug: "llama-3-2",
        name: "Llama 3.2",
        icon: "/assets/tech/llama.svg",
      },
      {
        id: "github-actions",
        slug: "github-actions",
        name: "GitHub Actions",
      },
      {
        id: "digitalocean",
        slug: "digitalocean",
        name: "DigitalOcean",
      },
    ],
    coverImage: {
      id: "medical-rag-platform-cover",
      type: "image",
      storagePath: "/assets/projects-mockup/rag-sys.png",
      alt: "Interface desktop et mobile de la plateforme Medical RAG Platform",
      width: 1536,
      height: 1024,
      sortOrder: 0,
    },
    gallery: [],
    links: [
      {
        id: "medical-rag-platform-github",
        type: "github",
        label: "GitHub",
        url: "https://github.com/SoufianeAzerdaoui/medical-rag-platform",
      },
    ],
    contributors: [
      {
        name: "Soufiane Azerdaoui",
      },
      {
        name: "Mohammed Benmoumen",
      },
    ],
    year: 2026,
    duration: "4 mois",
    role: "Co-développement en binôme",
    featured: true,
    featuredOrder: 1,
    publishedAt: null,
  },
] satisfies Project[];
