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
}, "Podaj poprawny adres http:// lub https://.");

const githubUrl = httpUrl.refine((value) => {
  if (!value) return true;
  const host = new URL(value).hostname.toLowerCase();
  return host === "github.com" || host === "www.github.com";
}, "Podaj link z github.com.");

const linkedinUrl = httpUrl.refine((value) => {
  if (!value) return true;
  const host = new URL(value).hostname.toLowerCase();
  return host === "linkedin.com" || host === "www.linkedin.com" || host.endsWith(".linkedin.com");
}, "Podaj link z linkedin.com.");

export const signupSchema = z.object({
  email: z.string().trim().email("Podaj poprawny adres e-mail."),
  password: z.string().min(12, "Hasło musi mieć co najmniej 12 znaków.").max(128, "Hasło jest zbyt długie."),
  acceptTerms: z.string().refine((value) => value === "on", "Zaakceptuj Regulamin i Politykę prywatności."),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Podaj poprawny adres e-mail."),
  password: z.string().min(1, "Podaj hasło.").max(128),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Podaj poprawny adres e-mail."),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(20),
  password: z.string().min(12, "Hasło musi mieć co najmniej 12 znaków.").max(128),
  confirmPassword: z.string().min(1),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Hasła nie są takie same.",
  path: ["confirmPassword"],
});


export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Podaj aktualne hasło."),
  newPassword: z.string().min(12, "Nowe hasło musi mieć co najmniej 12 znaków.").max(128),
  confirmPassword: z.string().min(1),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Nowe hasła nie są takie same.",
  path: ["confirmPassword"],
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Podaj aktualne hasło."),
  confirmation: z.literal("USUŃ KONTO", { error: "Wpisz dokładnie: USUŃ KONTO" }),
});

export const onboardingSchema = z.object({
  username: z
    .string()
    .trim()
    .min(2, "Nick musi mieć min. 2 znaki.")
    .max(24, "Nick może mieć maks. 24 znaki.")
    .regex(/^[a-zA-Z0-9_]+$/, "Tylko litery, cyfry i podkreślenia."),
  role: z.enum(roleTypeEnum),
  skills: z.array(z.string()).min(1, "Wybierz przynajmniej jedną umiejętność."),
  level: z.enum(levelEnum),
  interests: z.array(z.string()).default([]),
  weeklyHours: z.enum(commitmentEnum),
  goals: z.array(z.enum(goalEnum)).default([]),
  lookingFor: z.array(z.enum(lookingForEnum)).min(1, "Zaznacz przynajmniej jedną opcję."),
  githubUrl: githubUrl.optional().or(z.literal("")),
  portfolioUrl: httpUrl.optional().or(z.literal("")),
  linkedinUrl: linkedinUrl.optional().or(z.literal("")),
  discordUsername: z.string().trim().max(40).optional().or(z.literal("")),
  headline: z.string().trim().max(100).optional().or(z.literal("")),
  country: z.string().trim().max(80).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  languages: z.array(z.string().trim().min(2).max(20)).min(1, "Wybierz przynajmniej jeden język.").max(8),
  workModePreference: z.enum(workModePreferenceEnum).default("FLEXIBLE"),
});

export const profileEditSchema = onboardingSchema.partial({
  lookingFor: undefined,
}).extend({
  lookingFor: z.array(z.enum(lookingForEnum)).min(1, "Zaznacz przynajmniej jedną opcję."),
  bio: z.string().trim().max(280).optional().or(z.literal("")),
  publicProfile: z.boolean().default(false),
});

export const collaborationEndorsementSchema = z.object({
  projectId: z.string().uuid(),
  targetUserId: z.string().uuid(),
  strengths: z.array(z.enum(collaborationEndorsementStrengthEnum)).min(1, "Wybierz przynajmniej jedną rzecz.").max(3, "Wybierz maksymalnie 3 rzeczy."),
  wouldCollaborateAgain: z.boolean(),
  note: z.string().trim().max(240, "Notatka może mieć maksymalnie 240 znaków.").optional().or(z.literal("")),
});

export const projectRoleSchema = z.object({
  roleType: z.enum(roleTypeEnum),
  description: z.string().trim().max(360).optional().or(z.literal("")),
  preferredLevel: z.enum(levelEnum).optional(),
  skills: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  slots: z.coerce.number().int().min(1).max(10).default(1),
});

export const projectCreateSchema = z.object({
  name: z.string().trim().min(2, "Podaj nazwę projektu.").max(60),
  tagline: z.string().trim().min(4, "Dodaj krótki opis (tagline).").max(120),
  description: z.string().trim().min(20, "Opisz projekt szerzej (min. 20 znaków).").max(2400),
  interests: z.array(z.string()).min(1, "Wybierz przynajmniej jedną kategorię.").max(5),
  stage: z.enum(stageEnum),
  projectType: z.enum(projectTypeEnum),
  technologies: z.array(z.string().trim().min(1).max(40)).min(1, "Dodaj przynajmniej jedną technologię.").max(15),
  existingAssets: z.array(z.enum(projectAssetEnum)).max(projectAssetEnum.length).default([]),
  ownerContribution: z.string().trim().max(400).optional().or(z.literal("")),
  roles: z.array(projectRoleSchema).min(1, "Dodaj przynajmniej jedną otwartą rolę.").max(8),
  commitment: z.enum(commitmentEnum),
  collaborationMode: z.enum(collaborationModeEnum),
  projectLanguage: z.enum(projectLanguageEnum).default("PL"),
  country: z.string().trim().max(80).optional().or(z.literal("")),
  marketScope: z.enum(projectMarketScopeEnum).default("LOCAL"),
  needs: z.array(z.enum(projectNeedEnum)).min(1).default(["TEAMMATES"]),
  fundingStage: z.enum(fundingStageEnum).optional(),
  fundingAmount: z.string().trim().max(80).optional().or(z.literal("")),
  fundingUse: z.string().trim().max(400).optional().or(z.literal("")),
  pitchDeckUrl: httpUrl.optional().or(z.literal("")),
  collaborationPace: z.enum(collaborationPaceEnum),
  duration: z.enum(projectDurationEnum),
  goal: z.string().trim().min(3, "Podaj najbliższy cel projektu.").max(240),
  character: z.array(z.enum(characterEnum)).min(1, "Wybierz charakter projektu.").max(3),
  repositoryUrl: httpUrl.optional().or(z.literal("")),
  demoUrl: httpUrl.optional().or(z.literal("")),
  designUrl: httpUrl.optional().or(z.literal("")),
  docsUrl: httpUrl.optional().or(z.literal("")),
  crewId: z.string().uuid().optional(),
  sourceIdeaId: z.string().uuid().optional(),
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
  name: z.string().trim().min(2, "Podaj nazwę pomysłu.").max(60),
  summary: z.string().trim().min(10, "Opisz pomysł jednym–dwoma zdaniami.").max(320),
  interests: z.array(z.string().trim().min(1).max(40)).min(1, "Wybierz przynajmniej jeden obszar.").max(5),
});

export const uuidSchema = z.string().uuid("Nieprawidłowy identyfikator.");
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
  title: z.string().trim().min(10, "Tytuł powinien mieć min. 10 znaków.").max(140),
  description: z.string().trim().min(20, "Opisz swój problem szerzej.").max(2000),
  tags: z.array(z.string()).max(5, "Maksymalnie 5 tagów.").default([]),
});

export const answerSchema = z.object({
  questionId: z.string().uuid(),
  body: z.string().trim().min(5, "Odpowiedź jest zbyt krótka.").max(2000),
});

export const reportSchema = z.object({
  reportedId: z.string().uuid(),
  reason: z.enum(reportReasonEnum),
  description: z.string().trim().max(500).optional().or(z.literal("")),
});

export const buildPoolListingSchema = z.object({
  headline: z.string().trim().min(4, "Dodaj krótki nagłówek.").max(80, "Nagłówek może mieć maks. 80 znaków."),
  role: z.enum(roleTypeEnum),
  technologies: z.array(z.string().trim().min(1).max(40)).min(1, "Dodaj przynajmniej jedną technologię.").max(10, "Maksymalnie 10 technologii."),
  wantsToBuild: z.string().trim().min(10, "Napisz trochę więcej o tym, co chcesz budować.").max(500),
  avoids: z.string().trim().max(300).optional().or(z.literal("")),
  weeklyHours: z.enum(commitmentEnum),
  preferredCrewSize: z.coerce.number().int().min(2).max(4),
  level: z.enum(levelEnum),
  description: z.string().trim().max(400).optional().or(z.literal("")),
});

export const buildPoolListingStatusSchema = z.enum(["ACTIVE", "PAUSED", "CLOSED"]);

export const messageSchema = z.object({
  body: z.string().trim().min(1, "Wiadomość nie może być pusta.").max(800, "Wiadomość może mieć maks. 800 znaków."),
});

export const workspaceMessageSchema = z.object({
  body: z.string().trim().min(1, "Wiadomość nie może być pusta.").max(2000, "Wiadomość może mieć maks. 2000 znaków."),
});

export const workspaceOverviewSchema = z.object({
  currentFocus: z.string().trim().max(240, "Aktualny fokus może mieć maks. 240 znaków.").optional().or(z.literal("")),
  milestoneTitle: z.string().trim().max(180, "Nazwa milestone'u może mieć maks. 180 znaków.").optional().or(z.literal("")),
  milestoneDescription: z.string().trim().max(600, "Opis milestone'u może mieć maks. 600 znaków.").optional().or(z.literal("")),
  milestoneDueAt: z.string().trim().regex(/^\\d{4}-\\d{2}-\\d{2}$/, "Podaj poprawną datę.").optional().or(z.literal("")),
  milestoneStatus: z.enum(projectMilestoneStatusEnum).default("DOING"),
  milestoneCompleted: z.boolean().default(false),
});

export const workspaceTaskSchema = z.object({
  title: z.string().trim().min(2, "Dodaj krótką nazwę zadania.").max(160, "Zadanie może mieć maks. 160 znaków."),
  description: z.string().trim().max(800, "Opis zadania może mieć maks. 800 znaków.").optional().or(z.literal("")),
  assigneeId: z.string().uuid().optional().or(z.literal("")),
  dueAt: z.string().trim().regex(/^\\d{4}-\\d{2}-\\d{2}$/, "Podaj poprawną datę.").optional().or(z.literal("")),
  sourceMessageId: z.string().uuid().optional().or(z.literal("")),
});

export const workspaceTaskUpdateSchema = workspaceTaskSchema.partial().extend({
  status: z.enum(projectTaskStatusEnum).optional(),
});

export const workspaceTaskStatusSchema = z.enum(projectTaskStatusEnum);
export const workspaceReactionSchema = z.enum(projectWorkspaceReactionEnum);

export const workspaceLinkSchema = z.object({
  label: z.string().trim().min(2, "Dodaj nazwę linku.").max(60, "Nazwa linku może mieć maks. 60 znaków."),
  url: httpUrl.refine((value) => Boolean(value), "Podaj adres linku."),
  kind: z.enum(projectLinkKindEnum),
});


export const showcaseCreateSchema = z.object({
  projectId: z.string().uuid().optional().or(z.literal("")),
  challengeId: z.string().uuid().optional().or(z.literal("")),
  title: z.string().trim().min(2, "Podaj nazwę projektu.").max(80),
  tagline: z.string().trim().min(4, "Dodaj krótki opis.").max(140),
  description: z.string().trim().min(20, "Opisz projekt trochę szerzej.").max(2500),
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
  message: "Napisz przynajmniej jedną rzecz, która Ci się podoba albo którą warto poprawić.",
});

export const challengeCreateSchema = z.object({
  title: z.string().trim().min(3).max(100),
  prompt: z.string().trim().min(10).max(240),
  description: z.string().trim().max(1500).optional().or(z.literal("")),
  category: z.string().trim().max(60).optional().or(z.literal("")),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
}).refine((data) => data.endsAt > data.startsAt, { message: "Data zakończenia musi być późniejsza niż start." });

export const challengeJoinSchema = z.object({
  challengeId: z.string().uuid(),
  mode: z.enum(["HAS_CREW", "FIND_CREW"]),
  crewId: z.string().uuid().optional().or(z.literal("")),
});

export const hackathonAdminSchema = z.object({
  name: z.string().trim().min(3, "Podaj nazwę hackathonu.").max(120),
  summary: z.string().trim().min(10, "Dodaj krótki opis wydarzenia.").max(240),
  description: z.string().trim().max(3000, "Opis może mieć maksymalnie 3000 znaków.").optional().or(z.literal("")),
  organizerName: z.string().trim().max(120).optional().or(z.literal("")),
  organizerUrl: httpUrl.optional().or(z.literal("")),
  officialUrl: httpUrl.refine(Boolean, "Dodaj oficjalną stronę wydarzenia."),
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
  if (data.endsAt <= data.startsAt) ctx.addIssue({ code: "custom", message: "Koniec musi być później niż start.", path: ["endsAt"] });
  if (data.maxTeamSize < data.minTeamSize) ctx.addIssue({ code: "custom", message: "Maksymalny zespół nie może być mniejszy od minimalnego.", path: ["maxTeamSize"] });
  if (data.coverImageUrl && !data.mediaRightsConfirmed) ctx.addIssue({ code: "custom", message: "Potwierdź prawo do użycia grafiki albo usuń jej URL.", path: ["mediaRightsConfirmed"] });
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
  name: z.string().trim().min(2, "Dodaj nazwę teamu.").max(60),
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
