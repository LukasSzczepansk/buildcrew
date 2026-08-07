"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

  const activeCount = filters.filter((f) => searchParams.get(f.key)).length + (showSearch && searchParams.get("q") ? 1 : 0);

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {filters.map((filter) => (
        <Select
          key={filter.key}
          value={searchParams.get(filter.key) ?? undefined}
          onValueChange={(v) => setParam(filter.key, v)}
        >
          <SelectTrigger className="w-auto min-w-[9rem] gap-2">
            <SelectValue placeholder={filter.label} />
          </SelectTrigger>
          <SelectContent>
            {filter.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
      {showSearch && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Szukaj…"
            defaultValue={searchParams.get("q") ?? ""}
            className="w-56 pl-9"
            onKeyDown={(e) => {
              if (e.key === "Enter") setParam("q", (e.target as HTMLInputElement).value || null);
            }}
          />
        </div>
      )}
      {activeCount > 0 && (
        <Button variant="ghost" size="sm" className="gap-1 text-neutral-500" onClick={() => router.push("?")}>
          <X className="h-3.5 w-3.5" /> Wyczyść filtry
        </Button>
      )}
    </div>
  );
}
