import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Regulamin — BuildCrew",
  description: "Regulamin korzystania z platformy BuildCrew.",
};

const EFFECTIVE_DATE = "12 sierpnia 2026 r.";

function getOperator() {
  return {
    name: process.env.LEGAL_OPERATOR_NAME?.trim() || "Łukasz Szczepański",
    address: process.env.LEGAL_OPERATOR_ADDRESS?.trim() || "ul. Hetmańska 16, Rzeszów",
    email: process.env.PUBLIC_CONTACT_EMAIL?.trim() || "slangtest.contact@gmail.com",
  };
}

export default function TermsPage() {
  const operator = getOperator();

  return (
    <LegalPage
      title="Regulamin BuildCrew"
      subtitle={`Wersja z dnia ${EFFECTIVE_DATE}. Regulamin określa zasady korzystania z platformy BuildCrew.`}
    >
      <LegalSection title="1. Informacje podstawowe">
        <p>
          Niniejszy Regulamin określa zasady korzystania z platformy internetowej <strong>BuildCrew</strong>, dalej
          „BuildCrew” lub „Serwis”.
        </p>
        <p>
          Operatorem i usługodawcą BuildCrew jest <strong>{operator.name}</strong>, adres: <strong>{operator.address}</strong>.
          Kontakt z Operatorem: {" "}
          <a className="text-lime-600 hover:underline dark:text-lime-400" href={`mailto:${operator.email}`}>
            {operator.email}
          </a>
          .
        </p>
        <p>Operator jest osobą fizyczną nieprowadzącą działalności gospodarczej.</p>
        <p>
          Elektronicznym punktem kontaktowym w sprawach dotyczących działania Serwisu, zgłoszeń treści oraz kontaktu z
          właściwymi organami — w zakresie, w jakim obowiązek taki wynika z przepisów, w tym z Aktu o usługach cyfrowych
          (DSA) — jest adres {" "}
          <a className="text-lime-600 hover:underline dark:text-lime-400" href={`mailto:${operator.email}`}>
            {operator.email}
          </a>
          . Punkt kontaktowy obsługuje komunikację w języku polskim i angielskim.
        </p>
        <p>
          Korzystanie z BuildCrew jest obecnie bezpłatne. BuildCrew nie oferuje obecnie płatnych kont, subskrypcji ani
          pośrednictwa w płatnościach pomiędzy użytkownikami.
        </p>
        <p>
          Regulamin jest udostępniany nieodpłatnie przed zawarciem umowy w sposób umożliwiający jego zapisanie i
          odtworzenie. Założenie konta i zaakceptowanie Regulaminu oznacza zawarcie z Operatorem umowy o świadczenie usług
          drogą elektroniczną na zasadach określonych w Regulaminie.
        </p>
        <p>
          W sprawach nieuregulowanych Regulaminem stosuje się odpowiednie przepisy prawa polskiego oraz bezpośrednio
          obowiązujące przepisy prawa Unii Europejskiej.
        </p>
      </LegalSection>

      <LegalSection title="2. Charakter i funkcje BuildCrew">
        <p>
          BuildCrew jest platformą społecznościową służącą przede wszystkim do poznawania osób zainteresowanych wspólnym
          tworzeniem stron internetowych, aplikacji, oprogramowania i innych produktów cyfrowych. Serwis nie jest serwisem
          pracy ani marketplace&apos;em freelancerów, a jego podstawowym celem jest ułatwianie współtworzenia projektów.
        </p>
        <p>BuildCrew może umożliwiać w szczególności:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>utworzenie i prowadzenie profilu użytkownika;</li>
          <li>publikowanie, wyszukiwanie i rozwijanie projektów;</li>
          <li>udostępnianie wybranych projektów przez publiczne linki dostępne także bez logowania oraz generowanie kart podglądu do udostępniania;</li>
          <li>zgłaszanie się do ról w projektach oraz zapraszanie innych użytkowników;</li>
          <li>publikowanie aktywnego zgłoszenia w Build Pool i odpowiadanie na takie zgłoszenia;</li>
          <li>tworzenie ekip (Crew) i zarządzanie członkostwem w ekipie;</li>
          <li>dodawanie znajomych oraz prowadzenie prywatnych rozmów 1:1 w zakresie udostępnionym przez Serwis;</li>
          <li>zadawanie pytań i udzielanie odpowiedzi;</li>
          <li>publikowanie informacji o umiejętnościach, doświadczeniu, zainteresowaniach i dostępności;</li>
          <li>publikowanie projektów w Showcase, reakcji i konstruktywnego feedbacku;</li>
          <li>udział w Build Challenges, w tym zgłaszanie się z ekipą albo korzystanie z mechanizmu dopasowania uczestników;</li>
          <li>otrzymywanie powiadomień w Serwisie i wybranych wiadomości e-mail związanych z aktywnością konta;</li>
          <li>udostępnianie linków do zewnętrznych serwisów, np. GitHub, Discord lub portfolio.</li>
        </ul>
        <p>
          Operator może rozwijać, zmieniać lub usuwać poszczególne funkcje BuildCrew, jeżeli jest to uzasadnione rozwojem
          Serwisu, bezpieczeństwem, wymaganiami technicznymi lub zmianą prawa.
        </p>
        <p>
          BuildCrew nie jest pracodawcą, agencją zatrudnienia, pośrednikiem pracy, pośrednikiem płatności ani stroną umów
          zawieranych pomiędzy użytkownikami. Operator nie gwarantuje, że użytkownik znajdzie projekt, ekipę, współtwórcę
          lub inną osobę spełniającą jego oczekiwania.
        </p>
      </LegalSection>

      <LegalSection title="3. Konto użytkownika">
        <p>Do korzystania z funkcji społecznościowych BuildCrew wymagane jest utworzenie konta.</p>
        <p>
          Rejestracja może odbywać się przy użyciu adresu e-mail i hasła albo za pomocą konta Google, jeżeli ta metoda
          logowania jest aktualnie dostępna. Przy zakładaniu konta użytkownik jest zobowiązany zaakceptować Regulamin.
        </p>
        <p>
          Dane przedstawiane jako informacje dotyczące użytkownika powinny być zgodne z prawdą. Zabronione jest
          podszywanie się pod inną osobę, tworzenie kont w celu oszustwa, obchodzenia blokady lub przejmowanie kont innych
          osób bez ich zgody.
        </p>
        <p>
          Użytkownik odpowiada za zabezpieczenie swojego konta, hasła i urządzeń służących do logowania oraz powinien
          niezwłocznie poinformować Operatora, jeżeli podejrzewa przejęcie konta przez osobę nieuprawnioną.
        </p>
        <p>
          Osoba, która nie posiada pełnej zdolności do czynności prawnych, może korzystać z BuildCrew wyłącznie w zakresie,
          w jakim pozwalają na to obowiązujące przepisy, a jeżeli jest to wymagane — za zgodą przedstawiciela ustawowego.
        </p>
      </LegalSection>

      <LegalSection title="4. Wymagania techniczne i ryzyka internetowe">
        <p>Do prawidłowego korzystania z BuildCrew potrzebne są co najmniej:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>urządzenie z dostępem do Internetu;</li>
          <li>aktualna przeglądarka internetowa z obsługą JavaScript;</li>
          <li>możliwość korzystania z niezbędnych cookies i mechanizmów pamięci przeglądarki;</li>
          <li>aktywny adres e-mail w przypadku funkcji wymagających komunikacji e-mailowej.</li>
        </ul>
        <p>
          Korzystanie ze starszych lub niewspieranych wersji przeglądarek może powodować nieprawidłowe działanie części
          funkcji. Korzystanie z usług elektronicznych wiąże się z typowymi zagrożeniami internetowymi, takimi jak phishing,
          złośliwe oprogramowanie, próby przejęcia kont, wykorzystanie błędów oprogramowania lub wyłudzenia danych.
        </p>
      </LegalSection>

      <LegalSection title="5. Zasady korzystania z BuildCrew">
        <p>
          Użytkownik zobowiązuje się korzystać z BuildCrew zgodnie z prawem, Regulaminem, dobrymi obyczajami oraz
          przeznaczeniem Serwisu. Zabronione jest w szczególności:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>publikowanie treści bezprawnych, oszukańczych lub świadomie wprowadzających w błąd;</li>
          <li>naruszanie praw autorskich, dóbr osobistych, prywatności lub innych praw osób trzecich;</li>
          <li>grożenie, nękanie, uporczywe obrażanie, dyskryminowanie lub spamowanie innych osób;</li>
          <li>masowe wysyłanie niechcianych wiadomości, zaproszeń, zgłoszeń lub propozycji;</li>
          <li>wyłudzanie pieniędzy, haseł, kodów uwierzytelniających, dokumentów, kluczy API lub innych poufnych informacji;</li>
          <li>rozpowszechnianie złośliwego oprogramowania lub organizowanie nieuprawnionych ataków na systemy informatyczne;</li>
          <li>podejmowanie prób uzyskania nieuprawnionego dostępu do kont, danych lub infrastruktury;</li>
          <li>obchodzenie zabezpieczeń, limitów, blokad lub mechanizmów moderacji;</li>
          <li>automatyczne pozyskiwanie danych z BuildCrew bez zgody Operatora, jeżeli zakaz takiego działania jest zgodny z prawem;</li>
          <li>publikowanie danych osobowych innych osób bez odpowiedniej podstawy prawnej;</li>
          <li>wykorzystywanie Serwisu w sposób mogący zakłócić jego działanie lub bezpieczeństwo.</li>
        </ul>
        <p>Użytkownik odpowiada za treści i informacje, które publikuje lub przesyła za pomocą swojego konta.</p>
      </LegalSection>

      <LegalSection title="6. Treści użytkowników i prawa własności intelektualnej">
        <p>Użytkownik zachowuje prawa do treści, których jest autorem.</p>
        <p>
          Publikując treść w BuildCrew, użytkownik udziela Operatorowi niewyłącznego i nieodpłatnego uprawnienia do
          korzystania z niej wyłącznie w zakresie koniecznym do zapisania jej w systemach BuildCrew, wykonania kopii
          technicznych, technicznego przetwarzania, wyświetlania jej właściwym odbiorcom, zapewnienia działania funkcji
          Serwisu, moderowania oraz zabezpieczania Serwisu.
        </p>
        <p>
          Uprawnienie obowiązuje przez okres przechowywania treści w BuildCrew, z zastrzeżeniem technicznych kopii
          zapasowych oraz przypadków, w których dalsze przechowywanie jest wymagane lub dozwolone przez prawo.
        </p>
        <p>
          Użytkownik powinien publikować wyłącznie materiały, do których posiada wymagane prawa lub odpowiednie
          zezwolenie. Dotyczy to również screenshotów, grafik, logo, fragmentów interfejsu i materiałów publikowanych w
          Showcase.
        </p>
        <p>
          Samo opublikowanie opisu pomysłu, projektu lub koncepcji w BuildCrew nie powoduje przeniesienia praw do tego
          pomysłu, projektu lub koncepcji na Operatora ani innych użytkowników. Operator nie nabywa praw do kodu źródłowego,
          projektu ani rezultatów współpracy wyłącznie z powodu poznania się użytkowników za pośrednictwem BuildCrew.
        </p>
      </LegalSection>

      <LegalSection title="7. Projekty, Build Pool i współpraca">
        <p>
          BuildCrew ułatwia nawiązywanie kontaktów pomiędzy użytkownikami, lecz Operator nie jest stroną współpracy
          podejmowanej między nimi i nie weryfikuje automatycznie tożsamości, kwalifikacji, kompetencji, wypłacalności ani
          prawdziwości wszystkich informacji podawanych przez użytkowników.
        </p>
        <p>
          Przed przekazaniem innemu użytkownikowi kodu źródłowego, kluczy API, haseł, danych dostępowych, pieniędzy,
          dokumentów lub informacji poufnych użytkownik powinien samodzielnie ocenić ryzyko i odpowiednio zabezpieczyć
          współpracę.
        </p>
        <p>
          Jeżeli współpraca pomiędzy użytkownikami ma charakter odpłatny lub komercyjny, użytkownicy samodzielnie odpowiadają
          za zawarcie odpowiednich umów, rozliczenia, podatki, prawa autorskie, poufność i inne obowiązki wynikające z ich
          relacji. BuildCrew nie pośredniczy w płatnościach pomiędzy użytkownikami.
        </p>
      </LegalSection>

      <LegalSection title="8. Showcase, reakcje i feedback">
        <p>
          Showcase służy do prezentowania gotowych, działających albo rozwijanych projektów. Projekt może być opublikowany
          przez pojedynczego użytkownika lub ekipę i może zawierać m.in. opis, screenshot, link do wersji działającej, link
          do repozytorium, informacje o twórcach, status projektu oraz informację o poszukiwaniu kolejnych współtwórców.
        </p>
        <p>
          Inni użytkownicy mogą korzystać z udostępnionych reakcji i formularzy feedbacku. Reakcje, liczby głosów, wyniki
          ankiet i rankingi mają charakter społecznościowy i orientacyjny. Nie stanowią profesjonalnej wyceny, rekomendacji
          inwestycyjnej, gwarancji jakości ani potwierdzenia prawdziwości informacji o projekcie.
        </p>
        <p>
          Użytkownik publikujący projekt odpowiada za prawdziwość informacji, które przedstawia jako fakty, oraz za prawo do
          używania zamieszczonych materiałów i linków. Zabronione jest sztuczne zawyżanie wyników, tworzenie kont do
          głosowania na własne treści lub organizowanie skoordynowanej manipulacji rankingiem.
        </p>
        <p>
          BuildCrew może prezentować przykładowe profile, projekty lub aktywności demonstracyjne. Takie materiały powinny być
          oznaczone jako <strong>Demo</strong> albo w inny jednoznaczny sposób i nie należy traktować ich jako informacji o
          rzeczywistych użytkownikach, projektach lub sukcesach społeczności.
        </p>
      </LegalSection>

      <LegalSection title="9. Build Challenges">
        <p>
          Build Challenges są wydarzeniami społecznościowymi, w których użytkownicy mogą tworzyć projekty w określonym
          czasie lub wokół określonego tematu. Użytkownik może zgłosić się z istniejącą ekipą albo, jeżeli funkcja jest
          dostępna, skorzystać z mechanizmu proponującego potencjalnych współtwórców.
        </p>
        <p>
          Informacja o dopasowaniu jest jedynie podpowiedzią opartą na danych dostępnych w profilach i nie gwarantuje
          zgodności charakterów, umiejętności, dostępności ani powodzenia współpracy. Każdy uczestnik samodzielnie decyduje,
          czy chce rozpocząć współpracę z proponowaną osobą.
        </p>
        <p>
          Dla konkretnego Challenge mogą zostać opublikowane dodatkowe zasady dotyczące m.in. czasu trwania, tematu i
          sposobu zgłoszenia projektu. Jeżeli dane wydarzenie ma charakter konkursu albo przewiduje nagrody, przed
          rozpoczęciem przyjmowania zgłoszeń zostaną udostępnione odrębne zasady określające co najmniej organizatora,
          warunki udziału, termin, sposób zgłoszenia, kryteria wyboru, zasady dotyczące nagrody oraz tryb reklamacyjny.
          Sam komunikat promujący wydarzenie w BuildCrew lub na Discordzie nie stanowi przyrzeczenia nagrody ani pełnego
          regulaminu konkursu.
        </p>
      </LegalSection>

      <LegalSection title="10. Prywatne wiadomości, kontakty i serwisy zewnętrzne">
        <p>
          BuildCrew może umożliwiać użytkownikom prowadzenie prywatnych rozmów. Użytkownik nie może wykorzystywać wiadomości
          do spamu, nękania, oszustw, wyłudzania danych ani innych działań zabronionych Regulaminem lub prawem.
        </p>
        <p>
          Użytkownicy mogą dobrowolnie publikować lub udostępniać linki do zewnętrznych profili i usług, w szczególności
          GitHub, Discord oraz portfolio. Po przejściu do zewnętrznego serwisu użytkownik korzysta z niego na zasadach
          określonych przez jego dostawcę. Link do oficjalnego serwera Discord BuildCrew prowadzi do usługi prowadzonej
          przez niezależnego dostawcę; zasady korzystania z Discorda i przetwarzania danych przez Discord określa ten
          dostawca. Operator nie odpowiada za działania użytkowników podejmowane poza BuildCrew.
        </p>
      </LegalSection>

      <LegalSection title="11. Powiadomienia i wiadomości e-mail">
        <p>
          BuildCrew może wysyłać powiadomienia w Serwisie oraz wiadomości e-mail związane z korzystaniem z konta, w
          szczególności o zgłoszeniu do projektu, odpowiedzi w Build Pool, zaproszeniu do Crew, zaakceptowaniu zgłoszenia,
          ważnym zdarzeniu w Build Challenge, bezpieczeństwie konta, weryfikacji adresu e-mail lub resecie hasła.
        </p>
        <p>
          Użytkownik może zarządzać częścią preferencji dotyczących powiadomień, jeżeli taka funkcja jest dostępna. Wyłączenie
          powiadomień opcjonalnych nie musi obejmować wiadomości niezbędnych do bezpieczeństwa konta, wykonania żądanej usługi
          albo przekazania informacji wymaganej prawem.
        </p>
        <p>
          BuildCrew nie traktuje powiadomień transakcyjnych dotyczących aktywności konta jako zgody na przesyłanie informacji
          marketingowych. Jeżeli w przyszłości Serwis wprowadzi komunikację promocyjną wymagającą odrębnej podstawy prawnej,
          zostanie ona wdrożona oddzielnie.
        </p>
      </LegalSection>

      <LegalSection title="12. Zgłaszanie treści nielegalnych i naruszeń">
        <p>
          Użytkownik lub inna osoba może zgłosić treść, konto lub zachowanie, które jego zdaniem narusza Regulamin, jest
          nielegalne albo narusza prawa zgłaszającego lub osoby trzeciej. Mechanizm ten pełni również funkcję zgłaszania
          potencjalnie nielegalnych treści w zakresie, w jakim odpowiednie obowiązki DSA mają zastosowanie do BuildCrew.
          Zgłoszenia można przekazywać przez funkcje dostępne w BuildCrew lub na adres {" "}
          <a className="text-lime-600 hover:underline dark:text-lime-400" href={`mailto:${operator.email}`}>
            {operator.email}
          </a>
          .
        </p>
        <p>Zgłoszenie dotyczące treści nielegalnej powinno w miarę możliwości zawierać:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>wystarczająco uzasadnione wyjaśnienie, dlaczego dana treść jest uznawana za nielegalną;</li>
          <li>dokładne wskazanie miejsca treści, np. link, identyfikator projektu, nazwa profilu albo inne dane pozwalające ją zlokalizować;</li>
          <li>imię i nazwisko lub nazwę oraz adres e-mail zgłaszającego, z wyjątkiem przypadków, w których prawo pozwala na zgłoszenie bez tych danych;</li>
          <li>oświadczenie o działaniu w dobrej wierze i przekonaniu, że informacje zawarte w zgłoszeniu są prawidłowe i kompletne.</li>
        </ul>
        <p>
          Operator rozpatruje zgłoszenia w sposób możliwie terminowy, obiektywny, niearbitralny i z należytą starannością.
          Jeżeli zgłaszający poda dane kontaktowe, Operator może potwierdzić otrzymanie zgłoszenia i przekazać informację o
          decyzji w zakresie wymaganym przez obowiązujące przepisy.
        </p>
      </LegalSection>

      <LegalSection title="13. Moderacja">
        <p>
          Moderacja BuildCrew jest obecnie wykonywana przez człowieka. Operator nie stosuje automatycznego systemu
          podejmującego ostateczne decyzje o trwałym blokowaniu użytkowników lub usuwaniu treści.
        </p>
        <p>W przypadku naruszenia Regulaminu, prawa lub praw innych osób Operator może odpowiednio:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>pozostawić treść bez zmian albo ograniczyć jej widoczność;</li>
          <li>usunąć treść;</li>
          <li>ostrzec użytkownika;</li>
          <li>czasowo ograniczyć określone funkcje konta;</li>
          <li>czasowo zawiesić albo trwale zablokować konto.</li>
        </ul>
        <p>
          Przy wyborze środka Operator może brać pod uwagę charakter naruszenia, jego skutki, powtarzalność i zagrożenie dla
          innych użytkowników lub bezpieczeństwa Serwisu. W sytuacji wymagającej szybkiego działania Operator może zastosować
          środek tymczasowy przed zakończeniem pełnej analizy.
        </p>
        <p>
          Jeżeli Operator ograniczy treść lub konto z powodu uznania treści za nielegalną albo niezgodną z Regulaminem,
          przekaże zainteresowanemu użytkownikowi — jeżeli jest to wymagane przez prawo i technicznie możliwe — informację o
          decyzji, jej zasadniczych powodach i dostępnych sposobach zakwestionowania decyzji.
        </p>
        <p>
          Użytkownik może zakwestionować decyzję moderacyjną, kontaktując się z Operatorem pod adresem {" "}
          <a className="text-lime-600 hover:underline dark:text-lime-400" href={`mailto:${operator.email}`}>
            {operator.email}
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="14. Usunięcie konta i rozwiązanie umowy">
        <p>Umowa o korzystanie z konta BuildCrew jest zawierana na czas nieoznaczony.</p>
        <p>
          Użytkownik może w dowolnym momencie zakończyć korzystanie z BuildCrew i rozwiązać umowę poprzez usunięcie konta za
          pomocą funkcji dostępnej w ustawieniach, o ile nie zachodzą wyjątkowe przeszkody prawne lub techniczne opisane w
          Polityce prywatności.
        </p>
        <p>
          Usunięcie konta powoduje usunięcie albo anonimizację danych powiązanych z kontem zgodnie z charakterem danej
          informacji, możliwościami technicznymi, obowiązkami prawnymi oraz zasadami określonymi w Polityce prywatności.
          Niektóre informacje mogą przez ograniczony czas pozostać w technicznych kopiach zapasowych.
        </p>
        <p>
          Operator może zakończyć świadczenie usług użytkownikowi w przypadku trwałej blokady konta dokonanej zgodnie z
          Regulaminem.
        </p>
      </LegalSection>

      <LegalSection title="15. Usługi zewnętrzne">
        <p>
          BuildCrew może korzystać z usług zewnętrznych dostawców niezbędnych do działania Serwisu, w szczególności dostawców
          hostingu, infrastruktury serwerowej, baz danych, poczty elektronicznej, zabezpieczeń oraz uwierzytelniania.
        </p>
        <p>
          Jeżeli użytkownik wybierze logowanie za pomocą Google, proces logowania korzysta również z usług Google. Zewnętrzne
          strony wskazywane przez użytkowników, takie jak GitHub, Discord lub portfolio, działają niezależnie od BuildCrew.
        </p>
      </LegalSection>

      <LegalSection title="16. Dostępność Serwisu i odpowiedzialność">
        <p>
          Operator dokłada racjonalnych starań, aby BuildCrew działał prawidłowo i bezpiecznie, ale nie gwarantuje
          nieprzerwanej dostępności Serwisu ani całkowitego braku błędów. BuildCrew może być czasowo niedostępny z powodu
          prac technicznych, aktualizacji, awarii, problemów po stronie dostawców zewnętrznych, zagrożeń bezpieczeństwa lub
          zdarzeń pozostających poza racjonalną kontrolą Operatora.
        </p>
        <p>
          Każdy użytkownik odpowiada za swoje działania, publikowane treści oraz ustalenia zawierane z innymi użytkownikami.
          Operator nie jest gwarantem powodzenia projektu ani prawidłowego wykonania zobowiązań pomiędzy użytkownikami.
        </p>
        <p>
          Postanowienia Regulaminu nie wyłączają ani nie ograniczają odpowiedzialności Operatora w przypadkach, w których takie
          wyłączenie lub ograniczenie byłoby niedopuszczalne na podstawie bezwzględnie obowiązujących przepisów.
        </p>
      </LegalSection>

      <LegalSection title="17. Reklamacje">
        <p>
          Reklamacje dotyczące działania BuildCrew można przesyłać na adres {" "}
          <a className="text-lime-600 hover:underline dark:text-lime-400" href={`mailto:${operator.email}`}>
            {operator.email}
          </a>
          .
        </p>
        <p>
          Reklamacja powinna zawierać informacje umożliwiające ustalenie, czego dotyczy, w szczególności adres e-mail konta,
          jeżeli reklamacja dotyczy konkretnego konta, opis problemu oraz — w miarę możliwości — informacje pozwalające
          odtworzyć problem. Użytkownik nie powinien przesyłać hasła, kodów jednorazowych, kluczy API ani innych sekretów
          uwierzytelniających.
        </p>
        <p>
          Operator rozpatrzy reklamację bez zbędnej zwłoki, nie później niż w terminie 14 dni od jej otrzymania. Odpowiedź
          zostanie przesłana na adres e-mail, z którego wysłano reklamację, chyba że użytkownik wskaże inny odpowiedni adres.
        </p>
      </LegalSection>

      <LegalSection title="18. Zmiany Regulaminu">
        <p>
          Operator może zmienić Regulamin z ważnej przyczyny, w szczególności w przypadku zmiany funkcjonalności BuildCrew,
          wprowadzenia lub usunięcia funkcji, konieczności zwiększenia bezpieczeństwa, przeciwdziałania nadużyciom, zmiany
          infrastruktury technicznej, zmiany prawa albo konieczności dostosowania Serwisu do decyzji lub orzeczenia właściwego
          organu.
        </p>
        <p>
          O istotnej zmianie Regulaminu dotyczącej zarejestrowanych użytkowników Operator poinformuje za pośrednictwem
          BuildCrew lub poczty elektronicznej przed wejściem zmiany w życie, jeżeli charakter zmiany lub obowiązujące przepisy
          tego wymagają. Jeżeli użytkownik nie chce korzystać z BuildCrew na nowych zasadach, może usunąć konto.
        </p>
      </LegalSection>

      <LegalSection title="19. Prawo właściwe i ochrona danych">
        <p>
          Do Regulaminu stosuje się prawo polskie. Wybór prawa polskiego nie pozbawia użytkownika ochrony przyznanej mu przez
          bezwzględnie obowiązujące przepisy prawa, które znajdują zastosowanie do jego sytuacji. Postanowienia Regulaminu nie
          ograniczają ustawowych praw użytkownika.
        </p>
        <p>
          Zasady przetwarzania danych osobowych i informacje dotyczące praw użytkownika znajdują się w {" "}
          <Link href="/polityka-prywatnosci" className="text-lime-600 hover:underline dark:text-lime-400">
            Polityce prywatności BuildCrew
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
