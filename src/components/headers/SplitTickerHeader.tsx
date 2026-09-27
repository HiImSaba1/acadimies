import { BrandMark, HeaderTools, PrimaryNavigation } from "./HeaderPrimitives";
import type { HeaderTemplateProps } from "./types";

export function SplitTickerHeader({ activeKey }: HeaderTemplateProps) {
  return <header className="publication-header header-split" data-testid="publication-header" data-header-template={activeKey}>
    <div className="header-split__top"><div className="site-shell"><span>Breaking</span><p>Οι ιστορίες που διαμορφώνουν τον αθλητισμό βάσης</p></div></div><div className="site-shell header-split__main"><BrandMark compact /><div className="header-split__edition"><b>THE SUNDAY EDIT</b><span>14.09.2026 / 184</span></div><HeaderTools /></div><div className="site-shell"><PrimaryNavigation /></div>
  </header>;
}
