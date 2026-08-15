export type UserRoleKey = "DIRECCION" | "RECEPCION" | "INSTRUCTOR";

export interface UserListItem {
  id: string;
  email: string;
  fullName: string;
  status: "ACTIVE" | "SUSPENDED";
  createdAt: string;
  roles: Array<{ role: { key: UserRoleKey; name: string } }>;
}

export interface CreatedUserResult {
  id: string;
  email: string;
  fullName: string;
  temporaryPassword: string;
}
