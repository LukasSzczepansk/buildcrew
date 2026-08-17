import { redirect } from "next/navigation";
export default function BuildPoolRedirect() { redirect("/builders?group=build"); }
