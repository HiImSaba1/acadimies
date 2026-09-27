import { BrandMark, HeaderTools, PrimaryNavigation } from "./HeaderPrimitives";
import type { HeaderTemplateProps } from "./types";

export function NeonSportsHeader({ activeKey }: HeaderTemplateProps) {
  return <header className="publication-header header-neon" data-testid="publication-header" data-header-template={activeKey}>
    <div className="site-shell header-neon__top"><span>LIVE / FIELD NOTES</span><span>GR — EN</span></div><div className="site-shell header-neon__main"><BrandMark /><span className="header-neon__score">90′</span><HeaderTools inverse /></div><div className="site-shell"><PrimaryNavigation /></div>
  </header>;
}
