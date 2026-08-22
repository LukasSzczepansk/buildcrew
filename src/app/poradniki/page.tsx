import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/site-config";
export const metadata: Metadata = { title:"Poradniki o budowaniu zespołów i projektów | BuildCrew", description:"Praktyczne poradniki BuildCrew o znajdowaniu programistów, designerów i ludzi do wspólnego tworzenia projektów.", alternates:{canonical:`${SITE_URL}/poradniki`} };
const guides=[
  ["/poradniki/jak-znalezc-programiste-do-projektu","Jak znaleźć programistę do projektu?","Jak przygotować projekt i zwiększyć szansę na dobrą współpracę z developerem."],
  ["/poradniki/jak-znalezc-designera-do-startupu","Jak znaleźć designera do startupu?","Na co patrzeć w portfolio i jak dobrze opisać zakres UX/UI."],
  ["/poradniki/jak-zbudowac-zespol-do-projektu","Jak zbudować zespół do projektu?","Jak dobierać role, zacząć od małego zakresu i nie kompletować zespołu na zapas."],
] as const;
export default function Guides(){return <main className="min-h-screen bg-[var(--bc-canvas)] text-[var(--bc-ink)]"><div className="mx-auto max-w-[920px] px-5 py-14 sm:px-8 sm:py-20"><Link href="/" className="text-sm font-semibold">← BuildCrew</Link><h1 className="mt-12 text-[42px] font-semibold tracking-[-0.04em]">Poradniki BuildCrew</h1><p className="mt-4 max-w-2xl text-[16px] leading-7 text-[var(--bc-muted)]">Konkretne materiały dla osób, które szukają współtwórców, kompletują zespół albo chcą dołączyć do projektu.</p><div className="mt-10 border-t border-[var(--bc-line-strong)]">{guides.map(([href,title,text])=><article key={href} className="border-b border-[var(--bc-line)] py-6"><h2 className="text-[20px] font-semibold"><Link href={href} className="hover:underline">{title}</Link></h2><p className="mt-2 text-sm leading-6 text-[var(--bc-muted)]">{text}</p></article>)}</div></div></main>}
