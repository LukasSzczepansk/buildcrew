"use client";
import * as React from "react";

export function LaunchGallery({ images, title }: { images: { id: string; width: number; height: number }[]; title: string }) {
  const [active, setActive] = React.useState(0);
  if (!images.length) return null;
  const current = images[Math.min(active, images.length - 1)];
  return (
    <section aria-label="Screenshoty projektu">
      <div className="overflow-hidden rounded-[10px] border border-[var(--bc-line)] bg-[var(--bc-surface-subtle)]"><img src={`/api/launches/images/${current.id}`} alt={`${title} - screenshot ${active + 1}`} className="max-h-[680px] w-full object-contain" /></div>
      {images.length > 1 ? <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{images.map((image, index) => <button key={image.id} type="button" onClick={() => setActive(index)} className={`shrink-0 overflow-hidden rounded-[7px] border ${active === index ? "border-[var(--bc-ink)]" : "border-[var(--bc-line)]"}`} aria-label={`Screenshot ${index + 1}`}><img src={`/api/launches/images/${image.id}`} alt="" loading="lazy" className="h-16 w-24 object-cover object-top sm:h-20 sm:w-32" /></button>)}</div> : null}
    </section>
  );
}
