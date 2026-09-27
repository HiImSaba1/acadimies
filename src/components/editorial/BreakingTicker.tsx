export function BreakingTicker({ items }: { items: readonly string[] }) {
  return (
    <section className="editorial-marquee" aria-label="Θέματα της έκδοσης">
      <div className="editorial-marquee__track">
        {[0, 1].map((copy) => (
          <div className="editorial-marquee__group" aria-hidden={copy === 1} key={copy}>
            {items.map((item) => <span key={`${copy}-${item}`}>{item}<b aria-hidden="true">↗</b></span>)}
          </div>
        ))}
      </div>
    </section>
  );
}
