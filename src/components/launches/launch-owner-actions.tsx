"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { deleteLaunch } from "@/server/actions/launches";

export function LaunchOwnerActions({ entryId, slug, en = false }: { entryId: string; slug: string; en?: boolean }) {
  const router = useRouter();
  const { confirm, dialog } = useConfirm();
  return <div className="flex gap-2">{dialog}<Button asChild variant="outline" size="sm" className="gap-1.5"><Link href={`/launches/${slug}/edit`}><Pencil className="h-3.5 w-3.5" />{en ? "Edit" : "Edytuj"}</Link></Button><Button variant="ghost" size="sm" className="gap-1.5 text-[var(--bc-danger)]" onClick={async () => { if (!(await confirm({ message: en ? "Delete this launch?" : "Usunąć tę premierę?", destructive: true }))) return; const result = await deleteLaunch(entryId); if (result.error) { toast.error(result.error); return; } router.push("/launches"); router.refresh(); }}><Trash2 className="h-3.5 w-3.5" />{en ? "Delete" : "Usuń"}</Button></div>;
}
