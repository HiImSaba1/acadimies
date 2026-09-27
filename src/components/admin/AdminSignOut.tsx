"use client";

import { signOut } from "next-auth/react";

export function AdminSignOut({ compact = false }: { compact?: boolean }) {
  return <button type="button" title={compact ? "Αποσύνδεση" : undefined} aria-label="Αποσύνδεση" onClick={() => signOut({ callbackUrl: "/admin/login" })}>{compact ? "↗" : "Αποσύνδεση"}</button>;
}
