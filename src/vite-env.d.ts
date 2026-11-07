/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WHATSAPP_URL?: string;
  readonly VITE_DOSSIER_EMAILS?: string;
  readonly VITE_UNION_EMAIL?: string;
  readonly VITE_DRAFT_NOTES?: string;
  readonly VITE_BASE?: string;
  readonly BASE_URL: string;
  readonly PROD: boolean;
  readonly DEV: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
