export function BrandLogo({
  compact = false,
  showTagline = false,
}: {
  compact?: boolean;
  showTagline?: boolean;
}) {
  return (
    <div className={compact ? "brand-logo compact" : "brand-logo"}>
      <span className="brand-wordmark" aria-label="ConsorTech">
        {!compact ? (
          <span className="brand-wordmark-text">ConsorTech</span>
        ) : null}
        <span className="brand-mark-group" aria-hidden="true">
          <span className="brand-pill brand-pill-blue" />
          <span className="brand-pill brand-pill-green" />
        </span>
      </span>
      {!compact && showTagline ? (
        <span className="brand-tagline">Gestão de consórcios</span>
      ) : null}
    </div>
  );
}
