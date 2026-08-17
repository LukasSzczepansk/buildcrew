import dotenv from "dotenv";
import crypto from "node:crypto";
import pg from "pg";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

if (typeof process.env.DATABASE_URL !== "string" || !process.env.DATABASE_URL.trim()) {
  throw new Error("DATABASE_URL is missing. Add it to .env.local before running this script.");
}

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const PEOPLE = [
  {
    username: "mateovr",
    email: "sample+launch-mateovr@buildcrew.invalid",
    role: "FULLSTACK",
    level: "EXPERIENCED",
    weekly: "5-10",
    headline: "Full-stack engineer building focused SaaS products",
    bio: "I like small product teams, fast feedback loops and shipping useful software without turning the stack into a science project. Mostly TypeScript, product infrastructure and early-stage SaaS.",
    country: "Spain",
    city: "Barcelona",
    languages: ["English", "Spanish"],
    lookingFor: ["HAS_PROJECT", "OPEN_TO_BUILD", "COFOUNDER", "FREELANCE"],
    goals: ["STARTUP", "COMMERCIAL"],
    skills: ["TypeScript", "Next.js", "Node.js", "PostgreSQL", "Product Engineering"],
    interests: ["SaaS", "Developer Tools", "Productivity"],
    activeHoursAgo: 6,
    createdDaysAgo: 46,
  },
  {
    username: "sofialabs",
    email: "sample+launch-sofialabs@buildcrew.invalid",
    role: "AI_ML",
    level: "BUILDING",
    weekly: "3-5",
    headline: "Applied AI builder working on search and knowledge tools",
    bio: "I prototype AI features that need to survive outside a demo: retrieval, evaluation, structured outputs and product integration. Interested in tools that help people work with messy information.",
    country: "Germany",
    city: "Berlin",
    languages: ["English", "German"],
    lookingFor: ["HAS_PROJECT", "OPEN_TO_BUILD", "WANTS_PROJECT", "FULL_TIME"],
    goals: ["LEARNING", "STARTUP"],
    skills: ["Python", "FastAPI", "RAG", "LLM", "PostgreSQL"],
    interests: ["AI", "Knowledge Management", "Research Tools"],
    activeHoursAgo: 11,
    createdDaysAgo: 34,
  },
  {
    username: "kaymakes",
    email: "sample+launch-kaymakes@buildcrew.invalid",
    role: "UI_UX",
    level: "EXPERIENCED",
    weekly: "3-5",
    headline: "Product designer for early-stage tools and collaborative products",
    bio: "I work from rough problem framing through flows, prototypes and UI. I am most useful when the product is still changing and design can shape what gets built, not just how it looks.",
    country: "Netherlands",
    city: "Amsterdam",
    languages: ["English"],
    lookingFor: ["HAS_PROJECT", "OPEN_TO_BUILD", "FREELANCE", "NETWORKING"],
    goals: ["STARTUP", "PORTFOLIO"],
    skills: ["Figma", "Product Discovery", "UX Research", "UI Design", "Prototyping"],
    interests: ["Collaboration", "Productivity", "SaaS"],
    activeHoursAgo: 21,
    createdDaysAgo: 61,
  },
  {
    username: "neelworks",
    email: "sample+launch-neelworks@buildcrew.invalid",
    role: "BACKEND",
    level: "EXPERIENCED",
    weekly: "5-10",
    headline: "Backend engineer interested in reliable, data-heavy products",
    bio: "I enjoy the parts of a product that should quietly keep working: data models, APIs, queues, observability and performance. Looking for practical products with a clear user workflow.",
    country: "United Kingdom",
    city: "London",
    languages: ["English"],
    lookingFor: ["HAS_PROJECT", "OPEN_TO_BUILD", "FULL_TIME", "NETWORKING"],
    goals: ["COMMERCIAL", "STARTUP"],
    skills: ["Node.js", "PostgreSQL", "Redis", "Docker", "API Design"],
    interests: ["FinTech", "SaaS", "Infrastructure"],
    activeHoursAgo: 29,
    createdDaysAgo: 52,
  },
  {
    username: "junocode",
    email: "sample+launch-junocode@buildcrew.invalid",
    role: "MOBILE",
    level: "BUILDING",
    weekly: "3-5",
    headline: "Mobile developer building simple products around local discovery",
    bio: "React Native developer who likes location-aware products, maps and small consumer apps. I prefer narrow MVPs that can be tested with real people quickly.",
    country: "Portugal",
    city: "Lisbon",
    languages: ["English", "Portuguese"],
    lookingFor: ["HAS_PROJECT", "OPEN_TO_BUILD", "WANTS_PROJECT", "FREELANCE"],
    goals: ["PORTFOLIO", "STARTUP"],
    skills: ["React Native", "Expo", "TypeScript", "Maps", "Supabase"],
    interests: ["Local Discovery", "Mobile", "Travel"],
    activeHoursAgo: 40,
    createdDaysAgo: 29,
  },
];

const PROJECTS = [
  {
    owner: "mateovr",
    name: "Patchnote",
    tagline: "A lightweight changelog for small product teams that want release notes without another CMS.",
    description: "Patchnote helps small SaaS teams turn shipped work into clear customer-facing release notes. The current MVP has a simple editor, grouped releases and a public changelog page. The next iteration is focused on GitHub-assisted drafts and making the first publish flow take less than five minutes.",
    ownerContribution: "Building the product, backend and release workflow.",
    stage: "TESTING",
    projectType: "SAAS",
    assets: ["DESIGN", "REPOSITORY", "MVP"],
    tech: ["Next.js", "TypeScript", "PostgreSQL"],
    interests: ["SaaS", "Developer Tools", "Productivity"],
    commitment: "5-10",
    goal: "STARTUP",
    character: ["STARTUP", "COMMERCIAL"],
    needs: ["TEAMMATES", "FEEDBACK"],
    createdDaysAgo: 31,
    updatedHoursAgo: 18,
    roles: [
      { type: "UI_UX", level: "BUILDING", skills: ["Figma", "Product Discovery"], description: "Help simplify first-run onboarding and shape the public changelog experience." },
    ],
    updates: [
      { kind: "MILESTONE", hoursAgo: 18, body: "The end-to-end publish flow is now working. A release can be drafted, grouped and published to a clean public page without touching code." },
      { kind: "PROGRESS", hoursAgo: 92, body: "Cut two steps from onboarding after testing the first flow. Next up is a small GitHub import experiment instead of a full integration." },
    ],
  },
  {
    owner: "sofialabs",
    name: "SignalNest",
    tagline: "A research inbox that turns saved articles, papers and notes into searchable working memory.",
    description: "SignalNest is for people who save useful research and then lose it across tabs, bookmarks and note apps. It captures sources, extracts structured notes and lets you search across them with citations. The prototype works locally; the current focus is reliable ingestion and a web experience simple enough for a small beta.",
    ownerContribution: "Building retrieval, ingestion and evaluation workflows.",
    stage: "BUILDING",
    projectType: "AI_ML",
    assets: ["RESEARCH", "PROTOTYPE", "REPOSITORY"],
    tech: ["Python", "FastAPI", "PostgreSQL", "RAG"],
    interests: ["AI", "Knowledge Management", "Productivity"],
    commitment: "3-5",
    goal: "STARTUP",
    character: ["STARTUP", "LEARNING"],
    needs: ["TEAMMATES", "BETA_TESTERS"],
    createdDaysAgo: 24,
    updatedHoursAgo: 26,
    roles: [
      { type: "FULLSTACK", level: "BUILDING", skills: ["Next.js", "TypeScript"], description: "Build the web product around the retrieval pipeline and make capture and search feel fast." },
    ],
    updates: [
      { kind: "PROGRESS", hoursAgo: 26, body: "Citation-aware search now works across saved web pages and PDFs. The rough edge is ingestion, so that is the focus before inviting more testers." },
      { kind: "MILESTONE", hoursAgo: 124, body: "The first evaluation set is in place for retrieval quality. It is already catching cases where the demo looked good but the source selection was weak." },
    ],
  },
  {
    owner: "kaymakes",
    name: "Threadmap",
    tagline: "A visual workspace for keeping product decisions, context and ownership out of buried chat threads.",
    description: "Threadmap explores a simple problem: important product decisions disappear inside long chat threads and meeting notes. The product turns a discussion into a visual decision map with context, alternatives, owners and follow-ups. The concept has been tested as a clickable prototype and is ready for a narrow collaborative web MVP.",
    ownerContribution: "Product direction, research, interaction design and prototypes.",
    stage: "DESIGN",
    projectType: "WEB_APP",
    assets: ["RESEARCH", "DESIGN", "PROTOTYPE"],
    tech: ["Next.js", "TypeScript"],
    interests: ["Collaboration", "Productivity", "SaaS"],
    commitment: "3-5",
    goal: "STARTUP",
    character: ["STARTUP", "PORTFOLIO"],
    needs: ["TEAMMATES", "FEEDBACK"],
    createdDaysAgo: 38,
    updatedHoursAgo: 39,
    roles: [
      { type: "FULLSTACK", level: "BUILDING", skills: ["Next.js", "TypeScript", "PostgreSQL"], description: "Turn the validated prototype into a small collaborative MVP without overbuilding the editor." },
    ],
    updates: [
      { kind: "PROGRESS", hoursAgo: 39, body: "The MVP scope is now down to decisions, links and ownership. The full document editor is out after prototype tests showed it was distracting from the core workflow." },
      { kind: "MILESTONE", hoursAgo: 148, body: "Finished the third prototype test. The strongest signal was not visual mapping itself, but being able to see why a decision was made weeks later." },
    ],
  },
  {
    owner: "neelworks",
    name: "LedgerLoop",
    tagline: "A weekly cash-flow view for freelancers and small studios that invoice clients across different tools.",
    description: "LedgerLoop brings invoices, expected payments and recurring business costs into one simple cash-flow view for independent consultants and tiny studios. The first version intentionally starts with CSV imports rather than deep accounting integrations. The goal is to validate whether a weekly cash snapshot is useful enough to become a habit.",
    ownerContribution: "Backend, data model and the first forecasting workflow.",
    stage: "TESTING",
    projectType: "SAAS",
    assets: ["RESEARCH", "MVP"],
    tech: ["Next.js", "Node.js", "PostgreSQL"],
    interests: ["FinTech", "SaaS", "Small Business"],
    commitment: "5-10",
    goal: "COMMERCIAL",
    character: ["COMMERCIAL", "STARTUP"],
    needs: ["TEAMMATES", "BETA_TESTERS"],
    createdDaysAgo: 27,
    updatedHoursAgo: 54,
    roles: [
      { type: "PRODUCT", level: "BUILDING", skills: ["Product Discovery", "Analytics"], description: "Run user interviews, sharpen the weekly workflow and help decide which forecasting features are actually worth building." },
    ],
    updates: [
      { kind: "PROGRESS", hoursAgo: 54, body: "The weekly cash snapshot is stable enough for structured testing. The next question is whether scenario planning belongs in the main flow or should stay optional." },
      { kind: "MILESTONE", hoursAgo: 176, body: "CSV import now handles the three formats used in the initial test data. Keeping integrations out of the first version has made iteration much faster." },
    ],
  },
  {
    owner: "junocode",
    name: "LocalLens",
    tagline: "A mobile discovery app for finding independent places based on interests instead of popularity rankings.",
    description: "LocalLens is a small mobile experiment around local discovery. Instead of ranking places by generic popularity, the app builds a short list from interests, context and lightweight collections made by other people. The first prototype is focused on Lisbon and a deliberately small set of categories so the recommendation loop can be tested before expanding coverage.",
    ownerContribution: "Mobile app, maps and the first recommendation flow.",
    stage: "BUILDING",
    projectType: "MOBILE_APP",
    assets: ["RESEARCH", "DESIGN", "PROTOTYPE"],
    tech: ["React Native", "Expo", "TypeScript", "Supabase"],
    interests: ["Local Discovery", "Mobile", "Travel"],
    commitment: "3-5",
    goal: "PORTFOLIO",
    character: ["PORTFOLIO", "STARTUP"],
    needs: ["TEAMMATES", "BETA_TESTERS"],
    createdDaysAgo: 19,
    updatedHoursAgo: 67,
    roles: [
      { type: "PRODUCT", level: "BUILDING", skills: ["Product Discovery", "User Research"], description: "Help test the recommendation concept locally and turn early feedback into a tighter discovery loop." },
    ],
    updates: [
      { kind: "PROGRESS", hoursAgo: 67, body: "The map and save-to-collection flow are working in the mobile prototype. Recommendations are still rule-based while the team tests what signals people actually care about." },
      { kind: "MILESTONE", hoursAgo: 196, body: "Finished the first route from onboarding interests to a short list of nearby places. The next test is whether collections are more useful than ratings for choosing where to go." },
    ],
  },
];

async function upsertTaxonomy(client, table, value, category = null) {
  if (table === "skills") {
    const result = await client.query(
      "insert into skills(name, category) values($1,$2) on conflict(name) do update set name=excluded.name returning id",
      [value, category || "Other"],
    );
    return result.rows[0].id;
  }

  const result = await client.query(
    "insert into interests(name) values($1) on conflict(name) do update set name=excluded.name returning id",
    [value],
  );
  return result.rows[0].id;
}

const client = await pool.connect();
try {
  await client.query("begin");

  // Replace earlier launch samples so rerunning the command stays deterministic.
  await client.query("delete from users where lower(email) like 'sample+%@buildcrew.invalid'");

  const users = new Map();
  for (const person of PEOPLE) {
    const usernameTaken = await client.query(
      "select 1 from profiles where lower(username)=lower($1) limit 1",
      [person.username],
    );
    if (usernameTaken.rows[0]) {
      throw new Error(`Cannot seed BuildCrew Lab profile @${person.username}: that username is already used by a real account.`);
    }

    const userId = crypto.randomUUID();
    await client.query(
      `insert into users(id,email,preferred_locale,email_verified_at,terms_accepted_at,privacy_accepted_at,last_login_at,last_active_at,created_at)
       values($1,$2,'en',now(),now(),now(),now()-($3::int * interval '1 hour'),now()-($3::int * interval '1 hour'),now()-($4::int * interval '1 day'))`,
      [userId, person.email, person.activeHoursAgo, person.createdDaysAgo],
    );

    await client.query(
      `insert into profiles(user_id,username,role,level,weekly_hours,bio,headline,country,city,languages,work_mode_preference,looking_for,goals,public_profile,onboarding_completed,onboarding_step,created_at,updated_at)
       values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'REMOTE',$11,$12,true,true,99,now()-($13::int * interval '1 day'),now()-($14::int * interval '1 hour'))`,
      [
        userId,
        person.username,
        person.role,
        person.level,
        person.weekly,
        person.bio,
        person.headline,
        person.country,
        person.city,
        person.languages,
        person.lookingFor,
        person.goals,
        person.createdDaysAgo,
        person.activeHoursAgo,
      ],
    );

    for (const skill of person.skills) {
      const skillId = await upsertTaxonomy(client, "skills", skill, "BuildCrew Lab");
      await client.query(
        "insert into profile_skills(user_id,skill_id) values($1,$2) on conflict do nothing",
        [userId, skillId],
      );
    }

    for (const interest of person.interests) {
      const interestId = await upsertTaxonomy(client, "interests", interest);
      await client.query(
        "insert into profile_interests(user_id,interest_id) values($1,$2) on conflict do nothing",
        [userId, interestId],
      );
    }

    users.set(person.username, userId);
  }

  for (const project of PROJECTS) {
    const ownerId = users.get(project.owner);
    if (!ownerId) throw new Error(`Missing BuildCrew Lab owner @${project.owner}`);

    const projectId = crypto.randomUUID();
    await client.query(
      `insert into projects(
        id,owner_id,entry_type,lifecycle_status,name,tagline,description,owner_contribution,stage,interests,commitment,goal,character,
        project_type,existing_assets,collaboration_mode,project_language,country,market_scope,needs,collaboration_pace,duration,created_at,updated_at
      ) values(
        $1,$2,'PROJECT','ACTIVE',$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'REMOTE','EN',null,'WORLDWIDE',$14,'REGULAR','3_6_MONTHS',
        now()-($15::int * interval '1 day'),now()-($16::int * interval '1 hour')
      )`,
      [
        projectId,
        ownerId,
        project.name,
        project.tagline,
        project.description,
        project.ownerContribution,
        project.stage,
        project.interests,
        project.commitment,
        project.goal,
        project.character,
        project.projectType,
        project.assets,
        project.needs,
        project.createdDaysAgo,
        project.updatedHoursAgo,
      ],
    );

    await client.query(
      "insert into project_members(project_id,user_id,is_owner,collaboration_status,member_confirmed_at,owner_confirmed_at) values($1,$2,true,'CONFIRMED',now(),now())",
      [projectId, ownerId],
    );

    for (const tech of project.tech) {
      await client.query(
        "insert into project_technologies(project_id,name) values($1,$2)",
        [projectId, tech],
      );
    }

    for (const role of project.roles) {
      await client.query(
        "insert into project_roles(id,project_id,role_type,description,preferred_level,skills,slots) values($1,$2,$3,$4,$5,$6,1)",
        [crypto.randomUUID(), projectId, role.type, role.description, role.level, role.skills],
      );
    }

    for (const update of project.updates) {
      await client.query(
        "insert into project_updates(id,project_id,author_id,kind,body,created_at) values($1,$2,$3,$4,$5,now()-($6::int * interval '1 hour'))",
        [crypto.randomUUID(), projectId, ownerId, update.kind, update.body, update.hoursAgo],
      );
    }
  }

  await client.query("commit");
  console.log(`Seeded ${PEOPLE.length} BuildCrew Lab profiles and ${PROJECTS.length} BuildCrew Lab projects.`);
  console.log("They use .invalid emails so the app can label them as BuildCrew Lab content and exclude them from real-user email flows.");
  console.log("Run npm run launch:remove-samples when real activity is strong enough to replace the launch seed.");
} catch (error) {
  await client.query("rollback");
  throw error;
} finally {
  client.release();
  await pool.end();
}
