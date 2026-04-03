export default function ShieldCellSprite({ className, style }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-hidden="true">
      {/* Hexagonal battery/cell */}
      <path d="M32 8 L50 18 L50 46 L32 56 L14 46 L14 18 Z" fill="#60a5fa" opacity="0.55" />
      <path d="M32 12 L46 20 L46 44 L32 52 L18 44 L18 20 Z" fill="none" stroke="#00d4ff" strokeWidth="1.8" opacity="0.75" />
      {/* Lightning bolt inside */}
      <path d="M28 22 L36 22 L30 34 L38 34 L26 50 L30 36 L22 36 Z" fill="#00d4ff" opacity="0.8" />
      {/* Contact points at bottom */}
      <rect x="28" y="54" width="3" height="4" rx="0.5" fill="#60a5fa" opacity="0.65" />
      <rect x="34" y="54" width="3" height="4" rx="0.5" fill="#60a5fa" opacity="0.65" />
    </svg>
  );
}
