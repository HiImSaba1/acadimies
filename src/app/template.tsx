"use client";

import { ViewTransition, type ReactNode } from "react";

export default function RootTemplate({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      <div data-page-view-transition>{children}</div>
    </ViewTransition>
  );
}
