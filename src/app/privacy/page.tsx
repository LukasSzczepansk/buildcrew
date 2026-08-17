import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy - BuildCrew",
  description: "How BuildCrew processes personal data.",
  alternates: { canonical: "/privacy" },
};

const EFFECTIVE_DATE = "August 15, 2026";

function getOperator() {
  return {
    name: process.env.LEGAL_OPERATOR_NAME?.trim() || "Łukasz Szczepański",
    address: process.env.LEGAL_OPERATOR_ADDRESS?.trim() || "ul. Hetmańska 16, Rzeszów, Poland",
    email: process.env.PUBLIC_CONTACT_EMAIL?.trim() || "slangtest.contact@gmail.com",
  };
}

export default function PrivacyPage() {
  const operator = getOperator();
  return (
    <LegalPage title="BuildCrew Privacy Policy" subtitle={`Effective ${EFFECTIVE_DATE}. This document explains what personal data BuildCrew processes and why.`}>
      <LegalSection title="1. Data controller">
        <p>The controller of personal data processed through BuildCrew is <strong>{operator.name}</strong>, address: <strong>{operator.address}</strong>, email: <a className="text-lime-600 hover:underline dark:text-lime-400" href={`mailto:${operator.email}`}>{operator.email}</a>.</p>
      </LegalSection>

      <LegalSection title="2. Data we may process">
        <p>Depending on the features you use, BuildCrew may process:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>account data such as email address, account identifiers, verification status and authentication/session information;</li>
          <li>profile data such as username, headline, bio, role, experience, skills, interests, availability, languages, location, collaboration preferences and links you provide;</li>
          <li>project and collaboration data such as project descriptions, roles, team membership, applications, invitations, updates, tasks, workspace messages, links, milestones, credits and endorsements;</li>
          <li>messages, reports, help questions, feedback, reactions and other content you submit;</li>
          <li>technical and security data such as IP address, device/browser information, timestamps, logs, rate-limit events and security signals;</li>
          <li>email-delivery and notification metadata;</li>
          <li>analytics data where you have given the required consent.</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Third-party sign-in">
        <p>If you choose Google or GitHub sign-in, BuildCrew may receive the account identifier, email address and limited public profile information needed to create, recognize or enrich your BuildCrew account. BuildCrew does not receive your provider password. GitHub sign-in may also provide your GitHub login and public profile URL so you can connect your builder profile.</p>
      </LegalSection>

      <LegalSection title="4. Why we process data">
        <p>Data may be processed to provide and secure your account, operate profiles and projects, enable team formation and communication, generate recommendations and matching, support professional-network and collaboration-history features, deliver notifications, moderate content, prevent abuse, maintain records of collaboration and comply with legal obligations.</p>
        <p>Depending on the specific processing activity, the legal basis may include performance of the service agreement, compliance with legal obligations, legitimate interests such as security and service improvement, or consent where required (for example selected analytics).</p>
      </LegalSection>

      <LegalSection title="5. Public information">
        <p>Some data is intentionally visible to other users, and selected public profile or project pages may be available without login. Public content can be indexed or cached by search engines and external platforms. Think carefully before publishing information you do not want to make public.</p>
        <p>Private contact details and private messages are not intended to be public unless you choose to share them yourself.</p>
      </LegalSection>

      <LegalSection title="6. Matching and recommendations">
        <p>BuildCrew may use information such as roles, skills, interests, languages, location, availability, project stage and collaboration preferences to rank or recommend people and projects. These recommendations are product-assistance features and do not make legally significant automated decisions about you.</p>
      </LegalSection>

      <LegalSection title="7. Service providers and international transfers">
        <p>BuildCrew may use infrastructure and service providers needed to operate the platform, including hosting/database providers, email delivery services, analytics providers (where consented) and authentication providers. Depending on the provider, data may be processed outside Poland or the European Economic Area using applicable legal transfer mechanisms.</p>
      </LegalSection>

      <LegalSection title="8. Emails and notifications">
        <p>BuildCrew may send transactional emails related to security, verification, password reset, messages, applications, invitations, project activity, matching and other account events. Selected categories can be controlled in notification settings where that option is available.</p>
      </LegalSection>

      <LegalSection title="9. Cookies and analytics">
        <p>BuildCrew may use cookies, local storage and similar mechanisms required for sessions, security, preferences and core functionality. Google Analytics 4 is used only where the relevant analytics consent has been given. Consent choices may be handled through Google Consent Mode or equivalent mechanisms.</p>
      </LegalSection>

      <LegalSection title="10. Data retention">
        <p>Data is kept for as long as needed to provide the service, maintain security and collaboration integrity, comply with legal requirements or establish and defend claims. Retention periods may differ by category. Deleted or changed content can remain temporarily in backups, logs or third-party caches.</p>
      </LegalSection>

      <LegalSection title="11. Account deletion">
        <p>You can request or perform account deletion through available settings. Deletion removes or anonymizes data according to the product's technical design and applicable legal requirements. Certain records may need to be retained where required for security, legal claims, compliance or integrity of shared project history.</p>
      </LegalSection>

      <LegalSection title="12. Your rights">
        <p>Subject to applicable law, you may have rights to access, rectify, erase or restrict your personal data, object to certain processing, receive portable data and withdraw consent where processing is based on consent. You may also lodge a complaint with the competent data-protection authority.</p>
        <p>Requests can be sent to <a className="text-lime-600 hover:underline dark:text-lime-400" href={`mailto:${operator.email}`}>{operator.email}</a>. Additional information may be requested where necessary to verify identity.</p>
      </LegalSection>

      <LegalSection title="13. Safety, reports and security">
        <p>BuildCrew uses technical and organizational safeguards appropriate to the service, including authentication controls, access restrictions, rate limits, validation and security logging. Reports about profiles, projects or messages may be stored with moderation notes and review metadata. Blocking removes or restricts relevant network and messaging relationships. No internet service can guarantee absolute security.</p>
      </LegalSection>

      <LegalSection title="14. Changes and contact">
        <p>This Privacy Policy may be updated when BuildCrew features, providers or legal requirements change. The current version will be published on the platform. Material changes may be communicated where appropriate.</p>
        <p>Questions about privacy can be sent to <a className="text-lime-600 hover:underline dark:text-lime-400" href={`mailto:${operator.email}`}>{operator.email}</a>. See also the <Link href="/terms" className="text-lime-600 hover:underline dark:text-lime-400">Terms of Service</Link>.</p>
      </LegalSection>
    </LegalPage>
  );
}
