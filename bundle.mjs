// node bundle.mjs — inlines model.js and game.js into dist/brickroom.html,
// a single file that runs anywhere (and publishes as one artifact page).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

let html = readFileSync('web/index.html', 'utf8');
for (const f of ['model.js', 'game.js']) {
  const src = readFileSync(`web/${f}`, 'utf8').replace(/<\/script/gi, '<\\/script');
  html = html.replace(`<script src="${f}"></script>`, () => `<script>\n${src}</script>`);
}
mkdirSync('dist', { recursive: true });
writeFileSync('dist/brickroom.html', html);
console.log(`dist/brickroom.html: ${(html.length / 1024).toFixed(0)} KB`);
