/**
 * Déclarations minimales pour le graphe serveur : il importe des helpers
 * partagés qui lisent `import.meta.env.BASE_URL`, sans embarquer les types
 * Vite dans la compilation des fonctions.
 */
interface ImportMetaEnv {
  readonly BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
