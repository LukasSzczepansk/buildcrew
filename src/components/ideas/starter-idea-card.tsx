import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import type { StarterIdea } from "@/lib/starter-ideas";

export function StarterIdeaCard({ idea }: { idea: StarterIdea }) {
  return (
    <article className="grid gap-4 border-b border-[var(--bc-line)] py-5 first:border-t sm:grid-cols-[minmax(0,1fr)_160px] sm:items-start">
      <div className="min-w-0">
        <div className="flex items-start gap-3.5">
          <Avatar username={idea.author} seed={`starter-${idea.slug}`} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[16px] font-semibold tracking-[-0.015em]">{idea.name}</h3>
              <span className="rounded-[4px] border border-[var(--bc-line)] px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--bc-faint)]">Przykład</span>
            </div>
            <p className="mt-1 max-w-[780px] text-sm leading-5 text-[var(--bc-muted)]">{idea.tagline}</p>

            <div className="mt-3 grid gap-2 text-[12px] leading-4 text-[var(--bc-muted)] sm:grid-cols-2 lg:grid-cols-3">
              <p><span className="text-[var(--bc-faint)]">Autor</span><br /><span className="font-medium text-[var(--bc-ink)]">{idea.author}</span> · {idea.role}</p>
              <p><span className="text-[var(--bc-faint)]">Szukam</span><br /><span className="text-[var(--bc-ink)]">{idea.lookingFor.join(" · ")}</span></p>
              <p><span className="text-[var(--bc-faint)]">Czas</span><br /><span className="text-[var(--bc-ink)]">{idea.commitment}</span></p>
            </div>

            <p className="mt-3 border-l-2 border-[var(--bc-accent)] pl-3 text-[13px] leading-5 text-[var(--bc-muted)]">{idea.note}</p>

            <div className="mt-3 flex flex-wrap gap-x-2 gap-y-1 text-[12px] text-[var(--bc-faint)]">
              <span>{idea.interests.join(" · ")}</span>
              <span>·</span>
              <span>{idea.interestedCount} zainteresowanych w przykładzie</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:flex-col sm:items-stretch">
        <Link href="#dodaj-pomysl" className="inline-flex h-9 items-center justify-center rounded-[6px] border border-[var(--bc-line-strong)] px-3 text-[13px] font-medium transition-colors hover:bg-[var(--bc-surface-subtle)]">
          Dodaj własny
        </Link>
        <span className="hidden text-center text-[11px] leading-4 text-[var(--bc-faint)] sm:block">To treść przykładowa, nie konto użytkownika.</span>
      </div>
    </article>
  );
}
