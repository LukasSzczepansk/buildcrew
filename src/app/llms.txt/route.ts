import { SITE_URL } from "@/lib/site-config";
export function GET() {
  const body = `# BuildCrew\n\nBuildCrew is a Polish platform for finding people to build projects together.\n\n## Main public sections\n\n- Projects: ${SITE_URL}/projekty\n- Launches: ${SITE_URL}/launches\n- Find a programmer: ${SITE_URL}/znajdz-programiste\n- Find a designer: ${SITE_URL}/znajdz-designera\n- Find a cofounder: ${SITE_URL}/znajdz-wspolnika\n- Find a team: ${SITE_URL}/znajdz-zespol\n- Join a project: ${SITE_URL}/dolacz-do-projektu\n- Guides: ${SITE_URL}/poradniki\n- About: ${SITE_URL}/o-nas\n\nPublic profiles and public project pages may also be indexed. Private dashboards, messages, settings and admin areas are not public content.\n`;
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
