import { useEffect, useState } from 'react'

// real quotes players sent in over Instagram. no fabricated testimonials.
export const REVIEWS = [
  {
    handle: '@neevchavla',
    initial: 'N',
    text: '"Tried r/minecraftbuddies for weeks. Two replies, nothing came of either. Set up MCOP in 60 seconds, matched in under a minute, and played for two hours straight. Actually made a proper friend."',
    source: 'via Instagram',
  },
  {
    handle: '@ayman_alam1',
    initial: 'A',
    text: '"r/minecraftbuddies took 3 days to get one low-effort reply. MCOP matched me in 40 seconds with someone who had the exact same playstyle. We swapped Discords at the end. Still playing together."',
    source: 'via Instagram',
  },
  {
    handle: '@neevchavla',
    initial: 'N',
    text: '"Hadn\'t opened Minecraft in months. A world by yourself gets old fast. First MCOP session we built a massive base together. Already planning a third session. This actually makes Minecraft feel alive again."',
    source: 'via Instagram',
  },
  {
    handle: '@ayman_alam1',
    initial: 'A',
    text: '"Didn\'t think a random matchmaking site would work but here we are. Got matched with someone also into Redstone and we spent the whole hour planning an automatic farm. Rare W, genuinely."',
    source: 'via Instagram',
  },
]

// auto-advancing testimonial carousel, framed for a .pair slot
export default function Reviews() {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % REVIEWS.length), 6000)
    return () => clearInterval(t)
  }, [])
  const r = REVIEWS[idx]
  return (
    <div className="frame reviews-section">
      <p className="section-eyebrow">What players say</p>
      <div className="review-card">
        <div className="review-stars" aria-label="5 out of 5">★★★★★</div>
        <p className="review-text">{r.text}</p>
        <div className="review-author">
          <div className="review-avatar" aria-hidden="true">{r.initial}</div>
          <div>
            <div className="review-handle">{r.handle}</div>
            <div className="review-source">{r.source}</div>
          </div>
        </div>
      </div>
      <div className="review-dots">
        {REVIEWS.map((_, i) => (
          <button
            key={i}
            className={`review-dot${i === idx ? ' active' : ''}`}
            aria-label={`Review ${i + 1}`}
            onClick={() => setIdx(i)}
          />
        ))}
      </div>
    </div>
  )
}
