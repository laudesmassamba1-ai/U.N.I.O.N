import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleApiRequest } from '../server/api.js';

/**
 * Vercel ne fournit pas de catch-all multi-segments pour les fonctions API.
 * vercel.json réécrit /api/* vers cette fonction avec le chemin dans __path ;
 * on le remet dans req.url avant de laisser le routeur historique décider.
 */
function restoreInternalPath(req: IncomingMessage): void {
  const raw = req.url || '/';
  const queryAt = raw.indexOf('?');
  if (queryAt === -1) return;
  const params = new URLSearchParams(raw.slice(queryAt + 1));
  const internal = params.get('__path');
  if (internal === null) return;
  params.delete('__path');
  const query = params.toString();
  req.url = `/api/${internal.replace(/^\/+/, '')}${query ? `?${query}` : ''}`;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  restoreInternalPath(req);
  const handled = await handleApiRequest(req, res);
  if (!handled) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Route introuvable' }));
  }
}
