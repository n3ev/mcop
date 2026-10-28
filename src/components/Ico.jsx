// a Minecraft item (or block, 'block:poppy') as a pixel-crisp inline icon —
// in place of emoji, which every OS draws differently and none draw blocky
export default function Ico({ name, className = '' }) {
  const [kind, file] = name.startsWith('block:') ? ['blocks', name.slice(6)] : ['items', name]
  return <img className={('ico ' + className).trim()} src={`/assets/textures/${kind}/${file}.png`} alt="" aria-hidden="true" draggable="false" />
}
