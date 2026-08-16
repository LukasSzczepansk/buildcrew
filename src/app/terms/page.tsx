import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Terms of Service - BuildCrew",
  description: "Terms governing the use of the BuildCrew platform.",
  alternates: { canonical: "/terms" },
};

const EFFECTIVE_DATE = "August 15, 2026";

function getOperator() {
  return {
    name: process.env.LEGAL_OPERATOR_NAME?.trim() || "Łukasz Szczepański",
    address: process.env.LEGAL_OPERATOR_ADDRESS?.trim() || "ul. Hetmańska 16, Rzeszów, Poland",
    email: process.env.PUBLIC_CONTACT_EMAIL?.trim() || "slangtest.contact@gmail.com",
  };
}

export default function TermsPage() {
  const operator = getOperator();
  return (
    <LegalPage title="BuildCrew Terms of Service" subtitle={`Effective ${EFFECTIVE_DATE}. These Terms govern your use of BuildCrew.`}>
      <LegalSection title="1. Operator and scope">
        <p>BuildCrew is an online platform operated by <strong>{operator.name}</strong>, address: <strong>{operator.address}</strong>. Contact: <a className="text-lime-600 hover:underline dark:text-lime-400" href={`mailto:${operator.email}`}>{operator.email}</a>.</p>
        <p>BuildCrew is currently free to use and does not currently offer paid subscriptions or payment intermediation between users.</p>
        <p>By creating an account and accepting these Terms, you enter into an agreement with the operator for electronic services provided through BuildCrew. Polish law and directly applicable European Union law apply where relevant.</p>
      </LegalSection>

      <LegalSection title="2. What BuildCrew is">
        <p>BuildCrew is a professional community for people who want to build digital projects together. It helps users discover people, projects and hackathons, form teams, communicate, document collaboration and share selected public project or profile information.</p>
        <p>BuildCrew is not an employer, recruitment agency, freelancer marketplace, payment intermediary, investment adviser or party to agreements made between users.</p>
      </LegalSection>

      <LegalSection title="3. Accounts">
        <p>Some features require an account. Registration may use email and password or an available third-party sign-in method such as Google.</p>
        <p>You must provide accurate information, protect access to your account and promptly report suspected unauthorized access. You may not create accounts for unlawful purposes, impersonate another person or bypass account restrictions.</p>
      </LegalSection>

      <LegalSection title="4. Acceptable use">
        <p>You agree to use BuildCrew lawfully and respectfully. In particular, you may not:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>publish illegal, fraudulent, abusive, threatening or deliberately misleading content;</li>
          <li>harass, spam, scam or exploit other users;</li>
          <li>request or distribute passwords, API secrets, malware or other harmful material;</li>
          <li>infringe intellectual-property, privacy or personality rights;</li>
          <li>circumvent security controls, rate limits, moderation or access restrictions;</li>
          <li>automatically scrape or extract BuildCrew data where such activity is prohibited by law or by these Terms.</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. User content and intellectual property">
        <p>You retain rights to content you publish. You grant BuildCrew a non-exclusive, royalty-free permission to store, process, reproduce and display that content only as necessary to provide, secure, back up and promote the relevant BuildCrew functionality.</p>
        <p>Publishing an idea or project does not transfer ownership of that idea, source code, design or future work to BuildCrew or to another user. Team members should agree separately on ownership, confidentiality, compensation and any commercial terms that matter to them.</p>
      </LegalSection>

      <LegalSection title="6. Projects, teams and collaboration">
        <p>BuildCrew can facilitate introductions, applications, invitations, team membership, private workspace features, project updates and collaboration history. Users are responsible for deciding whether to work together and on what terms.</p>
        <p>BuildCrew does not guarantee the identity, skills, availability, conduct, funding, delivery or commercial success of any user or project. Do not send money, credentials or sensitive secrets to people you have not independently verified.</p>
      </LegalSection>

      <LegalSection title="7. Public profiles, projects and sharing">
        <p>Selected profiles and projects may be publicly visible without login when a user enables or publishes those features. Public pages may be indexed by search engines or cached by external services. Shared preview cards may remain cached for a period after content changes.</p>
      </LegalSection>

      <LegalSection title="8. Hackathons, challenges and external events">
        <p>BuildCrew may list external hackathons and help users find teams. Unless explicitly stated otherwise, BuildCrew is not the organizer or official partner of an external event. Official registration, fees, rules, prizes, eligibility and event decisions are governed by the organizer.</p>
      </LegalSection>

      <LegalSection title="9. Messages, notifications and third-party services">
        <p>BuildCrew may provide private messaging and may send transactional emails about account security, applications, invitations, messages, project activity, matching or other account-related events. Email preferences may be available for selected categories.</p>
        <p>Links to GitHub, Discord, portfolio sites or other third-party services are governed by those providers. BuildCrew is not responsible for activity that takes place outside the platform.</p>
      </LegalSection>

      <LegalSection title="10. Moderation and reports">
        <p>BuildCrew may remove or restrict content, suspend accounts, limit features or take other proportionate measures when required by law, these Terms, security considerations or the protection of other users. Reports may be submitted through available reporting tools or to <a className="text-lime-600 hover:underline dark:text-lime-400" href={`mailto:${operator.email}`}>{operator.email}</a>.</p>
      </LegalSection>

      <LegalSection title="11. Availability and changes">
        <p>BuildCrew may evolve, add, modify or discontinue features. The operator does not guarantee uninterrupted availability and may perform maintenance or temporarily restrict access for security or technical reasons.</p>
      </LegalSection>

      <LegalSection title="12. Liability">
        <p>To the extent permitted by applicable law, the operator is not responsible for agreements, payments, disputes, losses or project outcomes arising solely from relationships between users or from third-party services. Nothing in these Terms excludes liability that cannot legally be excluded.</p>
      </LegalSection>

      <LegalSection title="13. Account termination">
        <p>You may delete your account using the available account settings. BuildCrew may suspend or terminate an account where required by law or where serious or repeated violations occur. Some records may be retained where legally necessary or required for security, claims or integrity of collaboration history, as explained in the Privacy Policy.</p>
      </LegalSection>

      <LegalSection title="14. Changes to these Terms">
        <p>These Terms may be updated when the product, legal requirements or service model changes. The current version will be published on BuildCrew. Material changes may be communicated through the platform or by email where appropriate.</p>
        <p>For information about personal data, see the <Link href="/privacy" className="text-lime-600 hover:underline dark:text-lime-400">Privacy Policy</Link>.</p>
      </LegalSection>
    </LegalPage>
  );
}
