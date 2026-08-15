import {
  BarChart3,
  Bot,
  BrainCircuit,
  Code2,
  Gamepad2,
  Globe2,
  GraduationCap,
  HeartPulse,
  PackageOpen,
  ShoppingBasket,
  Smartphone,
  Store,
  TerminalSquare,
  UsersRound,
} from "lucide-react";
import type { ProjectType } from "@/db/schema";

type VisualKind =
  | "shopping"
  | "web"
  | "mobile"
  | "ai"
  | "devtool"
  | "marketplace"
  | "community"
  | "game"
  | "opensource"
  | "data"
  | "bot"
  | "health"
  | "education"
  | "generic";

const TYPE_KIND: Partial<Record<ProjectType, VisualKind>> = {
  WEB_APP: "web",
  MOBILE_APP: "mobile",
  SAAS: "web",
  OPEN_SOURCE: "opensource",
  DEV_TOOL: "devtool",
  AI_ML: "ai",
  GAME: "game",
  MARKETPLACE: "marketplace",
  ECOMMERCE: "shopping",
  COMMUNITY: "community",
};

export function inferProjectVisualKind(input: {
  projectType?: ProjectType | null;
  name: string;
  tagline: string;
  technologies?: string[];
}): VisualKind {
  if (input.projectType && TYPE_KIND[input.projectType]) {
    return TYPE_KIND[input.projectType] as VisualKind;
  }

  const haystack = [input.name, input.tagline, ...(input.technologies ?? [])]
    .join(" ")
    .toLocaleLowerCase("pl");

  if (/koszyk|zakup|sklep|cena|cenow|promoc|market|grocery|retail/.test(haystack)) return "shopping";
  if (/bot|telegram|discord|chatbot/.test(haystack)) return "bot";
  if (/anality|statyst|dashboard|data|metryk|raport/.test(haystack)) return "data";
  if (/zdrow|health|fit|sport|trening|medycz/.test(haystack)) return "health";
  if (/eduk|student|study|nauka|kurs|school/.test(haystack)) return "education";
  if (/npm|repo|github|developer|devtool|api|sdk|cli|terminal/.test(haystack)) return "devtool";
  if (/community|społecz|spolecz|grupa|forum/.test(haystack)) return "community";
  if (/game|gaming|gra\b|gry\b/.test(haystack)) return "game";
  if (/mobile|android|ios|react native|flutter/.test(haystack)) return "mobile";
  if (/\bai\b|\bml\b|agent|model|llm|gemini|openai/.test(haystack)) return "ai";
  if (/marketplace|ogłoszen|ogloszen|sprzedaj|sprzedaż/.test(haystack)) return "marketplace";
  if (/open source|opensource/.test(haystack)) return "opensource";
  if (/next\.js|react|vue|svelte|web/.test(haystack)) return "web";
  return "generic";
}

export function inferProjectCategoryLabel(kind: VisualKind) {
  switch (kind) {
    case "shopping":
      return "Porównywarka";
    case "ai":
      return "AI / ML";
    case "devtool":
      return "Narzędzie dev";
    case "marketplace":
      return "Marketplace";
    case "community":
      return "Community";
    case "game":
      return "Gra";
    case "opensource":
      return "Open source";
    case "data":
      return "Analityka";
    case "bot":
      return "Bot";
    case "health":
      return "Zdrowie";
    case "education":
      return "Edukacja";
    case "mobile":
      return "Mobile";
    case "web":
      return "Web";
    default:
      return "Projekt cyfrowy";
  }
}

export function ProjectIdentityMark({
  name,
  tagline,
  projectType,
  technologies,
  size = "md",
}: {
  name: string;
  tagline: string;
  projectType?: ProjectType | null;
  technologies?: string[];
  size?: "sm" | "md";
}) {
  const kind = inferProjectVisualKind({ name, tagline, projectType, technologies });
  const Icon = iconForKind(kind);
  const dimensions = size === "sm" ? "h-11 w-11" : "h-14 w-14";
  const iconSize = size === "sm" ? "h-5 w-5" : "h-6 w-6";

  return (
    <div
      className={`inline-flex ${dimensions} shrink-0 items-center justify-center rounded-[8px] border border-[color-mix(in_srgb,var(--bc-accent)_36%,var(--bc-line))] bg-[color-mix(in_srgb,var(--bc-accent)_13%,var(--bc-surface))] text-[color-mix(in_srgb,var(--bc-accent)_72%,var(--bc-ink))]`}
      aria-hidden="true"
    >
      <Icon className={iconSize} strokeWidth={1.8} />
    </div>
  );
}

function iconForKind(kind: VisualKind) {
  switch (kind) {
    case "shopping":
      return ShoppingBasket;
    case "web":
      return Globe2;
    case "mobile":
      return Smartphone;
    case "ai":
      return BrainCircuit;
    case "devtool":
      return TerminalSquare;
    case "marketplace":
      return Store;
    case "community":
      return UsersRound;
    case "game":
      return Gamepad2;
    case "opensource":
      return PackageOpen;
    case "data":
      return BarChart3;
    case "bot":
      return Bot;
    case "health":
      return HeartPulse;
    case "education":
      return GraduationCap;
    default:
      return Code2;
  }
}
