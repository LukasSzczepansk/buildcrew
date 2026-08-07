import { z } from "zod";
import {
  characterEnum,
  commitmentEnum,
  goalEnum,
  levelEnum,
  lookingForEnum,
  reportReasonEnum,
  roleTypeEnum,
  stageEnum,
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
});

export const profileEditSchema = onboardingSchema.partial({
  lookingFor: undefined,
}).extend({
  lookingFor: z.array(z.enum(lookingForEnum)).min(1, "Zaznacz przynajmniej jedną opcję."),
  bio: z.string().trim().max(280).optional().or(z.literal("")),
});

export const projectRoleSchema = z.object({
  roleType: z.enum(roleTypeEnum),
  description: z.string().trim().max(240).optional().or(z.literal("")),
  preferredLevel: z.enum(levelEnum).optional(),
  slots: z.coerce.number().int().min(1).max(10).default(1),
});

export const projectCreateSchema = z.object({
  name: z.string().trim().min(2, "Podaj nazwę projektu.").max(60),
  tagline: z.string().trim().min(4, "Dodaj krótki opis (tagline).").max(120),
  description: z.string().trim().min(20, "Opisz projekt szerzej (min. 20 znaków).").max(2000),
  interests: z.array(z.string()).min(1, "Wybierz przynajmniej jedną kategorię."),
  stage: z.enum(stageEnum),
  technologies: z.array(z.string()).min(1, "Dodaj przynajmniej jedną technologię."),
  ownerContribution: z.string().trim().max(300).optional().or(z.literal("")),
  roles: z.array(projectRoleSchema).min(1, "Dodaj przynajmniej jedną otwartą rolę."),
  commitment: z.enum(commitmentEnum),
  goal: z.string().trim().min(3, "Podaj cel projektu.").max(200),
  character: z.array(z.enum(characterEnum)).min(1, "Wybierz charakter projektu."),
  crewId: z.string().uuid().optional(),
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
