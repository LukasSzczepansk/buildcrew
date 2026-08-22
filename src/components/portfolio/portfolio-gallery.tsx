import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { PortfolioViewItem } from "@/server/data/portfolio";

export function PortfolioGallery({ items, locale = "pl", compact = false }: { items: PortfolioViewItem[]; locale?: "pl" | "en"; compact?: boolean }) {
  const en = locale === "en";
  if (!items.length) return null;
  return (
    <div className={compact ? "grid gap-4 sm:grid-cols-2" : "grid gap-5 md:grid-cols-2"}>
      {items.map((item) => {
        const cover = item.images[0];
        const rest = item.images.slice(1, 4);
        return (
          <article key={item.id} className="min-w-0 overflow-hidden border border-[var(--bc-line)] bg-[var(--bc-surface)]">
            {cover ? (
              <a href={`/api/portfolio/images/${cover.id}`} target="_blank" rel="noopener noreferrer" className="group block overflow-hidden bg-[var(--bc-surface-subtle)]">
                <img src={`/api/portfolio/images/${cover.id}`} alt={item.title} className="aspect-[16/10] w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.015]" loading="lazy" />
              </a>
            ) : null}
            {rest.length ? <div className="grid grid-cols-3 border-t border-[var(--bc-line)]">{rest.map((image) => <a key={image.id} href={`/api/portfolio/images/${image.id}`} target="_blank" rel="noopener noreferrer" className="overflow-hidden border-r border-[var(--bc-line)] last:border-r-0"><img src={`/api/portfolio/images/${image.id}`} alt="" className="aspect-[4/3] w-full object-cover object-top transition-transform duration-300 hover:scale-[1.02]" loading="lazy" /></a>)}</div> : null}
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><h3 className="text-[15px] font-semibold tracking-[-0.01em]">{item.title}</h3>{item.role ? <p className="mt-0.5 text-[12px] font-medium text-[var(--bc-muted)]">{item.role}</p> : null}</div>
                {item.images.length > 1 ? <span className="shrink-0 text-[11px] text-[var(--bc-faint)]">{item.images.length} {en ? "screens" : "screenów"}</span> : null}
              </div>
              {item.description ? <p className="bc-truncate-3 mt-2 text-[13px] leading-5 text-[var(--bc-muted)]">{item.description}</p> : null}
              {item.tools.length ? <div className="mt-3 flex flex-wrap gap-1.5">{item.tools.slice(0, 8).map((tool) => <span key={tool} className="border border-[var(--bc-line)] bg-[var(--bc-surface-subtle)] px-2 py-1 text-[10px] font-medium text-[var(--bc-muted)]">{tool}</span>)}</div> : null}
              {item.projectId && item.projectName ? <Link href={`/p/${item.projectId}`} className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--bc-ink)] hover:underline">{en ? "BuildCrew project:" : "Projekt BuildCrew:"} {item.projectName}<ExternalLink className="h-3 w-3" /></Link> : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
