import Ico from './Ico.jsx'

// the in-game modes (ids match the MCOPSession plugin's)
export const MODES = [
  { id: 'quest', name: 'Survival Quests', icon: 'writable_book', blurb: 'Tracked goals to chase together, one after another' },
  { id: 'build', name: 'Build Battle', icon: 'block:planks', blurb: 'A secret theme, a plot each, then rate each other' },
  { id: 'lab', name: 'Redstone Lab', icon: 'redstone', blurb: '12 puzzle rooms that check your circuit for you' },
  { id: 'oneblock', name: 'One Block', icon: 'block:grass-side', blurb: 'One block in the void. Mine it, it changes' },
  { id: 'copycat', name: 'Copycat', icon: 'spyglass', blurb: "Build in secret, then copy each other's build" },
  { id: 'free', name: 'Just Play', icon: 'campfire', blurb: 'Plain survival, no goals' },
]
export const modeName = (id) => MODES.find(m => m.id === id)?.name || id

// what you two are doing this hour, live from the game server: the mode menu
// until you've picked, then the objective and its progress
export default function HourPanel({ live, suggest, partnerName }) {
  const playing = live?.phase === 'playing' && live.mode
  if (!playing) {
    const choosing = live?.phase === 'choosing'
    return (
      <div className="quest-banner hour-panel">
        <span className="quest-label"><Ico name="compass_00" className="btn-ico" />Your hour</span>
        <span className="quest-text">
          {choosing ? 'Pick a mode in the menu that just opened in-game.' : `When you and ${partnerName || 'your buddy'} are both in, you'll pick what to do:`}
        </span>
        <div className="hour-modes">
          {MODES.map(m => {
            const voters = Object.entries(live?.votes || {}).filter(([, v]) => v === m.id).map(([n]) => n)
            return (
              <span key={m.id} className={'hour-mode' + (m.id === suggest ? ' suggested' : '')} title={m.blurb}>
                <Ico name={m.icon} className="btn-ico" />{m.name}
                {m.id === suggest && <em> · picked for you two</em>}
                {voters.length > 0 && <em className="hour-vote"> · {voters.join(' + ')}</em>}
              </span>
            )
          })}
        </div>
        <span className="muted small">Change it any time: type <code>/hour</code> in chat.</span>
      </div>
    )
  }
  const mode = MODES.find(m => m.id === live.mode)
  const pct = typeof live.pct === 'number' && live.pct >= 0 ? live.pct : null
  return (
    <div className="quest-banner hour-panel">
      <span className="quest-label"><Ico name={mode?.icon || 'compass_00'} className="btn-ico" />{live.modeName || modeName(live.mode)}</span>
      <span className="quest-text">{live.quest?.title ? `Quest ${live.quest.n}: ${live.quest.title}` : live.objective}</span>
      {live.quest?.how && <span className="muted small">{live.quest.how}</span>}
      {live.quest?.each && (
        <div className="hour-each">
          {Object.entries(live.quest.each).map(([name, ok]) => (
            <span key={name} className={ok ? 'success small' : 'muted small'}>{ok ? '✔' : '✘'} {name}</span>
          ))}
        </div>
      )}
      {pct !== null && (
        <div className="hour-progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progress">
          <div className="hour-progress-fill" style={{ width: pct + '%' }} />
        </div>
      )}
      <span className="muted small">
        {live.mode === 'quest' && `${live.questsDone || 0} done so far · /quest for tips, /quest skip to swap`}
        {live.mode === 'lab' && 'Stuck in a room? /hint in chat'}
        {live.mode === 'build' && (live.build?.phase === 'build' ? 'No peeking at your buddy\'s plot · /theme done when you both finish' : 'Showcase: rate each other\'s builds')}
        {live.mode === 'oneblock' && live.oneblock && `Phase ${live.oneblock.phase}: ${live.oneblock.phaseName}`}
        {live.mode === 'copycat' && (live.copycat?.phase === 'copy' ? 'Copy their design block for block. The server scores it live' : 'Design something small. Your buddy has to copy it')}
        {live.mode === 'free' && 'No goals, just the two of you'}
        {' · '}/hour to switch modes
      </span>
    </div>
  )
}
