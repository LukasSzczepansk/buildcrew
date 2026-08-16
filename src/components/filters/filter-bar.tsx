"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Search, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCopy } from "@/components/i18n/locale-provider";

export type FilterOption = { value: string; label: string };
export type FilterDef = { key: string; label: string; options: FilterOption[] };

export function FilterBar({ filters, showSearch, searchPlaceholder }: { filters: FilterDef[]; showSearch?: boolean; searchPlaceholder?: string }) {
  const router = useRouter();
  const copy = useCopy();
  const searchParams = useSearchParams();
  const [showMore, setShowMore] = React.useState(() => filters.slice(3).some((filter) => Boolean(searchParams.get(filter.key))));

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`?${params.toString()}`);
  }

  const activeCount = filters.filter((filter) => searchParams.get(filter.key)).length + (showSearch && searchParams.get("q") ? 1 : 0);
  const quickFilters = filters.slice(0, 3);
  const extraFilters = filters.slice(3);
  const extraActiveCount = extraFilters.filter((filter) => searchParams.get(filter.key)).length;

  function renderFilter(filter: FilterDef) {
    return (
      <Select key={filter.key} value={searchParams.get(filter.key) ?? undefined} onValueChange={(value) => setParam(filter.key, value)}>
        <SelectTrigger className="h-10 w-auto min-w-[8.5rem] max-w-[12rem] gap-2 text-[13px]">
          <SelectValue placeholder={filter.label} />
        </SelectTrigger>
        <SelectContent>
          {filter.options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
        </SelectContent>
      </Select>
    );
  }

  return (
    <div className="border-y border-[var(--bc-line)] py-3">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        {showSearch ? (
          <div className="relative w-full xl:max-w-[340px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--bc-faint)]" />
            <Input
              placeholder={searchPlaceholder ?? copy("Search…", "Search…")}
              defaultValue={searchParams.get("q") ?? ""}
              className="h-10 bg-[var(--bc-surface)] pl-9 text-sm"
              onKeyDown={(event) => { if (event.key === "Enter") setParam("q", (event.target as HTMLInputElement).value || null); }}
            />
          </div>
        ) : null}

        <div className="flex min-w-0 flex-wrap items-center gap-2 xl:ml-auto xl:justify-end">
          {quickFilters.map(renderFilter)}
          {extraFilters.length > 0 ? (
            <Button type="button" variant="ghost" size="sm" className="h-10 gap-1.5 px-2.5 text-[13px]" onClick={() => setShowMore((value) => !value)} aria-expanded={showMore}>
              {copy("More", "More")}{extraActiveCount > 0 ? ` (${extraActiveCount})` : ""}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showMore ? "rotate-180" : ""}`} />
            </Button>
          ) : null}
          {activeCount > 0 ? (
            <Button variant="ghost" size="sm" className="h-10 gap-1 px-2.5 text-[13px]" onClick={() => router.push("?")}>
              <X className="h-3.5 w-3.5" /> {copy("Clear", "Clear")}
            </Button>
          ) : null}
        </div>
      </div>

      {showMore && extraFilters.length > 0 ? <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--bc-line)] pt-3">{extraFilters.map(renderFilter)}</div> : null}
    </div>
  );
}
