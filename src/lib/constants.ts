import type {
  Character,
  ChallengeStatus,
  CollaborationMode,
  CollaborationPace,
  Commitment,
  Goal,
  HackathonAvailability,
  HackathonGoal,
  HackathonLocationType,
  Level,
  LookingFor,
  ProjectAsset,
  ProjectDuration,
  ProjectType,
  RoleType,
  ShowcaseCategory,
  ShowcaseReaction,
  ShowcaseStatus,
  Stage,
} from "@/db/schema";

export const ROLE_LABELS: Record<RoleType, string> = {
  FRONTEND: "Frontend",
  BACKEND: "Backend",
  FULLSTACK: "Full-stack",
  UI_UX: "UI/UX",
  MOBILE: "Mobile",
  AI_ML: "AI/ML",
  PRODUCT: "Product",
  MARKETING: "Marketing",
};

export const ROLE_OPTIONS = Object.keys(ROLE_LABELS) as RoleType[];

export const LEVEL_LABELS: Record<Level, string> = {
  LEARNING: "Uczę się",
  BUILDING: "Buduję",
  EXPERIENCED: "Doświadczony",
};

export const LEVEL_DESCRIPTIONS: Record<Level, string> = {
  LEARNING: "Znam podstawy i chcę zrobić prawdziwy projekt.",
  BUILDING: "Potrafię samodzielnie tworzyć mniejsze rzeczy.",
  EXPERIENCED: "Mam praktykę i mogę poprowadzić część projektu.",
};

export const LEVEL_OPTIONS = Object.keys(LEVEL_LABELS) as Level[];
export const LEVEL_ORDER: Record<Level, number> = { LEARNING: 0, BUILDING: 1, EXPERIENCED: 2 };

export const COMMITMENT_LABELS: Record<Commitment, string> = {
  "1-2": "1–2h / tydzień",
  "3-5": "3–5h / tydzień",
  "5-10": "5–10h / tydzień",
  "10+": "10h+ / tydzień",
};
export const COMMITMENT_OPTIONS = Object.keys(COMMITMENT_LABELS) as Commitment[];

export const GOAL_LABELS: Record<Goal, string> = {
  LEARNING: "Nauka",
  PORTFOLIO: "Portfolio",
  FUN: "Dla zabawy",
  STARTUP: "Startup",
  EXPERIMENT: "Eksperyment",
  COMMERCIAL: "Potencjalnie komercyjny",
};
export const GOAL_OPTIONS = Object.keys(GOAL_LABELS) as Goal[];

export const LOOKING_FOR_LABELS: Record<LookingFor, string> = {
  HAS_PROJECT: "Mam projekt i szukam ludzi",
  WANTS_PROJECT: "Chcę dołączyć do projektu lub startupu",
  OPEN_TO_BUILD: "Chcę poznać ludzi i wspólnie coś zbudować",
  COFOUNDER: "Szukam co-foundera lub projektu founderskiego",
  FULL_TIME: "Jestem otwarty na pracę na pełen etat",
  FREELANCE: "Jestem otwarty na freelance",
  INTERNSHIP: "Szukam stażu",
  NETWORKING: "Chcę rozwijać sieć kontaktów",
};
export const LOOKING_FOR_OPTIONS = Object.keys(LOOKING_FOR_LABELS) as LookingFor[];

export const STAGE_LABELS: Record<Stage, string> = {
  IDEA: "Pomysł",
  DESIGN: "Projektowanie",
  BUILDING: "Budowa",
  TESTING: "Testowanie",
  LAUNCHED: "Uruchomiony",
};
export const STAGE_OPTIONS = Object.keys(STAGE_LABELS) as Stage[];

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  WEB_APP: "Aplikacja webowa",
  MOBILE_APP: "Aplikacja mobilna",
  SAAS: "SaaS",
  OPEN_SOURCE: "Open source",
  DEV_TOOL: "Narzędzie dla developerów",
  AI_ML: "AI / ML",
  GAME: "Gra",
  MARKETPLACE: "Marketplace",
  ECOMMERCE: "E-commerce",
  COMMUNITY: "Społeczność",
  OTHER: "Inny",
};
export const PROJECT_TYPE_OPTIONS = Object.keys(PROJECT_TYPE_LABELS) as ProjectType[];

export const PROJECT_ASSET_LABELS: Record<ProjectAsset, string> = {
  RESEARCH: "Research",
  DESIGN: "Design",
  LANDING: "Landing page",
  REPOSITORY: "Repozytorium",
  PROTOTYPE: "Prototyp",
  MVP: "MVP",
  USERS: "Pierwsi użytkownicy",
  REVENUE: "Przychód",
};
export const PROJECT_ASSET_OPTIONS = Object.keys(PROJECT_ASSET_LABELS) as ProjectAsset[];

export const COLLABORATION_MODE_LABELS: Record<CollaborationMode, string> = {
  REMOTE: "Zdalnie",
  HYBRID: "Hybrydowo",
  LOCAL: "Lokalnie",
};
export const COLLABORATION_MODE_OPTIONS = Object.keys(COLLABORATION_MODE_LABELS) as CollaborationMode[];

export const COLLABORATION_PACE_LABELS: Record<CollaborationPace, string> = {
  RELAXED: "Luźne tempo",
  REGULAR: "Regularne tempo",
  INTENSIVE: "Intensywne tempo",
};
export const COLLABORATION_PACE_OPTIONS = Object.keys(COLLABORATION_PACE_LABELS) as CollaborationPace[];

export const PROJECT_DURATION_LABELS: Record<ProjectDuration, string> = {
  WEEKEND: "Weekend / hackathon",
  "1_2_MONTHS": "1–2 miesiące",
  "3_6_MONTHS": "3–6 miesięcy",
  LONG_TERM: "Długoterminowo",
};
export const PROJECT_DURATION_OPTIONS = Object.keys(PROJECT_DURATION_LABELS) as ProjectDuration[];

export const CHARACTER_LABELS: Record<Character, string> = {
  LEARNING: "Nauka",
  PORTFOLIO: "Portfolio",
  HOBBY: "Hobby",
  STARTUP: "Startup",
  COMMERCIAL: "Potencjalnie komercyjny",
};
export const CHARACTER_OPTIONS = Object.keys(CHARACTER_LABELS) as Character[];

export const INTEREST_OPTIONS = [
  "AI",
  "SaaS",
  "Education",
  "Fintech",
  "Productivity",
  "Social",
  "Health",
  "Fitness",
  "Developer Tools",
  "Games",
  "E-commerce",
  "Creator Tools",
  "Automation",
];

export const SKILL_GROUPS: Record<string, string[]> = {
  Frontend: [
    "React",
    "Next.js",
    "Vue",
    "Nuxt",
    "Svelte",
    "SvelteKit",
    "Angular",
    "Astro",
    "JavaScript",
    "TypeScript",
    "HTML/CSS",
    "Tailwind CSS",
  ],
  Backend: [
    "Node.js",
    "Express",
    "NestJS",
    "Python",
    "FastAPI",
    "Django",
    "Flask",
    "Go",
    "Java",
    "Spring Boot",
    "C#/.NET",
    "PHP",
    "Laravel",
    "PostgreSQL",
    "MySQL",
    "SQLite",
    "Redis",
    "Supabase",
    "Firebase",
  ],
  Mobile: ["React Native", "Expo", "Flutter", "Swift", "SwiftUI", "Kotlin", "Jetpack Compose"],
  AI: [
    "OpenAI API",
    "Anthropic API",
    "Gemini API",
    "LLM",
    "RAG",
    "AI Agents",
    "LangChain",
    "LlamaIndex",
    "Embeddings",
    "pgvector",
    "Pinecone",
  ],
  Design: ["Figma", "FigJam", "UI Design", "UX", "UX Research", "User Research", "Wireframing", "Prototyping", "Design Systems", "Product Design", "Information Architecture", "Framer", "Webflow", "Branding", "Graphic Design", "Adobe Illustrator", "Photoshop"],
  DevOps: ["Docker", "Vercel", "Railway", "AWS", "Google Cloud", "Azure", "GitHub Actions", "CI/CD"],
  Data: ["Drizzle ORM", "Prisma", "MongoDB", "Neon", "PlanetScale", "Turso"],
  Integrations: ["Stripe", "Auth.js", "Clerk", "Resend", "REST API", "GraphQL", "WebSockets"],
  Product: ["Product Discovery", "Product Strategy", "Roadmapping", "Analytics", "User Research", "UX Research", "Agile", "Scrum", "SEO", "Copywriting", "Growth"],
  Marketing: ["Growth", "SEO", "Copywriting", "Content Marketing", "Performance Marketing", "Social Media", "Email Marketing", "Community", "Analytics", "Sales", "Branding"],
  Business: ["Business Strategy", "Sales", "Fundraising", "Pitching", "Market Research", "Community"],
  "Data & AI": ["Data Analysis", "Machine Learning", "Data Visualization", "Automation", "SQL"],
};

export const ALL_SKILLS = Object.values(SKILL_GROUPS).flat();

export const REPORT_REASON_LABELS: Record<string, string> = {
  spam: "Spam",
  scam: "Scam",
  harassment: "Harassment",
  inappropriate: "Inappropriate content",
  other: "Other",
};


export const SHOWCASE_CATEGORY_LABELS: Record<ShowcaseCategory, string> = {
  AI: "AI",
  WEB: "Web",
  MOBILE: "Mobile",
  GAMES: "Games",
  EDUCATION: "Education",
  SAAS: "SaaS",
  DEVTOOLS: "DevTools",
  OTHER: "Other",
};

export const SHOWCASE_STATUS_LABELS: Record<ShowcaseStatus, string> = {
  MVP: "MVP",
  LIVE: "Working product",
  EXPERIMENT: "Experiment",
};

export const SHOWCASE_REACTION_LABELS: Record<ShowcaseReaction, string> = {
  APPLAUSE: "Great work",
  IDEA: "Interesting idea",
  POTENTIAL: "Has potential",
};

export const HACKATHON_LOCATION_LABELS: Record<HackathonLocationType, string> = {
  ONLINE: "Online",
  ONSITE: "On-site",
  HYBRID: "Hybrid",
};

export const HACKATHON_GOAL_LABELS: Record<HackathonGoal, string> = {
  COMPETE: "I want to compete for a strong result",
  BUILD: "I mainly want to build something",
  NETWORK: "Networking and meeting people",
};

export const HACKATHON_AVAILABILITY_LABELS: Record<HackathonAvailability, string> = {
  FULL_EVENT: "Full event",
  MOST_EVENT: "Most of the event",
  LIMITED: "Limited availability",
};

export const CHALLENGE_STATUS_LABELS: Record<ChallengeStatus, string> = {
  OPEN: "Registration",
  BUILDING: "Building",
  VOTING: "Voting",
  CLOSED: "Finished",
};
