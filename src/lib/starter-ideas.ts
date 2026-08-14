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
    tagline: "Prosta aplikacja do dzielenia wspólnych wydatków w grupach znajomych, na wyjazdach i przy wspólnym mieszkaniu.",
    author: "Mikołaj K.",
    role: "Product",
    lookingFor: ["Frontend", "UI/UX"],
    interests: ["Fintech", "SaaS", "Productivity"],
    commitment: "5–10h / tydzień",
    note: "Kierunek na małe MVP: szybkie dodawanie wydatków, saldo grupy i rozliczenie jednym kliknięciem.",
    interestedCount: 4,
  },
  {
    slug: "local-sport-buddy",
    name: "Local Sport Buddy",
    tagline: "Miejsce do znajdowania ludzi do biegania, tenisa i innych lokalnych aktywności bez przeglądania wielu grup na Facebooku.",
    author: "Ola N.",
    role: "Product / Community",
    lookingFor: ["Mobile", "Designer"],
    interests: ["Lifestyle", "Community", "Mobile"],
    commitment: "3–5h / tydzień",
    note: "Najpierw jedno miasto i kilka dyscyplin, żeby sprawdzić, czy ludzie faktycznie umawiają się przez produkt.",
    interestedCount: 3,
  },
  {
    slug: "intern-track",
    name: "InternTrack",
    tagline: "Narzędzie dla studentów do śledzenia rekrutacji na staże i junior joby: statusy, terminy, kontakty i notatki.",
    author: "Patryk W.",
    role: "Full-stack",
    lookingFor: ["Product", "Frontend"],
    interests: ["Career", "Productivity", "EdTech"],
    commitment: "5–10h / tydzień",
    note: "Pomysł zakłada prosty panel zamiast kolejnego rozbudowanego systemu ATS dla kandydatów.",
    interestedCount: 5,
  },
  {
    slug: "study-circle",
    name: "StudyCircle",
    tagline: "Małe grupy nauki i accountability dla studentów oraz osób uczących się programowania, języków albo nowych narzędzi.",
    author: "Ania K.",
    role: "UX / Product",
    lookingFor: ["Full-stack", "Frontend"],
    interests: ["EdTech", "Community", "Productivity"],
    commitment: "3–8h / tydzień",
    note: "Pierwsza wersja mogłaby skupić się tylko na tygodniowym celu, check-inie i małej grupie 3–5 osób.",
    interestedCount: 6,
  },
  {
    slug: "build-journal",
    name: "Build Journal",
    tagline: "Minimalny dziennik pracy nad side-projectami: tygodniowy cel, krótki update i historia tego, co faktycznie zostało dowiezione.",
    author: "Michał C.",
    role: "Product",
    lookingFor: ["Frontend", "Backend"],
    interests: ["Creator tools", "SaaS", "Productivity"],
    commitment: "około 5h / tydzień",
    note: "Bez rozbudowanego project managementu — tylko prosty rytm, który pomaga nie porzucać projektu po pierwszym tygodniu.",
    interestedCount: 2,
  },
  {
    slug: "freelancer-booking",
    name: "Simple Booking for Freelancers",
    tagline: "Lekki system umawiania konsultacji i małych usług dla freelancerów, którzy nie potrzebują pełnego CRM ani rozbudowanej platformy.",
    author: "Kuba B.",
    role: "Backend",
    lookingFor: ["Frontend", "Product"],
    interests: ["SaaS", "Freelancers", "B2B"],
    commitment: "5–10h / tydzień",
    note: "MVP: dostępne terminy, prosty formularz klienta i potwierdzenie spotkania. Bez budowania całego kalendarza od zera.",
    interestedCount: 3,
  },
];
