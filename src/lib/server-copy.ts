import type { AppLocale } from "@/lib/site-config";

const EXACT_EN: Record<string, string> = {
  "You must be logged in.": "You must be logged in.",
  "Check the fields you filled in.": "Check the fields and try again.",
  "This username is already taken. Choose another one.": "This username is already taken. Choose another one.",
  "This username is already taken.": "This username is already taken.",
  "Something went wrong. Try again.": "Something went wrong. Please try again.",
  "Complete all required fields.": "Complete all required fields.",
  "Invalid project.": "Invalid project.",
  "Invalid data.": "Invalid data.",
  "You cannot send messages in this conversation.": "You cannot send messages in this conversation.",
  "Invalid message.": "Invalid message.",
  "Project not found.": "Project not found.",
  "Role not found.": "Role not found.",
  "This role has already been filled.": "This role has already been filled.",
  "You cannot apply to your own project.": "You cannot apply to your own project.",
  "You cannot apply to this project.": "You cannot apply to this project.",
  "You already have a pending application for this role.": "You already have a pending application for this role.",
  "You do not have permission to do this.": "You do not have permission to do this.",
  "This person is not available.": "This person is not available.",
  "You cannot invite yourself.": "You cannot invite yourself.",
  "This person cannot be invited.": "This person cannot be invited.",
  "This person is already on the project.": "This person is already a project member.",
  "Invitation not found.": "Invitation not found.",
  "Application not found.": "Application not found.",
  "This application has already been reviewed.": "This application has already been reviewed.",
  "This invitation has already been handled.": "This invitation has already been reviewed.",
  "This invitation cannot be accepted.": "This invitation cannot be accepted.",
  "This role is no longer available.": "This role is no longer available.",
  "Too many sign-up attempts. Try again later.": "Too many sign-up attempts. Please try again later.",
  "An account with this email address already exists.": "An account with this email address already exists.",
  "Could not create the account.": "We could not create your account. Please try again.",
  "Too many sign-in attempts. Try again in a few minutes.": "Too many login attempts. Please try again in a few minutes.",
  "Invalid email or password.": "Incorrect email or password.",
  "This account has been suspended by an administrator.": "This account has been suspended.",
  "Please log in again.": "Please log in again.",
  "Email is already verified.": "Your email is already verified.",
  "Too many messages. Try again later.": "Too many messages were requested. Please try again later.",
  "We sent a new verification link.": "We sent a new verification link.",
  "Could not send the message.": "We could not send the email. Please try again.",
  "Invalid verification link.": "Invalid verification link.",
  "The link is invalid or has expired.": "This link is invalid or has expired.",
  "Podaj poprawny e-mail.": "Enter a valid email address.",
  "If the account exists, we sent a password reset link.": "If the account exists, we sent a password reset link.",
  "Too many attempts. Try again later.": "Too many attempts. Please try again later.",
};

const PREFIX_EN: Array<[string, string]> = [
  ["Username must have at least", "Username must have at least"],
  ["Username can have at most", "Username can have at most"],
  ["Choose at least one skill.", "Choose at least one skill."],
  ["Choose at least one language.", "Choose at least one collaboration language."],
  ["Choose at least one option.", "Choose at least one option."],
  ["Enter a project name.", "Enter a project name."],
  ["Add a short tagline.", "Add a short project tagline."],
  ["Describe the project in more detail", "Add a longer project description"],
  ["Choose at least one category.", "Choose at least one category."],
  ["Add at least one technology.", "Add at least one technology."],
  ["Add at least one open role.", "Add at least one open role."],
  ["Enter the project’s next goal.", "Add the project's next goal."],
  ["Choose the project type.", "Choose the project character."],
];

export function appMessage(message: string | undefined | null, locale: AppLocale, fallbackEn = "Something went wrong. Please try again.") {
  if (locale !== "en") return message || "Something went wrong. Try again.";
  if (!message) return fallbackEn;
  if (EXACT_EN[message]) return EXACT_EN[message];
  for (const [pl, en] of PREFIX_EN) if (message.startsWith(pl)) return en;
  return fallbackEn;
}
