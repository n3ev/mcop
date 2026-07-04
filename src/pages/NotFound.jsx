import { useNavigate } from 'react-router-dom'

// catch-all route: falling out of the world, themed appropriately
export default function NotFound() {
  const nav = useNavigate()
  return (
    <section className="card center">
      <span className="tag">Y: -2147483648</span>
      <h2>You fell out of the world</h2>
      <p className="muted">
        This page doesn't exist, or a creeper got to it. Either way,
        there's nothing down here but the void.
      </p>
      <button className="btn primary big" style={{ marginTop: 18 }} onClick={() => nav('/')}>
        Respawn at world spawn
      </button>
    </section>
  )
}
