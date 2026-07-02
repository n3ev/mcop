// achievement toasts — fire from anywhere, rendered once in App
export function toast(text, title = 'Achievement Get!', icon = '/assets/textures/blocks/ore-diamond.png') {
  window.dispatchEvent(new CustomEvent('mcop:toast', { detail: { text, title, icon } }))
}
