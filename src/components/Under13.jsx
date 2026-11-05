import { Link } from 'react-router-dom'

// shown instead of matching or an invite when someone says they're under 13
export default function Under13() {
  return (
    <section className="card center">
      <span className="tag">Sorry</span>
      <h2>MCOP is for players 13 and up</h2>
      <p className="muted">
        It puts you on a private server with another player, so it's only for teens and adults.
        Nothing you typed has been saved.
      </p>
      <p className="muted">
        Want a private world with friends you know in real life? Ask a parent about Minecraft
        Realms, Mojang's own servers for exactly that.
      </p>
      <Link to="/" className="btn">Back to the start</Link>
    </section>
  )
}
