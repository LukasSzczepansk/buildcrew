import { z } from "zod";
import { launchNeedEnum, showcaseCategoryEnum, showcaseStatusEnum } from "@/db/schema";

const optionalHttpUrl = z.string().trim().max(500).refine((value) => {
  if (!value) return true;
  try { const url = new URL(value); return url.protocol === "https:" || url.protocol === "http:"; } catch { return false; }
}, "Podaj poprawny adres http:// lub https://.");

export const launchInputSchema = z.object({
  projectId: z.string().uuid().optional().or(z.literal("")),
  title: z.string().trim().min(2, "Dodaj nazwę projektu.").max(80, "Nazwa może mieć maksymalnie 80 znaków."),
  tagline: z.string().trim().min(4, "Dodaj krótki opis.").max(160, "Krótki opis może mieć maksymalnie 160 znaków."),
  description: z.string().trim().min(20, "Napisz trochę więcej o projekcie.").max(3500, "Opis może mieć maksymalnie 3500 znaków."),
  websiteUrl: optionalHttpUrl.optional().or(z.literal("")),
  githubUrl: optionalHttpUrl.optional().or(z.literal("")),
  category: z.enum(showcaseCategoryEnum),
  status: z.enum(showcaseStatusEnum),
  technologies: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  needs: z.array(z.enum(launchNeedEnum)).max(4).default([]),
});

export const launchCommentSchema = z.object({
  body: z.string().trim().min(2, "Napisz co najmniej 2 znaki.").max(900, "Komentarz może mieć maksymalnie 900 znaków."),
  parentId: z.string().uuid().optional().or(z.literal("")),
});
