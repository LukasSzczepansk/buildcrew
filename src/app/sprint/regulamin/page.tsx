import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/legal/legal-page";
import { getRequestLocale } from "@/lib/site-server";
import {
  SPRINT_TERMS_EFFECTIVE_DATE_EN,
  SPRINT_TERMS_EFFECTIVE_DATE_PL,
  SPRINT_TERMS_VERSION,
} from "@/lib/sprint-terms";

function getOperator() {
  return {
    name: process.env.LEGAL_OPERATOR_NAME?.trim() || "Łukasz Szczepański",
    address: process.env.LEGAL_OPERATOR_ADDRESS?.trim() || "ul. Hetmańska 16, Rzeszów, Poland",
    email: process.env.PUBLIC_CONTACT_EMAIL?.trim() || "slangtest.contact@gmail.com",
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    title: locale === "en" ? "BuildCrew Sprint Terms" : "Regulamin BuildCrew Sprint",
    description: locale === "en"
      ? "Rules for participating in the free BuildCrew Sprint program."
      : "Zasady udziału w bezpłatnym programie BuildCrew Sprint.",
    alternates: { canonical: "/sprint/regulamin" },
  };
}

export default async function SprintTermsPage() {
  const locale = await getRequestLocale();
  const en = locale === "en";
  const operator = getOperator();

  if (!en) {
    return (
      <LegalPage
        title="Regulamin BuildCrew Sprint"
        subtitle={`Wersja ${SPRINT_TERMS_VERSION}. Obowiązuje od ${SPRINT_TERMS_EFFECTIVE_DATE_PL}.`}
      >
        <LegalSection title="1. Organizator i charakter Sprintu">
          <p>BuildCrew Sprint jest bezpłatnym programem społecznościowym organizowanym przez <strong>{operator.name}</strong>, adres: <strong>{operator.address}</strong>. Kontakt: <a className="text-lime-600 hover:underline dark:text-lime-400" href={`mailto:${operator.email}`}>{operator.email}</a>.</p>
          <p>Program służy łączeniu uczestników w zespoły, wspólnemu tworzeniu projektów i produktów oraz dokumentowaniu współpracy. Obecna edycja nie jest loterią, konkursem z nagrodami ani odpłatną usługą premium.</p>
          <p>Niniejszy regulamin uzupełnia <Link href="/terms" className="text-lime-600 hover:underline dark:text-lime-400">Regulamin BuildCrew</Link>. W sprawach nieuregulowanych tutaj zastosowanie ma Regulamin BuildCrew.</p>
        </LegalSection>

        <LegalSection title="2. Udział i zgłoszenie">
          <p>Do Sprintu może zgłosić się użytkownik posiadający konto BuildCrew i uzupełniający formularz zgłoszeniowy. Uczestnik powinien podawać prawdziwe i aktualne informacje, w szczególności dotyczące roli, umiejętności i realnej dostępności.</p>
          <p>Wysłanie zgłoszenia nie gwarantuje przyjęcia do Sprintu, znalezienia Crew ani przypisania do konkretnego projektu. Organizator może przyjąć zgłoszenie, umieścić je na liście rezerwowej lub go nie zakwalifikować, w szczególności z uwagi na liczbę miejsc, balans ról, dostępność uczestników i możliwość stworzenia sensownych zespołów.</p>
          <p>Jeżeli w odniesieniu do danego uczestnika przepisy wymagają zgody przedstawiciela ustawowego na udział lub korzystanie z usługi, uczestnik powinien taką zgodę uzyskać przed zgłoszeniem.</p>
        </LegalSection>

        <LegalSection title="3. Matching i tworzenie Crew">
          <p>BuildCrew może wykorzystywać dane ze zgłoszenia i profilu, takie jak rola, stack, poziom, zainteresowania, dostępność, cele i preferowany styl pracy, aby proponować dopasowania oraz pomagać administratorowi w tworzeniu Crew.</p>
          <p>Wynik dopasowania ma charakter pomocniczy. Nie jest gwarancją zgodności charakterów, jakości współpracy, poziomu umiejętności ani ukończenia projektu.</p>
          <p>Organizator może ręcznie zmieniać skład Crew, zaproponować re-matching albo nie utworzyć Crew, jeżeli brakuje odpowiednich uczestników lub wymaga tego bezpieczeństwo albo sprawny przebieg programu.</p>
        </LegalSection>

        <LegalSection title="4. Zasady uczestnictwa">
          <p>Uczestnik powinien komunikować się z Crew w rozsądnym czasie, informować o istotnych zmianach dostępności i działać w dobrej wierze na rzecz wspólnie ustalonego celu.</p>
          <p>Nie wolno nękać innych osób, spamować, podszywać się pod innych, publikować treści nielegalnych, naruszać cudzych praw, udostępniać złośliwego oprogramowania ani wykorzystywać Sprintu do oszustw lub pozyskiwania sekretów, haseł czy kluczy API.</p>
          <p>Organizator może poprosić o zmianę zachowania, ograniczyć funkcje, przenieść uczestnika do innej Crew lub zakończyć jego udział w razie poważnego albo powtarzającego się naruszania zasad, długotrwałego braku kontaktu lub działania na szkodę innych uczestników.</p>
        </LegalSection>

        <LegalSection title="5. Projekty i prawa własności intelektualnej">
          <p>BuildCrew nie nabywa własności projektu, kodu, designu, nazwy, domeny ani innych rezultatów pracy tworzonych przez uczestników w ramach Sprintu wyłącznie dlatego, że projekt powstał podczas programu.</p>
          <p>Członkowie Crew samodzielnie ustalają pomiędzy sobą prawa do kodu, grafiki, dokumentacji, znaków, repozytoriów, domen, przychodów, udziałów i innych rezultatów współpracy. Przy projektach, które mogą być rozwijane komercyjnie, zalecane jest zapisanie tych ustaleń w sposób możliwy do późniejszego odtworzenia.</p>
          <p>Uczestnik powinien korzystać wyłącznie z materiałów, kodu, danych i innych zasobów, do których ma odpowiednie prawa lub licencję. Nie należy umieszczać w BuildCrew poufnych sekretów, haseł, kluczy API ani danych, których Crew nie może legalnie używać.</p>
        </LegalSection>

        <LegalSection title="6. Demo Day i prezentowanie projektów">
          <p>Celem Sprintu może być prezentacja rezultatów podczas Demo Day. Uczestnicy decydują, jakie materiały projektowe chcą udostępnić publicznie, z zastrzeżeniem funkcji i ustawień dostępnych na BuildCrew.</p>
          <p>BuildCrew może prezentować publicznie nazwę projektu, jego publiczny opis, publiczne linki, publiczne materiały projektowe oraz informację o uczestnictwie w Sprincie, jeżeli zostały one przez uczestników udostępnione lub oznaczone jako publiczne w ramach programu. Publikacja wizerunku osoby lub materiałów wymagających osobnej zgody może być obsługiwana oddzielnie.</p>
        </LegalSection>

        <LegalSection title="7. Brak gwarancji rezultatu">
          <p>Celem Sprintu jest pomoc uczestnikom w zbudowaniu i wypuszczeniu działającego produktu, ale BuildCrew nie gwarantuje ukończenia projektu, utrzymania pełnego składu Crew, jakości produktu, liczby użytkowników, przychodów, finansowania, zatrudnienia, zleceń ani dalszej współpracy po zakończeniu Sprintu.</p>
          <p>Decyzje dotyczące zakresu projektu, technologii, publikacji produktu i dalszego rozwoju podejmują uczestnicy na własną odpowiedzialność.</p>
        </LegalSection>

        <LegalSection title="8. Rezygnacja, zmiany i odwołanie edycji">
          <p>Uczestnik może wycofać zgłoszenie lub zakończyć udział. Jeżeli uczestnik jest już członkiem Crew, powinien możliwie szybko poinformować zespół o rezygnacji.</p>
          <p>Organizator może zmienić harmonogram, limit miejsc, termin Team Reveal, Demo Day lub inne elementy organizacyjne, jeżeli jest to potrzebne do prawidłowego przeprowadzenia Sprintu. W przypadku zbyt małej liczby zgłoszeń, problemów technicznych, bezpieczeństwa lub innych istotnych przyczyn organizator może przesunąć albo odwołać edycję.</p>
        </LegalSection>

        <LegalSection title="9. Dane osobowe">
          <p>Dane ze zgłoszenia są wykorzystywane do prowadzenia Sprintu, komunikacji, moderacji, dopasowywania uczestników i organizacji Crew. Szczegóły dotyczące administratora danych, podstaw przetwarzania, odbiorców, okresów przechowywania i praw użytkownika opisuje <Link href="/privacy" className="text-lime-600 hover:underline dark:text-lime-400">Polityka prywatności BuildCrew</Link>.</p>
          <p>Akceptacja tego regulaminu nie jest zgodą marketingową. Jeżeli BuildCrew będzie potrzebować osobnej zgody na określone przetwarzanie, zostanie ona przedstawiona oddzielnie.</p>
        </LegalSection>

        <LegalSection title="10. Kontakt i zgłoszenia problemów">
          <p>Pytania dotyczące Sprintu, rezygnacji, bezpieczeństwa lub sporów organizacyjnych można wysyłać na <a className="text-lime-600 hover:underline dark:text-lime-400" href={`mailto:${operator.email}`}>{operator.email}</a> albo przez dostępne funkcje BuildCrew.</p>
          <p>BuildCrew może pomagać w rozwiązywaniu problemów organizacyjnych, ale nie staje się przez to stroną prywatnych umów pomiędzy członkami Crew.</p>
        </LegalSection>

        <LegalSection title="11. Zmiany regulaminu">
          <p>Regulamin może zostać zmieniony, jeżeli zmienia się sposób prowadzenia Sprintu, funkcje BuildCrew albo wymagania prawne. Aktualna wersja i data obowiązywania są publikowane na tej stronie. Istotne zmiany dotyczące trwającej edycji mogą zostać dodatkowo zakomunikowane uczestnikom.</p>
        </LegalSection>
      </LegalPage>
    );
  }

  return (
    <LegalPage
      title="BuildCrew Sprint Terms"
      subtitle={`Version ${SPRINT_TERMS_VERSION}. Effective ${SPRINT_TERMS_EFFECTIVE_DATE_EN}.`}
    >
      <LegalSection title="1. Organizer and nature of the Sprint">
        <p>BuildCrew Sprint is a free community program organized by <strong>{operator.name}</strong>, address: <strong>{operator.address}</strong>. Contact: <a className="text-lime-600 hover:underline dark:text-lime-400" href={`mailto:${operator.email}`}>{operator.email}</a>.</p>
        <p>The program helps participants form teams, build projects and products together, and document collaboration. The current edition is not a lottery, a prize competition or a paid premium service.</p>
        <p>These Sprint Terms supplement the <Link href="/terms" className="text-lime-600 hover:underline dark:text-lime-400">BuildCrew Terms of Service</Link>. The general Terms apply where these Sprint Terms do not provide a specific rule.</p>
      </LegalSection>

      <LegalSection title="2. Participation and application">
        <p>To apply, a participant needs a BuildCrew account and must complete the Sprint application form. Information provided should be accurate and current, especially role, skills and realistic availability.</p>
        <p>Submitting an application does not guarantee admission, a Crew match or assignment to a specific project. The organizer may accept, waitlist or decline an application, including because of capacity, role balance, availability and the ability to form workable teams.</p>
        <p>If applicable law requires consent from a legal representative for a particular participant to join or use the service, the participant should obtain that consent before applying.</p>
      </LegalSection>

      <LegalSection title="3. Matching and Crew formation">
        <p>BuildCrew may use application and profile information such as role, stack, level, interests, availability, goals and working preferences to suggest matches and assist administrators in forming Crews.</p>
        <p>Match scores are assistance features only. They do not guarantee personal compatibility, skill level, quality of collaboration or project completion.</p>
        <p>The organizer may manually adjust Crews, propose re-matching or decide not to form a Crew where suitable participants are unavailable or where safety or program operations require it.</p>
      </LegalSection>

      <LegalSection title="4. Participation rules">
        <p>Participants should communicate with their Crew within a reasonable time, report material availability changes and work in good faith toward the agreed goal.</p>
        <p>Harassment, spam, impersonation, illegal content, infringement, malware, fraud and attempts to obtain passwords, API secrets or other sensitive credentials are prohibited.</p>
        <p>The organizer may ask a participant to change behavior, restrict features, move the participant to another Crew or end participation in cases of serious or repeated violations, prolonged loss of contact or conduct harmful to other participants.</p>
      </LegalSection>

      <LegalSection title="5. Projects and intellectual property">
        <p>BuildCrew does not acquire ownership of a project, code, design, name, domain or other work product merely because it was created during the Sprint.</p>
        <p>Crew members are responsible for agreeing among themselves on ownership and use of code, graphics, documentation, marks, repositories, domains, revenue, equity and other collaboration outcomes. For projects that may continue commercially, those arrangements should be recorded in a form that can later be retrieved.</p>
        <p>Participants should only use materials, code and data they are entitled to use. Do not put confidential secrets, passwords, API keys or unlawfully obtained data into BuildCrew.</p>
      </LegalSection>

      <LegalSection title="6. Demo Day and project presentation">
        <p>The Sprint may culminate in a Demo Day. Participants decide which project materials they make public, subject to the features and settings available in BuildCrew.</p>
        <p>BuildCrew may display the project name, public description, public links, public project materials and Sprint participation where participants have intentionally made those items public through the program. A person's likeness or materials requiring separate permission may be handled through a separate permission flow.</p>
      </LegalSection>

      <LegalSection title="7. No guarantee of outcome">
        <p>The Sprint aims to help participants build and ship a working product, but BuildCrew does not guarantee project completion, a stable Crew, product quality, users, revenue, funding, employment, contracts or continued collaboration after the Sprint.</p>
        <p>Participants are responsible for decisions about scope, technology, publication and continued development.</p>
      </LegalSection>

      <LegalSection title="8. Withdrawal, changes and cancellation">
        <p>A participant may withdraw an application or end participation. If already part of a Crew, the participant should inform the team as soon as reasonably possible.</p>
        <p>The organizer may change the schedule, capacity, Team Reveal, Demo Day or other operational details where needed to run the Sprint properly. An edition may be postponed or cancelled because of insufficient applications, technical or safety issues, or other significant reasons.</p>
      </LegalSection>

      <LegalSection title="9. Personal data">
        <p>Application data is used to operate the Sprint, communicate with participants, moderate activity, match participants and organize Crews. The <Link href="/privacy" className="text-lime-600 hover:underline dark:text-lime-400">BuildCrew Privacy Policy</Link> explains the controller, purposes and legal bases, recipients, retention and user rights.</p>
        <p>Accepting these Terms is not marketing consent. Where separate consent is required for a specific processing activity, it will be requested separately.</p>
      </LegalSection>

      <LegalSection title="10. Contact and issues">
        <p>Questions about the Sprint, withdrawal, safety or organizational disputes can be sent to <a className="text-lime-600 hover:underline dark:text-lime-400" href={`mailto:${operator.email}`}>{operator.email}</a> or through available BuildCrew tools.</p>
        <p>BuildCrew may assist with organizational issues but does not thereby become a party to private agreements between Crew members.</p>
      </LegalSection>

      <LegalSection title="11. Changes to these Terms">
        <p>These Terms may be updated when the Sprint format, BuildCrew features or legal requirements change. The current version and effective date are published on this page. Material changes affecting an active edition may also be communicated to participants.</p>
      </LegalSection>
    </LegalPage>
  );
}
