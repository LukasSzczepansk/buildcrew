import dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path: ".env.local" });
dotenv.config();

const { Client } = pg;
const connectionString = process.env.DATABASE_URL;
const removeOnly = process.argv.includes("--remove");

if (!connectionString) {
  console.error("❌ Brak DATABASE_URL. Ustaw połączenie z bazą BuildCrew i spróbuj ponownie.");
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

if (!isLocalDatabase(connectionString) && process.env.ALLOW_SHOWCASE_SEED !== "true") {
  console.error("❌ Odmowa modyfikacji zdalnej bazy bez ALLOW_SHOWCASE_SEED=true.");
  console.error("Ustaw tę zmienną tylko na czas świadomego dodania/usunięcia danych demonstracyjnych.");
  process.exit(1);
}

const DEMO_USER_IDS = Array.from({ length: 14 }, (_, i) => `74000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`);
const CREW_IDS = Array.from({ length: 7 }, (_, i) => `74100000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`);
const PROJECT_IDS = Array.from({ length: 7 }, (_, i) => `74110000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`);
const ENTRY_IDS = Array.from({ length: 8 }, (_, i) => `74200000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`);

const builders = [
  { username: "nina.codes", avatar: "👩‍💻", role: "FRONTEND", level: "BUILDING", weeklyHours: "5-10", bio: "Frontend i produktowe UI. Najbardziej lubię małe aplikacje, które można szybko pokazać użytkownikom i iterować na prawdziwym feedbacku.", lookingFor: ["WANTS_PROJECT", "OPEN_TO_BUILD"], goals: ["PORTFOLIO", "STARTUP"], skills: ["React", "Next.js", "TypeScript", "Tailwind CSS"], interests: ["SaaS", "Productivity", "Creator Tools"] },
  { username: "tomek.api", avatar: "🧑‍💻", role: "BACKEND", level: "EXPERIENCED", weeklyHours: "3-5", bio: "Backend, PostgreSQL i API. Lubię proste architektury, sensowne modele danych i produkty, które faktycznie da się dowieźć małym zespołem.", lookingFor: ["WANTS_PROJECT", "OPEN_TO_BUILD"], goals: ["FUN", "PORTFOLIO"], skills: ["Node.js", "PostgreSQL", "REST API", "Docker"], interests: ["Developer Tools", "Fintech", "Automation"] },
  { username: "ola.design", avatar: "🎨", role: "UI_UX", level: "BUILDING", weeklyHours: "3-5", bio: "Projektuję flow, dashboardy i proste design systemy. Najchętniej pracuję nad produktami, w których design powstaje razem z MVP.", lookingFor: ["WANTS_PROJECT", "OPEN_TO_BUILD"], goals: ["PORTFOLIO", "LEARNING"], skills: ["Figma", "UX Research", "UI Design", "Prototyping"], interests: ["Health", "Education", "Productivity"] },
  { username: "maciek.builds", avatar: "🛠️", role: "FULLSTACK", level: "EXPERIENCED", weeklyHours: "5-10", bio: "Fullstack builder. Wolę wypuścić działające MVP w dwa tygodnie niż pół roku dopieszczać pomysł bez użytkowników.", lookingFor: ["HAS_PROJECT", "OPEN_TO_BUILD"], goals: ["STARTUP", "EXPERIMENT"], skills: ["Next.js", "TypeScript", "PostgreSQL", "Vercel"], interests: ["DevTools", "SaaS", "Open Source"] },
  { username: "karolina.mobile", avatar: "📱", role: "MOBILE", level: "BUILDING", weeklyHours: "5-10", bio: "Buduję aplikacje mobilne i lubię produkty, które rozwiązują jeden konkretny problem zamiast próbować robić wszystko naraz.", lookingFor: ["WANTS_PROJECT", "OPEN_TO_BUILD"], goals: ["PORTFOLIO", "STARTUP"], skills: ["React Native", "Expo", "TypeScript", "Firebase"], interests: ["Mobile", "Travel", "Fintech"] },
  { username: "piotr.ml", avatar: "🤖", role: "AI_ML", level: "BUILDING", weeklyHours: "3-5", bio: "AI/ML i praktyczne wykorzystanie modeli w małych produktach. Interesuje mnie przede wszystkim użyteczność, nie samo demo technologii.", lookingFor: ["WANTS_PROJECT", "OPEN_TO_BUILD"], goals: ["EXPERIMENT", "STARTUP"], skills: ["Python", "LLM", "RAG", "FastAPI"], interests: ["AI", "Education", "Automation"] },
  { username: "zuza.product", avatar: "🧭", role: "PRODUCT", level: "BUILDING", weeklyHours: "3-5", bio: "Product, research i ogarnianie zakresu MVP. Lubię zespoły, które szybko podejmują decyzje i regularnie pokazują efekt pracy.", lookingFor: ["OPEN_TO_BUILD", "WANTS_PROJECT"], goals: ["STARTUP", "FUN"], skills: ["Product Discovery", "User Research", "Analytics", "Roadmapping"], interests: ["SaaS", "Education", "Communities"] },
  { username: "kamil.node", avatar: "⚙️", role: "BACKEND", level: "BUILDING", weeklyHours: "5-10", bio: "Node.js, bazy danych i integracje. Chętnie dołączę do projektu, który ma jasny cel i małą ekipę.", lookingFor: ["WANTS_PROJECT", "OPEN_TO_BUILD"], goals: ["PORTFOLIO", "LEARNING"], skills: ["Node.js", "PostgreSQL", "Redis", "Docker"], interests: ["Fintech", "Automation", "Mobile"] },
  { username: "ania.pixel", avatar: "✨", role: "UI_UX", level: "EXPERIENCED", weeklyHours: "3-5", bio: "UI/UX z naciskiem na prostotę i czytelność. Lubię dopracowywać produkty, które już mają pierwsze działające flow.", lookingFor: ["WANTS_PROJECT", "OPEN_TO_BUILD"], goals: ["PORTFOLIO", "FUN"], skills: ["Figma", "Design Systems", "UX Writing", "Prototyping"], interests: ["Mobile", "Social", "Productivity"] },
  { username: "mateusz.react", avatar: "⚛️", role: "FRONTEND", level: "BUILDING", weeklyHours: "5-10", bio: "React, Next.js i interfejsy. Szukam małych zespołów, w których można mieć realny wpływ na produkt, a nie tylko zamykać tickety.", lookingFor: ["WANTS_PROJECT", "OPEN_TO_BUILD"], goals: ["PORTFOLIO", "STARTUP"], skills: ["React", "Next.js", "TypeScript", "Framer Motion"], interests: ["Education", "SaaS", "AI"] },
  { username: "lena.apps", avatar: "📲", role: "MOBILE", level: "BUILDING", weeklyHours: "3-5", bio: "Mobile i prototypowanie. Najbardziej motywują mnie aplikacje, które po kilku dniach można dać komuś do ręki i sprawdzić, czy mają sens.", lookingFor: ["HAS_PROJECT", "OPEN_TO_BUILD"], goals: ["PORTFOLIO", "EXPERIMENT"], skills: ["React Native", "Expo", "Supabase", "TypeScript"], interests: ["Health", "Habits", "Social"] },
  { username: "dawid.fullstack", avatar: "🚀", role: "FULLSTACK", level: "EXPERIENCED", weeklyHours: "5-10", bio: "Fullstack i deployment. Lubię szybko składać MVP, automatyzować nudne rzeczy i trzymać zakres projektu pod kontrolą.", lookingFor: ["WANTS_PROJECT", "OPEN_TO_BUILD"], goals: ["STARTUP", "FUN"], skills: ["Next.js", "Node.js", "PostgreSQL", "Cloudflare"], interests: ["Local", "Communities", "SaaS"] },
  { username: "kasia.product", avatar: "📋", role: "PRODUCT", level: "BUILDING", weeklyHours: "3-5", bio: "Product i UX research. Pomagam małym ekipom zamienić luźny pomysł w konkretne MVP i plan pierwszych testów.", lookingFor: ["WANTS_PROJECT", "OPEN_TO_BUILD"], goals: ["STARTUP", "LEARNING"], skills: ["Product Strategy", "Research", "Notion", "Analytics"], interests: ["Education", "Productivity", "Communities"] },
  { username: "michal.ai", avatar: "🧠", role: "AI_ML", level: "EXPERIENCED", weeklyHours: "3-5", bio: "AI engineering i prototypy z LLM. Interesują mnie narzędzia, które oszczędzają czas developerom i mają prosty, mierzalny use case.", lookingFor: ["HAS_PROJECT", "OPEN_TO_BUILD"], goals: ["EXPERIMENT", "STARTUP"], skills: ["Python", "OpenAI API", "Embeddings", "FastAPI"], interests: ["AI", "Developer Tools", "Automation"] },
].map((builder, index) => ({ ...builder, id: DEMO_USER_IDS[index], email: `showcase-${index + 1}@demo.buildcrew.invalid` }));

const projectDefs = [
  { id: PROJECT_IDS[0], crewId: CREW_IDS[0], owner: 0, name: "Focusly", tagline: "Prosty rytm pracy dla osób, które ciągle rozpraszają powiadomienia.", description: "Focusly łączy timer skupienia, krótkie podsumowania sesji i tygodniowy obraz tego, kiedy naprawdę udało się popracować bez rozpraszaczy.", stage: "LAUNCHED", interests: ["SaaS", "Productivity"], commitment: "5-10", goal: "MVP dla pierwszych testerów", character: ["PORTFOLIO", "STARTUP"], members: [0, 1, 2] },
  { id: PROJECT_IDS[1], crewId: CREW_IDS[1], owner: 5, name: "MealMind AI", tagline: "Pomysły na posiłki z produktów, które już masz w domu.", description: "Mały eksperyment AI: użytkownik wpisuje produkty z lodówki, a aplikacja proponuje kilka prostych posiłków i listę brakujących składników.", stage: "TESTING", interests: ["AI", "Health"], commitment: "3-5", goal: "Sprawdzić użyteczność pomysłu", character: ["EXPERIMENT", "PORTFOLIO"], members: [5, 6] },
  { id: PROJECT_IDS[2], crewId: CREW_IDS[2], owner: 4, name: "Splitly", tagline: "Wspólne wydatki na wyjazdach bez arkuszy i liczenia na czacie.", description: "Splitly upraszcza rozliczanie grupowych wyjazdów. Każdy dodaje wydatek, a aplikacja na końcu pokazuje najmniejszą liczbę przelewów potrzebnych do rozliczenia grupy.", stage: "TESTING", interests: ["Mobile", "Fintech", "Travel"], commitment: "5-10", goal: "Publiczne MVP", character: ["PORTFOLIO", "STARTUP"], members: [4, 7, 8] },
  { id: PROJECT_IDS[3], crewId: CREW_IDS[3], owner: 9, name: "StudyFlow", tagline: "Plan nauki, który zamienia duży materiał w krótkie, realistyczne sesje.", description: "StudyFlow pomaga studentom rozłożyć materiał przed egzaminem na małe sesje, pilnuje postępu i pozwala szybko zmienić plan, kiedy wypada dzień nauki.", stage: "LAUNCHED", interests: ["Education", "Productivity"], commitment: "5-10", goal: "Testy ze studentami", character: ["PORTFOLIO", "STARTUP"], members: [9, 12, 1] },
  { id: PROJECT_IDS[4], crewId: CREW_IDS[4], owner: 11, name: "LocalMeet", tagline: "Znajdź osobę do wspólnej pracy albo nauki w swoim mieście.", description: "LocalMeet to prosty katalog krótkich spotkań do coworkingu i nauki. Bez swipe'owania — wybierasz temat, miejsce i godzinę.", stage: "BUILDING", interests: ["Local", "Communities"], commitment: "3-5", goal: "MVP dla jednego miasta", character: ["HOBBY", "PORTFOLIO"], members: [11, 8] },
  { id: PROJECT_IDS[5], crewId: CREW_IDS[5], owner: 13, name: "CodeLens", tagline: "Wyjaśnia fragment kodu w kontekście całego zadania, nie tylko linijka po linijce.", description: "CodeLens to narzędzie dla osób uczących się programowania. Użytkownik wkleja kod i opis zadania, a aplikacja tłumaczy decyzje, potencjalne błędy i możliwe uproszczenia.", stage: "TESTING", interests: ["AI", "Developer Tools", "Education"], commitment: "3-5", goal: "Sprawdzić jakość feedbacku AI", character: ["EXPERIMENT", "PORTFOLIO"], members: [13, 0] },
  { id: PROJECT_IDS[6], crewId: CREW_IDS[6], owner: 10, name: "HabitCrew", tagline: "Małe grupy, które pomagają sobie utrzymać jeden nawyk przez 30 dni.", description: "HabitCrew łączy 3–5 osób wokół jednego nawyku. Zamiast skomplikowanych statystyk są krótkie check-iny, wspólny postęp i delikatne przypomnienia.", stage: "BUILDING", interests: ["Mobile", "Health", "Social"], commitment: "3-5", goal: "Pierwsza grupa testowa", character: ["PORTFOLIO", "HOBBY"], members: [10, 6, 7, 2] },
];

const entries = [
  { id: ENTRY_IDS[0], creator: 0, projectIndex: 0, title: "Focusly", tagline: "Minimalistyczny timer skupienia z tygodniowym podsumowaniem.", description: "Zaczęliśmy od pytania: czy timer do skupienia może być prostszy niż lista funkcji w typowej aplikacji produktywności?\n\nFocusly ma tylko trzy rzeczy: rozpoczęcie sesji, szybkie oznaczenie jej wyniku i tygodniowy wykres skupienia. Po kilku iteracjach wyrzuciliśmy checklisty, cele dzienne i rozbudowane statystyki. Dzięki temu MVP jest lekkie i szybkie.", screenshot: "/showcase-demo/focusly.svg", category: "SAAS", status: "LIVE", reactions: [12, 9, 7] },
  { id: ENTRY_IDS[1], creator: 5, projectIndex: 1, title: "MealMind AI", tagline: "Co ugotować z tego, co już masz? Mały eksperyment z AI.", description: "Użytkownik wpisuje kilka składników, które ma pod ręką. MealMind proponuje 3 realistyczne posiłki, zaznacza brakujące rzeczy i pozwala od razu wygenerować krótką instrukcję.\n\nNajwiększym wyzwaniem było ograniczenie odpowiedzi modelu tak, żeby pomysły były proste i faktycznie wykonalne, a nie tylko efektowne.", screenshot: "/showcase-demo/mealmind-ai.svg", category: "AI", status: "EXPERIMENT", reactions: [9, 11, 8] },
  { id: ENTRY_IDS[2], creator: 4, projectIndex: 2, title: "Splitly", tagline: "Szybkie rozliczanie wspólnych wydatków po wyjeździe.", description: "Splitly powstało po kolejnym wyjeździe, na którym część wydatków była w arkuszu, część na czacie, a część tylko w pamięci.\n\nMVP pozwala utworzyć wyjazd, dodać osoby i wydatki, a na końcu wylicza minimalny zestaw przelewów. Testujemy też tryb offline dla słabszego zasięgu.", screenshot: "/showcase-demo/splitly.svg", category: "MOBILE", status: "MVP", reactions: [10, 7, 9] },
  { id: ENTRY_IDS[3], creator: 3, projectIndex: null, title: "DevShelf", tagline: "Prywatna biblioteka narzędzi, snippetów i linków dla developerów.", description: "DevShelf to projekt solo, który zaczął się od prywatnej listy linków. Dodałem tagowanie, szybkie wyszukiwanie i możliwość zapisania krótkiej notatki z informacją, po co właściwie dany zasób był mi potrzebny.\n\nNajbardziej zależało mi na tym, żeby dodanie nowej rzeczy zajmowało kilka sekund.", screenshot: "/showcase-demo/devshelf.svg", category: "DEVTOOLS", status: "LIVE", reactions: [8, 6, 5] },
  { id: ENTRY_IDS[4], creator: 9, projectIndex: 3, title: "StudyFlow", tagline: "Realistyczny plan nauki zamiast kolejnej listy zadań.", description: "StudyFlow bierze zakres materiału, termin i dostępny czas, a potem dzieli przygotowania na krótkie sesje. Jeśli dzień wypada, plan przelicza kolejne dni bez karania użytkownika czerwonymi statystykami.\n\nPierwsze testy robiliśmy na planach do sesji i nauce języka.", screenshot: "/showcase-demo/studyflow.svg", category: "EDUCATION", status: "MVP", reactions: [11, 10, 10] },
  { id: ENTRY_IDS[5], creator: 11, projectIndex: 4, title: "LocalMeet", tagline: "Coworking i wspólna nauka z ludźmi z okolicy.", description: "LocalMeet pozwala wystawić krótkie spotkanie: temat, miejsce, czas i maksymalną liczbę osób. Chcemy sprawdzić, czy mały, konkretny format działa lepiej niż duże grupy społecznościowe, w których trudno się faktycznie umówić.", screenshot: "/showcase-demo/localmeet.svg", category: "WEB", status: "EXPERIMENT", reactions: [7, 8, 6] },
  { id: ENTRY_IDS[6], creator: 13, projectIndex: 5, title: "CodeLens", tagline: "Feedback do kodu dla osób, które chcą zrozumieć rozwiązanie, a nie dostać gotowca.", description: "CodeLens analizuje fragment kodu razem z opisem zadania i odpowiada w trzech częściach: co działa, co może być problemem i jakie pytanie warto sobie zadać przed poprawką.\n\nCelowo unikamy generowania całego rozwiązania jednym kliknięciem — to ma pomagać w nauce, a nie ją omijać.", screenshot: "/showcase-demo/codelens.svg", category: "AI", status: "MVP", reactions: [10, 9, 11] },
  { id: ENTRY_IDS[7], creator: 10, projectIndex: 6, title: "HabitCrew", tagline: "30 dni jednego nawyku w małej ekipie zamiast samotnego streaka.", description: "HabitCrew tworzy małe grupy wokół konkretnego celu — np. spacer, nauka języka albo regularne kodowanie. Każdego dnia jest jeden prosty check-in i widok wspólnego postępu.\n\nTestujemy, czy obecność 3–4 osób działa motywująco bez presji typowej dla publicznych rankingów.", screenshot: "/showcase-demo/habitcrew.svg", category: "MOBILE", status: "MVP", reactions: [9, 8, 7] },
];

const feedbackTemplates = [
  ["Bardzo czytelne i od razu wiadomo, do czego służy.", "Dodałbym krótkie demo w pierwszym ekranie, żeby szybciej pokazać wartość.", "YES"],
  ["Fajnie ograniczony zakres MVP — nie ma poczucia przeładowania.", "Warto przetestować onboarding na osobach, które pierwszy raz widzą produkt.", "YES"],
  ["Pomysł jest prosty, ale rozwiązuje konkretny problem.", "Przydałoby się mocniej pokazać, czym różni się od podobnych narzędzi.", "MAYBE"],
  ["Dobre flow i sensowna hierarchia informacji.", "Na mobile część akcji mogłaby być bardziej dostępna jednym kciukiem.", "YES"],
  ["Podoba mi się, że projekt nie próbuje robić wszystkiego naraz.", "Dodałbym jeden konkretny przykład użycia na stronie startowej.", "MAYBE"],
  ["To wygląda jak coś, co da się realnie przetestować z użytkownikami już teraz.", "Zebrałbym kilka krótkich historii od pierwszych testerów i pokazał je przy projekcie.", "YES"],
];

function daysAgo(days, hours = 0) {
  return new Date(Date.now() - (days * 24 + hours) * 60 * 60 * 1000);
}

async function assertShowcaseSchema(client) {
  const result = await client.query("select to_regclass('public.showcase_entries') as showcase, to_regclass('public.showcase_reactions') as reactions, to_regclass('public.showcase_feedback') as feedback");
  if (!result.rows[0]?.showcase || !result.rows[0]?.reactions || !result.rows[0]?.feedback) {
    throw new Error("Brakuje tabel Showcase w bazie. Najpierw zastosuj główny patch Showcase i uruchom npm run db:push na właściwej bazie BuildCrew.");
  }
}

async function removeDemo(client) {
  await client.query("delete from showcase_entries where id = any($1::uuid[])", [ENTRY_IDS]);
  await client.query("delete from projects where id = any($1::uuid[])", [PROJECT_IDS]);
  await client.query("delete from crews where id = any($1::uuid[])", [CREW_IDS]);
  await client.query("delete from users where id = any($1::uuid[])", [DEMO_USER_IDS]);
}

async function ensureSkill(client, name) {
  const { rows } = await client.query("insert into skills(name, category) values ($1, 'Showcase demo') on conflict (name) do update set name = excluded.name returning id", [name]);
  return rows[0].id;
}

async function ensureInterest(client, name) {
  const { rows } = await client.query("insert into interests(name) values ($1) on conflict (name) do update set name = excluded.name returning id", [name]);
  return rows[0].id;
}

async function seed(client) {
  await removeDemo(client);

  for (let i = 0; i < builders.length; i += 1) {
    const builder = builders[i];
    const createdAt = daysAgo(26 - i);
    await client.query(
      `insert into users(id, email, password_hash, system_role, email_verified_at, terms_accepted_at, privacy_accepted_at, is_suspended, created_at)
       values ($1, $2, null, 'USER', $3, $3, $3, false, $3)`,
      [builder.id, builder.email, createdAt],
    );
    await client.query(
      `insert into profiles(user_id, username, role, level, weekly_hours, bio, looking_for, goals, avatar_emoji, onboarding_completed, onboarding_step, created_at, updated_at)
       values ($1, $2, $3, $4, $5, $6, $7::text[], $8::text[], $9, true, 5, $10, $10)`,
      [builder.id, builder.username, builder.role, builder.level, builder.weeklyHours, builder.bio, builder.lookingFor, builder.goals, builder.avatar, createdAt],
    );

    for (const skillName of builder.skills) {
      const skillId = await ensureSkill(client, skillName);
      await client.query("insert into profile_skills(user_id, skill_id) values ($1, $2) on conflict do nothing", [builder.id, skillId]);
    }
    for (const interestName of builder.interests) {
      const interestId = await ensureInterest(client, interestName);
      await client.query("insert into profile_interests(user_id, interest_id) values ($1, $2) on conflict do nothing", [builder.id, interestId]);
    }
  }

  for (let i = 0; i < projectDefs.length; i += 1) {
    const project = projectDefs[i];
    const ownerId = builders[project.owner].id;
    const createdAt = daysAgo(18 - i);
    await client.query(
      "insert into crews(id, status, created_by, project_id, created_at) values ($1, 'CONVERTED_TO_PROJECT', $2, null, $3)",
      [project.crewId, ownerId, createdAt],
    );
    await client.query(
      `insert into projects(id, owner_id, crew_id, name, tagline, description, stage, interests, owner_contribution, commitment, goal, character, created_at, updated_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8::text[], $9, $10, $11, $12::text[], $13, $13)`,
      [project.id, ownerId, project.crewId, project.name, project.tagline, project.description, project.stage, project.interests, "Budowa MVP i koordynacja zakresu", project.commitment, project.goal, project.character, createdAt],
    );
    await client.query("update crews set project_id = $1 where id = $2", [project.id, project.crewId]);
    for (const memberIndex of project.members) {
      const member = builders[memberIndex];
      await client.query(
        "insert into project_members(project_id, user_id, role_id, role_type, is_owner, joined_at) values ($1, $2, null, $3, $4, $5)",
        [project.id, member.id, member.role, memberIndex === project.owner, createdAt],
      );
      await client.query(
        "insert into crew_members(crew_id, user_id, joined_at) values ($1, $2, $3) on conflict do nothing",
        [project.crewId, member.id, createdAt],
      );
    }
  }

  for (let i = 0; i < entries.length; i += 1) {
    const entry = entries[i];
    const creator = builders[entry.creator];
    const project = entry.projectIndex === null ? null : projectDefs[entry.projectIndex];
    const createdAt = daysAgo(Math.min(6, i + 1), i * 2);
    await client.query(
      `insert into showcase_entries(id, creator_id, project_id, crew_id, challenge_id, title, tagline, description, screenshot_url, live_url, github_url, category, status, looking_for_collaborators, looking_for_text, created_at, updated_at)
       values ($1, $2, $3, $4, null, $5, $6, $7, $8, null, null, $9, $10, false, null, $11, $11)`,
      [entry.id, creator.id, project?.id ?? null, project?.crewId ?? null, entry.title, entry.tagline, entry.description, entry.screenshot, entry.category, entry.status, createdAt],
    );

    const candidateIds = builders.map((builder) => builder.id).filter((id) => id !== creator.id);
    const reactionNames = ["APPLAUSE", "IDEA", "POTENTIAL"];
    for (let r = 0; r < reactionNames.length; r += 1) {
      const count = Math.min(entry.reactions[r], candidateIds.length);
      for (let n = 0; n < count; n += 1) {
        const userId = candidateIds[(n + i * 2 + r) % candidateIds.length];
        await client.query(
          "insert into showcase_reactions(entry_id, user_id, reaction, created_at) values ($1, $2, $3, $4) on conflict do nothing",
          [entry.id, userId, reactionNames[r], daysAgo((n + i) % 6, n)],
        );
      }
    }

    const feedbackCount = 3 + (i % 3);
    const feedbackAuthors = candidateIds.slice(i % 4).concat(candidateIds.slice(0, i % 4)).slice(0, feedbackCount);
    for (let f = 0; f < feedbackAuthors.length; f += 1) {
      const template = feedbackTemplates[(i + f) % feedbackTemplates.length];
      const feedbackId = `74300000-0000-4000-8000-${String(i * 10 + f + 1).padStart(12, "0")}`;
      await client.query(
        `insert into showcase_feedback(id, entry_id, user_id, liked, improve, would_use, created_at, updated_at)
         values ($1, $2, $3, $4, $5, $6, $7, $7)`,
        [feedbackId, entry.id, feedbackAuthors[f], template[0], template[1], template[2], daysAgo((f + i) % 6, f * 3)],
      );
    }
  }
}

const client = new Client({ connectionString });
try {
  await client.connect();
  await assertShowcaseSchema(client);
  await client.query("begin");
  if (removeOnly) {
    await removeDemo(client);
    await client.query("commit");
    console.log("✅ Usunięto wyłącznie demonstracyjną zawartość Showcase z tego seeda.");
  } else {
    await seed(client);
    await client.query("commit");
    console.log("✅ Showcase demo gotowy: 8 projektów, 14 demonstracyjnych builderów, reakcje i feedback.");
    console.log("ℹ️ Wszystkie profile i projekty są oznaczane w UI jako Demo.");
  }
} catch (error) {
  try { await client.query("rollback"); } catch {}
  console.error("❌ Seed Showcase nie został zapisany:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
