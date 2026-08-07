import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { COMMITMENT_LABELS, LEVEL_LABELS, LOOKING_FOR_LABELS, ROLE_LABELS } from "@/lib/constants";
import type { Commitment, Level, LookingFor, RoleType } from "@/db/schema";

export type BuilderCardData = {
  userId: string;
  username: string;
  avatarEmoji: string;
  role: RoleType | null;
  level: Level | null;
  weeklyHours: Commitment | null;
  skills: string[];
  interests: string[];
  lookingFor: LookingFor[];
};

export function BuilderCard({ builder, action }: { builder: BuilderCardData; action?: React.ReactNode }) {
  return (
    <Card className="flex h-full flex-col p-5 transition-shadow hover:shadow-md">
      <div className="flex items-center gap-3">
        <Avatar emoji={builder.avatarEmoji} />
        <div className="min-w-0">
          <p className="truncate font-semibold">{builder.username}</p>
          <p className="text-sm text-neutral-500">{builder.role ? ROLE_LABELS[builder.role] : "Builder"}</p>
        </div>
      </div>

      {builder.skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {builder.skills.slice(0, 4).map((s) => (
            <Badge key={s} variant="outline">
              {s}
            </Badge>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-neutral-400">
        {builder.level && <span>{LEVEL_LABELS[builder.level]}</span>}
        {builder.weeklyHours && (
          <>
            <span>·</span>
            <span>{COMMITMENT_LABELS[builder.weeklyHours]}</span>
          </>
        )}
      </div>

      {builder.lookingFor.length > 0 && (
        <p className="mt-3 text-xs text-neutral-400">
          Szuka: <span className="text-neutral-600 dark:text-neutral-300">{builder.lookingFor.map((l) => LOOKING_FOR_LABELS[l]).join(", ")}</span>
        </p>
      )}

      <div className="mt-4 flex items-center gap-2 border-t border-neutral-100 pt-4 dark:border-neutral-800">
        <Button asChild variant="outline" size="sm" className="flex-1">
          <Link href={`/builders/${builder.userId}`}>Zobacz profil</Link>
        </Button>
        {action}
      </div>
    </Card>
  );
}
