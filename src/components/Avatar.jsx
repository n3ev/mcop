// renders a player's minecraft skin head from their username.
// minotar serves a default steve head for unknown names, so no fallback needed.
export default function Avatar({ name, size = 48, className = '' }) {
  const safe = encodeURIComponent((name || 'Steve').trim() || 'Steve')
  return (
    <img
      className={'mc-avatar ' + className}
      src={`https://minotar.net/helm/${safe}/${size * 2}.png`}
      alt={name || 'player'}
      width={size}
      height={size}
      loading="lazy"
    />
  )
}
