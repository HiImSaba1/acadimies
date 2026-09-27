import type { ReactNode } from "react";
import { AdminWorkspaceShell } from "@/components/admin/AdminWorkspaceShell";
import { requireStaffSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import "../admin.css";

export default async function AdminWorkspaceLayout({ children }: { children: ReactNode }) {
  const session = await requireStaffSession();

  return <AdminWorkspaceShell userName={session.user.name ?? "Acadimies owner"} role={session.user.role}
    canReviewImports={can(session.user.role, "migration:review")}
    canPublish={can(session.user.role, "article:publish")}>{children}</AdminWorkspaceShell>;
}
