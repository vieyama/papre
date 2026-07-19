export function PapreGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M50,30 C14,54 14,54 50,78 C86,54 86,54 50,30 Z"
        fill="currentColor"
      />
      <line
        x1="50"
        y1="30"
        x2="50"
        y2="78"
        stroke="#0f172a"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}
