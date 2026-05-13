import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const ADMIN_PASSWORD = "12345678";
export const ADMIN_SESSION_COOKIE = "wad-admin-session";
export const ADMIN_SESSION_VALUE = "wad-admin-authenticated";

export async function hasAdminSession() {
  const cookieStore = await cookies();

  return cookieStore.get(ADMIN_SESSION_COOKIE)?.value === ADMIN_SESSION_VALUE;
}

export async function requireAdminSession() {
  if (!(await hasAdminSession())) {
    redirect("/admin/login");
  }
}
