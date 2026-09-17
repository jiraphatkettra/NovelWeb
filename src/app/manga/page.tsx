import { redirect } from "next/navigation";

export default function MangaRedirectPage() {
  redirect("/?type=MANGA");
}
