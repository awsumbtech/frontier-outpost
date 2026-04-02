export default function ApexPredatorSprite({ className, style }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-hidden="true">
      {/* Crown crest on head */}
      <path d="M22 6 L26 2 L30 5 L34 2 L38 6 L30 10 Z" fill="var(--sprite-accent, #fbbf24)" opacity="0.8" />

      {/* Massive head — hunched forward */}
      <path d="M20 8 L42 6 L44 18 L40 22 L22 22 L18 16 Z" fill="var(--sprite-primary, #991b1b)" opacity="0.85" />
      {/* Four eyes in a row */}
      <circle cx="24" cy="13" r="1.2" fill="var(--sprite-highlight, #ef4444)" opacity="0.95" />
      <circle cx="29" cy="12" r="1.2" fill="var(--sprite-highlight, #ef4444)" opacity="0.95" />
      <circle cx="34" cy="12" r="1.2" fill="var(--sprite-highlight, #ef4444)" opacity="0.95" />
      <circle cx="39" cy="13" r="1.2" fill="var(--sprite-highlight, #ef4444)" opacity="0.95" />

      {/* Massive jaw with zigzag teeth */}
      <path d="M22 22 L40 22 L42 28 L20 28 Z" fill="var(--sprite-primary, #991b1b)" opacity="0.75" />
      <path d="M22 22 L24 26 L26 22 L28 26 L30 22 L32 26 L34 22 L36 26 L38 22 L40 22" fill="none" stroke="var(--sprite-accent, #fca5a5)" strokeWidth="1" opacity="0.85" />

      {/* Hunched torso */}
      <path d="M22 22 L42 22 L44 44 L20 44 Z" fill="var(--sprite-primary, #991b1b)" opacity="0.75" />

      {/* Armored spine ridges along the back */}
      <path d="M18 18 L22 14 L22 18 Z" fill="var(--sprite-accent, #7f1d1d)" opacity="0.7" />
      <path d="M16 24 L20 20 L20 24 Z" fill="var(--sprite-accent, #7f1d1d)" opacity="0.7" />
      <path d="M14 30 L18 26 L18 30 Z" fill="var(--sprite-accent, #7f1d1d)" opacity="0.65" />
      <path d="M14 36 L18 32 L18 36 Z" fill="var(--sprite-accent, #7f1d1d)" opacity="0.6" />
      <path d="M16 42 L20 38 L20 42 Z" fill="var(--sprite-accent, #7f1d1d)" opacity="0.55" />

      {/* Right arm raised with claw */}
      <path d="M42 24 L48 20 L50 34 L44 36 Z" fill="var(--sprite-primary, #991b1b)" opacity="0.7" />
      {/* Claws */}
      <line x1="48" y1="18" x2="52" y2="12" stroke="var(--sprite-accent, #fca5a5)" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
      <line x1="50" y1="20" x2="56" y2="16" stroke="var(--sprite-accent, #fca5a5)" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
      <line x1="50" y1="24" x2="56" y2="22" stroke="var(--sprite-accent, #fca5a5)" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />

      {/* Left arm */}
      <path d="M20 24 L16 26 L14 38 L20 40 Z" fill="var(--sprite-primary, #991b1b)" opacity="0.65" />

      {/* Legs — powerful, bent */}
      <path d="M22 44 L30 44 L28 56 L22 56 Z" fill="var(--sprite-primary, #991b1b)" opacity="0.65" />
      <path d="M34 44 L42 44 L42 56 L34 56 Z" fill="var(--sprite-primary, #991b1b)" opacity="0.65" />

      {/* Tail wraps partially to front */}
      <path d="M20 44 Q12 48 10 42 Q8 38 10 32" fill="none" stroke="var(--sprite-primary, #991b1b)" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}
