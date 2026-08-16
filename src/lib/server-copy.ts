import type { AppLocale } from "@/lib/site-config";

const EXACT_EN: Record<string, string> = {
  "Musisz być zalogowany.": "You must be logged in.",
  "Sprawdź wypełnione pola.": "Check the fields and try again.",
  "Ten nick jest już zajęty. Wybierz inny.": "This username is already taken. Choose another one.",
  "Ten nick jest już zajęty.": "This username is already taken.",
  "Coś poszło nie tak. Spróbuj ponownie.": "Something went wrong. Please try again.",
  "Uzupełnij wszystkie wymagane pola.": "Complete all required fields.",
  "Nieprawidłowy projekt.": "Invalid project.",
  "Nieprawidłowe dane.": "Invalid data.",
  "Nie możesz pisać w tej rozmowie.": "You cannot send messages in this conversation.",
  "Nieprawidłowa wiadomość.": "Invalid message.",
  "Błędne dane.": "Invalid data.",
  "Projekt nie istnieje.": "Project not found.",
  "Rola nie istnieje.": "Role not found.",
  "Ta rola jest już obsadzona.": "This role has already been filled.",
  "Nie możesz aplikować do własnego projektu.": "You cannot apply to your own project.",
  "Nie możesz aplikować do tego projektu.": "You cannot apply to this project.",
  "Masz już oczekujące zgłoszenie do tej roli.": "You already have a pending application for this role.",
  "Brak uprawnień.": "You do not have permission to do this.",
  "Ta osoba nie jest dostępna.": "This person is not available.",
  "Nie możesz zaprosić samego siebie.": "You cannot invite yourself.",
  "Nie można zaprosić tej osoby.": "This person cannot be invited.",
  "Ta osoba już należy do projektu.": "This person is already a project member.",
  "Zaproszenie nie istnieje.": "Invitation not found.",
  "Zgłoszenie nie istnieje.": "Application not found.",
  "To zgłoszenie zostało już rozpatrzone.": "This application has already been reviewed.",
  "To zaproszenie zostało już rozpatrzone.": "This invitation has already been reviewed.",
  "Nie można zaakceptować tego zaproszenia.": "This invitation cannot be accepted.",
  "Rola nie jest już dostępna.": "This role is no longer available.",
  "Za dużo prób rejestracji. Spróbuj ponownie później.": "Too many sign-up attempts. Please try again later.",
  "Konto z tym adresem e-mail już istnieje.": "An account with this email address already exists.",
  "Nie udało się utworzyć konta.": "We could not create your account. Please try again.",
  "Za dużo prób logowania. Spróbuj ponownie za kilkanaście minut.": "Too many login attempts. Please try again in a few minutes.",
  "Nieprawidłowy e-mail lub hasło.": "Incorrect email or password.",
  "To konto zostało zawieszone przez administrację.": "This account has been suspended.",
  "Zaloguj się ponownie.": "Please log in again.",
  "E-mail jest już potwierdzony.": "Your email is already verified.",
  "Za dużo wiadomości. Spróbuj ponownie później.": "Too many messages were requested. Please try again later.",
  "Wysłaliśmy nowy link weryfikacyjny.": "We sent a new verification link.",
  "Nie udało się wysłać wiadomości.": "We could not send the email. Please try again.",
  "Nieprawidłowy link weryfikacyjny.": "Invalid verification link.",
  "Link jest nieprawidłowy albo wygasł.": "This link is invalid or has expired.",
  "Podaj poprawny e-mail.": "Enter a valid email address.",
  "Jeżeli konto istnieje, wysłaliśmy link do resetu hasła.": "If the account exists, we sent a password reset link.",
  "Za dużo prób. Spróbuj ponownie później.": "Too many attempts. Please try again later.",
};

const PREFIX_EN: Array<[string, string]> = [
  ["Nick musi mieć min.", "Username must have at least"],
  ["Nick może mieć maks.", "Username can have at most"],
  ["Wybierz przynajmniej jedną umiejętność.", "Choose at least one skill."],
  ["Wybierz przynajmniej jeden język.", "Choose at least one collaboration language."],
  ["Zaznacz przynajmniej jedną opcję.", "Choose at least one option."],
  ["Podaj nazwę projektu.", "Enter a project name."],
  ["Dodaj krótki opis (tagline).", "Add a short project tagline."],
  ["Opisz projekt szerzej", "Add a longer project description"],
  ["Wybierz przynajmniej jedną kategorię.", "Choose at least one category."],
  ["Dodaj przynajmniej jedną technologię.", "Add at least one technology."],
  ["Dodaj przynajmniej jedną otwartą rolę.", "Add at least one open role."],
  ["Podaj najbliższy cel projektu.", "Add the project's next goal."],
  ["Wybierz charakter projektu.", "Choose the project character."],
];

export function appMessage(message: string | undefined | null, locale: AppLocale, fallbackEn = "Something went wrong. Please try again.") {
  if (locale !== "en") return message || "Coś poszło nie tak. Spróbuj ponownie.";
  if (!message) return fallbackEn;
  if (EXACT_EN[message]) return EXACT_EN[message];
  for (const [pl, en] of PREFIX_EN) if (message.startsWith(pl)) return en;
  return fallbackEn;
}
