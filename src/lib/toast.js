// achievement toasts — fire from anywhere, rendered once in App.
// pass rare=true for the purple challenge styling.
export function toast(text, title = 'Achievement Get!', icon = '/assets/textures/blocks/ore-diamond.png', rare = false) {
  window.dispatchEvent(new CustomEvent('mcop:toast', { detail: { text, title, icon, rare } }))
}
