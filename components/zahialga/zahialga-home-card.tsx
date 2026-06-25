import Link from "next/link";

export function ZahialgaHomeCard() {
  return (
    <Link href="/zahialga" className="zah-home-banner">
      <span className="zah-home-banner-badge">ҮНЭГҮЙ</span>
      <div className="zah-home-banner-body">
        <div className="zah-home-banner-text">
          <p className="zah-home-banner-title">Захиалга хийж сур</p>
          <p className="zah-home-banner-sub">
            Хятад, Солонгос, Америкаас өөрөө захиалж сур
          </p>
        </div>
        <span className="zah-home-banner-action" aria-hidden>
          <span className="zah-home-banner-icon">🛒</span>
          <span className="zah-home-banner-chev">→</span>
        </span>
      </div>
    </Link>
  );
}
