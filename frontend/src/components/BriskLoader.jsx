export default function BriskLoader({ label = "Loading", fullScreen = false }) {
  return (
    <div className={`brisk-loader${fullScreen ? " brisk-loader-screen" : ""}`} role="status" aria-live="polite" aria-label={label}>
      <span className="brisk-loader-orbit" aria-hidden="true"><i /><i /><i /></span>
      <span className="brisk-loader-wordmark">brisk <b>lifestyles</b></span>
      <span className="brisk-loader-caption">{label}<span className="loader-dots" aria-hidden="true">…</span></span>
    </div>
  );
}
