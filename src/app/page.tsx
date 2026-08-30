import { redirect } from "next/navigation";

export default function RootPage() {
  // Direct all traffic to the admin dashboard since this repo is purely for admin
  redirect("/admin/dashboard");
}
