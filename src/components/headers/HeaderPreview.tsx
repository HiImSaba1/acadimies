import { BrandMark, HeaderTools } from "./HeaderPrimitives";
import { getHeaderMenuPostImages } from "@/features/header-menu/data";

export async function HeaderPreview({ onLight = false }: { onLight?: boolean }) {
  const menuPostImages = await getHeaderMenuPostImages();
  return <header className="publication-header site-header" style={{ viewTransitionName: "navbar" }} data-testid="publication-header" data-on-light={onLight || undefined}><div className="site-header__inner"><BrandMark compact /><HeaderTools menuPostImages={menuPostImages} /></div></header>;
}
