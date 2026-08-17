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
  LEARNING: "Learning",
  BUILDING: "Building",
  EXPERIENCED: "Experienced",
};

export const LEVEL_DESCRIPTIONS: Record<Level, string> = {
  LEARNING: "I know the basics and want to build a real project.",
  BUILDING: "I can independently build smaller things.",
  EXPERIENCED: "I have hands-on experience and can lead part of a project.",
};

export const LEVEL_OPTIONS = Object.keys(LEVEL_LABELS) as Level[];
export const LEVEL_ORDER: Record<Level, number> = { LEARNING: 0, BUILDING: 1, EXPERIENCED: 2 };

export const COMMITMENT_LABELS: Record<Commitment, string> = {
  "1-2": "1–2h / week",
  "3-5": "3–5h / week",
  "5-10": "5–10h / week",
  "10+": "10h+ / week",
};
export const COMMITMENT_OPTIONS = Object.keys(COMMITMENT_LABELS) as Commitment[];

export const GOAL_LABELS: Record<Goal, string> = {
  LEARNING: "Learning",
  PORTFOLIO: "Portfolio",
  FUN: "For fun",
  STARTUP: "Startup",
  EXPERIMENT: "Experiment",
  COMMERCIAL: "Potentially commercial",
};
export const GOAL_OPTIONS = Object.keys(GOAL_LABELS) as Goal[];

export const LOOKING_FOR_LABELS: Record<LookingFor, string> = {
  HAS_PROJECT: "I have a project and need teammates",
  WANTS_PROJECT: "Projects and startup teams",
  OPEN_TO_BUILD: "Meeting people to build with",
  COFOUNDER: "Co-founder opportunities",
  FULL_TIME: "Full-time opportunities",
  FREELANCE: "Freelance work",
  INTERNSHIP: "Internships",
  NETWORKING: "Professional networking",
};
export const LOOKING_FOR_OPTIONS = Object.keys(LOOKING_FOR_LABELS) as LookingFor[];

export const STAGE_LABELS: Record<Stage, string> = {
  IDEA: "Idea",
  DESIGN: "Design",
  BUILDING: "Building",
  TESTING: "Testing",
  LAUNCHED: "Launched",
};
export const STAGE_OPTIONS = Object.keys(STAGE_LABELS) as Stage[];

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  WEB_APP: "Web app",
  MOBILE_APP: "Mobile app",
  SAAS: "SaaS",
  OPEN_SOURCE: "Open source",
  DEV_TOOL: "Developer tool",
  AI_ML: "AI / ML",
  GAME: "Game",
  MARKETPLACE: "Marketplace",
  ECOMMERCE: "E-commerce",
  COMMUNITY: "Community",
  OTHER: "Other",
};
export const PROJECT_TYPE_OPTIONS = Object.keys(PROJECT_TYPE_LABELS) as ProjectType[];

export const PROJECT_ASSET_LABELS: Record<ProjectAsset, string> = {
  RESEARCH: "Research",
  DESIGN: "Design",
  LANDING: "Landing page",
  REPOSITORY: "Repository",
  PROTOTYPE: "Prototype",
  MVP: "MVP",
  USERS: "First users",
  REVENUE: "Revenue",
};
export const PROJECT_ASSET_OPTIONS = Object.keys(PROJECT_ASSET_LABELS) as ProjectAsset[];

export const COLLABORATION_MODE_LABELS: Record<CollaborationMode, string> = {
  REMOTE: "Remote",
  HYBRID: "Hybrid",
  LOCAL: "Local",
};
export const COLLABORATION_MODE_OPTIONS = Object.keys(COLLABORATION_MODE_LABELS) as CollaborationMode[];

export const COLLABORATION_PACE_LABELS: Record<CollaborationPace, string> = {
  RELAXED: "Relaxed pace",
  REGULAR: "Regular pace",
  INTENSIVE: "Intensive pace",
};
export const COLLABORATION_PACE_OPTIONS = Object.keys(COLLABORATION_PACE_LABELS) as CollaborationPace[];

export const PROJECT_DURATION_LABELS: Record<ProjectDuration, string> = {
  WEEKEND: "Weekend / hackathon",
  "1_2_MONTHS": "1–2 months",
  "3_6_MONTHS": "3–6 months",
  LONG_TERM: "Long term",
};
export const PROJECT_DURATION_OPTIONS = Object.keys(PROJECT_DURATION_LABELS) as ProjectDuration[];

export const CHARACTER_LABELS: Record<Character, string> = {
  LEARNING: "Learning",
  PORTFOLIO: "Portfolio",
  HOBBY: "Hobby",
  STARTUP: "Startup",
  COMMERCIAL: "Potentially commercial",
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
  Design: ["Figma", "UI Design", "UX", "Design Systems", "Framer", "Webflow"],
  DevOps: ["Docker", "Vercel", "Railway", "AWS", "Google Cloud", "Azure", "GitHub Actions", "CI/CD"],
  Data: ["Drizzle ORM", "Prisma", "MongoDB", "Neon", "PlanetScale", "Turso"],
  Integrations: ["Stripe", "Auth.js", "Clerk", "Resend", "REST API", "GraphQL", "WebSockets"],
  Product: ["Product Discovery", "Analytics", "SEO", "Copywriting", "Growth", "User Research"],
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
