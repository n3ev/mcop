import { useState } from 'react'
import Lever from './Lever.jsx'
import { isMuted, setMuted } from '../lib/sound.js'

export default function SoundToggle() {
  const [on, setOn] = useState(!isMuted()) // lever ON = sound on
  return (
    <Lever
      on={on}
      label={on ? 'Sound on' : 'Sound off'}
      onChange={(checked) => { setOn(checked); setMuted(!checked) }}
    />
  )
}
