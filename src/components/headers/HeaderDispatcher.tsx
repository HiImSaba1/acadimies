import type { ComponentType } from "react";
import type { HeaderTemplateKey } from "@/features/publication/contracts";
import { ClassicBroadsheetHeader } from "./ClassicBroadsheetHeader";
import { MegaMenuGridHeader } from "./MegaMenuGridHeader";
import { MinimalEditorialHeader } from "./MinimalEditorialHeader";
import { NeonSportsHeader } from "./NeonSportsHeader";
import { SplitTickerHeader } from "./SplitTickerHeader";
import type { HeaderTemplateProps } from "./types";

export const headerTemplateRegistry = {
  minimal_editorial: MinimalEditorialHeader,
  classic_broadsheet: ClassicBroadsheetHeader,
  neon_sports: NeonSportsHeader,
  split_ticker: SplitTickerHeader,
  mega_menu_grid: MegaMenuGridHeader,
} satisfies Record<HeaderTemplateKey, ComponentType<HeaderTemplateProps>>;

export function HeaderDispatcher({ templateKey }: { templateKey: HeaderTemplateKey }) {
  const Header = headerTemplateRegistry[templateKey] ?? MinimalEditorialHeader;
  return <Header activeKey={templateKey in headerTemplateRegistry ? templateKey : "minimal_editorial"} />;
}
