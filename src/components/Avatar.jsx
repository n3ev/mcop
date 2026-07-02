import { useState } from 'react'

// renders a player's minecraft skin head from their username.
// minotar serves a default steve head for unknown names; if minotar itself
// is unreachable we fall back to an initial in an inventory slot.
export default function Avatar({ name, size = 48, className = '' }) {
  const [failed, setFailed] = useState(false)
  const label = (name || 'Steve').trim() || 'Steve'
  if (failed) {
    return (
      <span
        className={'mc-avatar mc-avatar-fallback ' + className}
        style={{ width: size, height: size, fontSize: size * 0.42 }}
        role="img"
        aria-label={label}
      >
        {label[0].toUpperCase()}
      </span>
    )
  }
  return (
    <img
      className={'mc-avatar ' + className}
      src={`https://minotar.net/helm/${encodeURIComponent(label)}/${size * 2}.png`}
      alt={label}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  )
}
