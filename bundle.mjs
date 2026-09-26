// node bundle.mjs — builds the two deliverables from web/:
//   dist/brickroom.html   one self-contained file (three.js from cdnjs); published as the artifact
//   docs/                 the GitHub Pages site: installable PWA, offline, plus the research report at docs/research/
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';

const inline = (html) => {
  for (const f of ['model.js', 'game.js']) {
    const src = readFileSync(`web/${f}`, 'utf8').replace(/<\/script/gi, '<\\/script');
    html = html.replace(`<script src="${f}"></script>`, () => `<script>\n${src}</script>`);
  }
  return html;
};
const CDN = '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>';
const page = readFileSync('web/index.html', 'utf8');

mkdirSync('dist', { recursive: true });
const single = inline(page);
writeFileSync('dist/brickroom.html', single);

// GitHub Pages / PWA build
const build = Date.now().toString(36);
const head = [
  '<!doctype html>',
  '<html lang="en">',
  '<meta charset="utf-8">',
  '<meta name="theme-color" content="#1F2A44">',
  '<meta name="description" content="A playroom photo turned into a buildable 454-part LEGO model, an isometric tidy-up game and step-by-step build instructions.">',
  '<link rel="manifest" href="manifest.webmanifest">',
  '<link rel="icon" href="icons/icon-192.png">',
  '<link rel="apple-touch-icon" href="icons/icon-180.png">',
  '<meta name="apple-mobile-web-app-capable" content="yes">',
  '<meta name="apple-mobile-web-app-status-bar-style" content="default">',
].join('\n');
const register = `<script>if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('sw.js'));</script>`;
const pwa = head + '\n' + inline(page).replace(CDN, '<script src="vendor/three.min.js"></script>') + register + '\n';
mkdirSync('docs/research', { recursive: true });
writeFileSync('docs/index.html', pwa);
writeFileSync('docs/sw.js', readFileSync('web/sw.js', 'utf8').replace('__BUILD__', build));
copyFileSync('web/manifest.webmanifest', 'docs/manifest.webmanifest');
writeFileSync('docs/.nojekyll', '');

// Research report as a sub-page
const report = readFileSync('research/opus55-brickworks.html', 'utf8');
writeFileSync(
  'docs/research/index.html',
  '<!doctype html>\n<html lang="en">\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<link rel="icon" href="../icons/icon-192.png">\n' + report,
);

console.log(`dist/brickroom.html ${(single.length / 1024).toFixed(0)} KB · docs/index.html ${(pwa.length / 1024).toFixed(0)} KB · sw ${build}`);
