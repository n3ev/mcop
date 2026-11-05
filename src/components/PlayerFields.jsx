import { ageQuestion } from '../data/fixedQuestions.js'

// "who are you" for the invite pages: a name to show, the Minecraft username
// that gets whitelisted, and the age group. an account fills in what it knows.
export const MC_RE = /^[A-Za-z0-9_]{3,16}$/

export default function PlayerFields({ name, setName, mc, setMc, age, setAge, user }) {
  const savedAge = user?.preferences?.age
  return (
    <div className="player-fields">
      {user?.mcVerified ? (
        <p className="muted small field-wide">Playing as <strong>{user.mcUsername}</strong>, your linked Minecraft account.</p>
      ) : (
        <>
          <label className="field">
            <span className="field-label">Your name</span>
            <input className="text-input" maxLength={24} value={name} onChange={e => setName(e.target.value)} placeholder="What your friend sees" autoComplete="nickname" />
          </label>
          <label className="field">
            <span className="field-label">Minecraft username (Java)</span>
            <input className="text-input" maxLength={16} value={mc} onChange={e => setMc(e.target.value.trim())} placeholder="e.g. Steve" autoComplete="username" spellCheck="false" />
            {mc && !MC_RE.test(mc) && <span className="auth-error small">3 to 16 letters, numbers or underscores</span>}
          </label>
        </>
      )}
      {!savedAge && (
        <fieldset className="field field-wide">
          <legend className="field-label">{ageQuestion.text}</legend>
          <div className="chip-row">
            {ageQuestion.options.map(o => (
              <button type="button" key={o} className={'chip' + (age === o ? ' chip-active' : '')} aria-pressed={age === o} onClick={() => setAge(o)}>{o}</button>
            ))}
          </div>
        </fieldset>
      )}
    </div>
  )
}
