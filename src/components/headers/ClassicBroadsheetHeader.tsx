import { BrandMark, EditionLine, HeaderTools, PrimaryNavigation } from "./HeaderPrimitives";
import type { HeaderTemplateProps } from "./types";

export function ClassicBroadsheetHeader({ activeKey }: HeaderTemplateProps) {
  return <header className="publication-header header-broadsheet" data-testid="publication-header" data-header-template={activeKey}>
    <div className="site-shell"><EditionLine /><div className="header-broadsheet__title"><p>Από το 2008</p><BrandMark /><p>Αρ. φύλλου 184</p></div><div className="header-broadsheet__nav"><PrimaryNavigation /><HeaderTools /></div></div>
  </header>;
}
