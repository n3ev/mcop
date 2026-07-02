import { playLever } from '../lib/sound.js'

// redstone lever — a real, accessible checkbox underneath.
// keyboard toggleable, proper label, focus-visible handled by global ring.
export default function Lever({ on, onChange, label }) {
  return (
    <label className={'lever' + (on ? ' lever-on' : '')}>
      <input
        type="checkbox"
        className="lever-input"
        checked={on}
        onChange={e => { playLever(); onChange(e.target.checked) }}
      />
      <span className="lever-base" aria-hidden="true"><span className="lever-handle" /></span>
      <span className="lever-label">{label}</span>
    </label>
  )
}
