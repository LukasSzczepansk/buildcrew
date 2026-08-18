import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/legal/legal-page";
import { getRequestLocale } from "@/lib/site-server";

const EFFECTIVE_DATE_EN = "August 15, 2026";
const EFFECTIVE_DATE_PL = "15 sierpnia 2026";

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
    title: locale === "en" ? "Terms of Service - BuildCrew" : "Regulamin - BuildCrew",
    description: locale === "en" ? "Terms governing the use of the BuildCrew platform." : "Regulamin korzystania z platformy BuildCrew.",
    alternates: { canonical: "/terms" },
  };
}

export default async function TermsPage() {
  const locale = await getRequestLocale();
  const en = locale === "en";
  const operator = getOperator();

  if (!en) {
    return (
      <LegalPage title="Regulamin BuildCrew" subtitle={`Obowiązuje od ${EFFECTIVE_DATE_PL}. Ten regulamin określa zasady korzystania z BuildCrew.`}>
        <LegalSection title="1. Operator i zakres usługi">
          <p>BuildCrew jest platformą internetową prowadzoną przez <strong>{operator.name}</strong>, adres: <strong>{operator.address}</strong>. Kontakt: <a className="text-lime-600 hover:underline dark:text-lime-400" href={`mailto:${operator.email}`}>{operator.email}</a>.</p>
          <p>BuildCrew jest obecnie bezpłatne i nie oferuje płatnych subskrypcji ani pośrednictwa w płatnościach pomiędzy użytkownikami.</p>
          <p>Tworząc konto i akceptując Regulamin, zawierasz z operatorem umowę o świadczenie usług drogą elektroniczną za pośrednictwem BuildCrew. W odpowiednim zakresie zastosowanie ma prawo polskie oraz bezpośrednio obowiązujące prawo Unii Europejskiej.</p>
        </LegalSection>
        <LegalSection title="2. Czym jest BuildCrew">
          <p>BuildCrew jest siecią dla osób, które tworzą projekty. Pomaga odkrywać ludzi i projekty, tworzyć zespoły, komunikować się, dokumentować potwierdzoną współpracę, budować publiczne portfolio i sygnalizować otwartość na możliwości zawodowe.</p>
          <p>BuildCrew nie jest pracodawcą, agencją rekrutacyjną, marketplace'em freelancerskim, pośrednikiem płatności, doradcą inwestycyjnym ani stroną umów zawieranych pomiędzy użytkownikami.</p>
        </LegalSection>
        <LegalSection title="3. Konta">
          <p>Część funkcji wymaga konta. Rejestracja może odbywać się przez e-mail i hasło albo dostępne logowanie zewnętrzne, np. Google lub GitHub.</p>
          <p>Masz obowiązek podawać prawdziwe informacje, chronić dostęp do konta i niezwłocznie zgłaszać podejrzenie nieautoryzowanego dostępu. Nie wolno tworzyć kont w celach niezgodnych z prawem, podszywać się pod inne osoby ani obchodzić ograniczeń konta.</p>
        </LegalSection>
        <LegalSection title="4. Dozwolone korzystanie">
          <p>Zobowiązujesz się korzystać z BuildCrew zgodnie z prawem i z poszanowaniem innych osób. W szczególności nie wolno:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>publikować treści nielegalnych, oszukańczych, obraźliwych, grożących lub celowo wprowadzających w błąd;</li>
            <li>nękać, spamować, oszukiwać ani wykorzystywać innych użytkowników;</li>
            <li>żądać lub rozpowszechniać haseł, sekretów API, złośliwego oprogramowania ani innych szkodliwych materiałów;</li>
            <li>naruszać praw własności intelektualnej, prywatności lub dóbr osobistych;</li>
            <li>obchodzić zabezpieczeń, limitów, moderacji lub ograniczeń dostępu;</li>
            <li>automatycznie pobierać danych BuildCrew, jeżeli jest to zabronione przez prawo lub ten Regulamin.</li>
          </ul>
        </LegalSection>
        <LegalSection title="5. Treści użytkowników i własność intelektualna">
          <p>Zachowujesz prawa do publikowanych treści. Udzielasz BuildCrew niewyłącznego, nieodpłatnego zezwolenia na ich przechowywanie, przetwarzanie, kopiowanie i wyświetlanie wyłącznie w zakresie potrzebnym do świadczenia, zabezpieczenia, tworzenia kopii zapasowych i promowania odpowiednich funkcji BuildCrew.</p>
          <p>Opublikowanie pomysłu lub projektu nie przenosi praw do pomysłu, kodu źródłowego, projektu graficznego ani przyszłej pracy na BuildCrew lub innego użytkownika. Członkowie zespołu powinni osobno ustalić własność, poufność, wynagrodzenie i inne istotne warunki komercyjne.</p>
        </LegalSection>
        <LegalSection title="6. Projekty, zespoły i współpraca">
          <p>BuildCrew może ułatwiać poznawanie osób, aplikowanie, zaproszenia, członkostwo w zespole, prywatną przestrzeń projektu, aktualizacje oraz historię współpracy. Użytkownicy sami decydują, czy i na jakich warunkach chcą współpracować.</p>
          <p>BuildCrew nie gwarantuje tożsamości, umiejętności, dostępności, zachowania, finansowania, realizacji ani sukcesu komercyjnego żadnego użytkownika lub projektu. Nie wysyłaj pieniędzy, danych logowania ani poufnych sekretów osobom, których samodzielnie nie zweryfikowałeś.</p>
        </LegalSection>
        <LegalSection title="7. Publiczne profile, projekty i udostępnianie">
          <p>Wybrane profile i projekty mogą być widoczne publicznie bez logowania, jeśli użytkownik włączy lub opublikuje taką funkcję. Publiczne strony mogą być indeksowane przez wyszukiwarki lub zapisywane w pamięci podręcznej zewnętrznych usług. Podglądy udostępnianych linków mogą pozostać w cache przez pewien czas po zmianie treści.</p>
        </LegalSection>
        <LegalSection title="8. Możliwości zawodowe i treści demonstracyjne">
          <p>Użytkownicy mogą zaznaczać otwartość na współpracę projektową, rozmowy z co-founderami, freelance, staże, zatrudnienie lub networking. BuildCrew nie weryfikuje ani nie gwarantuje żadnej pracy, wynagrodzenia, inwestycji, zlecenia lub innej możliwości i nie jest pracodawcą ani agencją rekrutacyjną.</p>
          <p>BuildCrew może wyświetlać jasno oznaczone przykładowe lub demonstracyjne profile i projekty, aby objaśnić działanie produktu i ograniczyć puste stany. Treści demonstracyjne są fikcyjne i nie stanowią oferty pracy ani inwestycji.</p>
        </LegalSection>
        <LegalSection title="9. Wiadomości, powiadomienia i usługi zewnętrzne">
          <p>BuildCrew może oferować prywatne wiadomości oraz wysyłać e-maile transakcyjne dotyczące bezpieczeństwa konta, aplikacji, zaproszeń, wiadomości, aktywności projektów, dopasowań i innych zdarzeń związanych z kontem. Dla wybranych kategorii mogą być dostępne ustawienia powiadomień.</p>
          <p>Linki do GitHub, Discord, portfolio i innych usług zewnętrznych podlegają zasadom tych usług. BuildCrew nie odpowiada za działania odbywające się poza platformą.</p>
        </LegalSection>
        <LegalSection title="10. Moderacja i zgłoszenia">
          <p>BuildCrew może usuwać lub ograniczać treści, zawieszać konta, ograniczać funkcje albo podejmować inne proporcjonalne działania, gdy wymaga tego prawo, Regulamin, bezpieczeństwo lub ochrona innych użytkowników. Zgłoszenia można wysyłać przez dostępne narzędzia lub na adres <a className="text-lime-600 hover:underline dark:text-lime-400" href={`mailto:${operator.email}`}>{operator.email}</a>.</p>
        </LegalSection>
        <LegalSection title="11. Dostępność i zmiany">
          <p>BuildCrew może się rozwijać, dodawać, zmieniać lub wycofywać funkcje. Operator nie gwarantuje nieprzerwanej dostępności i może prowadzić prace techniczne albo czasowo ograniczać dostęp ze względów bezpieczeństwa lub technicznych.</p>
        </LegalSection>
        <LegalSection title="12. Odpowiedzialność">
          <p>W zakresie dozwolonym przez obowiązujące prawo operator nie odpowiada za umowy, płatności, spory, straty ani rezultaty projektów wynikające wyłącznie z relacji pomiędzy użytkownikami lub z usług zewnętrznych. Regulamin nie wyłącza odpowiedzialności, której zgodnie z prawem nie można wyłączyć.</p>
        </LegalSection>
        <LegalSection title="13. Usunięcie lub zakończenie konta">
          <p>Możesz usunąć konto za pomocą dostępnych ustawień. BuildCrew może zawiesić lub zakończyć konto, jeśli wymaga tego prawo albo występują poważne lub powtarzające się naruszenia. Niektóre dane mogą zostać zachowane, jeżeli jest to prawnie konieczne lub potrzebne ze względów bezpieczeństwa, roszczeń lub integralności historii współpracy, zgodnie z Polityką prywatności.</p>
        </LegalSection>
        <LegalSection title="14. Zmiany Regulaminu">
          <p>Regulamin może być aktualizowany wraz ze zmianami produktu, wymogów prawnych lub modelu usługi. Aktualna wersja będzie publikowana na BuildCrew. O istotnych zmianach możemy poinformować przez platformę lub e-mail, jeśli będzie to odpowiednie.</p>
          <p>Informacje dotyczące danych osobowych znajdziesz w <Link href="/privacy" className="text-lime-600 hover:underline dark:text-lime-400">Polityce prywatności</Link>.</p>
        </LegalSection>
      </LegalPage>
    );
  }

  return (
    <LegalPage title="BuildCrew Terms of Service" subtitle={`Effective ${EFFECTIVE_DATE_EN}. These Terms govern your use of BuildCrew.`}>
      <LegalSection title="1. Operator and scope"><p>BuildCrew is an online platform operated by <strong>{operator.name}</strong>, address: <strong>{operator.address}</strong>. Contact: <a className="text-lime-600 hover:underline dark:text-lime-400" href={`mailto:${operator.email}`}>{operator.email}</a>.</p><p>BuildCrew is currently free to use and does not currently offer paid subscriptions or payment intermediation between users.</p><p>By creating an account and accepting these Terms, you enter into an agreement with the operator for electronic services provided through BuildCrew. Polish law and directly applicable European Union law apply where relevant.</p></LegalSection>
      <LegalSection title="2. What BuildCrew is"><p>BuildCrew is a professional network for people who build. It helps users discover people and projects, form teams, communicate, document confirmed collaboration, build a public portfolio and signal interest in professional opportunities.</p><p>BuildCrew is not an employer, recruitment agency, freelancer marketplace, payment intermediary, investment adviser or party to agreements made between users.</p></LegalSection>
      <LegalSection title="3. Accounts"><p>Some features require an account. Registration may use email and password or an available third-party sign-in method such as Google or GitHub.</p><p>You must provide accurate information, protect access to your account and promptly report suspected unauthorized access. You may not create accounts for unlawful purposes, impersonate another person or bypass account restrictions.</p></LegalSection>
      <LegalSection title="4. Acceptable use"><p>You agree to use BuildCrew lawfully and respectfully. In particular, you may not:</p><ul className="list-disc space-y-1 pl-5"><li>publish illegal, fraudulent, abusive, threatening or deliberately misleading content;</li><li>harass, spam, scam or exploit other users;</li><li>request or distribute passwords, API secrets, malware or other harmful material;</li><li>infringe intellectual-property, privacy or personality rights;</li><li>circumvent security controls, rate limits, moderation or access restrictions;</li><li>automatically scrape or extract BuildCrew data where such activity is prohibited by law or by these Terms.</li></ul></LegalSection>
      <LegalSection title="5. User content and intellectual property"><p>You retain rights to content you publish. You grant BuildCrew a non-exclusive, royalty-free permission to store, process, reproduce and display that content only as necessary to provide, secure, back up and promote the relevant BuildCrew functionality.</p><p>Publishing an idea or project does not transfer ownership of that idea, source code, design or future work to BuildCrew or to another user. Team members should agree separately on ownership, confidentiality, compensation and any commercial terms that matter to them.</p></LegalSection>
      <LegalSection title="6. Projects, teams and collaboration"><p>BuildCrew can facilitate introductions, applications, invitations, team membership, private workspace features, project updates and collaboration history. Users are responsible for deciding whether to work together and on what terms.</p><p>BuildCrew does not guarantee the identity, skills, availability, conduct, funding, delivery or commercial success of any user or project. Do not send money, credentials or sensitive secrets to people you have not independently verified.</p></LegalSection>
      <LegalSection title="7. Public profiles, projects and sharing"><p>Selected profiles and projects may be publicly visible without login when a user enables or publishes those features. Public pages may be indexed by search engines or cached by external services. Shared preview cards may remain cached for a period after content changes.</p></LegalSection>
      <LegalSection title="8. Opportunities and sample content"><p>Users may indicate that they are open to project collaboration, co-founder conversations, freelance work, internships, employment or networking. BuildCrew does not verify or guarantee any job, compensation, investment, engagement or opportunity and is not an employer or recruitment agency.</p><p>BuildCrew may display clearly labelled sample or demonstration profiles and projects to explain the product and avoid empty states. Sample content is fictional, is not an offer of work or investment, and should not be presented as a real user, customer or active business.</p></LegalSection>
      <LegalSection title="9. Messages, notifications and third-party services"><p>BuildCrew may provide private messaging and may send transactional emails about account security, applications, invitations, messages, project activity, matching or other account-related events. Email preferences may be available for selected categories.</p><p>Links to GitHub, Discord, portfolio sites or other third-party services are governed by those providers. BuildCrew is not responsible for activity that takes place outside the platform.</p></LegalSection>
      <LegalSection title="10. Moderation and reports"><p>BuildCrew may remove or restrict content, suspend accounts, limit features or take other proportionate measures when required by law, these Terms, security considerations or the protection of other users. Reports may be submitted through available reporting tools or to <a className="text-lime-600 hover:underline dark:text-lime-400" href={`mailto:${operator.email}`}>{operator.email}</a>.</p></LegalSection>
      <LegalSection title="11. Availability and changes"><p>BuildCrew may evolve, add, modify or discontinue features. The operator does not guarantee uninterrupted availability and may perform maintenance or temporarily restrict access for security or technical reasons.</p></LegalSection>
      <LegalSection title="12. Liability"><p>To the extent permitted by applicable law, the operator is not responsible for agreements, payments, disputes, losses or project outcomes arising solely from relationships between users or from third-party services. Nothing in these Terms excludes liability that cannot legally be excluded.</p></LegalSection>
      <LegalSection title="13. Account termination"><p>You may delete your account using the available account settings. BuildCrew may suspend or terminate an account where required by law or where serious or repeated violations occur. Some records may be retained where legally necessary or required for security, claims or integrity of collaboration history, as explained in the Privacy Policy.</p></LegalSection>
      <LegalSection title="14. Changes to these Terms"><p>These Terms may be updated when the product, legal requirements or service model changes. The current version will be published on BuildCrew. Material changes may be communicated through the platform or by email where appropriate.</p><p>For information about personal data, see the <Link href="/privacy" className="text-lime-600 hover:underline dark:text-lime-400">Privacy Policy</Link>.</p></LegalSection>
    </LegalPage>
  );
}
