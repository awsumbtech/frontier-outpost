export default function ItemSprite({ className, style }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-hidden="true">
      {/* Capsule/pill shape — horizontal */}
      <rect x="10" y="22" width="34" height="20" rx="10" fill="currentColor" opacity="0.75" />
      <rect x="12" y="24" width="30" height="16" rx="8" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.55" />
      {/* Dividing line — bump to be visible */}
      <line x1="27" y1="24" x2="27" y2="40" stroke="currentColor" strokeWidth="1.2" opacity="0.65" />
      {/* Plus symbol to the right */}
      <line x1="52" y1="26" x2="52" y2="38" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
      <line x1="46" y1="32" x2="58" y2="32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
    </svg>
  );
}
