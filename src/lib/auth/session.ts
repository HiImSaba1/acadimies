import "server-only";

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "./options";
import { can, type StaffCapability } from "./permissions";

export async function requireStaffSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/admin/login");
  return session;
}

export async function requireCapability(capability: StaffCapability) {
  const session = await requireStaffSession();
  if (!can(session.user.role, capability)) redirect("/admin?denied=1");
  return session;
}
