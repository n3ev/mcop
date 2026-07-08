import { playLever } from '../lib/sound.js'

// a real cobblestone lever (Neev's render). two actual positions from the same
// sheet — handle up when on, down when off — cropped so the block stays put and
// only the handle throws. accessible checkbox under it.
export default function Lever({ on, onChange, label }) {
  return (
    <label className={'lever' + (on ? ' lever-on' : '')}>
      <input
        type="checkbox"
        className="lever-input"
        checked={on}
        onChange={e => { playLever(); onChange(e.target.checked) }}
      />
      <img
        className="lever-img"
        src={on ? '/assets/textures/lever-on.png' : '/assets/textures/lever-off.png'}
        alt=""
        aria-hidden="true"
        draggable="false"
      />
      <span className="lever-label">{label}</span>
    </label>
  )
}
