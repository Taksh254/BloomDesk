/** Sun, cloud and star doodle from the Crayon Box theme. */
export function Doodles({ className = "" }: { className?: string }) {
  return (
    <svg className={`bd-doodles ${className}`} viewBox="0 0 200 90" aria-hidden="true">
      <g className="sun">
        <circle cx="160" cy="30" r="13" />
        <line x1="160" y1="7" x2="160" y2="12" />
        <line x1="160" y1="48" x2="160" y2="53" />
        <line x1="137" y1="30" x2="142" y2="30" />
        <line x1="178" y1="30" x2="183" y2="30" />
        <line x1="144" y1="14" x2="147.5" y2="17.5" />
        <line x1="172.5" y1="42.5" x2="176" y2="46" />
        <line x1="176" y1="14" x2="172.5" y2="17.5" />
        <line x1="147.5" y1="42.5" x2="144" y2="46" />
      </g>
      <path className="cloud" d="M92 62h44a10 10 0 0 0 0-20 14 14 0 0 0-26-6 11 11 0 0 0-18 8 9 9 0 0 0 0 18z" />
      <polygon className="star" points="40,6 43,13 50,13.7 44.6,18.4 46.2,25.4 40,21.7 33.8,25.4 35.4,18.4 30,13.7 37,13" />
    </svg>
  );
}

/** BloomDesk wordmark: a small crayon flower and the name. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-display text-[22px] font-semibold text-ink ${className}`}>
      <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden>
        <circle cx="14" cy="7" r="5" fill="var(--bd-class-playgroup)" />
        <circle cx="21" cy="14" r="5" fill="var(--bd-accent)" />
        <circle cx="14" cy="21" r="5" fill="var(--bd-class-lkg)" />
        <circle cx="7" cy="14" r="5" fill="var(--bd-primary)" />
        <circle cx="14" cy="14" r="3.5" fill="var(--bd-surface)" />
      </svg>
      BloomDesk
    </span>
  );
}
