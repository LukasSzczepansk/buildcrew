"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Search, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export type FilterOption = { value: string; label: string };
export type FilterDef = { key: string; label: string; options: FilterOption[] };

export function FilterBar({ filters, showSearch, searchPlaceholder = "Szukaj…" }: { filters: FilterDef[]; showSearch?: boolean; searchPlaceholder?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showMore, setShowMore] = React.useState(() => filters.slice(3).some((filter) => Boolean(searchParams.get(filter.key))));

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`?${params.toString()}`);
  }

  const activeCount = filters.filter((filter) => searchParams.get(filter.key)).length + (showSearch && searchParams.get("q") ? 1 : 0);
  const extraFilters = filters.slice(3);
  const extraActiveCount = extraFilters.filter((filter) => searchParams.get(filter.key)).length;

  function renderFilter(filter: FilterDef) {
    return (
      <Select key={filter.key} value={searchParams.get(filter.key) ?? undefined} onValueChange={(value) => setParam(filter.key, value)}>
        <SelectTrigger className="h-10 w-auto min-w-[8rem] gap-2 bg-transparent text-[12px]">
          <SelectValue placeholder={filter.label} />
        </SelectTrigger>
        <SelectContent>
          {filter.options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
        </SelectContent>
      </Select>
    );
  }

  return (
    <div className="border-b border-[var(--bc-line)] pb-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        {showSearch ? (
          <div className="relative w-full xl:max-w-[360px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--bc-faint)]" />
            <Input
              placeholder={searchPlaceholder}
              defaultValue={searchParams.get("q") ?? ""}
              className="h-10 bg-[var(--bc-surface)] pl-9 text-[13px] dark:bg-[var(--bc-surface)]"
              onKeyDown={(event) => {
                if (event.key === "Enter") setParam("q", (event.target as HTMLInputElement).value || null);
              }}
            />
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2 xl:ml-auto">
          {filters.slice(0, 3).map(renderFilter)}

          {extraFilters.length > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-10 gap-1.5 px-2.5 text-[12px] text-[var(--bc-muted)]"
              onClick={() => setShowMore((value) => !value)}
              aria-expanded={showMore}
            >
              Więcej filtrów{extraActiveCount > 0 ? ` (${extraActiveCount})` : ""}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showMore ? "rotate-180" : ""}`} />
            </Button>
          ) : null}

          {activeCount > 0 ? (
            <Button variant="ghost" size="sm" className="h-10 gap-1 px-2.5 text-[var(--bc-muted)]" onClick={() => router.push("?")}>
              <X className="h-3.5 w-3.5" /> Wyczyść
            </Button>
          ) : null}
        </div>
      </div>

      {showMore && extraFilters.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--bc-line)] pt-3">
          {extraFilters.map(renderFilter)}
        </div>
      ) : null}
    </div>
  );
}
