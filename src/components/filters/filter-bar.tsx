"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export type FilterOption = { value: string; label: string };
export type FilterDef = { key: string; label: string; options: FilterOption[] };

export function FilterBar({ filters, showSearch }: { filters: FilterDef[]; showSearch?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`?${params.toString()}`);
  }

  const activeCount = filters.filter((filter) => searchParams.get(filter.key)).length + (showSearch && searchParams.get("q") ? 1 : 0);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {showSearch ? (
        <div className="relative min-w-[220px] flex-1 md:max-w-[320px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Szukaj…"
            defaultValue={searchParams.get("q") ?? ""}
            className="h-9 bg-white pl-8 text-[13px] dark:bg-[#171715]"
            onKeyDown={(event) => {
              if (event.key === "Enter") setParam("q", (event.target as HTMLInputElement).value || null);
            }}
          />
        </div>
      ) : null}

      <div className="flex flex-wrap gap-1.5 md:ml-auto">
        {filters.map((filter) => (
          <Select key={filter.key} value={searchParams.get(filter.key) ?? undefined} onValueChange={(value) => setParam(filter.key, value)}>
            <SelectTrigger className="h-9 w-auto min-w-[7.5rem] gap-2 bg-transparent text-[12px]">
              <SelectValue placeholder={filter.label} />
            </SelectTrigger>
            <SelectContent>
              {filter.options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
            </SelectContent>
          </Select>
        ))}

        {activeCount > 0 ? (
          <Button variant="ghost" size="sm" className="gap-1 px-2 text-neutral-500" onClick={() => router.push("?")}><X className="h-3.5 w-3.5" /> Wyczyść</Button>
        ) : null}
      </div>
    </div>
  );
}
