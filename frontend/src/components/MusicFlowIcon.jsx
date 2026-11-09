export default function MusicFlowIcon({ size = 24, className = "" }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M15 27c-3 5-3 10 0 15" stroke="#17232D" strokeOpacity=".65" strokeLinecap="round" strokeWidth="3" />
      <path d="M21 31c-1.5 2-1.5 5 0 7" stroke="#17232D" strokeOpacity=".65" strokeLinecap="round" strokeWidth="2.5" />
      <path d="M30 43V20l20-4v23" stroke="#17232D" strokeLinecap="round" strokeLinejoin="round" strokeWidth="5" />
      <path d="m30 25 20-4" stroke="#17232D" strokeLinecap="round" strokeWidth="5" />
      <ellipse cx="23.5" cy="44" fill="#17232D" rx="7.5" ry="5.5" transform="rotate(-16 23.5 44)" />
      <ellipse cx="43.5" cy="40" fill="#17232D" rx="7.5" ry="5.5" transform="rotate(-16 43.5 40)" />
      <circle cx="49" cy="13" r="2" fill="#F3F5E8" />
    </svg>
  );
}
