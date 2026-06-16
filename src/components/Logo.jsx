// MCOP wordmark — 2x2 grid: M, C, fireplace-O, planks-P.
// Placeholder until the real art lands: drop an image at
// public/assets/logo/mcop.png and set USE_IMAGE = true (one-line swap).
const USE_IMAGE = false

export default function Logo({ size = 84 }) {
  if (USE_IMAGE) {
    return <img className="mcop-logo-img" src="/assets/logo/mcop.png" alt="MCOP" style={{ height: size * 2 }} />
  }
  return (
    <div className="mcop-logo" role="img" aria-label="MCOP" style={{ '--tile': size + 'px' }}>
      <span className="logo-tile logo-letter">M</span>
      <span className="logo-tile logo-letter">C</span>
      <span className="logo-tile logo-fire" aria-hidden="true"><span className="logo-flame" /></span>
      <span className="logo-tile logo-plank">P</span>
    </div>
  )
}
