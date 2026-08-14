import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const uuidPk = () =>
  uuid("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

// ---------------------------------------------------------------------------
// Auth (minimal, self-hosted — see README for the Supabase Auth equivalent)
// ---------------------------------------------------------------------------

export const systemRoleEnum = ["USER", "MODERATOR", "ADMIN"] as const;
export type SystemRole = (typeof systemRoleEnum)[number];

export const users = pgTable("users", {
  id: uuidPk(),
  email: text("email").notNull(),
  passwordHash: text("password_hash"),
  systemRole: text("system_role").$type<SystemRole>().notNull().default("USER"),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  termsAcceptedAt: timestamp("terms_accepted_at", { withTimezone: true }),
  privacyAcceptedAt: timestamp("privacy_accepted_at", { withTimezone: true }),
  passwordChangedAt: timestamp("password_changed_at", { withTimezone: true }),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  lastActiveAt: timestamp("last_active_at", { withTimezone: true }),
  isSuspended: boolean("is_suspended").notNull().default(false),
  suspendedAt: timestamp("suspended_at", { withTimezone: true }),
  suspendedReason: text("suspended_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("users_email_idx").on(t.email)]);

export const authAccounts = pgTable("auth_accounts", {
  id: uuidPk(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex("auth_accounts_provider_account_idx").on(t.provider, t.providerAccountId),
  uniqueIndex("auth_accounts_user_provider_idx").on(t.userId, t.provider),
]);

export const sessions = pgTable("sessions", {
  id: uuidPk(),
  tokenHash: text("token_hash"),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("sessions_token_hash_idx").on(t.tokenHash)]);

export const emailVerificationTokens = pgTable("email_verification_tokens", {
  id: uuidPk(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("email_verification_token_hash_idx").on(t.tokenHash), index("email_verification_user_idx").on(t.userId)]);

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuidPk(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("password_reset_token_hash_idx").on(t.tokenHash), index("password_reset_user_idx").on(t.userId)]);

export const adminLoginChallenges = pgTable("admin_login_challenges", {
  id: uuidPk(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  codeHash: text("code_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  attempts: integer("attempts").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("admin_login_challenge_user_idx").on(t.userId)]);

export const rateLimitBuckets = pgTable("rate_limit_buckets", {
  id: serial("id").primaryKey(),
  scope: text("scope").notNull(),
  keyHash: text("key_hash").notNull(),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
  count: integer("count").notNull().default(1),
}, (t) => [uniqueIndex("rate_limit_scope_key_window_idx").on(t.scope, t.keyHash, t.windowStart), index("rate_limit_window_idx").on(t.windowStart)]);

// ---------------------------------------------------------------------------
// Profiles
// ---------------------------------------------------------------------------

export const roleTypeEnum = [
  "FRONTEND",
  "BACKEND",
  "FULLSTACK",
  "UI_UX",
  "MOBILE",
  "AI_ML",
  "PRODUCT",
  "MARKETING",
] as const;
export type RoleType = (typeof roleTypeEnum)[number];

export const levelEnum = ["LEARNING", "BUILDING", "EXPERIENCED"] as const;
export type Level = (typeof levelEnum)[number];

export const commitmentEnum = ["1-2", "3-5", "5-10", "10+"] as const;
export type Commitment = (typeof commitmentEnum)[number];

export const goalEnum = [
  "LEARNING",
  "PORTFOLIO",
  "FUN",
  "STARTUP",
  "EXPERIMENT",
  "COMMERCIAL",
] as const;
export type Goal = (typeof goalEnum)[number];

export const lookingForEnum = ["HAS_PROJECT", "WANTS_PROJECT", "OPEN_TO_BUILD"] as const;
export type LookingFor = (typeof lookingForEnum)[number];

export const profiles = pgTable("profiles", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  username: text("username").notNull(),
  role: text("role").$type<RoleType>(),
  level: text("level").$type<Level>(),
  weeklyHours: text("weekly_hours").$type<Commitment>(),
  bio: text("bio"),
  lookingFor: text("looking_for").array().$type<LookingFor[]>().notNull().default(sql`'{}'::text[]`),
  goals: text("goals").array().$type<Goal[]>().notNull().default(sql`'{}'::text[]`),
  githubUrl: text("github_url"),
  portfolioUrl: text("portfolio_url"),
  linkedinUrl: text("linkedin_url"),
  avatarEmoji: text("avatar_emoji").notNull().default("🙂"),
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  onboardingStep: integer("onboarding_step").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("profiles_username_idx").on(t.username)]);

export const profilePrivate = pgTable("profile_private", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  discordUsername: text("discord_username"),
});

export const skills = pgTable("skills", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
}, (t) => [uniqueIndex("skills_name_idx").on(t.name)]);

export const profileSkills = pgTable("profile_skills", {
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  skillId: integer("skill_id").notNull().references(() => skills.id, { onDelete: "cascade" }),
}, (t) => [primaryKey({ columns: [t.userId, t.skillId] })]);

export const interests = pgTable("interests", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
}, (t) => [uniqueIndex("interests_name_idx").on(t.name)]);

export const profileInterests = pgTable("profile_interests", {
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  interestId: integer("interest_id").notNull().references(() => interests.id, { onDelete: "cascade" }),
}, (t) => [primaryKey({ columns: [t.userId, t.interestId] })]);

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export const stageEnum = ["IDEA", "DESIGN", "BUILDING", "TESTING", "LAUNCHED"] as const;
export type Stage = (typeof stageEnum)[number];

export const characterEnum = ["LEARNING", "PORTFOLIO", "HOBBY", "STARTUP", "COMMERCIAL"] as const;
export type Character = (typeof characterEnum)[number];

export const projectTypeEnum = [
  "WEB_APP",
  "MOBILE_APP",
  "SAAS",
  "OPEN_SOURCE",
  "DEV_TOOL",
  "AI_ML",
  "GAME",
  "MARKETPLACE",
  "ECOMMERCE",
  "COMMUNITY",
  "OTHER",
] as const;
export type ProjectType = (typeof projectTypeEnum)[number];

export const projectAssetEnum = [
  "RESEARCH",
  "DESIGN",
  "LANDING",
  "REPOSITORY",
  "PROTOTYPE",
  "MVP",
  "USERS",
  "REVENUE",
] as const;
export type ProjectAsset = (typeof projectAssetEnum)[number];

export const collaborationModeEnum = ["REMOTE", "HYBRID", "LOCAL"] as const;
export type CollaborationMode = (typeof collaborationModeEnum)[number];

export const collaborationPaceEnum = ["RELAXED", "REGULAR", "INTENSIVE"] as const;
export type CollaborationPace = (typeof collaborationPaceEnum)[number];

export const projectDurationEnum = ["WEEKEND", "1_2_MONTHS", "3_6_MONTHS", "LONG_TERM"] as const;
export type ProjectDuration = (typeof projectDurationEnum)[number];

export const projectEntryTypeEnum = ["PROJECT", "IDEA"] as const;
export type ProjectEntryType = (typeof projectEntryTypeEnum)[number];

export const crews = pgTable("crews", {
  id: uuidPk(),
  status: text("status").$type<"FORMING" | "CONVERTED_TO_PROJECT" | "ARCHIVED">().notNull().default("FORMING"),
  createdBy: uuid("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  projectId: uuid("project_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const projects = pgTable("projects", {
  id: uuidPk(),
  ownerId: uuid("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  crewId: uuid("crew_id").references(() => crews.id, { onDelete: "set null" }),
  entryType: text("entry_type").$type<ProjectEntryType>().notNull().default("PROJECT"),
  name: text("name").notNull(),
  tagline: text("tagline").notNull(),
  description: text("description").notNull(),
  stage: text("stage").$type<Stage>().notNull().default("IDEA"),
  interests: text("interests").array().$type<string[]>().notNull().default(sql`'{}'::text[]`),
  ownerContribution: text("owner_contribution"),
  commitment: text("commitment").$type<Commitment>(),
  goal: text("goal"),
  character: text("character").array().$type<Character[]>().notNull().default(sql`'{}'::text[]`),
  projectType: text("project_type").$type<ProjectType>(),
  existingAssets: text("existing_assets").array().$type<ProjectAsset[]>().notNull().default(sql`'{}'::text[]`),
  collaborationMode: text("collaboration_mode").$type<CollaborationMode>(),
  collaborationPace: text("collaboration_pace").$type<CollaborationPace>(),
  duration: text("duration").$type<ProjectDuration>(),
  repositoryUrl: text("repository_url"),
  demoUrl: text("demo_url"),
  designUrl: text("design_url"),
  docsUrl: text("docs_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("projects_owner_idx").on(t.ownerId)]);

export const projectIdeaInterests = pgTable("project_idea_interests", {
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  primaryKey({ columns: [t.projectId, t.userId] }),
  index("project_idea_interests_project_idx").on(t.projectId, t.createdAt),
]);

export const projectTechnologies = pgTable("project_technologies", {
  id: serial("id").primaryKey(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
});

export const projectRoles = pgTable("project_roles", {
  id: uuidPk(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  roleType: text("role_type").$type<RoleType>().notNull(),
  description: text("description"),
  preferredLevel: text("preferred_level").$type<Level>(),
  skills: text("skills").array().$type<string[]>().notNull().default(sql`'{}'::text[]`),
  slots: integer("slots").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [check("project_roles_slots_check", sql`${t.slots} between 1 and 10`)]);

export const projectMembers = pgTable("project_members", {
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  roleId: uuid("role_id").references(() => projectRoles.id, { onDelete: "set null" }),
  roleType: text("role_type").$type<RoleType>(),
  isOwner: boolean("is_owner").notNull().default(false),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.projectId, t.userId] })]);

export const applicationStatusEnum = ["PENDING", "ACCEPTED", "REJECTED"] as const;
export type ApplicationStatus = (typeof applicationStatusEnum)[number];

export const applications = pgTable("applications", {
  id: uuidPk(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  roleId: uuid("role_id").notNull().references(() => projectRoles.id, { onDelete: "cascade" }),
  applicantId: uuid("applicant_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  message: text("message"),
  status: text("status").$type<ApplicationStatus>().notNull().default("PENDING"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("applications_project_idx").on(t.projectId),
  uniqueIndex("applications_pending_unique_idx")
    .on(t.projectId, t.roleId, t.applicantId)
    .where(sql`${t.status} = 'PENDING'`),
]);

export const projectInvites = pgTable("project_invites", {
  id: uuidPk(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  roleId: uuid("role_id").references(() => projectRoles.id, { onDelete: "set null" }),
  inviterId: uuid("inviter_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  inviteeId: uuid("invitee_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  message: text("message"),
  status: text("status").$type<ApplicationStatus>().notNull().default("PENDING"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("project_invites_pending_unique_idx").on(t.projectId, t.inviteeId).where(sql`${t.status} = 'PENDING'`)]);

// ---------------------------------------------------------------------------
// Crews (Build Pool)
// ---------------------------------------------------------------------------

export const crewMembers = pgTable("crew_members", {
  crewId: uuid("crew_id").notNull().references(() => crews.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.crewId, t.userId] })]);

export const crewInvites = pgTable("crew_invites", {
  id: uuidPk(),
  crewId: uuid("crew_id").notNull().references(() => crews.id, { onDelete: "cascade" }),
  inviterId: uuid("inviter_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  inviteeId: uuid("invitee_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  message: text("message"),
  status: text("status").$type<ApplicationStatus>().notNull().default("PENDING"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("crew_invites_pending_unique_idx").on(t.crewId, t.inviteeId).where(sql`${t.status} = 'PENDING'`)]);


export const buildPoolListingStatusEnum = ["ACTIVE", "PAUSED", "CLOSED"] as const;
export type BuildPoolListingStatus = (typeof buildPoolListingStatusEnum)[number];

/**
 * An explicit "I am available to build now" card. This intentionally lives
 * outside profiles so Builderzy stays a directory while Build Pool only shows
 * people who have actively opted in.
 */
export const buildPoolListings = pgTable("build_pool_listings", {
  id: uuidPk(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  headline: text("headline").notNull(),
  role: text("role").$type<RoleType>().notNull(),
  technologies: text("technologies").array().$type<string[]>().notNull().default(sql`'{}'::text[]`),
  wantsToBuild: text("wants_to_build").notNull(),
  avoids: text("avoids"),
  weeklyHours: text("weekly_hours").$type<Commitment>().notNull(),
  preferredCrewSize: integer("preferred_crew_size").notNull().default(3),
  level: text("level").$type<Level>().notNull(),
  description: text("description"),
  status: text("status").$type<BuildPoolListingStatus>().notNull().default("ACTIVE"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex("build_pool_listings_user_idx").on(t.userId),
  index("build_pool_listings_status_idx").on(t.status, t.updatedAt),
  check("build_pool_listings_crew_size_check", sql`${t.preferredCrewSize} between 2 and 4`),
]);

// "Zbudujmy coś razem" proposal between two people with no crew yet.
export const buildProposals = pgTable("build_proposals", {
  id: uuidPk(),
  senderId: uuid("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  receiverId: uuid("receiver_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  message: text("message"),
  challengeId: uuid("challenge_id"),
  status: text("status").$type<ApplicationStatus>().notNull().default("PENDING"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("build_proposals_pending_unique_idx").on(t.senderId, t.receiverId).where(sql`${t.status} = 'PENDING'`)]);


// ---------------------------------------------------------------------------
// Friends & 1:1 messaging
// ---------------------------------------------------------------------------

export const friendRequestStatusEnum = ["PENDING", "ACCEPTED", "REJECTED", "CANCELLED"] as const;
export type FriendRequestStatus = (typeof friendRequestStatusEnum)[number];

export const friendRequests = pgTable("friend_requests", {
  id: uuidPk(),
  senderId: uuid("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  receiverId: uuid("receiver_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  pairKey: text("pair_key").notNull(),
  status: text("status").$type<FriendRequestStatus>().notNull().default("PENDING"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex("friend_requests_pending_pair_idx").on(t.pairKey).where(sql`${t.status} = 'PENDING'`),
  index("friend_requests_receiver_status_idx").on(t.receiverId, t.status),
  index("friend_requests_sender_status_idx").on(t.senderId, t.status),
  check("friend_requests_not_self_check", sql`${t.senderId} <> ${t.receiverId}`),
]);

export const friendships = pgTable("friendships", {
  id: uuidPk(),
  userLowId: uuid("user_low_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  userHighId: uuid("user_high_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex("friendships_pair_idx").on(t.userLowId, t.userHighId),
  index("friendships_low_idx").on(t.userLowId),
  index("friendships_high_idx").on(t.userHighId),
  check("friendships_not_self_check", sql`${t.userLowId} <> ${t.userHighId}`),
]);

export const conversations = pgTable("conversations", {
  id: uuidPk(),
  userLowId: uuid("user_low_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  userHighId: uuid("user_high_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex("conversations_pair_idx").on(t.userLowId, t.userHighId),
  index("conversations_low_idx").on(t.userLowId),
  index("conversations_high_idx").on(t.userHighId),
  index("conversations_updated_idx").on(t.updatedAt),
  check("conversations_not_self_check", sql`${t.userLowId} <> ${t.userHighId}`),
]);

export const messages = pgTable("messages", {
  id: uuidPk(),
  conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  senderId: uuid("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("messages_conversation_created_idx").on(t.conversationId, t.createdAt),
  index("messages_conversation_read_idx").on(t.conversationId, t.readAt),
  index("messages_sender_idx").on(t.senderId),
]);

// ---------------------------------------------------------------------------
// Help / Q&A
// ---------------------------------------------------------------------------

export const questions = pgTable("questions", {
  id: uuidPk(),
  authorId: uuid("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const questionTags = pgTable("question_tags", {
  id: serial("id").primaryKey(),
  questionId: uuid("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
  tag: text("tag").notNull(),
});

export const answers = pgTable("answers", {
  id: uuidPk(),
  questionId: uuid("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
  authorId: uuid("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  isHelpful: boolean("is_helpful").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Showcase & Build Challenges
// ---------------------------------------------------------------------------

export const challengeStatusEnum = ["OPEN", "BUILDING", "VOTING", "CLOSED"] as const;
export type ChallengeStatus = (typeof challengeStatusEnum)[number];

export const buildChallenges = pgTable("build_challenges", {
  id: uuidPk(),
  title: text("title").notNull(),
  prompt: text("prompt").notNull(),
  description: text("description"),
  category: text("category"),
  status: text("status").$type<ChallengeStatus>().notNull().default("OPEN"),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  createdBy: uuid("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("build_challenges_status_idx").on(t.status, t.endsAt)]);

export const challengeParticipationModeEnum = ["HAS_CREW", "FIND_CREW"] as const;
export type ChallengeParticipationMode = (typeof challengeParticipationModeEnum)[number];

export const challengeParticipants = pgTable("challenge_participants", {
  challengeId: uuid("challenge_id").notNull().references(() => buildChallenges.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  mode: text("mode").$type<ChallengeParticipationMode>().notNull(),
  crewId: uuid("crew_id").references(() => crews.id, { onDelete: "set null" }),
  role: text("role").$type<RoleType>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  primaryKey({ columns: [t.challengeId, t.userId] }),
  index("challenge_participants_challenge_idx").on(t.challengeId, t.mode),
]);

export const showcaseCategoryEnum = ["AI", "WEB", "MOBILE", "GAMES", "EDUCATION", "SAAS", "DEVTOOLS", "OTHER"] as const;
export type ShowcaseCategory = (typeof showcaseCategoryEnum)[number];
export const showcaseStatusEnum = ["MVP", "LIVE", "EXPERIMENT"] as const;
export type ShowcaseStatus = (typeof showcaseStatusEnum)[number];

export const showcaseEntries = pgTable("showcase_entries", {
  id: uuidPk(),
  creatorId: uuid("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
  crewId: uuid("crew_id").references(() => crews.id, { onDelete: "set null" }),
  challengeId: uuid("challenge_id").references(() => buildChallenges.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  tagline: text("tagline").notNull(),
  description: text("description").notNull(),
  screenshotUrl: text("screenshot_url"),
  liveUrl: text("live_url"),
  githubUrl: text("github_url"),
  category: text("category").$type<ShowcaseCategory>().notNull().default("OTHER"),
  status: text("status").$type<ShowcaseStatus>().notNull().default("MVP"),
  lookingForCollaborators: boolean("looking_for_collaborators").notNull().default(false),
  lookingForText: text("looking_for_text"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("showcase_entries_created_idx").on(t.createdAt),
  index("showcase_entries_category_idx").on(t.category, t.createdAt),
  index("showcase_entries_challenge_idx").on(t.challengeId),
]);

export const showcaseReactionEnum = ["APPLAUSE", "IDEA", "POTENTIAL"] as const;
export type ShowcaseReaction = (typeof showcaseReactionEnum)[number];

export const showcaseReactions = pgTable("showcase_reactions", {
  entryId: uuid("entry_id").notNull().references(() => showcaseEntries.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reaction: text("reaction").$type<ShowcaseReaction>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  primaryKey({ columns: [t.entryId, t.userId, t.reaction] }),
  index("showcase_reactions_entry_idx").on(t.entryId, t.createdAt),
]);

export const showcaseWouldUseEnum = ["YES", "MAYBE", "NO"] as const;
export type ShowcaseWouldUse = (typeof showcaseWouldUseEnum)[number];

export const showcaseFeedback = pgTable("showcase_feedback", {
  id: uuidPk(),
  entryId: uuid("entry_id").notNull().references(() => showcaseEntries.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  liked: text("liked"),
  improve: text("improve"),
  wouldUse: text("would_use").$type<ShowcaseWouldUse>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex("showcase_feedback_entry_user_idx").on(t.entryId, t.userId),
  index("showcase_feedback_entry_idx").on(t.entryId, t.createdAt),
]);

export const notificationPreferences = pgTable("notification_preferences", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  emailProjectApplications: boolean("email_project_applications").notNull().default(true),
  emailProjectAccepted: boolean("email_project_accepted").notNull().default(true),
  emailBuildPool: boolean("email_build_pool").notNull().default(true),
  emailCrew: boolean("email_crew").notNull().default(true),
  emailChallenge: boolean("email_challenge").notNull().default(true),
  emailShowcaseFeedback: boolean("email_showcase_feedback").notNull().default(false),
  emailMessages: boolean("email_messages").notNull().default(true),
  emailMatches: boolean("email_matches").notNull().default(true),
  emailWeeklyDigest: boolean("email_weekly_digest").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export const notificationTypeEnum = [
  "PROJECT_APPLICATION",
  "APPLICATION_ACCEPTED",
  "APPLICATION_REJECTED",
  "PROJECT_INVITE",
  "CREW_INVITE",
  "CREW_INVITE_ACCEPTED",
  "BUILD_PROPOSAL",
  "BUILD_PROPOSAL_ACCEPTED",
  "QUESTION_ANSWERED",
  "ANSWER_MARKED_HELPFUL",
  "FRIEND_REQUEST",
  "FRIEND_ACCEPTED",
  "SHOWCASE_REACTION",
  "SHOWCASE_FEEDBACK",
  "CHALLENGE_MATCH",
  "CHALLENGE_UPDATE",
  "MESSAGE_RECEIVED",
  "MATCH_DIGEST",
  "WEEKLY_DIGEST",
  "IDEA_INTERESTED",
  "IDEA_CONVERTED",
] as const;
export type NotificationType = (typeof notificationTypeEnum)[number];

export const notifications = pgTable("notifications", {
  id: uuidPk(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
  type: text("type").$type<NotificationType>().notNull(),
  entityType: text("entity_type"),
  entityId: text("entity_id"),
  title: text("title").notNull(),
  body: text("body"),
  link: text("link"),
  isRead: boolean("is_read").notNull().default(false),
  readAt: timestamp("read_at", { withTimezone: true }),
  emailSentAt: timestamp("email_sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("notifications_user_idx").on(t.userId, t.createdAt),
  index("notifications_unread_idx").on(t.userId, t.isRead, t.createdAt),
]);

// ---------------------------------------------------------------------------
// Trust & safety
// ---------------------------------------------------------------------------

export const reportReasonEnum = ["spam", "scam", "harassment", "inappropriate", "other"] as const;
export type ReportReason = (typeof reportReasonEnum)[number];

export const blocks = pgTable("blocks", {
  id: uuidPk(),
  blockerId: uuid("blocker_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  blockedId: uuid("blocked_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("blocks_pair_idx").on(t.blockerId, t.blockedId)]);

export const reports = pgTable("reports", {
  id: uuidPk(),
  reporterId: uuid("reporter_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reportedId: uuid("reported_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reason: text("reason").$type<ReportReason>().notNull(),
  description: text("description"),
  status: text("status").notNull().default("open"),
  adminNote: text("admin_note"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewedBy: uuid("reviewed_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const adminAuditLogs = pgTable("admin_audit_logs", {
  id: uuidPk(),
  adminId: uuid("admin_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id"),
  details: jsonb("details"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("admin_audit_created_idx").on(t.createdAt)]);

// ---------------------------------------------------------------------------
// Analytics (lightweight event log — see section 38 of the spec)
// ---------------------------------------------------------------------------

export const analyticsEventTypeEnum = [
  "profile_created",
  "project_created",
  "project_application_sent",
  "project_application_accepted",
  "builder_invite_sent",
  "crew_invite_sent",
  "crew_created",
  "crew_converted_to_project",
  "contact_revealed",
  "question_created",
  "answer_marked_helpful",
  "match_email_sent",
  "weekly_digest_sent",
  "idea_created",
  "idea_interested",
  "idea_interest_removed",
] as const;
export type AnalyticsEventType = (typeof analyticsEventTypeEnum)[number];

export const analyticsEvents = pgTable("analytics_events", {
  id: uuidPk(),
  eventType: text("event_type").$type<AnalyticsEventType>().notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
