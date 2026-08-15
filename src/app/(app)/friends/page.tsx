import { redirect } from "next/navigation";

export default function FriendsRedirectPage() {
  redirect("/network?tab=contacts");
}
