import type { DefaultSession } from "next-auth";
import type { StaffRole } from "@/db/schema";

declare module "next-auth" {
  interface User {
    role?: StaffRole;
  }

  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: StaffRole;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    staffId?: string;
    role?: StaffRole;
  }
}
