import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { PAGES, SITE } from './src/data/seo.js'
import { COMMON, TROUBLE } from './src/data/faq.js'

const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

// structured data for search engines: who we are on the home page, the FAQ on /help
function ldFor(route) {
  if (route === '/') {
    return [{
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'MCOP',
      alternateName: 'MCOP: Find a Minecraft buddy',
      url: SITE + '/',
      description: PAGES['/'].description,
      publisher: { '@type': 'Organization', name: 'MCOP', url: SITE, logo: SITE + '/assets/logo/mcop-static.png', sameAs: ['https://github.com/n3ev/mcop', 'https://instagram.com/neevchavla'] },
    }]
  }
  if (route === '/help') {
    return [{
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [...COMMON, ...TROUBLE].map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    }]
  }
  return []
}

// a copy of index.html per public page with its own title, description,
// canonical URL and link-preview tags. it's still the same app; this only
// changes what crawlers and link previews read before it runs. Vercel serves
// /about/index.html for /about before falling back to the SPA rewrite.
function staticPages() {
  let outDir = 'dist'
  return {
    name: 'mcop-static-pages',
    apply: 'build',
    configResolved(c) { outDir = path.resolve(c.root, c.build.outDir) },
    closeBundle() {
      const base = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8')
      for (const [route, meta] of Object.entries(PAGES)) {
        if (!meta.page) continue
        const url = SITE + (route === '/' ? '/' : route)
        const ld = ldFor(route).map(j => `<script type="application/ld+json">${JSON.stringify(j)}</script>`).join('\n    ')
        const html = base
          .replace(/<title>[^<]*<\/title>/, `<title>${esc(meta.title)}</title>`)
          .replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(meta.description)}$2`)
          .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`)
          .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(meta.title)}$2`)
          .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(meta.description)}$2`)
          .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${esc(meta.title)}$2`)
          .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${esc(meta.description)}$2`)
          .replace('</head>', `  <link rel="canonical" href="${url}" />\n    ${ld}\n  </head>`)
        const file = route === '/' ? path.join(outDir, 'index.html') : path.join(outDir, route.slice(1), 'index.html')
        fs.mkdirSync(path.dirname(file), { recursive: true })
        fs.writeFileSync(file, html)
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), staticPages()],
  server: { port: 5173, open: true },
})
