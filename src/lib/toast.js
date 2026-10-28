// toasts — fire from anywhere, rendered once in App, the way Minecraft does
// them: a slab sliding in at the top right. toast('Message sent') is a plain
// note; advancements come from lib/achievements.js with their own kind.
// icon: any 16px texture path.
export function toast(text, icon = '/assets/textures/items/writable_book.png') {
  window.dispatchEvent(new CustomEvent('mcop:toast', { detail: { title: text, text: '', icon, kind: 'info' } }))
}
