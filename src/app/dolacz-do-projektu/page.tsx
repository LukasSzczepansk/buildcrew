import { IntentLanding, intentMetadata } from "@/components/seo/intent-landing";
import { SEO_INTENT_PAGES } from "@/lib/seo-intent-pages";
const config = SEO_INTENT_PAGES["dolacz-do-projektu"]!;
export const metadata = intentMetadata(config);
export default function Page() { return <IntentLanding config={config} />; }
