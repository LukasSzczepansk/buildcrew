import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Polityka prywatności — BuildCrew",
  description: "Informacje o przetwarzaniu danych osobowych w BuildCrew.",
};

const EFFECTIVE_DATE = "12 sierpnia 2026 r.";

function getOperator() {
  return {
    name: process.env.LEGAL_OPERATOR_NAME?.trim() || "Łukasz Szczepański",
    address: process.env.LEGAL_OPERATOR_ADDRESS?.trim() || "ul. Hetmańska 16, Rzeszów",
    email: process.env.PUBLIC_CONTACT_EMAIL?.trim() || "slangtest.contact@gmail.com",
  };
}

export default function PrivacyPage() {
  const operator = getOperator();

  return (
    <LegalPage
      title="Polityka prywatności BuildCrew"
      subtitle={`Wersja z dnia ${EFFECTIVE_DATE}. Dokument opisuje, jakie dane są przetwarzane podczas korzystania z BuildCrew, w jakich celach i jakie prawa przysługują użytkownikowi.`}
    >
      <LegalSection title="1. Administrator danych">
        <p>
          Administratorem danych osobowych przetwarzanych w związku z działaniem BuildCrew jest <strong>{operator.name}</strong>,
          adres: <strong>{operator.address}</strong>, e-mail: {" "}
          <a className="text-lime-600 hover:underline dark:text-lime-400" href={`mailto:${operator.email}`}>
            {operator.email}
          </a>
          , dalej „Administrator”.
        </p>
        <p>W sprawach dotyczących danych osobowych można kontaktować się z Administratorem pod powyższym adresem e-mail.</p>
      </LegalSection>

      <LegalSection title="2. Zakres Polityki">
        <p>
          Niniejsza Polityka prywatności opisuje zasady przetwarzania danych osobowych osób korzystających z platformy
          BuildCrew. BuildCrew jest obecnie bezpłatną platformą służącą do nawiązywania kontaktów pomiędzy osobami
          zainteresowanymi wspólnym tworzeniem projektów cyfrowych.
        </p>
      </LegalSection>

      <LegalSection title="3. Jakie dane mogą być przetwarzane">
        <p>W zależności od sposobu korzystania z BuildCrew Administrator może przetwarzać następujące kategorie danych:</p>

        <p><strong>A. Dane konta i logowania</strong></p>
        <ul className="list-disc space-y-1 pl-5">
          <li>adres e-mail;</li>
          <li>identyfikator konta oraz informacje o jego statusie;</li>
          <li>informacje o weryfikacji adresu e-mail;</li>
          <li>bezpiecznie przetwarzane dane uwierzytelniające, identyfikatory sesji i dane związane z logowaniem;</li>
          <li>informacje związane z wybraną metodą logowania.</li>
        </ul>
        <p>
          Administrator nie ma dostępu do hasła użytkownika w jego jawnej postaci. Hasła i tokeny uwierzytelniające są
          przetwarzane przy użyciu mechanizmów bezpieczeństwa przewidzianych przez system BuildCrew.
        </p>

        <p><strong>B. Dane otrzymywane przy logowaniu Google</strong></p>
        <p>
          Jeżeli użytkownik wybierze logowanie za pomocą konta Google, BuildCrew może otrzymać od Google informacje
          udostępnione zgodnie z zakresem prezentowanym podczas procesu logowania, w szczególności identyfikator konta,
          adres e-mail i informacje niezbędne do utworzenia lub rozpoznania konta BuildCrew. BuildCrew nie otrzymuje hasła
          użytkownika do konta Google.
        </p>

        <p><strong>C. Dane profilu</strong></p>
        <ul className="list-disc space-y-1 pl-5">
          <li>nazwa użytkownika lub nazwa wyświetlana;</li>
          <li>opis użytkownika, rola i poziom doświadczenia;</li>
          <li>umiejętności, technologie, zainteresowania i cele;</li>
          <li>informacje o dostępności i rodzaju poszukiwanej współpracy;</li>
          <li>avatar lub inne oznaczenie profilu, jeżeli funkcja jest dostępna;</li>
          <li>linki lub identyfikatory GitHub, Discord, portfolio albo innych usług podane dobrowolnie przez użytkownika;</li>
          <li>inne informacje dobrowolnie umieszczone w profilu.</li>
        </ul>

        <p><strong>D. Dane dotyczące projektów, ekip i Build Pool</strong></p>
        <ul className="list-disc space-y-1 pl-5">
          <li>utworzone projekty, ich opisy i role;</li>
          <li>zgłoszenia do projektów, zaproszenia i decyzje dotyczące zgłoszeń;</li>
          <li>członkostwo w ekipach i zaproszenia do Crew;</li>
          <li>informacje publikowane w Build Pool i propozycje wspólnego budowania;</li>
          <li>relacje pomiędzy użytkownikami, w tym znajomi i blokady;</li>
          <li>pytania, odpowiedzi oraz inne informacje związane z korzystaniem z funkcji społecznościowych.</li>
        </ul>

        <p><strong>E. Dane Showcase</strong></p>
        <ul className="list-disc space-y-1 pl-5">
          <li>nazwa, tagline i opis prezentowanego projektu;</li>
          <li>screenshot lub adres materiału graficznego;</li>
          <li>link do działającej wersji projektu albo repozytorium;</li>
          <li>informacja o twórcy, ekipie i ewentualnym powiązaniu z projektem lub Build Challenge;</li>
          <li>status, kategoria i informacja o poszukiwaniu współtwórców;</li>
          <li>reakcje na Showcase oraz konstruktywny feedback;</li>
          <li>odpowiedź na pytanie, czy użytkownik skorzystałby z prezentowanego projektu.</li>
        </ul>
        <p>
          Użytkownik publikujący screenshot lub inne materiały powinien upewnić się, że nie zawierają danych osób trzecich,
          których nie ma prawa ujawniać.
        </p>

        <p><strong>F. Dane Build Challenges i dopasowania</strong></p>
        <ul className="list-disc space-y-1 pl-5">
          <li>informacja o udziale w Challenge;</li>
          <li>wybrany sposób udziału, np. z ekipą albo z prośbą o znalezienie ekipy;</li>
          <li>powiązanie z Crew i projektem zgłoszonym do Challenge;</li>
          <li>informacje używane do proponowania potencjalnych współtwórców, np. rola, zainteresowania, poziom i dostępność;</li>
          <li>informacje o zaakceptowaniu albo odrzuceniu zaproszenia lub propozycji dopasowania.</li>
        </ul>

        <p><strong>G. Prywatne wiadomości</strong></p>
        <p>
          Jeżeli użytkownicy korzystają z prywatnych wiadomości, BuildCrew przetwarza treść wiadomości oraz informacje
          techniczne niezbędne do ich dostarczenia, wyświetlenia historii i obsługi statusu odczytu. Treść wiadomości nie jest
          przeznaczona do publicznego udostępniania.
        </p>
        <p>
          Administrator może uzyskać dostęp do treści w zakresie koniecznym do zapewnienia działania usługi, rozwiązania
          problemu technicznego, rozpatrzenia zgłoszenia, przeciwdziałania nadużyciom lub wykonania obowiązku prawnego.
        </p>

        <p><strong>H. Powiadomienia i preferencje</strong></p>
        <ul className="list-disc space-y-1 pl-5">
          <li>typ i treść powiadomienia;</li>
          <li>użytkownik, którego dotyczy zdarzenie, oraz — jeżeli ma to zastosowanie — użytkownik inicjujący zdarzenie;</li>
          <li>powiązanie powiadomienia z projektem, Crew, Showcase, Challenge lub inną funkcją;</li>
          <li>status odczytu i czas utworzenia;</li>
          <li>preferencje dotyczące otrzymywania wybranych wiadomości e-mail;</li>
          <li>informacja techniczna o wysłaniu wiadomości e-mail, jeżeli jest potrzebna do działania systemu.</li>
        </ul>

        <p><strong>I. Dane dotyczące zgłoszeń i moderacji</strong></p>
        <ul className="list-disc space-y-1 pl-5">
          <li>treść zgłoszenia i dane osoby zgłaszającej;</li>
          <li>informacje dotyczące zgłaszanego konta lub treści;</li>
          <li>historia działań moderacyjnych, ostrzeżeń, ograniczeń i blokad;</li>
          <li>korespondencja dotycząca wyjaśnienia lub zakwestionowania decyzji.</li>
        </ul>

        <p><strong>J. Dane techniczne i bezpieczeństwa</strong></p>
        <ul className="list-disc space-y-1 pl-5">
          <li>adres IP;</li>
          <li>data i czas połączenia;</li>
          <li>data ostatniej aktywności konta używana do prezentowania przybliżonego statusu, np. „aktywny dziś” albo „aktywny w tym tygodniu”;</li>
          <li>informacje o urządzeniu i przeglądarce;</li>
          <li>logi serwerowe i informacje dotyczące błędów;</li>
          <li>identyfikatory sesji;</li>
          <li>informacje potrzebne do zabezpieczenia konta, limitowania nadużyć i ochrony Serwisu.</li>
        </ul>

        <p><strong>K. Korespondencja</strong></p>
        <p>
          Jeżeli użytkownik kontaktuje się z Administratorem, przetwarzane mogą być adres e-mail, treść wiadomości,
          załączniki oraz inne informacje przekazane dobrowolnie w korespondencji.
        </p>
      </LegalSection>

      <LegalSection title="4. Cele i podstawy przetwarzania">
        <p>Dane osobowe mogą być przetwarzane w następujących celach:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Utworzenie i prowadzenie konta oraz świadczenie funkcji BuildCrew</strong> — w celu zawarcia i wykonania
            umowy o korzystanie z BuildCrew, na podstawie art. 6 ust. 1 lit. b RODO.
          </li>
          <li>
            <strong>Realizacja funkcji społecznościowych</strong>, w tym profilu, projektów, Crew, Build Pool, znajomych,
            wiadomości, Showcase, feedbacku i Build Challenges — na podstawie art. 6 ust. 1 lit. b RODO w zakresie
            niezbędnym do świadczenia funkcji wybranych przez użytkownika.
          </li>
          <li>
            <strong>Powiadomienia transakcyjne i wiadomości dotyczące konta</strong>, np. o zgłoszeniu do projektu,
            zaproszeniu do Crew, odpowiedzi w Build Pool, zdarzeniu Challenge, weryfikacji e-maila lub resecie hasła — w
            celu wykonania umowy i zapewnienia działania żądanych funkcji.
          </li>
          <li>
            <strong>Bezpieczeństwo i przeciwdziałanie nadużyciom</strong> — na podstawie prawnie uzasadnionego interesu
            Administratora polegającego na ochronie użytkowników, kont i infrastruktury, art. 6 ust. 1 lit. f RODO.
          </li>
          <li>
            <strong>Prezentowanie przybliżonego statusu aktywności</strong> — w celu ograniczenia kontaktowania się z
            nieaktywnymi kontami i poprawy jakości dopasowań, na podstawie prawnie uzasadnionego interesu Administratora,
            art. 6 ust. 1 lit. f RODO.
          </li>
          <li>
            <strong>Moderacja, obsługa zgłoszeń i egzekwowanie Regulaminu</strong> — na podstawie wykonania umowy,
            prawnie uzasadnionego interesu Administratora lub obowiązku prawnego, zależnie od konkretnej sytuacji.
          </li>
          <li>
            <strong>Obsługa pytań i reklamacji</strong> — na podstawie art. 6 ust. 1 lit. b, c lub f RODO, zależnie od
            charakteru sprawy.
          </li>
          <li>
            <strong>Ustalenie, dochodzenie lub obrona przed roszczeniami</strong> — na podstawie prawnie uzasadnionego
            interesu Administratora, art. 6 ust. 1 lit. f RODO.
          </li>
          <li>
            <strong>Wykonanie obowiązków prawnych</strong> — na podstawie art. 6 ust. 1 lit. c RODO, jeżeli przepisy
            wymagają przechowania, ujawnienia lub innego przetwarzania określonych danych.
          </li>
        </ul>
        <p>
          Jeżeli w przyszłości konkretna funkcja, komunikacja marketingowa, analityka lub technologia będzie wymagała zgody,
          zgoda będzie zbierana osobno i będzie można ją wycofać na zasadach wskazanych przy tej funkcji.
        </p>
      </LegalSection>

      <LegalSection title="5. Czy podanie danych jest obowiązkowe">
        <p>
          Podanie danych wymaganych podczas rejestracji jest dobrowolne, ale konieczne do utworzenia i korzystania z konta.
          Podawanie dodatkowych informacji w profilu, linków do innych serwisów, udział w Showcase, Build Challenges i innych
          funkcjach opcjonalnych jest dobrowolne, ale część danych może być konieczna do skorzystania z konkretnej funkcji.
        </p>
      </LegalSection>

      <LegalSection title="6. Logowanie Google">
        <p>
          Użytkownik może dobrowolnie wybrać logowanie Google, jeżeli ta opcja jest aktywna. BuildCrew wykorzystuje wtedy
          mechanizm OAuth/OpenID Connect do potwierdzenia tożsamości. Z Google pobierany jest minimalny zestaw informacji
          potrzebny do logowania, w szczególności unikalny identyfikator konta i adres e-mail.
        </p>
        <p>
          BuildCrew nie przechowuje hasła do konta Google i nie wykorzystuje logowania Google do dostępu do Gmaila, Dysku,
          Kalendarza ani innych danych użytkownika, które nie są potrzebne do procesu logowania.
        </p>
      </LegalSection>

      <LegalSection title="7. Publiczne treści, publiczne linki i komunikacja prywatna">
        <p>
          Część informacji publikowanych w BuildCrew jest przeznaczona do udostępniania innym użytkownikom, a wybrane
          treści mogą być dostępne także dla osób niezalogowanych. Dotyczy to w szczególności projektów udostępnionych
          publicznym linkiem oraz treści publikowanych w Showcase. Publiczna strona projektu może zawierać m.in. nazwę,
          opis, technologie, etap projektu, informacje o wolnych rolach, nazwę wyświetlaną lub avatar twórcy oraz informacje
          o członkach ekipy w zakresie prezentowanym przez daną funkcję.
        </p>
        <p>
          BuildCrew może generować kartę podglądu publicznego projektu do udostępnienia w zewnętrznych serwisach. Po
          wklejeniu publicznego linku np. na Discordzie, Facebooku lub w innym serwisie zewnętrzny dostawca może pobrać i
          czasowo zapisać publicznie dostępne dane oraz obraz podglądu zgodnie z własnymi zasadami. Usunięcie lub zmiana
          treści w BuildCrew nie musi powodować natychmiastowego usunięcia kopii podglądu zapisanej przez zewnętrzny serwis.
        </p>
        <p>
          W celu ograniczenia kontaktowania się z nieaktywnymi kontami BuildCrew może prezentować innym użytkownikom
          przybliżony status aktywności, np. „aktywny dziś”, „aktywny w tym tygodniu” lub informację o mniejszej aktywności.
          Dokładna data i godzina ostatniej aktywności nie jest prezentowana jako publiczny znacznik czasu.
        </p>
        <p>
          Użytkownik powinien uważać, aby w publicznych częściach BuildCrew nie umieszczać informacji, których nie chce
          ujawniać innym osobom. Prywatne dane kontaktowe są udostępniane wyłącznie w zakresie wynikającym z funkcji Serwisu.
        </p>
        <p>
          Prywatne wiadomości są przeznaczone dla uczestników danej rozmowy i nie są publikowane jako treści publiczne.
          Zablokowanie użytkownika, usunięcie relacji lub konta może wpływać na możliwość dalszego prowadzenia rozmowy lub
          sposób prezentowania jej historii zgodnie z aktualnym działaniem Serwisu.
        </p>
      </LegalSection>

      <LegalSection title="8. Odbiorcy danych i dostawcy techniczni">
        <p>
          BuildCrew korzysta obecnie z zewnętrznych dostawców niezbędnych do działania Serwisu. W zależności od funkcji i
          konfiguracji dane mogą być powierzane lub udostępniane w niezbędnym zakresie następującym kategoriom odbiorców:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Vercel</strong> — hosting i infrastruktura służąca do udostępniania aplikacji;</li>
          <li><strong>Neon</strong> — infrastruktura bazy danych PostgreSQL;</li>
          <li><strong>Resend</strong> — dostarczanie wiadomości e-mail związanych z kontem i wybranymi powiadomieniami;</li>
          <li><strong>Google</strong> — uwierzytelnianie, jeżeli użytkownik dobrowolnie wybierze logowanie Google;</li>
          <li>dostawcy infrastruktury i podwykonawcy powyższych podmiotów w zakresie wynikającym z ich aktualnych warunków świadczenia usług.</li>
        </ul>
        <p>
          Zakres danych zależy od używanej funkcji i może obejmować m.in. dane techniczne, adres IP, identyfikatory, adres
          e-mail, treść wiadomości transakcyjnej oraz dane przechowywane w bazie lub infrastrukturze hostingowej.
        </p>
      </LegalSection>

      <LegalSection title="9. Przekazywanie danych poza Europejski Obszar Gospodarczy">
        <p>
          Część dostawców technologii lub ich podwykonawców może przetwarzać dane poza Europejskim Obszarem Gospodarczym,
          w szczególności w Stanach Zjednoczonych. W takim przypadku Administrator korzysta z mechanizmów przewidzianych w
          rozdziale V RODO odpowiednich dla danego transferu. Może to obejmować decyzję Komisji Europejskiej stwierdzającą
          odpowiedni stopień ochrony — w tym EU-U.S. Data Privacy Framework, gdy dany odbiorca jest objęty ważną
          certyfikacją — albo odpowiednie zabezpieczenia, takie jak standardowe klauzule umowne Komisji Europejskiej.
        </p>
        <p>
          Informację o mechanizmie mającym zastosowanie do konkretnego odbiorcy oraz, gdy przepisy tego wymagają, możliwość
          uzyskania kopii odpowiednich zabezpieczeń można uzyskać, kontaktując się z Administratorem. Zakres i miejsce
          przetwarzania mogą ulegać zmianie wraz ze zmianą infrastruktury lub podwykonawców dostawców.
        </p>
      </LegalSection>

      <LegalSection title="10. Okres przechowywania danych">
        <p>Dane konta i profilu są co do zasady przetwarzane przez czas istnienia konta.</p>
        <p>
          Dane dotyczące projektów, Crew, Build Pool, Showcase, Build Challenges, wiadomości, relacji i aktywności są
          przechowywane przez okres potrzebny do świadczenia funkcji, z których użytkownik korzysta, lub do czasu ich usunięcia
          zgodnie z funkcjami Serwisu.
        </p>
        <p>
          Powiadomienia i informacje o ich odczytaniu mogą być przechowywane przez okres potrzebny do zapewnienia historii
          powiadomień i prawidłowego działania funkcji. Dane o preferencjach powiadomień są przechowywane do czasu zmiany
          preferencji, usunięcia konta lub utraty potrzeby ich przetwarzania.
        </p>
        <p>
          Dane dotyczące zgłoszeń, bezpieczeństwa i roszczeń mogą być przechowywane dłużej, jeżeli jest to konieczne do
          rozpatrzenia sprawy, przeciwdziałania nadużyciom, wykonania obowiązku prawnego albo ustalenia, dochodzenia lub obrony
          przed roszczeniami. Dane dotyczące roszczeń mogą być przechowywane do czasu upływu właściwego okresu przedawnienia.
        </p>
        <p>
          Techniczne kopie zapasowe mogą zawierać usunięte informacje jeszcze przez ograniczony okres wynikający z cyklu
          tworzenia i zastępowania kopii, pod warunkiem ich odpowiedniego zabezpieczenia.
        </p>
      </LegalSection>

      <LegalSection title="11. Usunięcie konta">
        <p>
          Użytkownik może usunąć swoje konto za pomocą funkcji dostępnej w ustawieniach BuildCrew. Usunięcie konta prowadzi
          do usunięcia lub anonimizacji danych w zakresie, w jakim nie istnieje dalsza podstawa do ich przetwarzania.
        </p>
        <p>
          Usunięcie konta nie oznacza konieczności natychmiastowego usunięcia każdej informacji z kopii bezpieczeństwa,
          jeżeli jej oddzielne usunięcie nie jest technicznie możliwe lub wymagałoby niewspółmiernych działań, pod warunkiem
          że kopie pozostają odpowiednio zabezpieczone i są usuwane zgodnie ze standardowym cyklem retencji.
        </p>
      </LegalSection>

      <LegalSection title="12. Prawa użytkownika">
        <p>W przypadkach przewidzianych przez RODO użytkownik może żądać:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>dostępu do swoich danych i otrzymania ich kopii;</li>
          <li>sprostowania nieprawidłowych danych;</li>
          <li>usunięcia danych;</li>
          <li>ograniczenia przetwarzania;</li>
          <li>przeniesienia danych;</li>
          <li>wniesienia sprzeciwu wobec przetwarzania opartego na prawnie uzasadnionym interesie;</li>
          <li>wycofania zgody, jeżeli określone przetwarzanie odbywa się na jej podstawie.</li>
        </ul>
        <p>
          Żądanie można przesłać na adres {" "}
          <a className="text-lime-600 hover:underline dark:text-lime-400" href={`mailto:${operator.email}`}>
            {operator.email}
          </a>
          . Administrator może poprosić o informacje konieczne do potwierdzenia tożsamości osoby składającej żądanie, jeżeli
          istnieją uzasadnione wątpliwości co do jej tożsamości.
        </p>
      </LegalSection>

      <LegalSection title="13. Prawo wniesienia skargi">
        <p>
          Osoba, która uważa, że jej dane są przetwarzane niezgodnie z przepisami, ma prawo wnieść skargę do właściwego organu
          nadzorczego. W Polsce organem nadzorczym jest <strong>Prezes Urzędu Ochrony Danych Osobowych</strong>.
        </p>
      </LegalSection>

      <LegalSection title="14. Dopasowanie, rankingi i zautomatyzowane przetwarzanie">
        <p>
          BuildCrew może wykorzystywać informacje profilowe, takie jak rola, zainteresowania, dostępność, cele lub poziom
          doświadczenia, do obliczania orientacyjnego dopasowania pomiędzy użytkownikami albo proponowania potencjalnych ekip.
          BuildCrew może również porządkować treści Showcase na podstawie aktywności, reakcji, czasu publikacji i innych
          kryteriów związanych z funkcją rankingu.
        </p>
        <p>
          Mechanizmy te służą do sortowania i rekomendowania treści lub osób. Nie podejmują wobec użytkownika decyzji
          wywołujących skutki prawne albo w podobny sposób istotnie na niego wpływających wyłącznie na podstawie
          zautomatyzowanego przetwarzania. Ostateczna decyzja o nawiązaniu współpracy, zaakceptowaniu zgłoszenia lub utworzeniu
          Crew należy do użytkowników.
        </p>
      </LegalSection>

      <LegalSection title="15. Powiadomienia i wiadomości e-mail">
        <p>
          BuildCrew może wysyłać wiadomości e-mail związane z bezpieczeństwem i obsługą konta oraz — zgodnie z preferencjami
          użytkownika — wybranymi zdarzeniami społecznościowymi, takimi jak wiadomość od innego użytkownika, zgłoszenie lub zaproszenie do projektu, odpowiedź w Build Pool,
          zaproszenie do Crew, mocne dopasowanie profilu lub projektu, tygodniowe podsumowanie, zdarzenie Build Challenge albo feedback w Showcase.
        </p>
        <p>
          Użytkownik może zarządzać częścią preferencji e-mailowych w Serwisie, jeżeli dana opcja jest dostępna. Wiadomości
          niezbędne do bezpieczeństwa konta lub wykonania żądanej czynności mogą być wysyłane niezależnie od preferencji
          dotyczących opcjonalnych powiadomień.
        </p>
        <p>
          BuildCrew nie wysyła na podstawie samych ustawień transakcyjnych reklamowych wiadomości e-mail. Jeżeli w przyszłości
          zostanie wprowadzona komunikacja marketingowa wymagająca zgody lub innej odrębnej podstawy, zostanie ona wdrożona
          osobno.
        </p>
      </LegalSection>

      <LegalSection title="16. Pliki cookies i podobne technologie">
        <p>BuildCrew może wykorzystywać cookies, pamięć lokalną przeglądarki lub podobne mechanizmy, jeżeli są potrzebne do:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>utrzymania sesji użytkownika i logowania;</li>
          <li>zabezpieczenia procesu uwierzytelniania;</li>
          <li>zapamiętania technicznych ustawień interfejsu, np. motywu;</li>
          <li>prawidłowego działania funkcji Serwisu.</li>
        </ul>
        <p>
          BuildCrew korzysta z Google Analytics 4 wyłącznie po wyrażeniu zgody na analitykę. Narzędzie pomaga mierzyć m.in.
          odsłony, sposób korzystania z funkcji oraz podstawowe zdarzenia produktowe. BuildCrew nie włącza w tej integracji
          personalizacji reklamowej ani Google Signals. Zgoda na analitykę jest opcjonalna i może zostać zmieniona przez
          przycisk „Cookies” dostępny w stopce Serwisu.
        </p>
        <p>
          Do obsługi wyboru użytkownika BuildCrew stosuje Google Consent Mode. Przed wyrażeniem zgody pamięć analityczna
          jest ustawiona jako niedozwolona, a skrypt Google Analytics nie jest ładowany. Ustawienia dotyczące reklam, danych
          reklamowych i personalizacji pozostają wyłączone. Wybór zgody jest zapamiętywany lokalnie w przeglądarce.
        </p>
      </LegalSection>

      <LegalSection title="17. Discord i linki do innych serwisów">
        <p>
          BuildCrew umożliwia użytkownikom publikowanie linków między innymi do GitHub, Discord, portfolio i działających
          wersji projektów oraz może zawierać link do oficjalnego serwera społeczności BuildCrew na Discordzie. Po kliknięciu
          takiego linku użytkownik przechodzi do zewnętrznego serwisu, który działa na własnych zasadach i może być odrębnym
          administratorem danych w zakresie swojej usługi.
        </p>
        <p>
          Samo wejście na serwer Discord przez link z BuildCrew nie powoduje przekazania BuildCrew hasła ani prywatnej
          historii konta Discord. BuildCrew może natomiast przechowywać identyfikator lub nazwę Discord, jeżeli użytkownik
          dobrowolnie poda ją w profilu. Jeżeli na Discordzie organizowane są wydarzenia społecznościowe, szczegóły zasad
          udziału są publikowane osobno. Jeżeli wydarzenie będzie wymagało zebrania dodatkowych danych przez Operatora,
          uczestnik zostanie poinformowany o zakresie i celu ich przetwarzania przed ich zebraniem.
        </p>
      </LegalSection>

      <LegalSection title="18. Treści demonstracyjne">
        <p>
          BuildCrew może zawierać wyraźnie oznaczone treści demonstracyjne, w tym przykładowe profile, projekty Showcase,
          reakcje lub feedback. Dane demonstracyjne powinny być syntetyczne i nie reprezentować rzeczywistych osób ani ich
          aktywności, chyba że przy konkretnej treści wyraźnie wskazano inaczej i istnieje odpowiednia podstawa do jej
          publikacji.
        </p>
      </LegalSection>

      <LegalSection title="19. Bezpieczeństwo">
        <p>
          Administrator stosuje odpowiednie do charakteru Serwisu środki techniczne i organizacyjne mające na celu
          zabezpieczenie danych przed nieuprawnionym dostępem, utratą, zmianą lub ujawnieniem. Obejmują one m.in. zabezpieczenia
          po stronie serwera, mechanizmy sesji i uwierzytelniania, ograniczanie nadużyć oraz szyfrowane połączenia w środowisku
          produkcyjnym. Żaden system internetowy nie gwarantuje jednak całkowitego wyeliminowania ryzyka.
        </p>
        <p>Użytkownik powinien chronić dane logowania i nie przekazywać innym osobom haseł, kodów ani innych sekretów.</p>
      </LegalSection>

      <LegalSection title="20. Zmiany Polityki prywatności i kontakt">
        <p>
          Polityka prywatności może być aktualizowana w szczególności w przypadku zmiany funkcjonalności BuildCrew, sposobu
          przetwarzania danych, dostawców technologii, przepisów prawa lub konieczności doprecyzowania informacji przekazywanych
          użytkownikom. Aktualna wersja Polityki będzie publikowana w BuildCrew.
        </p>
        <p>
          Jeżeli zmiana istotnie wpływa na sposób przetwarzania danych użytkowników, Administrator przekaże odpowiednią
          informację w Serwisie lub pocztą elektroniczną, gdy będzie to wymagane lub uzasadnione charakterem zmiany.
        </p>
        <p>
          W sprawach związanych z prywatnością można kontaktować się z Administratorem pod adresem {" "}
          <a className="text-lime-600 hover:underline dark:text-lime-400" href={`mailto:${operator.email}`}>
            {operator.email}
          </a>
          . Zasady korzystania z Serwisu opisuje {" "}
          <Link href="/regulamin" className="text-lime-600 hover:underline dark:text-lime-400">
            Regulamin BuildCrew
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
