import type { ReactNode } from "react";

export function PageEntrance({ children }: { children: ReactNode }) {
  return <div data-public-route>{children}</div>;
}
