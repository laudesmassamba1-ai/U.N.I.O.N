import { put } from '@vercel/blob';

export interface ObjectStoreEnv {
  BLOB_PUBLIC_READ_WRITE_TOKEN?: string;
  BLOB_READ_WRITE_TOKEN?: string;
}

export interface ObjectStore {
  put(key: string, body: string, contentType?: string): Promise<void>;
}

/**
 * Écriture serveur dans le Blob public (Vercel Blob).
 * `BLOB_READ_WRITE_TOKEN` est le nom posé par Vercel ; le nom préfixé
 * `BLOB_PUBLIC_READ_WRITE_TOKEN` sert au développement local avec deux Blobs.
 */
export function createObjectStore(env: ObjectStoreEnv = process.env): ObjectStore | null {
  const token = env.BLOB_PUBLIC_READ_WRITE_TOKEN || env.BLOB_READ_WRITE_TOKEN;
  if (!token) return null;

  return {
    async put(key, body, contentType = 'application/json') {
      await put(key, body, {
        access: 'public',
        token,
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType,
        cacheControlMaxAge: 60,
      });
    },
  };
}
