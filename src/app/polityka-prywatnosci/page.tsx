import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal/legal-page";
import { getLegalConfig, LEGAL_EFFECTIVE_DATE } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Polityka prywatności — BuildCrew",
  description: "Informacje o przetwarzaniu danych osobowych w BuildCrew.",
};

export default function PrivacyPage() {
  const legal = getLegalConfig();

  return (
    <LegalPage
      title="Polityka prywatności BuildCrew"
      subtitle={`Obowiązuje od ${LEGAL_EFFECTIVE_DATE}. Dokument opisuje, jakie dane są przetwarzane podczas korzystania z BuildCrew i w jakich celach.`}
    >
      <LegalSection title="1. Administrator danych">
        <p>
          Administratorem danych osobowych związanych z korzystaniem z BuildCrew jest <strong>{legal.operatorName}</strong>
          {legal.operatorAddress ? <> z adresem: <strong>{legal.operatorAddress}</strong></> : null}. W sprawach dotyczących prywatności
          można skontaktować się pod adresem{" "}
          <a className="text-violet-600 hover:underline dark:text-violet-400" href={`mailto:${legal.contactEmail}`}>{legal.contactEmail}</a>.
        </p>
      </LegalSection>

      <LegalSection title="2. Jakie dane przetwarzamy">
        <p>W zależności od sposobu korzystania z BuildCrew możemy przetwarzać następujące kategorie danych:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>dane konta, w tym adres e-mail, informacje o weryfikacji oraz dane związane z metodą logowania;</li>
          <li>dane profilu, takie jak nazwa użytkownika, rola, poziom doświadczenia, bio, umiejętności, zainteresowania i linki podane przez użytkownika;</li>
          <li>prywatne dane kontaktowe podane w profilu, które są ujawniane wyłącznie w przewidzianych przez serwis relacjach;</li>
          <li>treści i aktywność w serwisie, m.in. projekty, zgłoszenia Build Pool, zaproszenia, relacje znajomych, ekipy, prywatne wiadomości 1:1, pytania, odpowiedzi, zgłoszenia moderacyjne i powiązane metadane;</li>
          <li>dane techniczne i bezpieczeństwa, takie jak identyfikatory sesji, adres IP, informacje o przeglądarce, zdarzenia bezpieczeństwa i dane potrzebne do limitowania nadużyć;</li>
          <li>jeżeli używane jest logowanie Google — identyfikator konta Google oraz zweryfikowany adres e-mail otrzymany w ramach autoryzacji.</li>
        </ul>
        <p>BuildCrew nie potrzebuje hasła do konta Google i nie otrzymuje go od Google.</p>
      </LegalSection>

      <LegalSection title="3. Cele i podstawy przetwarzania">
        <ul className="list-disc space-y-2 pl-5">
          <li><strong>Świadczenie usługi i obsługa konta</strong> — w celu wykonania umowy o korzystanie z BuildCrew.</li>
          <li><strong>Uwierzytelnianie, bezpieczeństwo i przeciwdziałanie nadużyciom</strong> — w celu wykonania umowy oraz realizacji prawnie uzasadnionego interesu polegającego na ochronie użytkowników i infrastruktury.</li>
          <li><strong>Moderacja, obsługa zgłoszeń i dochodzenie roszczeń</strong> — na podstawie prawnie uzasadnionego interesu oraz, gdy ma to zastosowanie, obowiązków prawnych.</li>
          <li><strong>Wiadomości transakcyjne</strong>, np. weryfikacja e-maila, reset hasła i kod administratora — w celu obsługi i zabezpieczenia konta.</li>
          <li><strong>Realizacja obowiązków prawnych</strong> — gdy przechowanie lub ujawnienie określonych danych jest wymagane przez przepisy.</li>
        </ul>
        <p>Jeżeli w przyszłości konkretna funkcja będzie wymagała zgody, zgoda będzie zbierana osobno i będzie można ją wycofać na zasadach wskazanych przy tej funkcji.</p>
      </LegalSection>

      <LegalSection title="4. Logowanie Google">
        <p>
          Użytkownik może dobrowolnie wybrać logowanie Google, jeżeli ta opcja jest aktywna. BuildCrew wykorzystuje wtedy mechanizm
          OAuth/OpenID Connect do potwierdzenia tożsamości. Z Google pobierany jest minimalny zestaw informacji potrzebny do logowania,
          w szczególności unikalny identyfikator konta oraz zweryfikowany adres e-mail. BuildCrew nie przechowuje tokenu dostępowego
          Google dłużej niż jest to potrzebne do zakończenia procesu logowania i nie wykorzystuje go do dostępu do Dysku, Gmaila,
          Kalendarza ani innych danych użytkownika.
        </p>
      </LegalSection>

      <LegalSection title="5. Odbiorcy danych i dostawcy techniczni">
        <p>
          Dane mogą być przetwarzane przez podmioty zapewniające hosting aplikacji, bazę danych, dostarczanie wiadomości e-mail,
          uwierzytelnianie, bezpieczeństwo i utrzymanie infrastruktury. Otrzymują one dane wyłącznie w zakresie koniecznym do świadczenia
          swoich usług i na podstawie właściwych warunków umownych lub przepisów prawa.
        </p>
        <p>
          Część dostawców może prowadzić działalność poza Europejskim Obszarem Gospodarczym. Jeżeli dochodzi do transferu danych poza
          EOG, administrator stosuje mechanizmy wymagane przez prawo, takie jak decyzja stwierdzająca odpowiedni stopień ochrony lub
          standardowe klauzule umowne, gdy są wymagane.
        </p>
      </LegalSection>

      <LegalSection title="6. Publiczność profilu, znajomi i prywatna komunikacja">
        <p>
          Dane profilu i treści oznaczone jako publiczne mogą być widoczne dla innych użytkowników zgodnie z funkcjami platformy.
          Prywatne dane kontaktowe, takie jak nazwa użytkownika Discord, nie powinny być ujawniane publicznie i są udostępniane wyłącznie
          po spełnieniu warunków relacji przewidzianych w BuildCrew.
        </p>
        <p>
          Prywatne wiadomości 1:1 są przeznaczone dla uczestników danej rozmowy i są przechowywane w bazie danych w celu dostarczenia
          wiadomości, pokazania historii rozmowy i statusu odczytu. Usunięcie relacji znajomych albo zablokowanie użytkownika może również
          spowodować usunięcie powiązanej rozmowy zgodnie z działaniem serwisu.
        </p>
      </LegalSection>

      <LegalSection title="7. Okres przechowywania">
        <p>
          Dane konta i profilu są co do zasady przechowywane przez okres korzystania z BuildCrew. Po usunięciu konta dane są usuwane lub
          anonimizowane w zakresie przewidzianym przez funkcje serwisu, chyba że dalsze przechowanie określonych informacji jest konieczne
          do wykonania obowiązku prawnego, zabezpieczenia roszczeń, przeciwdziałania nadużyciom lub utrzymania integralności kopii technicznych.
        </p>
        <p>
          Tokeny weryfikacyjne i resetujące mają ograniczony okres ważności. Sesje również wygasają. Techniczne kopie zapasowe mogą być
          przechowywane przez ograniczony czas zgodnie z cyklem retencji dostawcy infrastruktury.
        </p>
      </LegalSection>

      <LegalSection title="8. Pliki cookies i pamięć przeglądarki">
        <p>
          BuildCrew używa mechanizmów niezbędnych do działania serwisu, w szczególności bezpiecznych cookies sesyjnych, cookies związanych
          z logowaniem i zabezpieczeniami oraz lokalnej pamięci przeglądarki do zapamiętania ustawień interfejsu, np. motywu. Mechanizmy te
          służą do logowania, bezpieczeństwa i działania funkcji, a nie do tworzenia reklamowego profilu użytkownika.
        </p>
      </LegalSection>

      <LegalSection title="9. Prawa osoby, której dane dotyczą">
        <p>
          W granicach przewidzianych przez RODO użytkownik może żądać dostępu do danych, ich sprostowania, usunięcia, ograniczenia
          przetwarzania, przeniesienia danych, a także wnieść sprzeciw wobec przetwarzania opartego na prawnie uzasadnionym interesie.
          Jeżeli podstawą przetwarzania jest zgoda, można ją wycofać bez wpływu na zgodność z prawem wcześniejszego przetwarzania.
        </p>
        <p>
          Żądania można kierować na{" "}
          <a className="text-violet-600 hover:underline dark:text-violet-400" href={`mailto:${legal.contactEmail}`}>{legal.contactEmail}</a>.
          Użytkownik ma również prawo wnieść skargę do Prezesa Urzędu Ochrony Danych Osobowych, jeżeli uważa, że jego dane są przetwarzane niezgodnie z prawem.
        </p>
      </LegalSection>

      <LegalSection title="10. Bezpieczeństwo">
        <p>
          BuildCrew stosuje środki techniczne i organizacyjne adekwatne do charakteru usługi, w tym haszowanie haseł i tokenów,
          ograniczanie liczby prób, kontrolę dostępu po stronie serwera, bezpieczne cookies, szyfrowane połączenia w środowisku
          produkcyjnym oraz mechanizmy ograniczające nadużycia. Żaden system internetowy nie daje jednak absolutnej gwarancji bezpieczeństwa.
        </p>
      </LegalSection>

      <LegalSection title="11. Zautomatyzowane decyzje">
        <p>
          BuildCrew nie podejmuje wobec użytkowników decyzji wywołujących skutki prawne wyłącznie w oparciu o zautomatyzowane
          przetwarzanie. Mechanizmy dopasowania i filtrowania mogą porządkować treści na podstawie informacji profilowych, ale nie
          zastępują decyzji użytkowników o rozpoczęciu współpracy.
        </p>
      </LegalSection>

      <LegalSection title="12. Zmiany Polityki prywatności">
        <p>
          Polityka może zostać zaktualizowana, jeżeli zmienią się funkcje BuildCrew, sposób przetwarzania danych, dostawcy techniczni lub
          wymagania prawne. W przypadku istotnych zmian operator przekaże odpowiednią informację w serwisie lub pocztą elektroniczną,
          jeżeli będzie to wymagane.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
