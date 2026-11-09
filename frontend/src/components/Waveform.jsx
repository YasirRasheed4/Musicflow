export default function Waveform({ className = "" }) {
  return (
    <span className={`waveform ${className}`} aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
    </span>
  );
}
