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
    domain: "ai-ml",
    content: {
      fr: {
        title:
          "Plateforme intelligente RAG pour l’exploitation de rapports d’analyses médicales",
        shortDescription:
          "Plateforme RAG multimodale pour extraire, structurer et interroger des rapports d’analyses médicales avec des réponses contextualisées et sourcées.",
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
            "Architecture RAG multimodale avec Hybrid Retrieval, reposant sur l’extraction de contenus issus de rapports PDF, leur structuration et leur indexation afin de permettre une recherche intelligente. Le contexte récupéré est ensuite transmis au modèle de langage afin de produire une réponse contextualisée accompagnée de ses sources.",
          architectureSteps: [
            "Rapports PDF multimodaux",
            "Extraction texte, tableaux, images et graphiques",
            "Structuration des résultats, unités et valeurs de référence",
            "Embeddings BAAI/bge-m3",
            "Indexation dans Qdrant",
            "Hybrid Retrieval",
            "Contexte récupéré",
            "Llama 3.2",
            "Réponse contextualisée avec sources",
          ],
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
        id: "multimodal-ai",
        slug: "multimodal-ai",
        name: "Multimodal AI",
      },
      {
        id: "generative-ai",
        slug: "generative-ai",
        name: "Generative AI",
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
        id: "qdrant",
        slug: "qdrant",
        name: "Qdrant",
        icon: "/assets/tech/qdrant.svg",
      },
      {
        id: "llama-3-2",
        slug: "llama-3-2",
        name: "Llama 3.2",
        icon: "/assets/tech/llama.svg",
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
        id: "ollama",
        slug: "ollama",
        name: "Ollama",
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
      role: "cover",
      storagePath: "/assets/projects-mockup/rag-sys.png",
      alt: "Interface desktop et mobile de la plateforme Medical RAG Platform",
      width: 1536,
      height: 1024,
      sortOrder: 0,
    },
    gallery: [
      {
        id: "medical-rag-architecture-01",
        type: "image",
        role: "architecture",
        storagePath: "/assets/projects-mockup/medical_rag_architecture/101.png",
        alt: "Diagramme d’architecture du Medical RAG Platform - vue 1",
        width: 1192,
        height: 629,
        sortOrder: 0,
      },
      {
        id: "medical-rag-architecture-02",
        type: "image",
        role: "architecture",
        storagePath: "/assets/projects-mockup/medical_rag_architecture/102.png",
        alt: "Diagramme d’architecture du Medical RAG Platform - vue 2",
        width: 1192,
        height: 629,
        sortOrder: 1,
      },
      {
        id: "medical-rag-architecture-03",
        type: "image",
        role: "architecture",
        storagePath: "/assets/projects-mockup/medical_rag_architecture/103.png",
        alt: "Diagramme d’architecture du Medical RAG Platform - vue 3",
        width: 1192,
        height: 629,
        sortOrder: 2,
      },
      {
        id: "medical-rag-interface-01",
        type: "image",
        role: "interface",
        storagePath: "/assets/projects-mockup/medical_rag_interfaces/11.png",
        alt: "Interface du Medical RAG Platform - vue 1",
        width: 1920,
        height: 949,
        sortOrder: 0,
      },
      {
        id: "medical-rag-interface-02",
        type: "image",
        role: "interface",
        storagePath: "/assets/projects-mockup/medical_rag_interfaces/12.png",
        alt: "Interface du Medical RAG Platform - vue 2",
        width: 1920,
        height: 949,
        sortOrder: 1,
      },
      {
        id: "medical-rag-interface-03",
        type: "image",
        role: "interface",
        storagePath: "/assets/projects-mockup/medical_rag_interfaces/13.png",
        alt: "Interface du Medical RAG Platform - vue 3",
        width: 1665,
        height: 926,
        sortOrder: 2,
      },
    ],
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
  {
    id: "syndismart-ai",
    slug: "syndismart-ai",
    status: "published",
    type: "academic",
    domain: "ai-ml",
    content: {
      fr: {
        title: "SyndiSmart AI",
        shortDescription:
          "Assistant IA pour classifier et prioriser les messages WhatsApp d’un syndic, puis générer des réponses contextualisées et sourcées grâce au RAG.",
        caseStudy: {
          overview:
            "SyndiSmart AI est un projet académique d’IA générative conçu pour automatiser le triage des messages reçus par un syndic, prioriser les urgences et assister la génération de réponses grâce à une architecture RAG avec validation humaine.",
          context:
            "Une société de syndic reçoit quotidiennement des messages WhatsApp de résidents concernant des plaintes, incidents et demandes administratives. Le traitement manuel de ces messages rend difficile la priorisation rapide des urgences, le routage des demandes et le suivi opérationnel.",
          problem:
            "Une société de syndic reçoit quotidiennement de nombreux messages WhatsApp liés à des incidents, réclamations et demandes administratives. Leur traitement manuel complique la détection rapide des urgences, la classification des demandes et leur suivi.",
          objectives: [
            "Lire et traiter les messages WhatsApp.",
            "Classifier leur urgence en P0 / P1 / P2 / P3.",
            "Identifier des informations telles que catégorie et sentiment.",
            "Générer une réponse contextualisée et sourcée.",
            "Permettre au syndic de valider ou modifier la réponse.",
            "Structurer les données pour l’analyse et le reporting.",
          ],
          role: "Projet individuel",
          approach:
            "Pipeline combinant prétraitement Python, règles métier de garde-fou pour les urgences critiques, classification LLM structurée avec Ollama et Qwen2.5, recherche RAG dans une base de connaissances métier, sortie JSON stricte et validation humaine avant traitement final.",
          architecture:
            "SyndiSmart AI analyse les messages, détermine leur niveau d’urgence et leur catégorie, puis s’appuie sur une base de connaissances RAG pour proposer une réponse contextualisée pouvant être validée ou modifiée par le syndic.",
          architectureSteps: [
            "Messages WhatsApp exportés",
            "Ingestion et prétraitement Python",
            "Nettoyage, normalisation et détection de langue",
            "Règles métier et garde-fous P0",
            "Classification LLM structurée avec Ollama et Qwen2.5",
            "Urgence P0 / P1 / P2 / P3, catégorie, sentiment et routage",
            "Chunking, embeddings, indexation vectorielle et retriever top-k",
            "Recherche RAG dans la base de connaissances métier",
            "Réponse contextualisée et sourcée",
            "Validation ou édition par le syndic",
            "Stockage analytique et reporting Streamlit",
          ],
          results: [],
        },
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
        id: "data-analytics",
        slug: "data-analytics",
        name: "Data Analytics",
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
        id: "ollama",
        slug: "ollama",
        name: "Ollama",
      },
      {
        id: "qwen2-5",
        slug: "qwen2-5",
        name: "Qwen2.5",
      },
      {
        id: "streamlit",
        slug: "streamlit",
        name: "Streamlit",
      },
      {
        id: "faiss",
        slug: "faiss",
        name: "FAISS",
      },
      {
        id: "chroma",
        slug: "chroma",
        name: "Chroma",
      },
      {
        id: "sql",
        slug: "sql",
        name: "SQL",
      },
    ],
    coverImage: {
      id: "syndismart-ai-cover",
      type: "image",
      role: "cover",
      storagePath: "/assets/projects-mockup/SyndiSmart.png",
      alt: "Identité visuelle du projet SyndiSmart AI",
      width: 1536,
      height: 1024,
      sortOrder: 0,
    },
    gallery: [],
    links: [
      {
        id: "syndismart-ai-github",
        type: "github",
        label: "GitHub",
        url: "https://github.com/SoufianeAzerdaoui/syndismart_ai",
      },
    ],
    contributors: [
      {
        name: "Soufiane Azerdaoui",
      },
    ],
    year: 2026,
    duration: "1 mois et demi",
    role: "Projet individuel",
    organization: "Projet individuel",
    featured: true,
    featuredOrder: 2,
    publishedAt: null,
  },
  {
    id: "callcenter-frustration-ai",
    slug: "callcenter-frustration-ai",
    status: "published",
    type: "academic",
    domain: "ai-ml",
    content: {
      fr: {
        title: "Call Center AI — Détection de frustration",
        shortDescription:
          "Solution NLP pour détecter la frustration dans les conversations de centres d’appels, résumer les échanges et suggérer aux agents des réponses contextualisées à partir de l’historique client.",
        caseStudy: {
          overview:
            "Projet académique individuel réalisé dans le cadre d’une collaboration avec une startup canadienne.",
          context:
            "Projet académique réalisé dans le cadre d’une collaboration avec une startup canadienne.",
          problem:
            "Dans les centres d’appels, les interactions frustrantes avec les chatbots ou des réponses inadaptées peuvent dégrader l’expérience client. L’enjeu est d’identifier rapidement ces situations et d’aider l’agent à adapter sa réponse au contexte de la conversation.",
          objectives: [
            "Détecter automatiquement les signes de frustration dans une conversation.",
            "Produire un résumé automatique des échanges.",
            "Proposer des réponses ou actions adaptées à l’agent.",
            "Prendre en compte l’historique du client.",
          ],
          role: "Projet individuel",
          approach:
            "Un pipeline IA transforme les conversations audio en texte, détecte les signes de frustration, génère un résumé de l’échange et propose des réponses ou actions contextualisées en tenant compte de l’historique client.",
          architecture:
            "Pipeline NLP combinant transcription audio, structuration des conversations, analyse de frustration, résumé automatique et suggestions contextuelles pour assister les agents de centres d’appels.",
          architectureSteps: [
            "Audio Input .mp3 / .wav",
            "FFMPEG pour le nettoyage audio",
            "Whisper pour la transcription Speech-to-Text",
            "Structuration JSON avec historique client",
            "BERT / CamemBERT pour l’analyse de sentiment et de frustration",
            "T5 / BART pour le résumé et les suggestions",
            "Résultats : résumé, état émotionnel, suggestions et actions",
            "Streamlit / FastAPI pour l’exploitation des résultats",
          ],
          results: [],
        },
      },
    },
    categories: [
      {
        id: "nlp",
        slug: "nlp",
        name: "NLP",
      },
      {
        id: "speech-ai",
        slug: "speech-ai",
        name: "Speech AI",
      },
      {
        id: "sentiment-analysis",
        slug: "sentiment-analysis",
        name: "Sentiment Analysis",
      },
      {
        id: "machine-learning",
        slug: "machine-learning",
        name: "Machine Learning",
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
        id: "whisper",
        slug: "whisper",
        name: "Whisper",
      },
      {
        id: "camembert",
        slug: "camembert",
        name: "CamemBERT",
      },
      {
        id: "hugging-face",
        slug: "hugging-face",
        name: "Hugging Face",
      },
      {
        id: "ffmpeg",
        slug: "ffmpeg",
        name: "FFMPEG",
      },
      {
        id: "pandas",
        slug: "pandas",
        name: "Pandas",
      },
      {
        id: "numpy",
        slug: "numpy",
        name: "NumPy",
      },
      {
        id: "bert",
        slug: "bert",
        name: "BERT",
      },
      {
        id: "t5",
        slug: "t5",
        name: "T5",
      },
      {
        id: "bart",
        slug: "bart",
        name: "BART",
      },
      {
        id: "pytorch",
        slug: "pytorch",
        name: "PyTorch",
      },
      {
        id: "tensorflow",
        slug: "tensorflow",
        name: "TensorFlow",
      },
      {
        id: "streamlit",
        slug: "streamlit",
        name: "Streamlit",
      },
      {
        id: "jupyter",
        slug: "jupyter",
        name: "Jupyter",
      },
      {
        id: "fastapi",
        slug: "fastapi",
        name: "FastAPI",
        icon: "/assets/tech/fastapi.svg",
      },
    ],
    coverImage: {
      id: "callcenter-frustration-ai-cover",
      type: "image",
      role: "cover",
      storagePath: "/assets/projects-mockup/call_center_ai.png",
      alt: "Identité visuelle du projet Call Center AI",
      width: 1536,
      height: 1024,
      sortOrder: 0,
    },
    gallery: [],
    links: [
      {
        id: "callcenter-frustration-ai-github",
        type: "github",
        label: "GitHub",
        url: "https://github.com/SoufianeAzerdaoui/CallCenter-Frustration-Detection",
      },
    ],
    contributors: [
      {
        name: "Soufiane Azerdaoui",
      },
    ],
    year: 2025,
    duration: "2 mois",
    role: "Projet individuel",
    organization: "Projet individuel",
    featured: true,
    featuredOrder: 3,
    publishedAt: null,
  },
  {
    id: "real-time-ecommerce-activity-tracking",
    slug: "real-time-ecommerce-activity-tracking",
    status: "published",
    type: "personal",
    domain: "data-engineering",
    content: {
      fr: {
        title: "Real-time E-commerce Activity Tracking",
        shortDescription:
          "Système de suivi en temps réel des interactions utilisateurs d’un site e-commerce, combinant React, Flask, Kafka et Spark pour collecter et traiter les événements de navigation.",
        caseStudy: {
          problem:
            "Les plateformes e-commerce génèrent de nombreux événements utilisateurs, notamment les clics et interactions de navigation, dont l’analyse peut aider à mieux comprendre les comportements et parcours clients.",
          approach:
            "Le projet met en place un système de click tracking capable de collecter les interactions depuis une interface React, de les transmettre au backend Flask puis de les traiter à l’aide de Kafka et Spark.",
          architecture:
            "Pipeline de suivi d’activité en temps réel reliant les interactions utilisateur, le frontend React, le tracking d’événements, le backend Flask, Apache Kafka et Apache Spark pour le traitement et l’analyse.",
          architectureSteps: [
            "User interaction / Click",
            "React frontend",
            "Event tracking",
            "Flask backend",
            "Apache Kafka",
            "Apache Spark",
            "Real-time processing / analysis",
          ],
          results: [],
        },
      },
    },
    categories: [
      {
        id: "data-engineering",
        slug: "data-engineering",
        name: "Data Engineering",
      },
      {
        id: "real-time-analytics",
        slug: "real-time-analytics",
        name: "Real-time Analytics",
      },
      {
        id: "big-data",
        slug: "big-data",
        name: "Big Data",
      },
      {
        id: "web-development",
        slug: "web-development",
        name: "Web Development",
      },
    ],
    technologies: [
      {
        id: "react",
        slug: "react",
        name: "React",
      },
      {
        id: "flask",
        slug: "flask",
        name: "Flask",
      },
      {
        id: "apache-kafka",
        slug: "apache-kafka",
        name: "Apache Kafka",
      },
      {
        id: "apache-spark",
        slug: "apache-spark",
        name: "Apache Spark",
      },
      {
        id: "tailwind-css",
        slug: "tailwind-css",
        name: "Tailwind CSS",
      },
    ],
    coverImage: {
      id: "real-time-ecommerce-activity-tracking-cover",
      type: "image",
      role: "cover",
      storagePath: "/assets/projects-mockup/reel_time_tracking_activity.png",
      alt: "Identité visuelle du projet Real-time E-commerce Activity Tracking",
      width: 1254,
      height: 1254,
      sortOrder: 0,
    },
    gallery: [],
    links: [
      {
        id: "real-time-ecommerce-activity-tracking-github",
        type: "github",
        label: "GitHub",
        url: "https://github.com/SoufianeAzerdaoui/Real-time-User-Activity-Tracking-in-E-commerce-website",
      },
    ],
    contributors: [
      {
        name: "Soufiane Azerdaoui",
      },
      {
        name: "Mustapha Mensouri",
      },
    ],
    year: 2024,
    role: "Projet réalisé en équipe de 2 personnes",
    featured: false,
    featuredOrder: null,
    publishedAt: null,
  },
  {
    id: "personalized-recommendation-system",
    slug: "personalized-recommendation-system",
    status: "published",
    type: "academic",
    domain: "ai-ml",
    content: {
      fr: {
        title: "Personalized Recommendation System",
        shortDescription:
          "Plateforme de recommandation personnalisée combinant traitement batch et streaming pour générer des recommandations en temps réel et analyser leurs performances.",
      },
    },
    categories: [
      {
        id: "recommender-systems",
        slug: "recommender-systems",
        name: "Recommender Systems",
      },
      {
        id: "machine-learning",
        slug: "machine-learning",
        name: "Machine Learning",
      },
      {
        id: "data-engineering",
        slug: "data-engineering",
        name: "Data Engineering",
      },
      {
        id: "real-time-analytics",
        slug: "real-time-analytics",
        name: "Real-time Analytics",
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
        id: "apache-spark",
        slug: "apache-spark",
        name: "Apache Spark",
      },
      {
        id: "pyspark",
        slug: "pyspark",
        name: "PySpark",
      },
      {
        id: "delta-lake",
        slug: "delta-lake",
        name: "Delta Lake",
      },
      {
        id: "apache-kafka",
        slug: "apache-kafka",
        name: "Apache Kafka",
      },
      {
        id: "fastapi",
        slug: "fastapi",
        name: "FastAPI",
        icon: "/assets/tech/fastapi.svg",
      },
      {
        id: "power-bi",
        slug: "power-bi",
        name: "Power BI",
      },
    ],
    searchKeywords: [
      "personalized_recommendation_sys",
      "recommendation",
      "recommender",
      "ALS",
      "Item-to-Item",
      "Hybrid Recommender",
      "Hybrid Recommendation",
      "Reranking",
      "CSV .gz",
      "PySpark batch",
      "Spark Structured Streaming",
      "MLlib",
      "Kafka Producer",
      "Kafka Topics",
      "Feature Store",
      "Offline Top-N Recommendations",
      "Real-time Recommendations Top 10",
      "KPIs",
      "trends",
    ],
    coverImage: {
      id: "personalized-recommendation-system-cover",
      type: "image",
      role: "cover",
      storagePath:
        "/assets/projects-mockup/personalized-recommendation-system-cover.png",
      alt: "Cover du projet Personalized Recommendation System",
      width: 1536,
      height: 512,
      sortOrder: 0,
    },
    gallery: [],
    links: [
      {
        id: "personalized-recommendation-system-github",
        type: "github",
        label: "GitHub",
        url: "https://github.com/SoufianeAzerdaoui/personalized_recommendation_sys",
      },
    ],
    contributors: [
      {
        name: "Soufiane Azerdaoui",
      },
    ],
    year: 2026,
    duration: "1 mois et demi",
    role: "Projet individuel",
    organization: "Projet individuel",
    featured: false,
    featuredOrder: null,
    publishedAt: null,
  },
  {
    id: "bank-credit-decision-support-system",
    slug: "bank-credit-decision-support-system",
    status: "published",
    type: "academic",
    domain: "data-analytics",
    content: {
      fr: {
        title: "Bank Credit Decision Support System",
        shortDescription:
          "Système d’aide à la décision pour estimer l’acceptation d’un crédit à partir de données préparées et analysées, avec des modèles de machine learning servis via Flask.",
      },
    },
    categories: [
      {
        id: "data-analytics",
        slug: "data-analytics",
        name: "Data Analytics",
      },
      {
        id: "machine-learning",
        slug: "machine-learning",
        name: "Machine Learning",
      },
      {
        id: "decision-support",
        slug: "decision-support",
        name: "Decision Support",
      },
      {
        id: "credit-risk",
        slug: "credit-risk",
        name: "Credit Risk",
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
        id: "flask",
        slug: "flask",
        name: "Flask",
      },
    ],
    searchKeywords: [
      "Decision-Support-System-for-Banks-using-Python-Machine-Learning-and-Flask",
      "bank",
      "credit",
      "decision",
      "credit approval",
      "credit approval status",
      "Kaggle",
      "data cleaning",
      "preprocessing",
      "exploratory data analysis",
      "EDA",
      "model comparison",
      "model optimization",
      "Flask application",
      "saisie utilisateur",
    ],
    coverImage: {
      id: "bank-credit-decision-support-system-cover",
      type: "image",
      role: "cover",
      storagePath:
        "/assets/projects-mockup/bank-credit-decision-support-system-cover.png",
      alt: "Cover du projet Bank Credit Decision Support System",
      width: 1536,
      height: 512,
      sortOrder: 0,
    },
    gallery: [],
    links: [
      {
        id: "bank-credit-decision-support-system-github",
        type: "github",
        label: "GitHub",
        url: "https://github.com/SoufianeAzerdaoui/Decision-Support-System-for-Banks-using-Python-Machine-Learning-and-Flask",
      },
    ],
    contributors: [
      {
        name: "Soufiane Azerdaoui",
      },
    ],
    year: 2024,
    role: "Projet individuel",
    organization: "Projet individuel",
    featured: false,
    featuredOrder: null,
    publishedAt: null,
  },
] satisfies Project[];
