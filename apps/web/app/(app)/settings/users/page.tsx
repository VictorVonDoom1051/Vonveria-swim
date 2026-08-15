import { CAPABILITIES } from "@vonveria-swim/permissions";
import { requireCapability, serverFetch } from "../../../../lib/session";
import { UsersTable } from "./users-table";
import type { UserListItem } from "./types";

export default async function UsersSettingsPage() {
  await requireCapability(CAPABILITIES.USERS_MANAGE);
  const users = await serverFetch<UserListItem[]>("/users");

  return <UsersTable initial={users ?? []} />;
}
