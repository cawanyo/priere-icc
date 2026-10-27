import { redirect } from "next/navigation";

export default function AdminTeamRedirectPage() {
  redirect("/dashboard/leader/team");
}
