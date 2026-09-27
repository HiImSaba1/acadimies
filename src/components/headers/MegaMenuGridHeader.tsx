import { BrandMark, EditionLine, HeaderTools, PrimaryNavigation } from "./HeaderPrimitives";
import type { HeaderTemplateProps } from "./types";

export function MegaMenuGridHeader({ activeKey }: HeaderTemplateProps) {
  return <header className="publication-header header-mega" data-testid="publication-header" data-header-template={activeKey}>
    <div className="site-shell"><EditionLine /><div className="header-mega__grid"><BrandMark /><PrimaryNavigation grid /><aside><p>Focus</p><strong>Πώς χτίζεται μια σύγχρονη ακαδημία;</strong></aside><HeaderTools /></div></div>
  </header>;
}
