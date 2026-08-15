import type { Metadata } from "next";
import Link from "next/link";
import { Check, ExternalLink, Image as ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { moderateProfileAvatar } from "@/server/actions/profile-avatar";
import { listPendingProfileAvatars } from "@/server/data/profile-avatars";

export const metadata: Metadata = { title: "Zdjęcia profilowe — Admin BuildCrew" };

function date(value: Date) {
  return new Intl.DateTimeFormat("pl-PL", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(value);
}

function bytes(value: number) {
  return value < 1024 ? `${value} B` : `${Math.round(value / 1024)} KB`;
}

export default async function AdminAvatarsPage() {
  const rows = await listPendingProfileAvatars();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Zdjęcia profilowe</h2>
          <p className="mt-1 max-w-2xl text-sm text-neutral-500">Ręczna kolejka moderacji. Zdjęcie nie pojawia się w profilu przed akceptacją. Odrzucenie usuwa sam obraz z bazy i zachowuje tylko minimalne dane decyzji.</p>
        </div>
        <div className="text-sm text-neutral-400">Oczekujące: <strong className="text-neutral-900 dark:text-white">{rows.length}</strong></div>
      </div>

      {rows.length ? (
        <div className="divide-y divide-neutral-200 border-y border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
          {rows.map((item) => (
            <article key={item.id} className="grid gap-5 py-5 lg:grid-cols-[136px_minmax(0,1fr)_360px] lg:items-start">
              <div className="overflow-hidden rounded-[8px] border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/admin/avatars/${item.id}`} alt={`Zdjęcie profilowe ${item.username}`} className="aspect-square w-full object-cover" />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <Link href={`/builders/${item.userId}`} className="text-[15px] font-semibold hover:underline">{item.username}</Link>
                  <Link href={`/builders/${item.userId}`} aria-label="Otwórz profil" className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white"><ExternalLink className="h-3.5 w-3.5" /></Link>
                </div>
                <p className="mt-1 text-sm text-neutral-500">{item.email}</p>
                <dl className="mt-4 grid max-w-lg grid-cols-[120px_1fr] gap-x-3 gap-y-2 text-[13px]">
                  <dt className="text-neutral-400">Przesłano</dt><dd>{date(item.uploadedAt)}</dd>
                  <dt className="text-neutral-400">Zgoda zapisana</dt><dd>{date(item.consentAt)}</dd>
                  <dt className="text-neutral-400">Rozmiar</dt><dd>{bytes(item.byteSize)}</dd>
                  <dt className="text-neutral-400">Format</dt><dd>WebP po przetworzeniu w przeglądarce</dd>
                </dl>
                <p className="mt-4 max-w-2xl text-[13px] leading-5 text-neutral-500">Akceptuj tylko neutralne zdjęcia profilowe. Odrzuć treści podszywające się pod inną osobę, pornograficzne, drastyczne, zawierające oczywiste dane wrażliwe osób trzecich lub niemające sensu jako avatar.</p>
              </div>

              <div className="space-y-3 border-t border-neutral-200 pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0 dark:border-neutral-800">
                <form action={moderateProfileAvatar}>
                  <input type="hidden" name="avatarId" value={item.id} />
                  <input type="hidden" name="decision" value="approve" />
                  <Button type="submit" className="w-full"><Check className="h-4 w-4" /> Akceptuj zdjęcie</Button>
                </form>

                <form action={moderateProfileAvatar} className="space-y-2">
                  <input type="hidden" name="avatarId" value={item.id} />
                  <input type="hidden" name="decision" value="reject" />
                  <Input name="reason" maxLength={300} placeholder="Powód odrzucenia (opcjonalny)" />
                  <Button type="submit" variant="outline" className="w-full"><X className="h-4 w-4" /> Odrzuć</Button>
                </form>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="border-y border-neutral-200 py-14 text-center dark:border-neutral-800">
          <ImageIcon className="mx-auto h-5 w-5 text-neutral-300 dark:text-neutral-700" />
          <p className="mt-3 text-sm font-medium">Brak zdjęć do sprawdzenia</p>
          <p className="mt-1 text-[13px] text-neutral-400">Nowe zgłoszenia pojawią się tutaj automatycznie.</p>
        </div>
      )}
    </div>
  );
}
