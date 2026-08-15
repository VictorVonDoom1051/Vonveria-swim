import { redirect } from "next/navigation";
import { getCurrentUser, homeRouteFor } from "../lib/session";

export default async function RootPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  redirect(homeRouteFor(user));
}
