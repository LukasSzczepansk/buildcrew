import type { ProfileDiscipline, RoleType } from "@/db/schema";
import { SKILL_GROUPS } from "@/lib/constants";
import type { AppLocale } from "@/lib/site-config";

export const PROFILE_DISCIPLINES: ProfileDiscipline[] = [
  "DEVELOPMENT",
  "DESIGN",
  "PRODUCT",
  "FOUNDER_BUSINESS",
  "MARKETING_GROWTH",
  "DATA_AI",
  "OTHER",
];

const PL: Record<ProfileDiscipline, { label: string; description: string }> = {
  DEVELOPMENT: { label: "Programowanie", description: "Frontend, backend, full-stack, mobile i infrastruktura." },
  DESIGN: { label: "UX/UI / Design", description: "UX/UI, product design, research, branding i warstwa wizualna." },
  PRODUCT: { label: "Produkt", description: "Product management, discovery, strategia i rozwój produktu." },
  FOUNDER_BUSINESS: { label: "Founder / Biznes", description: "Startup, biznes, sprzedaż, strategia i budowanie zespołu." },
  MARKETING_GROWTH: { label: "Marketing / Growth", description: "Growth, performance, content, community, SEO i launch." },
  DATA_AI: { label: "Data / AI", description: "AI/ML, data, analityka, automatyzacja i rozwiązania oparte o dane." },
  OTHER: { label: "Inne", description: "Wybierz, jeśli nie mieścisz się w jednej z powyższych kategorii." },
};

const EN: typeof PL = {
  DEVELOPMENT: { label: "Programowanie", description: "Frontend, backend, full-stack, mobile and infrastructure." },
  DESIGN: { label: "UX/UI / Design", description: "UX/UI, product design, research, branding and visual work." },
  PRODUCT: { label: "Produkt", description: "Product management, discovery, strategy and product development." },
  FOUNDER_BUSINESS: { label: "Founder / Biznes", description: "Startups, business, sales, strategy and team building." },
  MARKETING_GROWTH: { label: "Marketing / Growth", description: "Growth, performance, content, community, SEO and launches." },
  DATA_AI: { label: "Data / AI", description: "AI/ML, data, analytics, automation and data-driven products." },
  OTHER: { label: "Other", description: "Choose this if none of the categories above describes you well." },
};

export function disciplineCopy(locale: AppLocale) {
  return locale === "en" ? EN : PL;
}

export const DISCIPLINE_ROLE_OPTIONS: Record<ProfileDiscipline, RoleType[]> = {
  DEVELOPMENT: ["FRONTEND", "BACKEND", "FULLSTACK", "MOBILE"],
  DESIGN: ["UI_UX"],
  PRODUCT: ["PRODUCT"],
  FOUNDER_BUSINESS: ["PRODUCT", "MARKETING"],
  MARKETING_GROWTH: ["MARKETING"],
  DATA_AI: ["AI_ML", "BACKEND"],
  OTHER: ["FRONTEND", "BACKEND", "FULLSTACK", "UI_UX", "MOBILE", "AI_ML", "PRODUCT", "MARKETING"],
};

const DESIGN_SKILLS = [
  "Figma", "FigJam", "UI Design", "UX", "UX Research", "User Research", "Wireframing", "Prototyping",
  "Design Systems", "Product Design", "Information Architecture", "Framer", "Webflow", "Branding", "Graphic Design",
  "Adobe Illustrator", "Photoshop",
];
const PRODUCT_SKILLS = ["Product Discovery", "Product Strategy", "Roadmapping", "Analytics", "User Research", "UX Research", "Agile", "Scrum", "Copywriting", "Growth"];
const FOUNDER_SKILLS = ["Product Strategy", "Product Discovery", "Business Strategy", "Sales", "Fundraising", "Pitching", "Market Research", "Growth", "Community", "Copywriting"];
const MARKETING_SKILLS = ["Growth", "SEO", "Copywriting", "Content Marketing", "Performance Marketing", "Social Media", "Email Marketing", "Community", "Analytics", "Sales", "Branding"];
const DATA_AI_SKILLS = [...SKILL_GROUPS.AI, "Python", "SQL", "Data Analysis", "Machine Learning", "Data Visualization", "Automation", ...SKILL_GROUPS.Data];
const DEVELOPMENT_SKILLS = [...SKILL_GROUPS.Frontend, ...SKILL_GROUPS.Backend, ...SKILL_GROUPS.Mobile, ...SKILL_GROUPS.DevOps, ...SKILL_GROUPS.Integrations];

export const DISCIPLINE_SKILLS: Record<ProfileDiscipline, string[]> = {
  DEVELOPMENT: DEVELOPMENT_SKILLS,
  DESIGN: DESIGN_SKILLS,
  PRODUCT: PRODUCT_SKILLS,
  FOUNDER_BUSINESS: FOUNDER_SKILLS,
  MARKETING_GROWTH: MARKETING_SKILLS,
  DATA_AI: DATA_AI_SKILLS,
  OTHER: Object.values(SKILL_GROUPS).flat(),
};

export function roleOptionsForDisciplines(disciplines: ProfileDiscipline[]) {
  return Array.from(new Set(disciplines.flatMap((discipline) => DISCIPLINE_ROLE_OPTIONS[discipline])));
}

export function skillsForDisciplines(disciplines: ProfileDiscipline[]) {
  return Array.from(new Set(disciplines.flatMap((discipline) => DISCIPLINE_SKILLS[discipline])));
}

export function portfolioPromptForDisciplines(disciplines: ProfileDiscipline[], locale: AppLocale) {
  const hasDesign = disciplines.includes("DESIGN");
  const hasMarketing = disciplines.includes("MARKETING_GROWTH");
  const hasDevelopment = disciplines.includes("DEVELOPMENT") || disciplines.includes("DATA_AI");
  const hasFounder = disciplines.includes("FOUNDER_BUSINESS") || disciplines.includes("PRODUCT");
  if (locale === "en") {
    if (hasDesign) return { title: "Show your work", description: "Add a screenshot of a design, case study or visual project. It will become your first native BuildCrew portfolio item.", example: "e.g. Finly mobile app redesign" };
    if (hasMarketing) return { title: "Show a case study", description: "Add a screenshot from a campaign, launch or growth experiment and explain what you were responsible for.", example: "e.g. Product launch campaign" };
    if (hasDevelopment) return { title: "Show something you built", description: "A product screenshot is optional, but it gives people a faster way to understand your work than a list of technologies.", example: "e.g. StudyFlow dashboard" };
    if (hasFounder) return { title: "Show what you are building", description: "If you already have a product, prototype or pitch visual, add one screenshot. You can also skip this and create a BuildCrew project later.", example: "e.g. MVP of my startup" };
    return { title: "Show your work", description: "If you have something visual that represents your work, add it now. You can always build your portfolio later.", example: "e.g. My latest project" };
  }
  if (hasDesign) return { title: "Pokaż swoją pracę", description: "Dodaj screen designu, case study albo projektu wizualnego. Stanie się pierwszą pracą w Twoim portfolio BuildCrew.", example: "np. Redesign aplikacji Finly" };
  if (hasMarketing) return { title: "Pokaż case study", description: "Dodaj screen kampanii, launchu albo eksperymentu growth i napisz, za co odpowiadałeś/aś.", example: "np. Kampania launchowa produktu" };
  if (hasDevelopment) return { title: "Pokaż coś, co zbudowałeś/aś", description: "Screen produktu jest opcjonalny, ale pozwala szybciej ocenić Twoją pracę niż sama lista technologii.", example: "np. Dashboard StudyFlow" };
  if (hasFounder) return { title: "Pokaż, co budujesz", description: "Jeśli masz już produkt, prototyp albo wizualizację pomysłu, dodaj jeden screen. Możesz też pominąć ten krok i utworzyć projekt później.", example: "np. MVP mojego startupu" };
  return { title: "Pokaż swoją pracę", description: "Jeśli masz coś wizualnego, co dobrze pokazuje Twoją pracę, dodaj to teraz. Portfolio możesz też uzupełnić później.", example: "np. Mój ostatni projekt" };
}
