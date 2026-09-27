import { BrandMark, EditionLine, HeaderTools, PrimaryNavigation } from "./HeaderPrimitives";
import type { HeaderTemplateProps } from "./types";

export function MinimalEditorialHeader({ activeKey }: HeaderTemplateProps) {
  return <header className="publication-header header-minimal" data-testid="publication-header" data-header-template={activeKey}>
    <div className="site-shell"><EditionLine /><div className="header-minimal__main"><BrandMark /><p>Ιστορίες, άνθρωποι και ιδέες<br />από τον αθλητισμό βάσης</p><HeaderTools /></div><PrimaryNavigation /></div>
  </header>;
}
