import { readFile, writeFile } from 'node:fs/promises';
import { del, get, list, put } from '@vercel/blob';

/**
 * Accès au Blob privé des sauvegardes.
 *
 *   node scripts/blob-store.mjs put <fichier> <chemin>
 *   node scripts/blob-store.mjs list [préfixe]
 *   node scripts/blob-store.mjs get <chemin> <fichier>
 *   node scripts/blob-store.mjs delete <chemin>
 *
 * Le jeton n’est jamais affiché. Il vient de BLOB_PRIVATE_READ_WRITE_TOKEN.
 */
const token = process.env.BLOB_PRIVATE_READ_WRITE_TOKEN;
if (!token) {
  console.error('BLOB_PRIVATE_READ_WRITE_TOKEN absent.');
  process.exit(1);
}

const [command, ...args] = process.argv.slice(2);

function fail(message) {
  console.error(message);
  process.exit(1);
}

function contentType(pathname) {
  if (pathname.endsWith('.json')) return 'application/json';
  return 'application/octet-stream';
}

try {
  if (command === 'put') {
    const [file, pathname] = args;
    if (!file || !pathname) fail('Usage : put <fichier> <chemin>.');
    const body = await readFile(file);
    const result = await put(pathname, body, {
      access: 'private',
      token,
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: contentType(pathname),
    });
    console.log(result.pathname);
  } else if (command === 'list') {
    const prefix = args[0] || 'backups/';
    let cursor;
    const pathnames = [];
    do {
      const page = await list({ token, prefix, cursor, limit: 1000 });
      pathnames.push(...page.blobs.map((blob) => blob.pathname));
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
    for (const pathname of pathnames.sort()) console.log(pathname);
  } else if (command === 'get') {
    const [pathname, file] = args;
    if (!pathname || !file) fail('Usage : get <chemin> <fichier>.');
    const result = await get(pathname, { access: 'private', token });
    if (!result || result.statusCode !== 200) fail(`Objet introuvable : ${pathname}.`);
    await writeFile(file, Buffer.from(await new Response(result.stream).arrayBuffer()));
    console.log(`${pathname} -> ${file}`);
  } else if (command === 'delete') {
    const [pathname] = args;
    if (!pathname) fail('Usage : delete <chemin>.');
    await del(pathname, { token });
    console.log(pathname);
  } else {
    fail('Commande attendue : put, list, get ou delete.');
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Échec du stockage privé.');
  process.exit(1);
}
