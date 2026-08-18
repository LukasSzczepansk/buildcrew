import { z } from "zod";
import {
  characterEnum,
  collaborationEndorsementStrengthEnum,
  collaborationModeEnum,
  collaborationPaceEnum,
  commitmentEnum,
  goalEnum,
  hackathonAvailabilityEnum,
  hackathonGoalEnum,
  hackathonLocationTypeEnum,
  levelEnum,
  lookingForEnum,
  projectAssetEnum,
  projectDurationEnum,
  projectLinkKindEnum,
  projectMilestoneStatusEnum,
  projectTaskStatusEnum,
  projectWorkspaceReactionEnum,
  projectTypeEnum,
  reportReasonEnum,
  reportTargetTypeEnum,
  roleTypeEnum,
  showcaseCategoryEnum,
  showcaseReactionEnum,
  showcaseStatusEnum,
  showcaseWouldUseEnum,
  stageEnum,
  workModePreferenceEnum,
  projectLanguageEnum,
  projectMarketScopeEnum,
  projectNeedEnum,
  fundingStageEnum,
} from "@/db/schema";

const httpUrl = z.string().trim().refine((value) => {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}, "Enter a valid http:// or https:// URL.");

const githubUrl = httpUrl.refine((value) => {
  if (!value) return true;
  const host = new URL(value).hostname.toLowerCase();
  return host === "github.com" || host === "www.github.com";
}, "Enter a github.com URL.");

const linkedinUrl = httpUrl.refine((value) => {
  if (!value) return true;
  const host = new URL(value).hostname.toLowerCase();
  return host === "linkedin.com" || host === "www.linkedin.com" || host.endsWith(".linkedin.com");
}, "Enter a linkedin.com URL.");

export const signupSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(12, "Password must be at least 12 characters long.").max(128, "Password is too long."),
  acceptTerms: z.string().refine((value) => value === "on", "Accept the Terms of Service and Privacy Policy."),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password.").max(128),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(20),
  password: z.string().min(12, "Password must be at least 12 characters long.").max(128),
  confirmPassword: z.string().min(1),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});


export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password."),
  newPassword: z.string().min(12, "New password must be at least 12 characters long.").max(128),
  confirmPassword: z.string().min(1),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New passwords do not match.",
  path: ["confirmPassword"],
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Enter your current password."),
  confirmation: z.literal("DELETE ACCOUNT", { error: "Type exactly: DELETE ACCOUNT" }),
});

export const onboardingSchema = z.object({
  username: z
    .string()
    .trim()
    .min(2, "Username must be at least 2 characters long.")
    .max(24, "Username can be at most 24 characters long.")
    .regex(/^[a-zA-Z0-9_]+$/, "Use letters, numbers and underscores only."),
  role: z.enum(roleTypeEnum),
  skills: z.array(z.string()).min(1, "Choose at least one skill."),
  level: z.enum(levelEnum),
  interests: z.array(z.string()).default([]),
  weeklyHours: z.enum(commitmentEnum),
  goals: z.array(z.enum(goalEnum)).default([]),
  lookingFor: z.array(z.enum(lookingForEnum)).min(1, "Choose at least one option."),
  githubUrl: githubUrl.optional().or(z.literal("")),
  portfolioUrl: httpUrl.optional().or(z.literal("")),
  linkedinUrl: linkedinUrl.optional().or(z.literal("")),
  discordUsername: z.string().trim().max(40).optional().or(z.literal("")),
  headline: z.string().trim().max(100).optional().or(z.literal("")),
  country: z.string().trim().max(80).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  languages: z.array(z.string().trim().min(2).max(20)).min(1, "Choose at least one collaboration language.").max(8),
  workModePreference: z.enum(workModePreferenceEnum).default("FLEXIBLE"),
});

export const profileEditSchema = onboardingSchema.partial({
  lookingFor: undefined,
}).extend({
  lookingFor: z.array(z.enum(lookingForEnum)).min(1, "Choose at least one option."),
  bio: z.string().trim().max(280).optional().or(z.literal("")),
  publicProfile: z.boolean().default(false),
});

export const collaborationEndorsementSchema = z.object({
  projectId: z.string().uuid(),
  targetUserId: z.string().uuid(),
  strengths: z.array(z.enum(collaborationEndorsementStrengthEnum)).min(1, "Choose at least one strength.").max(3, "Choose up to 3 strengths."),
  wouldCollaborateAgain: z.boolean(),
  note: z.string().trim().max(240, "Note can be at most 240 characters long.").optional().or(z.literal("")),
});

export const projectRoleSchema = z.object({
  roleType: z.enum(roleTypeEnum),
  description: z.string().trim().max(360).optional().or(z.literal("")),
  preferredLevel: z.enum(levelEnum).optional(),
  skills: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  slots: z.coerce.number().int().min(1).max(10).default(1),
});

export const projectCreateSchema = z.object({
  name: z.string().trim().min(2, "Enter a project name.").max(60),
  tagline: z.string().trim().min(4, "Add a short tagline.").max(120),
  description: z.string().trim().min(20, "Describe the project in at least 20 characters.").max(2400),
  interests: z.array(z.string()).min(1, "Choose at least one category.").max(5),
  stage: z.enum(stageEnum),
  projectType: z.enum(projectTypeEnum),
  technologies: z.array(z.string().trim().min(1).max(40)).min(1, "Add at least one technology.").max(15),
  existingAssets: z.array(z.enum(projectAssetEnum)).max(projectAssetEnum.length).default([]),
  ownerContribution: z.string().trim().max(400).optional().or(z.literal("")),
  roles: z.array(projectRoleSchema).min(1, "Add at least one open role.").max(8),
  commitment: z.enum(commitmentEnum),
  collaborationMode: z.enum(collaborationModeEnum),
  projectLanguage: z.enum(projectLanguageEnum).default("EN"),
  country: z.string().trim().max(80).optional().or(z.literal("")),
  marketScope: z.enum(projectMarketScopeEnum).default("WORLDWIDE"),
  needs: z.array(z.enum(projectNeedEnum)).min(1).default(["TEAMMATES"]),
  fundingStage: z.enum(fundingStageEnum).optional(),
  fundingAmount: z.string().trim().max(80).optional().or(z.literal("")),
  fundingUse: z.string().trim().max(400).optional().or(z.literal("")),
  pitchDeckUrl: httpUrl.optional().or(z.literal("")),
  collaborationPace: z.enum(collaborationPaceEnum),
  duration: z.enum(projectDurationEnum),
  goal: z.string().trim().min(3, "Add the project's next goal.").max(240),
  character: z.array(z.enum(characterEnum)).min(1, "Choose at least one project characteristic.").max(3),
  repositoryUrl: httpUrl.optional().or(z.literal("")),
  demoUrl: httpUrl.optional().or(z.literal("")),
  designUrl: httpUrl.optional().or(z.literal("")),
  docsUrl: httpUrl.optional().or(z.literal("")),
  crewId: z.string().uuid().optional(),
  sourceIdeaId: z.string().uuid().optional(),
});

export const projectContentUpdateSchema = z.object({
  name: z.string().trim().min(2, "Enter a project name.").max(60),
  tagline: z.string().trim().min(4, "Add a short tagline.").max(120),
  description: z.string().trim().min(20, "Describe the project in at least 20 characters.").max(2400),
  goal: z.string().trim().min(3, "Add the project's next goal.").max(240),
  ownerContribution: z.string().trim().max(400).optional().or(z.literal("")),
  outcome: z.string().trim().max(1200).optional().or(z.literal("")),
  fundingUse: z.string().trim().max(400).optional().or(z.literal("")),
  roles: z.array(z.object({
    id: z.string().uuid(),
    description: z.string().trim().max(360).optional().or(z.literal("")),
  })).max(8),
  updates: z.array(z.object({
    id: z.string().uuid(),
    body: z.string().trim().min(1, "Project updates cannot be empty.").max(1200),
  })).max(30),
});

export const projectInternationalSettingsSchema = z.object({
  projectLanguage: z.enum(projectLanguageEnum),
  country: z.string().trim().max(80).optional().or(z.literal("")),
  marketScope: z.enum(projectMarketScopeEnum),
  needs: z.array(z.enum(projectNeedEnum)).min(1),
  fundingStage: z.enum(fundingStageEnum).optional(),
  fundingAmount: z.string().trim().max(80).optional().or(z.literal("")),
  fundingUse: z.string().trim().max(400).optional().or(z.literal("")),
  pitchDeckUrl: httpUrl.optional().or(z.literal("")),
});

export const ideaCreateSchema = z.object({
  name: z.string().trim().min(2, "Enter an idea name.").max(60),
  summary: z.string().trim().min(10, "Describe the idea in one or two sentences.").max(320),
  interests: z.array(z.string().trim().min(1).max(40)).min(1, "Choose at least one area.").max(5),
});

export const uuidSchema = z.string().uuid("Invalid identifier.");
export const decisionSchema = z.enum(["ACCEPTED", "REJECTED"]);

export const projectInviteSchema = z.object({
  projectId: uuidSchema,
  inviteeId: uuidSchema,
  roleId: uuidSchema.optional(),
  message: z.string().trim().max(300).optional().or(z.literal("")),
});

export const applicationSchema = z.object({
  roleId: z.string().uuid(),
  message: z.string().trim().max(500).optional().or(z.literal("")),
});

export const buildProposalSchema = z.object({
  receiverId: z.string().uuid(),
  message: z.string().trim().max(300).optional().or(z.literal("")),
});

export const crewInviteSchema = z.object({
  crewId: z.string().uuid(),
  inviteeId: z.string().uuid(),
  message: z.string().trim().max(300).optional().or(z.literal("")),
});

export const questionSchema = z.object({
  title: z.string().trim().min(10, "Title must be at least 10 characters long.").max(140),
  description: z.string().trim().min(20, "Describe the problem in more detail.").max(2000),
  tags: z.array(z.string()).max(5, "Use up to 5 tags.").default([]),
});

export const answerSchema = z.object({
  questionId: z.string().uuid(),
  body: z.string().trim().min(5, "The answer is too short.").max(2000),
});

export const reportSchema = z.object({
  reportedId: z.string().uuid(),
  reason: z.enum(reportReasonEnum),
  description: z.string().trim().max(500).optional().or(z.literal("")),
});

export const contentReportSchema = z.object({
  targetType: z.enum(reportTargetTypeEnum),
  targetId: z.string().trim().min(1).max(200),
  reason: z.enum(reportReasonEnum),
  description: z.string().trim().max(500).optional().or(z.literal("")),
});

export const buildPoolListingSchema = z.object({
  headline: z.string().trim().min(4, "Add a short headline.").max(80, "Headline can be at most 80 characters long."),
  role: z.enum(roleTypeEnum),
  technologies: z.array(z.string().trim().min(1).max(40)).min(1, "Add at least one technology.").max(10, "Use up to 10 technologies."),
  wantsToBuild: z.string().trim().min(10, "Write a little more about what you want to build.").max(500),
  avoids: z.string().trim().max(300).optional().or(z.literal("")),
  weeklyHours: z.enum(commitmentEnum),
  preferredCrewSize: z.coerce.number().int().min(2).max(4),
  level: z.enum(levelEnum),
  description: z.string().trim().max(400).optional().or(z.literal("")),
});

export const buildPoolListingStatusSchema = z.enum(["ACTIVE", "PAUSED", "CLOSED"]);

export const messageSchema = z.object({
  body: z.string().trim().min(1, "Message cannot be empty.").max(800, "Message can be at most 800 characters long."),
});

export const workspaceMessageSchema = z.object({
  body: z.string().trim().min(1, "Message cannot be empty.").max(2000, "Message can be at most 2000 characters long."),
});

export const workspaceOverviewSchema = z.object({
  currentFocus: z.string().trim().max(240, "Current focus can be at most 240 characters long.").optional().or(z.literal("")),
  milestoneTitle: z.string().trim().max(180, "Milestone title can be at most 180 characters long.").optional().or(z.literal("")),
  milestoneDescription: z.string().trim().max(600, "Milestone description can be at most 600 characters long.").optional().or(z.literal("")),
  milestoneDueAt: z.string().trim().regex(/^\\d{4}-\\d{2}-\\d{2}$/, "Enter a valid date.").optional().or(z.literal("")),
  milestoneStatus: z.enum(projectMilestoneStatusEnum).default("DOING"),
  milestoneCompleted: z.boolean().default(false),
});

export const workspaceTaskSchema = z.object({
  title: z.string().trim().min(2, "Add a short task title.").max(160, "Task title can be at most 160 characters long."),
  description: z.string().trim().max(800, "Task description can be at most 800 characters long.").optional().or(z.literal("")),
  assigneeId: z.string().uuid().optional().or(z.literal("")),
  dueAt: z.string().trim().regex(/^\\d{4}-\\d{2}-\\d{2}$/, "Enter a valid date.").optional().or(z.literal("")),
  sourceMessageId: z.string().uuid().optional().or(z.literal("")),
});

export const workspaceTaskUpdateSchema = workspaceTaskSchema.partial().extend({
  status: z.enum(projectTaskStatusEnum).optional(),
});

export const workspaceTaskStatusSchema = z.enum(projectTaskStatusEnum);
export const workspaceReactionSchema = z.enum(projectWorkspaceReactionEnum);

export const workspaceLinkSchema = z.object({
  label: z.string().trim().min(2, "Add a link label.").max(60, "Link label can be at most 60 characters long."),
  url: httpUrl.refine((value) => Boolean(value), "Enter a link URL."),
  kind: z.enum(projectLinkKindEnum),
});


export const showcaseCreateSchema = z.object({
  projectId: z.string().uuid().optional().or(z.literal("")),
  challengeId: z.string().uuid().optional().or(z.literal("")),
  title: z.string().trim().min(2, "Enter a project name.").max(80),
  tagline: z.string().trim().min(4, "Add a short description.").max(140),
  description: z.string().trim().min(20, "Describe the project in more detail.").max(2500),
  screenshotUrl: httpUrl.optional().or(z.literal("")),
  liveUrl: httpUrl.optional().or(z.literal("")),
  githubUrl: githubUrl.optional().or(z.literal("")),
  category: z.enum(showcaseCategoryEnum),
  status: z.enum(showcaseStatusEnum),
  lookingForCollaborators: z.boolean().default(false),
  lookingForText: z.string().trim().max(240).optional().or(z.literal("")),
});

export const showcaseReactionSchema = z.enum(showcaseReactionEnum);

export const showcaseFeedbackSchema = z.object({
  liked: z.string().trim().max(700).optional().or(z.literal("")),
  improve: z.string().trim().max(700).optional().or(z.literal("")),
  wouldUse: z.enum(showcaseWouldUseEnum),
}).refine((data) => Boolean(data.liked || data.improve), {
  message: "Write at least one thing you liked or one thing that could be improved.",
});

export const challengeCreateSchema = z.object({
  title: z.string().trim().min(3).max(100),
  prompt: z.string().trim().min(10).max(240),
  description: z.string().trim().max(1500).optional().or(z.literal("")),
  category: z.string().trim().max(60).optional().or(z.literal("")),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
}).refine((data) => data.endsAt > data.startsAt, { message: "End date must be later than the start date." });

const sprintWorkTimeEnum = ["WEEKDAY_MORNING", "WEEKDAY_EVENING", "WEEKENDS", "FLEXIBLE"] as const;
const sprintSeriousnessEnum = ["LEARN", "PORTFOLIO", "SHIP"] as const;
const sprintProjectThemeEnum = ["SAAS", "AI", "MOBILE", "WEB", "DEVTOOLS", "GAMING", "SOCIAL", "EDUCATION", "FINTECH", "HEALTH", "ANY"] as const;
const sprintIdeaStatusEnum = ["HAS_IDEA", "ROUGH_IDEAS", "JOIN_OTHER"] as const;
const sprintGoalEnum = ["LEARN", "MEET_PEOPLE", "PORTFOLIO", "SHIP", "VALIDATE", "FUTURE_TEAM"] as const;

export const challengeJoinSchema = z.object({
  challengeId: z.string().uuid(),
  mode: z.enum(["HAS_CREW", "FIND_CREW"]),
  crewId: z.string().uuid().optional().or(z.literal("")),
  application: z.object({
    role: z.enum(roleTypeEnum),
    level: z.enum(levelEnum),
    skills: z.array(z.string().trim().min(1).max(60)).min(1).max(5),
    weeklyHours: z.enum(commitmentEnum),
    workTimes: z.array(z.enum(sprintWorkTimeEnum)).min(1).max(4),
    seriousness: z.enum(sprintSeriousnessEnum),
    projectThemes: z.array(z.enum(sprintProjectThemeEnum)).min(1).max(3),
    ideaStatus: z.enum(sprintIdeaStatusEnum),
    ideaDescription: z.string().trim().max(600).optional().or(z.literal("")),
    preferredRoles: z.array(z.enum(roleTypeEnum)).max(4),
    sprintGoals: z.array(z.enum(sprintGoalEnum)).min(1).max(2),
    planningStyle: z.coerce.number().int().min(1).max(5),
    paceStyle: z.coerce.number().int().min(1).max(5),
    projectStyle: z.coerce.number().int().min(1).max(5),
    commitmentAccepted: z.literal(true),
  }).superRefine((data, ctx) => {
    if (data.ideaStatus === "HAS_IDEA" && (data.ideaDescription?.trim().length ?? 0) < 10) {
      ctx.addIssue({ code: "custom", path: ["ideaDescription"], message: "Opisz pomysł w co najmniej 10 znakach." });
    }
  }),
}).superRefine((data, ctx) => {
  if (data.mode === "HAS_CREW" && !data.crewId) {
    ctx.addIssue({ code: "custom", path: ["crewId"], message: "Wybierz Crew." });
  }
});

export const hackathonAdminSchema = z.object({
  name: z.string().trim().min(3, "Enter the hackathon name.").max(120),
  summary: z.string().trim().min(10, "Add a short event description.").max(240),
  description: z.string().trim().max(3000, "Description can be at most 3000 characters long.").optional().or(z.literal("")),
  organizerName: z.string().trim().max(120).optional().or(z.literal("")),
  organizerUrl: httpUrl.optional().or(z.literal("")),
  officialUrl: httpUrl.refine(Boolean, "Add the official event website."),
  registrationUrl: httpUrl.optional().or(z.literal("")),
  locationType: z.enum(hackathonLocationTypeEnum),
  city: z.string().trim().max(100).optional().or(z.literal("")),
  venue: z.string().trim().max(160).optional().or(z.literal("")),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  registrationDeadline: z.union([z.coerce.date(), z.literal(""), z.null()]).optional(),
  minTeamSize: z.coerce.number().int().min(2).max(8),
  maxTeamSize: z.coerce.number().int().min(2).max(8),
  themes: z.array(z.string().trim().min(1).max(40)).max(10).default([]),
  coverImageUrl: httpUrl.optional().or(z.literal("")),
  mediaRightsConfirmed: z.boolean().default(false),
  isPartner: z.boolean().default(false),
  isCancelled: z.boolean().default(false),
  isPublished: z.boolean().default(true),
}).superRefine((data, ctx) => {
  if (data.endsAt <= data.startsAt) ctx.addIssue({ code: "custom", message: "End date must be later than the start date.", path: ["endsAt"] });
  if (data.maxTeamSize < data.minTeamSize) ctx.addIssue({ code: "custom", message: "Maximum team size cannot be smaller than minimum team size.", path: ["maxTeamSize"] });
  if (data.coverImageUrl && !data.mediaRightsConfirmed) ctx.addIssue({ code: "custom", message: "Confirm you have the right to use the image or remove its URL.", path: ["mediaRightsConfirmed"] });
});

export const hackathonJoinSchema = z.object({
  hackathonId: uuidSchema,
  role: z.enum(roleTypeEnum),
  technologies: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  themes: z.array(z.string().trim().min(1).max(40)).max(8).default([]),
  hasIdea: z.boolean().default(false),
  ideaSummary: z.string().trim().max(360).optional().or(z.literal("")),
  goal: z.enum(hackathonGoalEnum),
  availability: z.enum(hackathonAvailabilityEnum),
  preferredTeamSize: z.coerce.number().int().min(2).max(8),
});

export const hackathonTeamCreateSchema = z.object({
  hackathonId: uuidSchema,
  name: z.string().trim().min(2, "Add a team name.").max(60),
  ideaTitle: z.string().trim().max(100).optional().or(z.literal("")),
  ideaSummary: z.string().trim().max(500).optional().or(z.literal("")),
  targetSize: z.coerce.number().int().min(2).max(8),
});

export const hackathonTeamInviteSchema = z.object({
  teamId: uuidSchema,
  inviteeId: uuidSchema,
  message: z.string().trim().max(280).optional().or(z.literal("")),
});

export const hackathonTeamRequestSchema = z.object({
  teamId: uuidSchema,
  message: z.string().trim().max(280).optional().or(z.literal("")),
});

export const hackathonDecisionSchema = z.object({
  id: uuidSchema,
  decision: z.enum(["ACCEPTED", "REJECTED"]),
});

export const notificationPreferencesSchema = z.object({
  emailProjectApplications: z.boolean(),
  emailProjectAccepted: z.boolean(),
  emailBuildPool: z.boolean(),
  emailCrew: z.boolean(),
  emailChallenge: z.boolean(),
  emailShowcaseFeedback: z.boolean(),
  emailMessages: z.boolean(),
  emailWorkspace: z.boolean(),
  emailMatches: z.boolean(),
  emailWeeklyDigest: z.boolean(),
});
