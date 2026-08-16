import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const ROOT = path.resolve("src");
const EXTENSIONS = new Set([".ts", ".tsx"]);
const POLISH_DIACRITICS = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/;
const STRONG_POLISH_WORDS = new Set([
  "brak", "dodaj", "usun", "zapisz", "anuluj", "szukaj", "znajdz", "wybierz", "zobacz", "wroc", "wyslij", "utworz", "dolacz", "odrzuc", "zaakceptuj",
  "obserwuje", "obserwujesz", "kontakty", "kontakt", "linki", "projektu", "projekcie", "projekty", "ludzie", "zespol", "ekipa", "ekipy",
  "opis", "celem", "tydzien", "tygodniowo", "dzisiaj", "wczoraj", "powiadomienia", "wiadomosci", "ustawienia", "aktywny", "aktywna", "aktywne",
  "szuka", "szukam", "szukamy", "polski", "angielski", "jezyk", "lokalnie", "zdalnie", "finansowanie", "finansowania", "fokus", "zadanie", "zadania",
  "zaproszenie", "zaproszenia", "zgloszenie", "blad", "musisz", "wymagane", "uzytkownik", "konto", "konta", "pomoc", "moje", "twoje", "twoj", "twoja",
  "nowych", "osoby", "godzin", "temu", "wspolpraca", "buduje", "budowac", "ustawiono", "dodano", "zaktualizowano", "ujawnione",
]);

const ALLOWED_EXACT = new Set([
  "Łukasz Szczepański",
  "ul. Hetmańska 16, Rzeszów, Poland",
]);

function normalize(value) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ł/g, "l");
}

function looksLikePathOrTechnical(value) {
  const trimmed = value.trim();
  return trimmed.startsWith("/") || trimmed.startsWith("@/") || /^https?:\/\//i.test(trimmed) || /^[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(trimmed);
}

function looksPolish(value) {
  const text = value.trim();
  if (!text || ALLOWED_EXACT.has(text) || looksLikePathOrTechnical(text)) return false;
  if (POLISH_DIACRITICS.test(text)) return true;
  const tokens = normalize(text).split(/[^a-z]+/).filter(Boolean);
  return tokens.some((token) => STRONG_POLISH_WORDS.has(token));
}

function filesUnder(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return filesUnder(full);
    return EXTENSIONS.has(path.extname(entry.name)) ? [full] : [];
  });
}

const failures = [];
for (const file of filesUnder(ROOT)) {
  const sourceText = fs.readFileSync(file, "utf8");
  const source = ts.createSourceFile(file, sourceText, ts.ScriptTarget.Latest, true, file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);

  function report(node, value) {
    if (!looksPolish(value)) return;
    const pos = source.getLineAndCharacterOfPosition(node.getStart(source));
    failures.push(`${path.relative(process.cwd(), file)}:${pos.line + 1}:${pos.character + 1}  ${JSON.stringify(value.slice(0, 180))}`);
  }

  function visit(node) {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isJsxText(node)) report(node, node.text);
    if (ts.isTemplateExpression(node)) {
      report(node.head, node.head.text);
      for (const span of node.templateSpans) report(span.literal, span.literal.text);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
}

if (failures.length) {
  console.error("English-only check failed. Polish-looking user-facing strings remain in src/:\n");
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("English-only check: OK");
