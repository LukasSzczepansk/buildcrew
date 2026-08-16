export type StarterIdea = {
  slug: string;
  name: string;
  tagline: string;
  author: string;
  role: string;
  lookingFor: string[];
  interests: string[];
  commitment: string;
  note: string;
  interestedCount: number;
};

export const STARTER_IDEAS: StarterIdea[] = [
  {
    slug: "split-budget",
    name: "SplitBudget for Friends",
    tagline: "A simple app for splitting shared expenses with friends, on trips and in shared apartments.",
    author: "Mikolaj K.",
    role: "Product",
    lookingFor: ["Frontend", "UI/UX"],
    interests: ["Fintech", "SaaS", "Productivity"],
    commitment: "5–10h / week",
    note: "A small MVP: quick expense entry, group balance and one-click settlement.",
    interestedCount: 4,
  },
  {
    slug: "local-sport-buddy",
    name: "Local Sport Buddy",
    tagline: "A place to find people for running, tennis and other local activities without searching through many Facebook groups.",
    author: "Ola N.",
    role: "Product / Community",
    lookingFor: ["Mobile", "Designer"],
    interests: ["Lifestyle", "Community", "Mobile"],
    commitment: "3–5h / week",
    note: "Start with one city and a few sports to see whether people actually arrange activities through the product.",
    interestedCount: 3,
  },
  {
    slug: "intern-track",
    name: "InternTrack",
    tagline: "A tool for students to track internship and junior-job applications: statuses, deadlines, contacts and notes.",
    author: "Patryk W.",
    role: "Full-stack",
    lookingFor: ["Product", "Frontend"],
    interests: ["Career", "Productivity", "EdTech"],
    commitment: "5–10h / week",
    note: "A simple candidate dashboard instead of another complex applicant tracking system.",
    interestedCount: 5,
  },
  {
    slug: "study-circle",
    name: "StudyCircle",
    tagline: "Small study and accountability groups for students and people learning programming, languages or new tools.",
    author: "Ania K.",
    role: "UX / Product",
    lookingFor: ["Full-stack", "Frontend"],
    interests: ["EdTech", "Community", "Productivity"],
    commitment: "3–8h / week",
    note: "The first version could focus only on a weekly goal, a check-in and small groups of 3–5 people.",
    interestedCount: 6,
  },
  {
    slug: "build-journal",
    name: "Build Journal",
    tagline: "A minimal side-project journal: weekly goal, short update and a history of what actually shipped.",
    author: "Michal C.",
    role: "Product",
    lookingFor: ["Frontend", "Backend"],
    interests: ["Creator tools", "SaaS", "Productivity"],
    commitment: "about 5h / week",
    note: "No heavy project management - just a simple rhythm that helps people avoid abandoning a project after week one.",
    interestedCount: 2,
  },
  {
    slug: "freelancer-booking",
    name: "Simple Booking for Freelancers",
    tagline: "A lightweight booking system for freelancers who do not need a full CRM or a complex service platform.",
    author: "Kuba B.",
    role: "Backend",
    lookingFor: ["Frontend", "Product"],
    interests: ["SaaS", "Freelancers", "B2B"],
    commitment: "5–10h / week",
    note: "MVP: available slots, a simple client form and meeting confirmation - without rebuilding an entire calendar system.",
    interestedCount: 3,
  },
];
