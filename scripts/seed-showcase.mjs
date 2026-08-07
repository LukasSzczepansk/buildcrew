import dotenv from "dotenv";
import pg from "pg";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";

dotenv.config({ path: ".env.local" });
dotenv.config();

const { Client } = pg;
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("Brak DATABASE_URL. Ustaw połączenie z bazą BuildCrew i spróbuj ponownie.");
  process.exit(1);
}

function isLocalDatabase(url) {
  try {
    const host = new URL(url).hostname;
    return ["localhost", "127.0.0.1", "::1"].includes(host);
  } catch {
    return false;
  }
}

const isRemote = !isLocalDatabase(connectionString);
if (isRemote && process.env.ALLOW_SHOWCASE_SEED !== "true") {
  console.error("❌ Odmowa dodania danych demonstracyjnych do zdalnej bazy.");
  console.error("Jeśli świadomie chcesz zasilić produkcyjną bazę BuildCrew, ustaw jednorazowo ALLOW_SHOWCASE_SEED=true.");
  process.exit(1);
}

const client = new Client({ connectionString });

// Reserved .invalid domains cannot receive real mail. These accounts are display-only.
const builders = [
  {
    id: "71000000-0000-4000-8000-000000000001",
    email: "marta.codes@profiles.buildcrew.invalid",
    username: "marta.codes",
    avatar: "👩‍💻",
    role: "FRONTEND",
    level: "BUILDING",
    weeklyHours: "5-10",
    bio: "Frontend developerka skupiona na React i Next.js. Lubię projekty z krótkim feedback loopem, dopracowanym UI i konkretnym MVP zamiast rozbudowanej listy funkcji.",
    lookingFor: ["WANTS_PROJECT", "OPEN_TO_BUILD"],
    goals: ["PORTFOLIO", "STARTUP"],
    skills: ["React", "Next.js", "TypeScript", "Tailwind CSS", "TanStack Query"],
    interests: ["SaaS", "Productivity", "Creator Tools"],
    discord: "marta.codes",
  },
  {
    id: "71000000-0000-4000-8000-000000000002",
    email: "filip.backend@profiles.buildcrew.invalid",
    username: "filip.backend",
    avatar: "🧑‍💻",
    role: "BACKEND",
    level: "EXPERIENCED",
    weeklyHours: "3-5",
    bio: "Backend, API i bazy danych. Najchętniej wskakuję do małych produktów, w których można od początku dobrze poukładać model danych, auth i deployment.",
    lookingFor: ["WANTS_PROJECT", "OPEN_TO_BUILD"],
    goals: ["FUN", "PORTFOLIO"],
    skills: ["Node.js", "PostgreSQL", "REST API", "Docker", "Redis"],
    interests: ["Developer Tools", "Fintech", "Automation"],
    discord: "filip_backend",
  },
  {
    id: "71000000-0000-4000-8000-000000000003",
    email: "ania.ux@profiles.buildcrew.invalid",
    username: "ania.ux",
    avatar: "🎨",
    role: "UI_UX",
    level: "BUILDING",
    weeklyHours: "3-5",
    bio: "Projektuję proste flow produktowe, dashboardy i design systemy. Szukam projektów, w których design jest częścią procesu budowania, a nie tylko warstwą na końcu.",
    lookingFor: ["WANTS_PROJECT", "OPEN_TO_BUILD"],
    goals: ["PORTFOLIO", "LEARNING"],
    skills: ["Figma", "UX Research", "UI Design", "Design Systems", "Prototyping"],
    interests: ["Health", "Education", "Productivity"],
    discord: "ania_ux",
  },
  {
    id: "71000000-0000-4000-8000-000000000004",
    email: "damian.fullstack@profiles.buildcrew.invalid",
    username: "damian.fullstack",
    avatar: "⚡",
    role: "FULLSTACK",
    level: "EXPERIENCED",
    weeklyHours: "5-10",
    bio: "Full-stack z naciskiem na szybkie MVP. Mogę postawić produkt od schematu bazy, przez API i frontend, aż po pierwsze wdrożenie i monitoring.",
    lookingFor: ["HAS_PROJECT", "WANTS_PROJECT"],
    goals: ["STARTUP", "COMMERCIAL"],
    skills: ["Next.js", "Node.js", "PostgreSQL", "Docker", "Vercel", "AWS"],
    interests: ["SaaS", "E-commerce", "Fintech"],
    discord: "damian_fullstack",
  },
  {
    id: "71000000-0000-4000-8000-000000000005",
    email: "julia.frontend@profiles.buildcrew.invalid",
    username: "julia.frontend",
    avatar: "✨",
    role: "FRONTEND",
    level: "LEARNING",
    weeklyHours: "3-5",
    bio: "Uczę się TypeScriptu i Reacta poprzez budowanie prawdziwych ekranów. Najbardziej zależy mi na dobrym code review i dowiezieniu projektu do wersji publicznej.",
    lookingFor: ["WANTS_PROJECT", "OPEN_TO_BUILD"],
    goals: ["LEARNING", "PORTFOLIO"],
    skills: ["React", "JavaScript", "TypeScript", "HTML/CSS", "Tailwind CSS"],
    interests: ["Education", "Social", "Creator Tools"],
    discord: "julia_frontend",
  },
  {
    id: "71000000-0000-4000-8000-000000000006",
    email: "sebastian.ai@profiles.buildcrew.invalid",
    username: "sebastian.ai",
    avatar: "🤖",
    role: "AI_ML",
    level: "BUILDING",
    weeklyHours: "5-10",
    bio: "Buduję funkcje oparte o LLM-y, embeddingi i RAG. Interesują mnie konkretne zastosowania AI: wyszukiwanie, ekstrakcja danych i automatyzacja powtarzalnej pracy.",
    lookingFor: ["HAS_PROJECT", "OPEN_TO_BUILD"],
    goals: ["EXPERIMENT", "STARTUP"],
    skills: ["Python", "OpenAI API", "RAG", "pgvector", "FastAPI"],
    interests: ["AI", "Automation", "Developer Tools"],
    discord: "sebastian_ai",
  },
  {
    id: "71000000-0000-4000-8000-000000000007",
    email: "alicja.mobile@profiles.buildcrew.invalid",
    username: "alicja.mobile",
    avatar: "📱",
    role: "MOBILE",
    level: "BUILDING",
    weeklyHours: "3-5",
    bio: "React Native i Expo. Chcę budować aplikacje, które da się faktycznie zainstalować i przetestować z kilkoma użytkownikami, a nie kończyć na samym prototypie.",
    lookingFor: ["WANTS_PROJECT", "OPEN_TO_BUILD"],
    goals: ["PORTFOLIO", "FUN"],
    skills: ["React Native", "Expo", "TypeScript", "Firebase", "EAS"],
    interests: ["Fitness", "Health", "Travel"],
    discord: "alicja_mobile",
  },
  {
    id: "71000000-0000-4000-8000-000000000008",
    email: "weronika.product@profiles.buildcrew.invalid",
    username: "weronika.product",
    avatar: "🧭",
    role: "PRODUCT",
    level: "EXPERIENCED",
    weeklyHours: "3-5",
    bio: "Pomagam zamieniać luźny pomysł w mały, testowalny zakres. Lubię discovery, rozmowy z użytkownikami i pilnowanie, żeby MVP miało jeden wyraźny cel.",
    lookingFor: ["HAS_PROJECT", "OPEN_TO_BUILD"],
    goals: ["STARTUP", "EXPERIMENT"],
    skills: ["Product Discovery", "User Research", "Analytics", "Copywriting", "Roadmapping"],
    interests: ["Education", "SaaS", "Productivity"],
    discord: "weronika_product",
  },
  {
    id: "71000000-0000-4000-8000-000000000009",
    email: "tomek.devops@profiles.buildcrew.invalid",
    username: "tomek.devops",
    avatar: "🛠️",
    role: "BACKEND",
    level: "EXPERIENCED",
    weeklyHours: "1-2",
    bio: "Na co dzień infrastruktura i backend. Po godzinach mogę pomóc z CI/CD, kontenerami, bazą, logami i doprowadzeniem MVP do stabilnego wdrożenia.",
    lookingFor: ["WANTS_PROJECT", "OPEN_TO_BUILD"],
    goals: ["FUN", "EXPERIMENT"],
    skills: ["Docker", "GitHub Actions", "PostgreSQL", "AWS", "Observability"],
    interests: ["Developer Tools", "Automation", "SaaS"],
    discord: "tomek_devops",
  },
  {
    id: "71000000-0000-4000-8000-00000000000a",
    email: "karolina.design@profiles.buildcrew.invalid",
    username: "karolina.design",
    avatar: "🪄",
    role: "UI_UX",
    level: "EXPERIENCED",
    weeklyHours: "1-2",
    bio: "UI designerka z doświadczeniem w aplikacjach B2B. Najchętniej pomagam ekipom, które mają już działający produkt i chcą uporządkować UX przed testami.",
    lookingFor: ["WANTS_PROJECT"],
    goals: ["FUN", "PORTFOLIO"],
    skills: ["Figma", "UI Design", "Design Systems", "Accessibility", "Prototyping"],
    interests: ["Fintech", "SaaS", "E-commerce"],
    discord: "karolina_design",
  },
  {
    id: "71000000-0000-4000-8000-00000000000b",
    email: "monika.growth@profiles.buildcrew.invalid",
    username: "monika.growth",
    avatar: "📣",
    role: "MARKETING",
    level: "BUILDING",
    weeklyHours: "3-5",
    bio: "Content, landing pages i pierwsze kanały pozyskiwania użytkowników. Szukam małego produktu, który ma jasno określoną grupę odbiorców i da się szybko zweryfikować.",
    lookingFor: ["WANTS_PROJECT", "OPEN_TO_BUILD"],
    goals: ["STARTUP", "LEARNING"],
    skills: ["Content Marketing", "SEO", "Copywriting", "Analytics", "Landing Pages"],
    interests: ["Creator Tools", "Education", "E-commerce"],
    discord: "monika_growth",
  },
  {
    id: "71000000-0000-4000-8000-00000000000c",
    email: "wojtek.backend@profiles.buildcrew.invalid",
    username: "wojtek.backend",
    avatar: "🧩",
    role: "BACKEND",
    level: "BUILDING",
    weeklyHours: "5-10",
    bio: "Node.js, SQL i integracje z zewnętrznymi API. Lubię projekty, w których backend rozwiązuje konkretny problem zamiast tylko przenosić dane między ekranami.",
    lookingFor: ["HAS_PROJECT", "WANTS_PROJECT"],
    goals: ["PORTFOLIO", "STARTUP"],
    skills: ["Node.js", "PostgreSQL", "REST API", "Webhooks", "Stripe API"],
    interests: ["Fintech", "Automation", "SaaS"],
    discord: "wojtek_backend",
  },
  {
    id: "71000000-0000-4000-8000-00000000000d",
    email: "ola.mobile@profiles.buildcrew.invalid",
    username: "ola.mobile",
    avatar: "🌿",
    role: "MOBILE",
    level: "LEARNING",
    weeklyHours: "1-2",
    bio: "Uczę się Fluttera i chcę wejść w pracę zespołową na małym projekcie. Mogę brać pojedyncze ekrany, poprawki UI i testy na Androidzie.",
    lookingFor: ["WANTS_PROJECT", "OPEN_TO_BUILD"],
    goals: ["LEARNING", "PORTFOLIO"],
    skills: ["Flutter", "Dart", "Firebase", "Figma"],
    interests: ["Health", "Travel", "Education"],
    discord: "ola_mobile",
  },
  {
    id: "71000000-0000-4000-8000-00000000000e",
    email: "krystian.builds@profiles.buildcrew.invalid",
    username: "krystian.builds",
    avatar: "🚀",
    role: "FULLSTACK",
    level: "BUILDING",
    weeklyHours: "10+",
    bio: "Buduję małe produkty webowe od zera i lubię pracę w krótkich iteracjach. Szukam osób, które chcą regularnie dowozić po kawałku, a nie tylko dyskutować o pomyśle.",
    lookingFor: ["HAS_PROJECT", "OPEN_TO_BUILD"],
    goals: ["STARTUP", "COMMERCIAL"],
    skills: ["Next.js", "TypeScript", "PostgreSQL", "Drizzle ORM", "Vercel"],
    interests: ["SaaS", "Productivity", "AI"],
    discord: "krystian_builds",
  },
];

const projects = [
  {
    id: "72000000-0000-4000-8000-000000000001",
    ownerId: builders[3].id,
    name: "Briefly",
    tagline: "Jeden prosty brief dla małych zespołów zamiast informacji rozsianych po czatach.",
    description: "MVP ma pozwalać stworzyć brief projektu, dopisać decyzje, linki i najbliższy cel. Chcę uniknąć rozbudowanego project managementu — to ma być lekkie miejsce startowe dla 2–5 osób.",
    stage: "BUILDING",
    interests: ["SaaS", "Productivity"],
    commitment: "5-10",
    goal: "Wypuścić zamkniętą betę i zebrać feedback od pięciu małych zespołów produktowych.",
    character: ["STARTUP", "PORTFOLIO"],
    ownerContribution: "Backend, auth, model danych i pierwsza wersja dashboardu.",
    technologies: ["Next.js", "TypeScript", "PostgreSQL", "Drizzle ORM", "Vercel"],
    roles: [
      ["73000000-0000-4000-8000-000000000001", "UI_UX", "Uporządkowanie flow briefu i lekkiego design systemu.", "BUILDING", 1],
      ["73000000-0000-4000-8000-000000000002", "FRONTEND", "Dopracowanie edytora briefu i widoków mobilnych.", "BUILDING", 1],
    ],
  },
  {
    id: "72000000-0000-4000-8000-000000000002",
    ownerId: builders[7].id,
    name: "SkillSprint",
    tagline: "Małe 14-dniowe wyzwania do nauki konkretnej umiejętności w grupie 3–5 osób.",
    description: "Użytkownik wybiera cel, dołącza do małej grupy i codziennie zaznacza krótki postęp. MVP bez feedu i gamifikacji — tylko wspólny cel, check-in i podsumowanie sprintu.",
    stage: "DESIGN",
    interests: ["Education", "Social"],
    commitment: "3-5",
    goal: "Przeprowadzić dwa pilotażowe sprinty: TypeScript i Figma.",
    character: ["EXPERIMENT", "PORTFOLIO"],
    ownerContribution: "Discovery, scenariusze użytkownika i testy z pierwszą grupą.",
    technologies: ["Next.js", "PostgreSQL", "Tailwind CSS"],
    roles: [
      ["73000000-0000-4000-8000-000000000003", "FULLSTACK", "Auth, grupy, check-iny i prosty dashboard sprintu.", "BUILDING", 1],
      ["73000000-0000-4000-8000-000000000004", "UI_UX", "Prototyp onboardingowy i widok codziennego check-inu.", "LEARNING", 1],
    ],
  },
  {
    id: "72000000-0000-4000-8000-000000000003",
    ownerId: builders[6].id,
    name: "TrailNote",
    tagline: "Mobilny dziennik krótkich tras, miejsc i notatek z wyjazdów.",
    description: "Aplikacja ma zapisywać trasę, kilka zdjęć i krótką notatkę. Bez społeczności na start. Najważniejsze są offline-first, szybkie dodawanie wpisu i późniejszy eksport wspomnienia.",
    stage: "BUILDING",
    interests: ["Travel", "Mobile"],
    commitment: "3-5",
    goal: "Dowieźć wersję testową na Androida i użyć jej podczas dwóch weekendowych wyjazdów.",
    character: ["HOBBY", "PORTFOLIO"],
    ownerContribution: "Ekrany mobilne w Expo i prototyp zapisu lokalnego.",
    technologies: ["React Native", "Expo", "TypeScript", "SQLite"],
    roles: [
      ["73000000-0000-4000-8000-000000000005", "BACKEND", "Synchronizacja danych i prosty storage zdjęć.", "BUILDING", 1],
      ["73000000-0000-4000-8000-000000000006", "UI_UX", "Dopracowanie flow dodawania trasy i pustych stanów.", "BUILDING", 1],
    ],
  },
  {
    id: "72000000-0000-4000-8000-000000000004",
    ownerId: builders[5].id,
    name: "DocLens",
    tagline: "Wyszukiwanie odpowiedzi w małym zestawie dokumentów technicznych z podaniem źródła.",
    description: "Chcę zrobić małe narzędzie do wrzucenia 20–50 dokumentów i zadawania pytań z cytowaniem konkretnych fragmentów. Bez agentów i automatyzacji — skupiamy się na jakości retrievalu i ocenie odpowiedzi.",
    stage: "TESTING",
    interests: ["AI", "Developer Tools"],
    commitment: "5-10",
    goal: "Porównać trzy strategie chunkowania na realnym zbiorze dokumentacji i opublikować demo.",
    character: ["EXPERIMENT", "PORTFOLIO"],
    ownerContribution: "Pipeline embeddingów, RAG i prosty evaluator odpowiedzi.",
    technologies: ["Python", "FastAPI", "PostgreSQL", "pgvector", "Next.js"],
    roles: [
      ["73000000-0000-4000-8000-000000000007", "FRONTEND", "Interfejs wyszukiwania, źródła i historia zapytań.", "BUILDING", 1],
      ["73000000-0000-4000-8000-000000000008", "BACKEND", "Upload plików, kolejka indeksowania i limity.", "EXPERIENCED", 1],
    ],
  },
  {
    id: "72000000-0000-4000-8000-000000000005",
    ownerId: builders[11].id,
    name: "InvoiceNudge",
    tagline: "Proste przypomnienia o niezapłaconych fakturach dla freelancerów.",
    description: "Użytkownik wpisuje klienta, numer faktury, kwotę i termin. Aplikacja pokazuje zaległe płatności i pozwala wysłać gotowy, uprzejmy reminder. Bez księgowości i bez generowania faktur.",
    stage: "IDEA",
    interests: ["Fintech", "SaaS"],
    commitment: "3-5",
    goal: "Zbudować MVP w trzy tygodnie i przetestować je z 8 freelancerami.",
    character: ["STARTUP", "COMMERCIAL"],
    ownerContribution: "Model danych, integracja e-mail i backend reminderów.",
    technologies: ["Next.js", "Node.js", "PostgreSQL", "Resend"],
    roles: [
      ["73000000-0000-4000-8000-000000000009", "FRONTEND", "Dashboard faktur, formularz i stan zaległości.", "BUILDING", 1],
      ["73000000-0000-4000-8000-00000000000a", "PRODUCT", "Rozmowy z freelancerami i doprecyzowanie reminder flow.", "BUILDING", 1],
    ],
  },
  {
    id: "72000000-0000-4000-8000-000000000006",
    ownerId: builders[10].id,
    name: "CreatorKit",
    tagline: "Generator małych stron z mediakitem dla twórców bez budowania całego portfolio.",
    description: "Twórca uzupełnia bio, statystyki, współprace i kontakt, a aplikacja generuje prosty publiczny mediakit. MVP ma trzy warianty wizualne i eksport do PDF później.",
    stage: "DESIGN",
    interests: ["Creator Tools", "Marketing"],
    commitment: "3-5",
    goal: "Uruchomić 20 przykładowych mediakitów i sprawdzić, które sekcje są faktycznie używane.",
    character: ["PORTFOLIO", "STARTUP"],
    ownerContribution: "Copy, landing page i rozmowy z mikro-twórcami.",
    technologies: ["Next.js", "TypeScript", "PostgreSQL", "Vercel"],
    roles: [
      ["73000000-0000-4000-8000-00000000000b", "UI_UX", "Trzy spójne warianty mediakitu i edytor sekcji.", "EXPERIENCED", 1],
      ["73000000-0000-4000-8000-00000000000c", "FULLSTACK", "Publiczne strony, edycja danych i upload grafik.", "BUILDING", 1],
    ],
  },
  {
    id: "72000000-0000-4000-8000-000000000007",
    ownerId: builders[0].id,
    name: "FocusRoom",
    tagline: "Minimalistyczny wspólny timer do 50-minutowych sesji pracy dla małych ekip.",
    description: "Pokój ma wspólny timer, listę 2–4 osób i jedno pole: nad czym pracujesz w tej sesji. Bez czatu, kamery i rankingów. Chcę sprawdzić, czy sama obecność innych pomaga regularnie zaczynać.",
    stage: "BUILDING",
    interests: ["Productivity", "Social"],
    commitment: "1-2",
    goal: "Uruchomić 10 testowych sesji z małymi grupami i sprawdzić retencję tygodniową.",
    character: ["EXPERIMENT", "HOBBY"],
    ownerContribution: "Frontend pokoju, timer i pierwsza wersja landing page.",
    technologies: ["Next.js", "TypeScript", "PostgreSQL"],
    roles: [
      ["73000000-0000-4000-8000-00000000000d", "BACKEND", "Synchronizacja sesji i bezpieczne dołączanie do pokoju.", "BUILDING", 1],
    ],
  },
  {
    id: "72000000-0000-4000-8000-000000000008",
    ownerId: builders[2].id,
    name: "ClinicPrep",
    tagline: "Prosta checklista przygotowania do wizyty lekarskiej, żeby nie zapomnieć ważnych pytań.",
    description: "Użytkownik przed wizytą zapisuje objawy, leki i pytania do omówienia, a potem generuje czytelną kartę do pokazania lekarzowi. To narzędzie organizacyjne, bez diagnoz i rekomendacji medycznych.",
    stage: "IDEA",
    interests: ["Health", "Productivity"],
    commitment: "1-2",
    goal: "Przetestować prototyp z 10 osobami i sprawdzić, czy format checklisty jest zrozumiały.",
    character: ["PORTFOLIO", "EXPERIMENT"],
    ownerContribution: "Research, prototyp w Figma i testy użyteczności.",
    technologies: ["Next.js", "TypeScript", "Tailwind CSS"],
    roles: [
      ["73000000-0000-4000-8000-00000000000e", "FRONTEND", "Formularz checklisty i czytelny widok do wydruku.", "LEARNING", 1],
    ],
  },
  {
    id: "72000000-0000-4000-8000-000000000009",
    ownerId: builders[13].id,
    name: "LaunchLog",
    tagline: "Publiczny changelog dla małych produktów z prostym widgetem do osadzenia.",
    description: "Twórca dodaje krótkie wpisy: co zmieniliśmy, dlaczego i dla kogo. Publiczna strona ma być szybka, a mały widget można osadzić w produkcie. Bez pełnego systemu feedbacku.",
    stage: "LAUNCHED",
    interests: ["SaaS", "Developer Tools"],
    commitment: "3-5",
    goal: "Zdobyć pierwszych 15 aktywnych projektów korzystających z publicznego changeloga.",
    character: ["STARTUP", "COMMERCIAL"],
    ownerContribution: "Pełny MVP, deployment i pierwsze integracje widgetu.",
    technologies: ["Next.js", "TypeScript", "PostgreSQL", "Vercel"],
    roles: [
      ["73000000-0000-4000-8000-00000000000f", "MARKETING", "Pierwsze case studies, onboarding i dotarcie do indie hackerów.", "BUILDING", 1],
    ],
  },
];

const questions = [
  ["74000000-0000-4000-8000-000000000001", builders[4].id, "Jak najlepiej walidować formularz w Next.js: tylko Zod na serwerze czy też klient?", "Mam formularz tworzenia projektu. Chcę mieć szybkie błędy w UI, ale nie dublować całej logiki. Jak sensownie podzielić walidację?", ["Next.js", "Zod", "Forms"]],
  ["74000000-0000-4000-8000-000000000002", builders[1].id, "Kiedy indeks w PostgreSQL faktycznie pomaga przy małej aplikacji?", "Mam kilka tabel po kilkanaście tysięcy rekordów. Czy indeksować wszystkie foreign keys i pola używane w filtrach, czy najpierw mierzyć zapytania?", ["PostgreSQL", "Backend", "Performance"]],
  ["74000000-0000-4000-8000-000000000003", builders[6].id, "Expo push notifications — od czego zacząć bez komplikowania backendu?", "Potrzebuję tylko jednego typu przypomnienia dziennie. Czy na MVP wystarczy Expo Push Service i prosty cron?", ["Expo", "Mobile", "Notifications"]],
  ["74000000-0000-4000-8000-000000000004", builders[5].id, "Jak dobrać rozmiar chunków do RAG dla dokumentacji technicznej?", "Przy 300–400 tokenach gubię czasem kontekst, a przy większych chunkach retrieval robi się mniej precyzyjny. Jak to sensownie testować?", ["RAG", "AI", "Search"]],
  ["74000000-0000-4000-8000-000000000005", builders[2].id, "Jak mały powinien być design system na MVP?", "Mamy około 12 ekranów i dwie osoby na frontendzie. Nie chcę budować biblioteki komponentów przez tydzień, ale bez zasad UI szybko się rozjeżdża.", ["Figma", "UI", "Design System"]],
  ["74000000-0000-4000-8000-000000000006", builders[8].id, "Czy warto od razu dodawać Redis do rate limitingu?", "Aplikacja stoi na Vercelu i PostgreSQL. Ruch jest jeszcze mały. Czy trzymanie bucketów rate limit w Postgresie jest wystarczające na start?", ["Redis", "PostgreSQL", "Rate Limiting"]],
  ["74000000-0000-4000-8000-000000000007", builders[10].id, "Jak mierzyć landing page przed uruchomieniem płatności?", "Mam formularz zapisu i kilka źródeł ruchu. Jakie 3–4 eventy warto zbierać, żeby nie wpaść w vanity metrics?", ["Analytics", "Marketing", "MVP"]],
  ["74000000-0000-4000-8000-000000000008", builders[11].id, "OAuth Google: jak bezpiecznie łączyć konto z istniejącym e-mailem?", "Jeśli ktoś wcześniej założył konto hasłem, a potem loguje się przez Google z tym samym zweryfikowanym adresem, czy można je automatycznie połączyć?", ["OAuth", "Security", "Auth"]],
  ["74000000-0000-4000-8000-000000000009", builders[0].id, "Server Actions czy Route Handlers do prostego CRUD-u?", "Mam kilka mutacji formularzy i upload pliku. Gdzie kończy się wygoda Server Actions, a zaczyna sens wydzielonego API?", ["Next.js", "Architecture", "API"]],
  ["74000000-0000-4000-8000-00000000000a", builders[7].id, "Jak przeprowadzić pierwszy test produktu z pięcioma użytkownikami?", "Mamy działający prototyp i konkretny scenariusz. Lepiej obserwować użytkownika na żywo czy wysłać link i zebrać feedback po użyciu?", ["Product", "Research", "MVP"]],
];

const answers = [
  ["75000000-0000-4000-8000-000000000001", questions[0][0], builders[3].id, "Trzymaj jeden schemat Zod jako źródło prawdy. Na kliencie użyj go dla UX, ale zawsze waliduj ponownie na serwerze przed zapisem. Klient nie jest granicą bezpieczeństwa.", true],
  ["75000000-0000-4000-8000-000000000002", questions[1][0], builders[8].id, "Indeksuj przede wszystkim kolumny używane regularnie w WHERE/JOIN oraz foreign keys, które biorą udział w większych zapytaniach. Potem sprawdź EXPLAIN ANALYZE zamiast zgadywać.", true],
  ["75000000-0000-4000-8000-000000000003", questions[2][0], builders[9].id, "Na taki zakres Expo Push Service jest wystarczający. Zacznij od tokenów urządzeń i jednego zadania cron; dopiero po realnych problemach dodawaj kolejkę.", false],
  ["75000000-0000-4000-8000-000000000004", questions[3][0], builders[1].id, "Zrób mały zestaw 30–50 pytań testowych z oczekiwanymi źródłami. Porównuj recall retrievalu dla kilku rozmiarów chunków i overlapu, zamiast oceniać wyłącznie subiektywnie odpowiedź modelu.", true],
  ["75000000-0000-4000-8000-000000000005", questions[4][0], builders[9].id, "Na MVP wystarczy kilka tokenów: spacing, radius, typografia, kolory oraz 6–8 podstawowych komponentów. Ważniejsze są reguły użycia niż liczba wariantów.", true],
  ["75000000-0000-4000-8000-000000000006", questions[5][0], builders[1].id, "Przy małym ruchu Postgres spokojnie wystarczy. Redis ma sens, gdy rate limiting zaczyna generować zauważalny koszt, contention albo potrzebujesz bardzo niskich opóźnień w wielu instancjach.", true],
  ["75000000-0000-4000-8000-000000000007", questions[6][0], builders[7].id, "Mierzyłabym wejście na landing, klik głównego CTA, rozpoczęcie formularza i zakończenie zapisu. Do tego zapisuj source/utm. To już wystarczy do pierwszych decyzji.", true],
  ["75000000-0000-4000-8000-000000000008", questions[7][0], builders[3].id, "Można, jeśli provider gwarantuje zweryfikowany e-mail i przed linkowaniem sprawdzisz, że użytkownik kontroluje ten flow. Nie łącz kont tylko na podstawie dowolnego e-maila zwróconego przez niezaufany provider.", true],
  ["75000000-0000-4000-8000-000000000009", questions[8][0], builders[11].id, "Do formularzy i prostych mutacji Server Actions są wygodne. Route Handler zostawiłbym dla endpointów wywoływanych spoza aplikacji, webhooków, OAuth i uploadów wymagających osobnego kontraktu HTTP.", false],
  ["75000000-0000-4000-8000-00000000000a", questions[9][0], builders[2].id, "Przy pięciu osobach obserwacja na żywo daje dużo więcej. Daj im zadanie bez instrukcji krok po kroku, patrz gdzie się zatrzymują, a pytania zadawaj dopiero po wykonaniu scenariusza.", true],
  ["75000000-0000-4000-8000-00000000000b", questions[3][0], builders[5].id, "Warto też logować, które chunki faktycznie trafiły do kontekstu. Czasem problem nie jest w rozmiarze chunku, tylko w samym zapytaniu do retrievera.", false],
  ["75000000-0000-4000-8000-00000000000c", questions[0][0], builders[0].id, "Dobrze działa też mapowanie błędów Zoda do pól dopiero w komponencie formularza. Dzięki temu logika domenowa nie zależy od biblioteki UI.", false],
];

const applications = [
  ["76000000-0000-4000-8000-000000000001", projects[0].id, projects[0].roles[0][0], builders[2].id, "Mogę uporządkować flow briefu i zrobić mały system komponentów w Figma. Mam 3–5h tygodniowo.", "ACCEPTED"],
  ["76000000-0000-4000-8000-000000000002", projects[0].id, projects[0].roles[1][0], builders[4].id, "Chętnie wezmę edytor briefu. Szukam właśnie projektu do portfolio w Next.js.", "PENDING"],
  ["76000000-0000-4000-8000-000000000003", projects[3].id, projects[3].roles[0][0], builders[0].id, "Interfejs wyszukiwania i źródeł brzmi jak dobry zakres. Mogę przygotować pierwszą wersję w React.", "ACCEPTED"],
  ["76000000-0000-4000-8000-000000000004", projects[4].id, projects[4].roles[0][0], builders[0].id, "Mogę zrobić dashboard i stany płatności. Mam doświadczenie z formularzami i tabelami.", "PENDING"],
  ["76000000-0000-4000-8000-000000000005", projects[5].id, projects[5].roles[0][0], builders[9].id, "Mogę przygotować dwa kierunki wizualne i komponenty mediakitu.", "PENDING"],
  ["76000000-0000-4000-8000-000000000006", projects[2].id, projects[2].roles[0][0], builders[1].id, "Mogę zrobić prosty backend synchronizacji i storage bez dokładania ciężkiej infrastruktury.", "ACCEPTED"],
  ["76000000-0000-4000-8000-000000000007", projects[8].id, projects[8].roles[0][0], builders[10].id, "Chętnie przygotuję onboarding i dwa krótkie case studies pod pierwsze pozyskanie użytkowników.", "PENDING"],
];

const projectMembers = [
  [projects[0].id, builders[2].id, projects[0].roles[0][0], "UI_UX"],
  [projects[3].id, builders[0].id, projects[3].roles[0][0], "FRONTEND"],
  [projects[2].id, builders[1].id, projects[2].roles[0][0], "BACKEND"],
];

const crews = [
  ["77000000-0000-4000-8000-000000000001", builders[4].id],
  ["77000000-0000-4000-8000-000000000002", builders[12].id],
];

const crewMembers = [
  [crews[0][0], builders[4].id],
  [crews[0][0], builders[10].id],
  [crews[1][0], builders[12].id],
  [crews[1][0], builders[8].id],
];

const buildProposals = [
  ["78000000-0000-4000-8000-000000000001", builders[6].id, builders[2].id, "Mam prototyp mobilny i przydałaby się osoba od UX. Może zrobimy mały projekt razem?", "PENDING"],
  ["78000000-0000-4000-8000-000000000002", builders[11].id, builders[0].id, "Mam prosty pomysł SaaS i backend. Szukam kogoś, kto chce dowieźć frontend w małym scope.", "PENDING"],
];

function allShowcaseIds() {
  return builders.map((b) => b.id);
}

async function ensureLookups() {
  const skillNames = [...new Set(builders.flatMap((b) => b.skills))];
  for (const name of skillNames) {
    await client.query(
      `insert into skills (name, category) values ($1, 'Showcase') on conflict (name) do nothing`,
      [name],
    );
  }

  const interestNames = [...new Set(builders.flatMap((b) => b.interests).concat(projects.flatMap((p) => p.interests)))];
  for (const name of interestNames) {
    await client.query(`insert into interests (name) values ($1) on conflict (name) do nothing`, [name]);
  }
}

async function removeShowcaseData() {
  const ids = allShowcaseIds();
  const emails = builders.map((b) => b.email);
  // User deletion cascades through profiles, projects, questions, applications,
  // crew data, proposals and answers owned by showcase accounts.
  await client.query(`delete from users where id = any($1::uuid[]) or email = any($2::text[])`, [ids, emails]);
}

async function seed() {
  await client.connect();
  try {
    console.log("🌱 BuildCrew showcase seed");
    await client.query("begin");

    await removeShowcaseData();

    if (process.argv.includes("--remove")) {
      await client.query("commit");
      console.log("✅ Usunięto wyłącznie konta i dane showcase utworzone przez ten skrypt.");
      return;
    }

    await ensureLookups();

    // Every showcase account gets a random unknown password on every seed run,
    // so these display-only accounts cannot be used as shared demo logins.
    const lockedPasswordHash = await bcrypt.hash(crypto.randomBytes(48).toString("hex"), 12);

    for (let i = 0; i < builders.length; i += 1) {
      const builder = builders[i];
      await client.query(
        `insert into users (id, email, password_hash, system_role, email_verified_at, created_at)
         values ($1, $2, $3, 'USER', now(), now() - ($4::int * interval '1 day'))`,
        [builder.id, builder.email, lockedPasswordHash, 26 - i],
      );
      await client.query(
        `insert into profiles
          (user_id, username, role, level, weekly_hours, bio, looking_for, goals, avatar_emoji, onboarding_completed, onboarding_step, created_at, updated_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,true,10,now() - ($10::int * interval '1 day'),now())`,
        [builder.id, builder.username, builder.role, builder.level, builder.weeklyHours, builder.bio, builder.lookingFor, builder.goals, builder.avatar, 26 - i],
      );
      await client.query(`insert into profile_private (user_id, discord_username) values ($1, $2)`, [builder.id, builder.discord]);

      for (const skill of builder.skills) {
        await client.query(
          `insert into profile_skills (user_id, skill_id)
           select $1, id from skills where name = $2
           on conflict do nothing`,
          [builder.id, skill],
        );
      }
      for (const interest of builder.interests) {
        await client.query(
          `insert into profile_interests (user_id, interest_id)
           select $1, id from interests where name = $2
           on conflict do nothing`,
          [builder.id, interest],
        );
      }
    }

    for (let i = 0; i < projects.length; i += 1) {
      const project = projects[i];
      await client.query(
        `insert into projects
          (id, owner_id, name, tagline, description, stage, interests, owner_contribution, commitment, goal, character, created_at, updated_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,now() - ($12::int * interval '1 day'),now())`,
        [project.id, project.ownerId, project.name, project.tagline, project.description, project.stage, project.interests, project.ownerContribution, project.commitment, project.goal, project.character, 18 - i],
      );
      await client.query(
        `insert into project_members (project_id, user_id, role_type, is_owner)
         values ($1,$2,(select role from profiles where user_id=$2),true)`,
        [project.id, project.ownerId],
      );
      for (const tech of project.technologies) {
        await client.query(`insert into project_technologies (project_id, name) values ($1, $2)`, [project.id, tech]);
      }
      for (const [id, roleType, description, preferredLevel, slots] of project.roles) {
        await client.query(
          `insert into project_roles (id, project_id, role_type, description, preferred_level, slots)
           values ($1,$2,$3,$4,$5,$6)`,
          [id, project.id, roleType, description, preferredLevel, slots],
        );
      }
    }

    for (const [projectId, userId, roleId, roleType] of projectMembers) {
      await client.query(
        `insert into project_members (project_id, user_id, role_id, role_type, is_owner)
         values ($1,$2,$3,$4,false)
         on conflict (project_id, user_id) do nothing`,
        [projectId, userId, roleId, roleType],
      );
    }

    for (let i = 0; i < questions.length; i += 1) {
      const [id, authorId, title, description, tags] = questions[i];
      await client.query(
        `insert into questions (id, author_id, title, description, created_at)
         values ($1,$2,$3,$4,now() - ($5::int * interval '1 day'))`,
        [id, authorId, title, description, 12 - i],
      );
      for (const tag of tags) {
        await client.query(`insert into question_tags (question_id, tag) values ($1,$2)`, [id, tag]);
      }
    }

    for (let i = 0; i < answers.length; i += 1) {
      const [id, questionId, authorId, body, isHelpful] = answers[i];
      await client.query(
        `insert into answers (id, question_id, author_id, body, is_helpful, created_at)
         values ($1,$2,$3,$4,$5,now() - ($6::int * interval '1 day'))`,
        [id, questionId, authorId, body, isHelpful, Math.max(1, 10 - Math.floor(i / 2))],
      );
    }

    for (const [id, projectId, roleId, applicantId, message, status] of applications) {
      await client.query(
        `insert into applications (id, project_id, role_id, applicant_id, message, status, created_at, updated_at)
         values ($1,$2,$3,$4,$5,$6,now() - interval '4 days',now() - interval '2 days')`,
        [id, projectId, roleId, applicantId, message, status],
      );
    }

    for (const [id, createdBy] of crews) {
      await client.query(
        `insert into crews (id, status, created_by, created_at)
         values ($1,'FORMING',$2,now() - interval '3 days')`,
        [id, createdBy],
      );
    }
    for (const [crewId, userId] of crewMembers) {
      await client.query(`insert into crew_members (crew_id, user_id) values ($1,$2)`, [crewId, userId]);
    }

    for (const [id, senderId, receiverId, message, status] of buildProposals) {
      await client.query(
        `insert into build_proposals (id, sender_id, receiver_id, message, status, created_at)
         values ($1,$2,$3,$4,$5,now() - interval '1 day')`,
        [id, senderId, receiverId, message, status],
      );
    }

    await client.query("commit");
    console.log("✅ Dodano: 14 profili, 9 projektów, 10 pytań, 12 odpowiedzi, 7 aplikacji i 2 ekipy Build Pool.");
    console.log("ℹ️ Konta są syntetyczne i mają adresy w domenie .invalid; nie da się na nie wysyłać prawdziwej poczty.");
    console.log("ℹ️ Skrypt jest idempotentny: ponowne uruchomienie odświeża tylko własne dane showcase.");
  } catch (error) {
    await client.query("rollback").catch(() => {});
    console.error("❌ Showcase seed nie powiódł się.");
    if (error?.code === "42P01" || error?.code === "42703") {
      console.error("Schemat bazy nie pasuje do aktualnej aplikacji. Najpierw uruchom npm run db:push na właściwej bazie BuildCrew.");
    }
    console.error(error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

seed();
