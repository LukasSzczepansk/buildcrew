import dotenv from "dotenv";
import pg from "pg";
import bcrypt from "bcryptjs";

dotenv.config({ path: ".env.local" });
dotenv.config();

const { Client } = pg;
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("Brak DATABASE_URL. Dodaj go do .env.local, np. postgresql://postgres:postgres@127.0.0.1:5434/buildcrew");
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

if (!isLocalDatabase(connectionString) && process.env.ALLOW_DEMO_SEED !== "true") {
  console.error("❌ Odmowa uruchomienia demo seeda na zdalnej bazie.");
  console.error("Jeśli to świadomie baza stagingowa, ustaw jednorazowo ALLOW_DEMO_SEED=true.");
  process.exit(1);
}

const client = new Client({ connectionString });
const DEMO_PASSWORD = "Demo12345!";
const ADMIN_EMAIL = "admin@buildcrew.local";
const ADMIN_PASSWORD = "Admin12345!";
const ADMIN_ID = "90000000-0000-4000-8000-000000000001";

const builders = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    email: "kacper@demo.local",
    username: "kacper.nowak",
    avatar: "👨‍💻",
    role: "FRONTEND",
    level: "BUILDING",
    weeklyHours: "3-5",
    bio: "Po godzinach buduję małe aplikacje webowe. Najlepiej czuję się w Next.js i TypeScript, a teraz szukam ekipy do projektu, który faktycznie da się wypuścić.",
    lookingFor: ["HAS_PROJECT", "OPEN_TO_BUILD"],
    goals: ["PORTFOLIO", "STARTUP"],
    skills: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Vercel"],
    interests: ["SaaS", "Productivity", "Education"],
    discord: "kacper_dev",
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    email: "jakub@demo.local",
    username: "jakub.codes",
    avatar: "🧑‍💻",
    role: "BACKEND",
    level: "BUILDING",
    weeklyHours: "3-5",
    bio: "Robię backend w Node.js i PostgreSQL. Chętnie dołączę do małego zespołu, w którym każdy ma konkretny kawałek produktu do dowiezienia.",
    lookingFor: ["WANTS_PROJECT", "OPEN_TO_BUILD"],
    goals: ["LEARNING", "PORTFOLIO"],
    skills: ["Node.js", "NestJS", "PostgreSQL", "REST API", "Docker"],
    interests: ["SaaS", "Developer Tools", "Automation"],
    discord: "jakub_codes",
  },
  {
    id: "10000000-0000-4000-8000-000000000003",
    email: "ola@demo.local",
    username: "ola.design",
    avatar: "👩‍🎨",
    role: "UI_UX",
    level: "BUILDING",
    weeklyHours: "3-5",
    bio: "Projektuję interfejsy w Figma i buduję portfolio na prawdziwych produktach. Najbardziej interesują mnie proste SaaS-y i aplikacje, które mają jasno określony problem.",
    lookingFor: ["WANTS_PROJECT", "OPEN_TO_BUILD"],
    goals: ["PORTFOLIO", "LEARNING"],
    skills: ["Figma", "UI Design", "UX", "Design Systems", "Framer"],
    interests: ["SaaS", "Creator Tools", "Productivity"],
    discord: "ola_design",
  },
  {
    id: "10000000-0000-4000-8000-000000000004",
    email: "mateusz@demo.local",
    username: "mateusz.dev",
    avatar: "👨‍💻",
    role: "FULLSTACK",
    level: "EXPERIENCED",
    weeklyHours: "5-10",
    bio: "Pracuję jako full-stack i po godzinach testuję własne pomysły. Lubię małe scope'y, szybkie MVP i projekty, które można pokazać użytkownikom w kilka tygodni.",
    lookingFor: ["HAS_PROJECT", "WANTS_PROJECT"],
    goals: ["STARTUP", "COMMERCIAL"],
    skills: ["React", "Next.js", "Node.js", "PostgreSQL", "Docker", "AWS"],
    interests: ["Fintech", "SaaS", "Productivity"],
    discord: "mateusz_dev",
  },
  {
    id: "10000000-0000-4000-8000-000000000005",
    email: "antek@demo.local",
    username: "antek.ai",
    avatar: "🤖",
    role: "AI_ML",
    level: "BUILDING",
    weeklyHours: "5-10",
    bio: "Eksperymentuję z LLM-ami i prostymi funkcjami AI w produktach. Wolę budować małe użyteczne rzeczy niż kolejny ogólny chatbot bez konkretnego zastosowania.",
    lookingFor: ["WANTS_PROJECT", "OPEN_TO_BUILD"],
    goals: ["EXPERIMENT", "STARTUP"],
    skills: ["Python", "OpenAI API", "Anthropic API", "RAG", "AI Agents", "pgvector"],
    interests: ["AI", "Automation", "Developer Tools"],
    discord: "antek_ai",
  },
  {
    id: "10000000-0000-4000-8000-000000000006",
    email: "natalia@demo.local",
    username: "natalia.mobile",
    avatar: "👩‍💻",
    role: "MOBILE",
    level: "LEARNING",
    weeklyHours: "3-5",
    bio: "Uczę się React Native i chcę w końcu dowieźć aplikację, którą można normalnie zainstalować na telefonie. Szukam kogoś od backendu albo designu.",
    lookingFor: ["HAS_PROJECT", "OPEN_TO_BUILD"],
    goals: ["LEARNING", "PORTFOLIO"],
    skills: ["React Native", "Expo", "TypeScript", "Supabase"],
    interests: ["Fitness", "Health", "Productivity"],
    discord: "natalia_mobile",
  },
  {
    id: "10000000-0000-4000-8000-000000000007",
    email: "bartek@demo.local",
    username: "bartek.builds",
    avatar: "🧠",
    role: "PRODUCT",
    level: "BUILDING",
    weeklyHours: "3-5",
    bio: "Najbardziej interesuje mnie product discovery: problem, użytkownik i sensowny zakres MVP. Szukam technicznej ekipy, z którą można szybko sprawdzać pomysły.",
    lookingFor: ["HAS_PROJECT", "OPEN_TO_BUILD"],
    goals: ["STARTUP", "EXPERIMENT"],
    skills: ["Product Discovery", "User Research", "Analytics", "Copywriting"],
    interests: ["Education", "Social", "Productivity"],
    discord: "bartek_builds",
  },
  {
    id: "10000000-0000-4000-8000-000000000008",
    email: "michal@demo.local",
    username: "michal.codes",
    avatar: "🧑‍💻",
    role: "FULLSTACK",
    level: "BUILDING",
    weeklyHours: "1-2",
    bio: "Po pracy dłubię przy małych narzędziach dla developerów. Mam mało czasu, więc szukam projektu z konkretnym zakresem i bez presji na codzienne spotkania.",
    lookingFor: ["HAS_PROJECT", "WANTS_PROJECT"],
    goals: ["FUN", "PORTFOLIO"],
    skills: ["SvelteKit", "TypeScript", "Node.js", "SQLite", "GitHub Actions"],
    interests: ["Developer Tools", "Automation", "SaaS"],
    discord: "michal_codes",
  },
  {
    id: "10000000-0000-4000-8000-000000000009",
    email: "zosia@demo.local",
    username: "zosia.frontend",
    avatar: "👩‍💻",
    role: "FRONTEND",
    level: "LEARNING",
    weeklyHours: "3-5",
    bio: "Mam podstawy Reacta i TypeScriptu. Chcę przestać robić tutoriale i dołączyć do projektu, w którym będę miała konkretne zadania i coś sensownego do portfolio.",
    lookingFor: ["WANTS_PROJECT", "OPEN_TO_BUILD"],
    goals: ["LEARNING", "PORTFOLIO"],
    skills: ["React", "JavaScript", "HTML/CSS", "Tailwind CSS", "Figma"],
    interests: ["Creator Tools", "Education", "E-commerce"],
    discord: "zosia_frontend",
  },
  {
    id: "10000000-0000-4000-8000-00000000000a",
    email: "piotr@demo.local",
    username: "piotr.backend",
    avatar: "👨‍💻",
    role: "BACKEND",
    level: "EXPERIENCED",
    weeklyHours: "1-2",
    bio: "Na co dzień zajmuję się backendem i deploymentem. Po godzinach mogę pomóc małej ekipie z API, bazą i pierwszym wdrożeniem na produkcję.",
    lookingFor: ["WANTS_PROJECT", "OPEN_TO_BUILD"],
    goals: ["FUN", "EXPERIMENT"],
    skills: ["Go", "PostgreSQL", "Docker", "AWS", "CI/CD", "Redis"],
    interests: ["Developer Tools", "Fintech", "Automation"],
    discord: "piotr_backend",
  },
];

const projects = [
  {
    id: "20000000-0000-4000-8000-000000000001",
    ownerId: builders[0].id,
    name: "MenuPilot",
    tagline: "Proste cyfrowe menu i panel do aktualizacji oferty dla małych lokali.",
    description: "Mam gotowy frontend pierwszej wersji menu i prosty panel właściciela. Chcę teraz dodać logowanie, bazę produktów i publiczny link/QR dla każdego lokalu. Na start bez zamówień i płatności — tylko łatwiejsza aktualizacja menu bez drukowania nowych kart.",
    stage: "BUILDING",
    interests: ["SaaS", "E-commerce", "Productivity"],
    commitment: "3-5",
    goal: "Dowieźć działające MVP i przetestować je w 2–3 lokalnych kawiarniach w ciągu miesiąca.",
    character: ["PORTFOLIO", "STARTUP"],
    ownerContribution: "Frontend w Next.js, podstawowy panel i rozmowy z pierwszymi lokalami.",
    technologies: ["Next.js", "TypeScript", "PostgreSQL", "Tailwind CSS", "Vercel"],
    roles: [
      ["30000000-0000-4000-8000-000000000001", "BACKEND", "Logowanie, model danych menu i proste API/panel administracyjny.", "BUILDING", 1],
      ["30000000-0000-4000-8000-000000000002", "UI_UX", "Dopracowanie widoku menu na telefonie i kilku ekranów panelu właściciela.", "BUILDING", 1],
    ],
  },
  {
    id: "20000000-0000-4000-8000-000000000002",
    ownerId: builders[3].id,
    name: "FreelanceDesk",
    tagline: "Lekki panel do pilnowania zleceń, terminów i płatności freelancera.",
    description: "Mam rozpisany zakres MVP i część backendu. Użytkownik dodaje klienta, zlecenie, kwotę, termin i status płatności, a dashboard pokazuje co jest do zrobienia i które płatności są po terminie. Nie budujemy księgowości ani CRM-u dla dużych firm.",
    stage: "DESIGN",
    interests: ["Fintech", "SaaS", "Productivity"],
    commitment: "3-5",
    goal: "Postawić pierwszą wersję na produkcji i dać ją do testów 10 freelancerom w ciągu 5 tygodni.",
    character: ["STARTUP", "COMMERCIAL"],
    ownerContribution: "Backend, schemat bazy i wdrożenie aplikacji.",
    technologies: ["Next.js", "Node.js", "PostgreSQL", "Docker", "Vercel"],
    roles: [
      ["30000000-0000-4000-8000-000000000003", "FRONTEND", "Dashboard, formularze klientów i zleceń oraz widok płatności.", "BUILDING", 1],
      ["30000000-0000-4000-8000-000000000004", "UI_UX", "Prosty design system i uporządkowanie głównych flow aplikacji.", "LEARNING", 1],
    ],
  },
  {
    id: "20000000-0000-4000-8000-000000000003",
    ownerId: builders[6].id,
    name: "StudyFlow",
    tagline: "Planer nauki, który zamienia większy cel na konkretne sesje na najbliższy tydzień.",
    description: "Pomysł powstał po rozmowach ze studentami, którzy zapisują terminy w kilku miejscach i potem nie wiedzą od czego zacząć. MVP ma mieć jeden cel semestralny, listę tematów i prosty tygodniowy plan. Na razie bez AI i bez społeczności.",
    stage: "IDEA",
    interests: ["Education", "Productivity", "SaaS"],
    commitment: "1-2",
    goal: "Zrobić klikalny prototyp, przeprowadzić 10 testów i dopiero potem zdecydować, czy budujemy MVP.",
    character: ["LEARNING", "PORTFOLIO"],
    ownerContribution: "Research, opis problemu, makieta flow i organizacja testów z użytkownikami.",
    technologies: ["Figma", "Next.js", "Supabase"],
    roles: [
      ["30000000-0000-4000-8000-000000000005", "FULLSTACK", "Pomoc przy oszacowaniu zakresu i zbudowaniu małego MVP po walidacji.", "LEARNING", 1],
      ["30000000-0000-4000-8000-000000000006", "UI_UX", "Dopracowanie prototypu oraz testów głównych ekranów.", "LEARNING", 1],
    ],
  },
  {
    id: "20000000-0000-4000-8000-000000000004",
    ownerId: builders[8].id,
    name: "ClientDrop",
    tagline: "Jedno miejsce, w którym freelancer zbiera brief, pliki i feedback od klienta.",
    description: "Frontend jest już częściowo zrobiony. Chodzi o prosty workspace na jedno zlecenie: brief, linki do materiałów, status i komentarze od klienta przez publiczny link. Chcę uniknąć rozbudowanego project managementu — ma to zastąpić chaotyczny wątek mailowy przy małych zleceniach.",
    stage: "BUILDING",
    interests: ["Creator Tools", "SaaS", "Productivity"],
    commitment: "3-5",
    goal: "Dowieźć publiczną wersję i użyć jej przy 3 prawdziwych zleceniach przed końcem miesiąca.",
    character: ["PORTFOLIO", "HOBBY"],
    ownerContribution: "Frontend, responsywny widok workspace'u i podstawowy UI.",
    technologies: ["React", "TypeScript", "Tailwind CSS", "Supabase"],
    roles: [
      ["30000000-0000-4000-8000-000000000007", "BACKEND", "Auth, baza danych, publiczne linki i podstawowe uprawnienia.", "LEARNING", 1],
    ],
  },
  {
    id: "20000000-0000-4000-8000-000000000005",
    ownerId: builders[5].id,
    name: "RunLog",
    tagline: "Prosta aplikacja mobilna do planowania tygodnia biegowego i zapisywania treningów.",
    description: "Mam już ekran tygodnia i dodawanie prostego treningu w React Native. Chcę dorobić historię, podstawowe statystyki i synchronizację między urządzeniami. Projekt jest głównie do nauki i portfolio — bez ambicji konkurowania ze Stravą.",
    stage: "BUILDING",
    interests: ["Fitness", "Health", "Productivity"],
    commitment: "3-5",
    goal: "Mieć stabilny build na Androida i TestFlight oraz dać go kilku znajomym biegaczom w ciągu 5 tygodni.",
    character: ["LEARNING", "PORTFOLIO"],
    ownerContribution: "React Native, ekran tygodnia i podstawowy model treningu.",
    technologies: ["React Native", "Expo", "TypeScript", "SQLite"],
    roles: [
      ["30000000-0000-4000-8000-000000000008", "BACKEND", "Synchronizacja danych, logowanie i proste API.", "BUILDING", 1],
      ["30000000-0000-4000-8000-000000000009", "UI_UX", "Uporządkowanie flow dodawania treningu i prosty mobilny UI.", "LEARNING", 1],
    ],
  },
  {
    id: "20000000-0000-4000-8000-000000000006",
    ownerId: builders[7].id,
    name: "DeployPing",
    tagline: "Mały dashboard do sprawdzania, czy side-projecty działają i kiedy był ostatni deploy.",
    description: "Mam działający prototyp, który odpytuje kilka endpointów i zapisuje historię statusu. Chcę teraz uporządkować onboarding, dodać publiczną stronę statusu i przetestować narzędzie na kilku własnych projektach oraz projektach znajomych.",
    stage: "TESTING",
    interests: ["Developer Tools", "Automation", "SaaS"],
    commitment: "1-2",
    goal: "Wypuścić publiczną betę i zebrać feedback od około 20 developerów używających własnych side-projectów.",
    character: ["HOBBY", "PORTFOLIO"],
    ownerContribution: "Full-stack, monitoring endpointów, baza i pierwsze wdrożenie.",
    technologies: ["SvelteKit", "TypeScript", "PostgreSQL", "Vercel", "GitHub Actions"],
    roles: [
      ["30000000-0000-4000-8000-00000000000a", "UI_UX", "Dopracowanie dashboardu i publicznej strony statusu bez rozbudowywania scope'u.", "BUILDING", 1],
      ["30000000-0000-4000-8000-00000000000b", "PRODUCT", "Pomoc przy krótkim onboardingu i zebraniu feedbacku od testerów.", "BUILDING", 1],
    ],
  },
];

const questions = [
  ["40000000-0000-4000-8000-000000000001", builders[8].id, "Jak najlepiej zrobić logowanie w Next.js bez przekombinowania?", "Robię małe MVP w Next.js i zastanawiam się, czy na start brać gotowy auth, czy trzymać zwykłe sesje w bazie. Zależy mi na prostocie i bezpiecznym rozwiązaniu.", ["Next.js", "Auth", "PostgreSQL"]],
  ["40000000-0000-4000-8000-000000000002", builders[5].id, "React Native: jak przechowywać małe dane offline?", "Chcę zapisywać plan treningu i odhaczanie wykonanych ćwiczeń także bez internetu. Dane są małe. SQLite, AsyncStorage czy coś innego?", ["React Native", "Expo", "SQLite"]],
  ["40000000-0000-4000-8000-000000000003", builders[2].id, "Jak uprościć onboarding SaaS-u do maksymalnie 3 ekranów?", "Projekt ma obecnie sześć kroków onboardingu i czuję, że użytkownik dostaje za dużo pytań przed zobaczeniem produktu. Jak decydujecie, co zostawić na start?", ["UI/UX", "Product", "SaaS"]],
  ["40000000-0000-4000-8000-000000000004", builders[1].id, "Czy Redis ma sens w bardzo małym MVP?", "Mam backend Node + PostgreSQL. Myślę o Redisie do cache, ale aplikacja będzie miała początkowo kilkudziesięciu użytkowników. Czy warto dodawać kolejną usługę?", ["Node.js", "PostgreSQL", "Redis"]],
  ["40000000-0000-4000-8000-000000000005", builders[4].id, "Jak ograniczyć koszty RAG w małej aplikacji AI?", "Mam niewielką bazę dokumentów i prosty RAG. Szukam najprostszych sposobów na ograniczenie liczby tokenów i wywołań bez pogarszania odpowiedzi.", ["RAG", "OpenAI API", "AI"]],
];

async function ensureLookups() {
  const skillCategories = new Map();
  for (const builder of builders) {
    for (const skill of builder.skills) {
      if (!skillCategories.has(skill)) skillCategories.set(skill, "Demo");
    }
  }
  for (const project of projects) {
    for (const tech of project.technologies) {
      if (!skillCategories.has(tech)) skillCategories.set(tech, "Demo");
    }
  }
  for (const [name, category] of skillCategories) {
    await client.query(
      `insert into skills (name, category) values ($1, $2)
       on conflict (name) do update set category = excluded.category`,
      [name, category],
    );
  }

  const allInterests = [...new Set(builders.flatMap((b) => b.interests).concat(projects.flatMap((p) => p.interests)))];
  for (const name of allInterests) {
    await client.query(`insert into interests (name) values ($1) on conflict (name) do nothing`, [name]);
  }
}

async function seed() {
  await client.connect();
  try {
    console.log("🌱 Seeding BuildCrew demo data...");
    await client.query("begin");

    const demoEmails = [...builders.map((b) => b.email), ADMIN_EMAIL];
    const demoIds = [...builders.map((b) => b.id), ADMIN_ID];
    // Delete demo records by stable UUID as well as e-mail, so this seed cleanly
    // replaces older demo names from previous patches without touching real users.
    await client.query(`delete from users where id = any($1::uuid[]) or email = any($2::text[])`, [demoIds, demoEmails]);

    await ensureLookups();
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
    const adminPasswordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

    await client.query(
      `insert into users (id, email, password_hash, system_role, email_verified_at) values ($1, $2, $3, 'ADMIN', now())`,
      [ADMIN_ID, ADMIN_EMAIL, adminPasswordHash],
    );
    await client.query(
      `insert into profiles
        (user_id, username, role, level, weekly_hours, bio, looking_for, goals, avatar_emoji, onboarding_completed, onboarding_step)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,true,10)`,
      [ADMIN_ID, "buildcrew.admin", "PRODUCT", "EXPERIENCED", "1-2", "Konto administracyjne BuildCrew używane do moderacji wersji demonstracyjnej.", [], [], "🛡️"],
    );

    for (const builder of builders) {
      await client.query(
        `insert into users (id, email, password_hash, system_role, email_verified_at) values ($1, $2, $3, 'USER', now())`,
        [builder.id, builder.email, passwordHash],
      );
      await client.query(
        `insert into profiles
          (user_id, username, role, level, weekly_hours, bio, looking_for, goals, avatar_emoji, onboarding_completed, onboarding_step)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,true,10)`,
        [builder.id, builder.username, builder.role, builder.level, builder.weeklyHours, builder.bio, builder.lookingFor, builder.goals, builder.avatar],
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

    for (const project of projects) {
      await client.query(
        `insert into projects
          (id, owner_id, name, tagline, description, stage, interests, owner_contribution, commitment, goal, character)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [project.id, project.ownerId, project.name, project.tagline, project.description, project.stage, project.interests, project.ownerContribution, project.commitment, project.goal, project.character],
      );
      await client.query(
        `insert into project_members (project_id, user_id, role_type, is_owner) values ($1,$2,(select role from profiles where user_id=$2),true)`,
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

    for (const [id, authorId, title, description, tags] of questions) {
      await client.query(
        `insert into questions (id, author_id, title, description) values ($1,$2,$3,$4)`,
        [id, authorId, title, description],
      );
      for (const tag of tags) {
        await client.query(`insert into question_tags (question_id, tag) values ($1,$2)`, [id, tag]);
      }
    }

    await client.query(
      `insert into answers (id, question_id, author_id, body, is_helpful) values
       ('50000000-0000-4000-8000-000000000001',$1,$2,$3,true),
       ('50000000-0000-4000-8000-000000000002',$4,$5,$6,false),
       ('50000000-0000-4000-8000-000000000003',$7,$8,$9,true)`,
      [
        questions[0][0], builders[3].id, "Na małe MVP nie dokładałbym wielu warstw. Gotowy provider albo prosta sesja HTTP-only w bazie są OK, jeśli autoryzację sprawdzasz po stronie serwera.",
        questions[1][0], builders[7].id, "Jeśli masz relacyjne dane planu treningowego, SQLite szybko staje się wygodniejsze niż trzymanie wszystkiego jako jeden obiekt w AsyncStorage.",
        questions[3][0], builders[9].id, "Przy kilkudziesięciu użytkownikach zostałbym przy PostgreSQL. Dodaj Redis dopiero, kiedy masz konkretny problem z cache, kolejkami albo rate limitingiem.",
      ],
    );

    // Kilka realistycznych rekordów, żeby panel administratora nie był pusty.
    await client.query(
      `insert into applications (id, project_id, role_id, applicant_id, message, status) values
       ('61000000-0000-4000-8000-000000000001',$1,$2,$3,$4,'PENDING'),
       ('61000000-0000-4000-8000-000000000002',$5,$6,$7,$8,'ACCEPTED'),
       ('61000000-0000-4000-8000-000000000003',$9,$10,$11,$12,'PENDING')`,
      [
        projects[1].id, projects[1].roles[0][0], builders[0].id, "Chętnie zrobię frontend dashboardu. Mam doświadczenie z Next.js i formularzami.",
        projects[4].id, projects[4].roles[1][0], builders[2].id, "Mogę uporządkować mobilny flow i przygotować komponenty w Figma.",
        projects[3].id, projects[3].roles[0][0], builders[1].id, "Mogę ogarnąć auth, bazę i publiczne linki. Scope wygląda sensownie na kilka tygodni.",
      ],
    );

    await client.query(
      `insert into reports (id, reporter_id, reported_id, reason, description, status) values
       ('62000000-0000-4000-8000-000000000001',$1,$2,'spam',$3,'open'),
       ('62000000-0000-4000-8000-000000000002',$4,$5,'scam',$6,'open'),
       ('62000000-0000-4000-8000-000000000003',$7,$8,'inappropriate',$9,'resolved')`,
      [
        builders[2].id, builders[7].id, "Wysłał kilka identycznych zaproszeń do projektu niezwiązanych z moim profilem.",
        builders[0].id, builders[9].id, "W opisie zaproszenia prosił o wpłatę pieniędzy przed dołączeniem do projektu.",
        builders[5].id, builders[4].id, "W odpowiedzi w Pomocy pojawił się niepotrzebny link reklamowy. Treść została już usunięta.",
      ],
    );

    await client.query(
      `insert into analytics_events (id, event_type, user_id, metadata, created_at) values
       ('63000000-0000-4000-8000-000000000001','profile_created',$1,'{}'::jsonb,now() - interval '6 days'),
       ('63000000-0000-4000-8000-000000000002','project_created',$2,'{}'::jsonb,now() - interval '5 days'),
       ('63000000-0000-4000-8000-000000000003','project_application_sent',$3,'{}'::jsonb,now() - interval '4 days'),
       ('63000000-0000-4000-8000-000000000004','question_created',$4,'{}'::jsonb,now() - interval '3 days'),
       ('63000000-0000-4000-8000-000000000005','crew_created',$5,'{}'::jsonb,now() - interval '2 days'),
       ('63000000-0000-4000-8000-000000000006','project_application_accepted',$6,'{}'::jsonb,now() - interval '1 day'),
       ('63000000-0000-4000-8000-000000000007','answer_marked_helpful',$7,'{}'::jsonb,now() - interval '8 hours'),
       ('63000000-0000-4000-8000-000000000008','contact_revealed',$8,'{}'::jsonb,now() - interval '2 hours')
       on conflict (id) do update set
         event_type = excluded.event_type,
         user_id = excluded.user_id,
         metadata = excluded.metadata,
         created_at = excluded.created_at`,
      [builders[8].id, builders[0].id, builders[1].id, builders[2].id, builders[4].id, builders[3].id, builders[9].id, builders[5].id],
    );

    await client.query("commit");
    console.log("✅ Gotowe: 10 builderów, 6 projektów, 5 pytań demo i konto administratora.");
    console.log(`🔑 Konta builderów mają hasło: ${DEMO_PASSWORD}`);
    console.log("Przykład: kacper@demo.local / Demo12345!");
    console.log(`🛡️ Admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
    console.log("   Admin ma teraz system_role=ADMIN w bazie. ADMIN_EMAILS jest tylko awaryjnym bootstrapem.");
  } catch (error) {
    await client.query("rollback").catch(() => {});
    console.error("❌ Seed nie powiódł się.");
    if (error?.code === "42P01") {
      console.error("Brakuje tabel. Najpierw uruchom: npm run db:push");
    }
    console.error(error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

seed();
