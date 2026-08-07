import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/legal/legal-page";
import { getLegalConfig, LEGAL_EFFECTIVE_DATE } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Regulamin — BuildCrew",
  description: "Regulamin korzystania z platformy BuildCrew.",
};

export default function TermsPage() {
  const legal = getLegalConfig();

  return (
    <LegalPage
      title="Regulamin BuildCrew"
      subtitle={`Obowiązuje od ${LEGAL_EFFECTIVE_DATE}. Regulamin określa zasady korzystania z platformy BuildCrew.`}
    >
      <LegalSection title="1. Informacje podstawowe">
        <p>
          BuildCrew jest platformą internetową ułatwiającą poznawanie osób zainteresowanych wspólnym tworzeniem stron,
          aplikacji i innych produktów cyfrowych. Usługodawcą i operatorem serwisu jest <strong>{legal.operatorName}</strong>
          {legal.operatorAddress ? <> z adresem: <strong>{legal.operatorAddress}</strong></> : null}. Kontakt z operatorem:
          {" "}<a className="text-violet-600 hover:underline dark:text-violet-400" href={`mailto:${legal.contactEmail}`}>{legal.contactEmail}</a>.
        </p>
        <p>
          Korzystając z BuildCrew, użytkownik zawiera z operatorem umowę o świadczenie usług drogą elektroniczną na zasadach
          określonych w tym Regulaminie. W zakresie nieuregulowanym Regulaminem zastosowanie mają właściwe przepisy prawa.
        </p>
      </LegalSection>

      <LegalSection title="2. Zakres usługi">
        <p>
          BuildCrew umożliwia w szczególności utworzenie profilu, publikowanie i wyszukiwanie projektów, zgłaszanie się do ról,
          publikowanie aktywnego zgłoszenia w Build Pool, zapraszanie innych użytkowników, tworzenie ekip, dodawanie znajomych,
          prowadzenie prywatnych rozmów 1:1 pomiędzy zaakceptowanymi znajomymi, zadawanie pytań i udzielanie odpowiedzi oraz ujawnienie
          prywatnego kontaktu po zaakceptowaniu relacji projektowej lub zespołowej.
        </p>
        <p>
          BuildCrew nie jest pracodawcą, agencją zatrudnienia, pośrednikiem płatności, stroną umów zawieranych pomiędzy
          użytkownikami ani gwarantem powodzenia projektu. Użytkownicy samodzielnie ustalają zasady dalszej współpracy poza platformą.
        </p>
      </LegalSection>

      <LegalSection title="3. Konto i logowanie">
        <p>
          Do korzystania z funkcji społecznościowych wymagane jest konto. Użytkownik może logować się adresem e-mail i hasłem
          albo — jeżeli funkcja jest dostępna — kontem Google. Użytkownik odpowiada za bezpieczeństwo swojego konta i nie powinien
          udostępniać danych logowania osobom trzecim.
        </p>
        <p>
          Dane podawane podczas rejestracji i korzystania z serwisu powinny być prawdziwe w zakresie, w jakim są przedstawiane jako
          informacje o użytkowniku. Zabronione jest podszywanie się pod inne osoby, tworzenie kont w celu oszustwa lub obchodzenia blokad.
        </p>
      </LegalSection>

      <LegalSection title="4. Zasady korzystania z BuildCrew">
        <p>Użytkownik zobowiązuje się korzystać z serwisu zgodnie z prawem, dobrymi obyczajami i celem platformy. W szczególności zabronione jest:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>publikowanie treści bezprawnych, oszukańczych, wprowadzających w błąd lub naruszających prawa innych osób;</li>
          <li>nękanie, grożenie, dyskryminowanie, spamowanie lub masowe wysyłanie niechcianych zaproszeń, zgłoszeń albo prywatnych wiadomości;</li>
          <li>wyłudzanie pieniędzy, danych dostępowych, kodów, dokumentów lub innych poufnych informacji;</li>
          <li>używanie serwisu do dystrybucji złośliwego oprogramowania, automatycznych ataków lub prób uzyskania nieuprawnionego dostępu;</li>
          <li>obchodzenie zabezpieczeń, limitów, blokad i mechanizmów moderacji;</li>
          <li>publikowanie danych osobowych innych osób bez odpowiedniej podstawy lub zgody.</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Treści użytkowników i prawa własności intelektualnej">
        <p>
          Użytkownik zachowuje prawa do treści, które publikuje. Publikując treść w BuildCrew, udziela operatorowi niewyłącznej,
          nieodpłatnej licencji w zakresie koniecznym do przechowywania, technicznego przetwarzania i wyświetlania tej treści w ramach
          działania serwisu. Licencja wygasa po usunięciu treści lub konta, z zastrzeżeniem kopii technicznych i obowiązków prawnych.
        </p>
        <p>
          Użytkownik powinien publikować wyłącznie treści, do których posiada odpowiednie prawa. Sam opis pomysłu lub projektu nie
          powoduje przeniesienia praw do niego na BuildCrew ani na innych użytkowników.
        </p>
      </LegalSection>

      <LegalSection title="6. Projekty i współpraca pomiędzy użytkownikami">
        <p>
          BuildCrew pomaga nawiązać kontakt, ale nie weryfikuje automatycznie kompetencji, tożsamości, wypłacalności ani deklaracji
          każdego użytkownika. Przed przekazaniem kodu źródłowego, danych dostępowych, pieniędzy lub informacji poufnych użytkownicy
          powinni samodzielnie ustalić zasady współpracy i zastosować odpowiednie zabezpieczenia.
        </p>
        <p>
          Jeżeli współpraca ma charakter komercyjny, użytkownicy samodzielnie odpowiadają za zawarcie odpowiednich umów, rozliczenia,
          podatki, prawa autorskie, poufność i inne obowiązki wynikające z ich relacji.
        </p>
      </LegalSection>

      <LegalSection title="7. Moderacja, zgłoszenia i blokady">
        <p>
          Operator może usuwać lub ograniczać widoczność treści, zawieszać konta albo ograniczać dostęp do funkcji, jeżeli jest to
          uzasadnione bezpieczeństwem serwisu, naruszeniem Regulaminu, prawa lub praw innych osób. Użytkownicy mogą korzystać z dostępnych
          funkcji zgłaszania i blokowania.
        </p>
        <p>
          W przypadkach wymagających szybkiej ochrony użytkowników lub infrastruktury operator może zastosować środek tymczasowy przed
          pełnym wyjaśnieniem sprawy. Zastrzeżenie to nie ogranicza praw konsumenta wynikających z bezwzględnie obowiązujących przepisów.
        </p>
      </LegalSection>

      <LegalSection title="8. Usługi zewnętrzne">
        <p>
          BuildCrew może korzystać z zewnętrznych dostawców infrastruktury, bazy danych, poczty transakcyjnej lub uwierzytelniania.
          Jeżeli użytkownik wybierze logowanie Google, korzysta również z usług Google na warunkach tego dostawcy. Linki prowadzące
          do zewnętrznych serwisów, takich jak Discord, GitHub, portfolio lub LinkedIn, prowadzą poza BuildCrew.
        </p>
      </LegalSection>

      <LegalSection title="9. Dostępność i odpowiedzialność">
        <p>
          Operator dokłada uzasadnionych starań, aby serwis działał prawidłowo i bezpiecznie, ale nie gwarantuje nieprzerwanej dostępności,
          braku błędów ani rezultatu współpracy pomiędzy użytkownikami. Serwis może być czasowo niedostępny z powodu prac technicznych,
          awarii lub zdarzeń pozostających poza racjonalną kontrolą operatora.
        </p>
        <p>
          Odpowiedzialność operatora nie jest wyłączona ani ograniczona w zakresie, w jakim takie wyłączenie byłoby niedopuszczalne na
          mocy obowiązującego prawa, w szczególności wobec konsumentów.
        </p>
      </LegalSection>

      <LegalSection title="10. Usunięcie konta i zakończenie korzystania">
        <p>
          Użytkownik może przestać korzystać z BuildCrew oraz usunąć konto przy użyciu funkcji dostępnej w ustawieniach profilu.
          Usunięcie konta może spowodować usunięcie lub anonimizację powiązanych danych zgodnie z architekturą serwisu i zasadami
          opisanymi w Polityce prywatności.
        </p>
      </LegalSection>

      <LegalSection title="11. Reklamacje i kontakt">
        <p>
          Pytania, zgłoszenia i reklamacje dotyczące działania serwisu można przesyłać na{" "}
          <a className="text-violet-600 hover:underline dark:text-violet-400" href={`mailto:${legal.contactEmail}`}>{legal.contactEmail}</a>.
          W zgłoszeniu warto podać adres e-mail konta oraz opis problemu, bez przesyłania hasła ani innych sekretów uwierzytelniających.
        </p>
      </LegalSection>

      <LegalSection title="12. Zmiany Regulaminu">
        <p>
          Regulamin może zostać zmieniony, gdy jest to uzasadnione zmianą funkcji BuildCrew, wymogów bezpieczeństwa, dostawców
          technicznych albo prawa. O istotnych zmianach dotyczących zarejestrowanych użytkowników operator poinformuje w serwisie lub
          pocztą elektroniczną z odpowiednim wyprzedzeniem, jeżeli wymagają tego przepisy.
        </p>
      </LegalSection>

      <LegalSection title="13. Prawo właściwe">
        <p>
          Do Regulaminu stosuje się prawo polskie, z zachowaniem bezwzględnie obowiązujących praw konsumenta wynikających z prawa
          właściwego dla jego miejsca zamieszkania. Postanowienia Regulaminu nie ograniczają ustawowych praw użytkownika.
        </p>
        <p>
          Informacje o przetwarzaniu danych osobowych znajdują się w{" "}
          <Link href="/polityka-prywatnosci" className="text-violet-600 hover:underline dark:text-violet-400">Polityce prywatności</Link>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
