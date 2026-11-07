import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
let failures = 0;

function fail(message) {
  console.error(message);
  failures += 1;
}

// 1. Service Worker: Check that sw.js uses dynamic base / scope and not hardcoded root paths
const swFile = path.join(root, 'public/sw.js');
if (!existsSync(swFile)) {
  fail('public/sw.js introuvable.');
} else {
  const swContent = readFileSync(swFile, 'utf8');
  if (swContent.includes("cache.add('/')") || swContent.includes("cache.add('/index.html')")) {
    fail('public/sw.js : contient des chemins absolus vers la racine ("/") au lieu de la portée BASE_URL.');
  }
  if (!swContent.includes('self.registration.scope') && !swContent.includes('getBasePath')) {
    fail('public/sw.js : ne résout pas dynamiquement la portée BASE_URL.');
  }
}

// 2. Service Worker registration in src/main.tsx must use BASE_URL
const mainFile = path.join(root, 'src/main.tsx');
if (existsSync(mainFile)) {
  const mainContent = readFileSync(mainFile, 'utf8');
  if (mainContent.includes("navigator.serviceWorker.register('/sw.js')")) {
    fail('src/main.tsx : enregistre "/sw.js" sans tenir compte de BASE_URL.');
  }
  if (!mainContent.includes('import.meta.env.BASE_URL')) {
    fail('src/main.tsx : n’utilise pas import.meta.env.BASE_URL pour le Service Worker.');
  }
}

// 3. index.html: og:image must be an absolute URL
const htmlFile = path.join(root, 'index.html');
if (existsSync(htmlFile)) {
  const htmlContent = readFileSync(htmlFile, 'utf8');
  const ogImageMatch = htmlContent.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
  if (!ogImageMatch) {
    fail('index.html : balise og:image manquante.');
  } else {
    const ogImageUrl = ogImageMatch[1];
    if (
      !ogImageUrl.startsWith('http://') &&
      !ogImageUrl.startsWith('https://') &&
      !ogImageUrl.startsWith('__SITE_URL__')
    ) {
      fail(`index.html : og:image doit être une URL absolue ou utiliser __SITE_URL__ (trouvé : "${ogImageUrl}").`);
    }
  }
}

// 4. Server share endpoint: /p/:slug must serve OG tags and redirect
const serverFile = path.join(root, 'server/api.ts');
if (existsSync(serverFile)) {
  const serverContent = readFileSync(serverFile, 'utf8');
  if (!serverContent.includes('/p/')) {
    fail('server/api.ts : route /p/:slug manquante.');
  }
  if (!serverContent.includes('og:title') || !serverContent.includes('og:image')) {
    fail('server/api.ts : la route /p/:slug ne génère pas les balises Open Graph.');
  }
  if (!serverContent.includes('/#/journal/')) {
    fail('server/api.ts : la route /p/:slug ne redirige pas vers /#/journal/:slug.');
  }
  if (!serverContent.includes('/api/v1/share/')) {
    fail('server/api.ts : la route /api/v1/share/:slug est absente.');
  }
}

// 5. Vercel: /p/:slug and /api/* must reach the single function with the path preserved
const vercelFile = path.join(root, 'vercel.json');
if (!existsSync(vercelFile)) {
  fail('vercel.json introuvable.');
} else {
  const config = JSON.parse(readFileSync(vercelFile, 'utf8'));
  const rewrites = Array.isArray(config.rewrites) ? config.rewrites : [];
  const shareRewrite = rewrites.find(
    (rule) =>
      rule &&
      typeof rule.source === 'string' &&
      typeof rule.destination === 'string' &&
      /^\/p\//.test(rule.source) &&
      rule.destination.includes('__path=v1/share/'),
  );
  if (!shareRewrite) {
    fail('vercel.json : /p/:slug doit être réécrit vers /api?__path=v1/share/:slug.');
  }
  const apiRewrite = rewrites.find(
    (rule) =>
      rule &&
      typeof rule.source === 'string' &&
      typeof rule.destination === 'string' &&
      rule.source.includes('/api/') &&
      rule.destination.includes('__path='),
  );
  if (!apiRewrite) {
    fail('vercel.json : /api/* doit être réécrit vers /api?__path=... pour conserver le chemin.');
  }
}

if (failures > 0) {
  console.error(`\nRoutes : ${failures} problème(s).`);
  process.exit(1);
}

console.log('Routes : Service Worker sous BASE_URL, og:image absolue, /p/:slug et /api/v1/share/:slug vérifiés.');
