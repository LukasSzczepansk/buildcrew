"use client";

import * as React from "react";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createQuestion } from "@/server/actions/help";

export function QuestionForm() {
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [tagInput, setTagInput] = React.useState("");
  const [tags, setTags] = React.useState<string[]>([]);
  const [pending, setPending] = React.useState(false);

  function addTag() {
    const tag = tagInput.trim();
    if (!tag || tags.includes(tag) || tags.length >= 5) return;
    setTags((prev) => [...prev, tag]);
    setTagInput("");
  }

  async function submit() {
    setPending(true);
    const result = await createQuestion({ title, description, tags }).catch((err) => {
      if (err?.digest?.startsWith?.("NEXT_REDIRECT")) throw err;
      return { error: "Nie udało się dodać pytania." };
    });
    setPending(false);
    if (result?.error) toast.error(result.error);
  }

  return (
    <Card className="p-6">
      <div className="grid gap-5">
        <div className="grid gap-1.5">
          <Label htmlFor="question-title">Tytuł</Label>
          <Input
            id="question-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Np. Jak najlepiej zrobić auth w Next.js?"
            maxLength={140}
          />
          <p className="text-[13px] text-neutral-400">Napisz konkretnie, z czym utknąłeś.</p>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="question-description">Opis problemu</Label>
          <Textarea
            id="question-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Co próbujesz zrobić? Co już sprawdziłeś? Jaki dokładnie pojawia się problem?"
            className="min-h-44"
            maxLength={2000}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="question-tags">Tagi (maks. 5)</Label>
          <div className="flex gap-2">
            <Input
              id="question-tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Next.js, PostgreSQL, Figma..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
            />
            <Button type="button" variant="outline" onClick={addTag} disabled={!tagInput.trim() || tags.length >= 5}>
              <Plus className="h-4 w-4" /> Dodaj
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setTags((prev) => prev.filter((item) => item !== tag))}
                  className="inline-flex items-center gap-1 rounded-full bg-lime-50 px-3 py-1 text-[13px] font-medium text-lime-700 hover:bg-lime-100 dark:bg-lime-500/10 dark:text-lime-300"
                >
                  {tag} <X className="h-3 w-3" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button onClick={submit} disabled={pending || title.trim().length < 10 || description.trim().length < 20}>
            {pending ? "Publikowanie…" : "Opublikuj pytanie"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
