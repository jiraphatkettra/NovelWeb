import { redirect } from "next/navigation";

export default function NovelRedirectPage() {
  redirect("/?type=NOVEL");
}
