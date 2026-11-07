export interface ValidationError {
  field: string;
  message: string;
}

export class ValidationException extends Error {
  errors: ValidationError[];
  constructor(errors: ValidationError[]) {
    super(errors.map((e) => `${e.field}: ${e.message}`).join(', '));
    this.name = 'ValidationException';
    this.errors = errors;
  }
}

export function validateSuggestionInput(data: unknown): {
  text: string;
  category: string;
  department?: string | null;
  proof?: string;
} {
  const errors: ValidationError[] = [];
  if (!data || typeof data !== 'object') {
    throw new ValidationException([{ field: 'body', message: 'Corps JSON attendu' }]);
  }
  const obj = data as Record<string, unknown>;

  if (typeof obj.text !== 'string' || obj.text.trim().length < 20) {
    errors.push({ field: 'text', message: 'La suggestion doit faire au moins 20 caractères' });
  } else if (obj.text.trim().length > 600) {
    errors.push({ field: 'text', message: 'La suggestion ne doit pas dépasser 600 caractères' });
  }

  if (typeof obj.category !== 'string' || !obj.category.trim()) {
    errors.push({ field: 'category', message: 'La catégorie est obligatoire' });
  }

  const department = typeof obj.department === 'string' && obj.department.trim() ? obj.department.trim() : null;
  const proof = typeof obj.proof === 'string' ? obj.proof.trim() : undefined;

  if (errors.length > 0) {
    throw new ValidationException(errors);
  }

  return {
    text: (obj.text as string).trim(),
    category: (obj.category as string).trim(),
    department,
    proof,
  };
}

export function validateVoteInput(data: unknown): {
  suggestionId: string;
  value: 'useful' | 'not_useful';
  token: string;
} {
  const errors: ValidationError[] = [];
  if (!data || typeof data !== 'object') {
    throw new ValidationException([{ field: 'body', message: 'Corps JSON attendu' }]);
  }
  const obj = data as Record<string, unknown>;

  if (typeof obj.suggestionId !== 'string' || !obj.suggestionId.trim()) {
    errors.push({ field: 'suggestionId', message: 'Identifiant de suggestion manquant' });
  }

  if (obj.value !== 'useful' && obj.value !== 'not_useful') {
    errors.push({ field: 'value', message: "Valeur attendue : 'useful' ou 'not_useful'" });
  }

  if (typeof obj.token !== 'string' || !obj.token.trim()) {
    errors.push({ field: 'token', message: 'Jeton de vote manquant' });
  }

  if (errors.length > 0) {
    throw new ValidationException(errors);
  }

  return {
    suggestionId: (obj.suggestionId as string).trim(),
    value: obj.value as 'useful' | 'not_useful',
    token: (obj.token as string).trim(),
  };
}

export function validateMemberInput(data: unknown): {
  fullName: string;
  email: string;
  department: string | null;
  phone: string | null;
  documentsConsent: boolean;
  selfiePath: string | null;
  identityPath: string | null;
} {
  const errors: ValidationError[] = [];
  if (!data || typeof data !== 'object') {
    throw new ValidationException([{ field: 'body', message: 'Corps JSON attendu' }]);
  }
  const obj = data as Record<string, unknown>;

  const rawName = typeof obj.fullName === 'string' ? obj.fullName.trim() : '';
  const cleanName = rawName.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
  if (cleanName.length < 2) {
    errors.push({ field: 'fullName', message: 'Indiquez un nom de 2 caractères minimum' });
  } else if (cleanName.length > 80) {
    errors.push({ field: 'fullName', message: 'Le nom ne doit pas dépasser 80 caractères' });
  }

  const email = typeof obj.email === 'string' ? obj.email.trim() : '';
  if (email.length > 160 || !/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(email)) {
    errors.push({ field: 'email', message: 'Adresse e-mail invalide' });
  }

  const rawDepartment = typeof obj.department === 'string' ? obj.department.trim() : '';
  const department = rawDepartment ? rawDepartment.slice(0, 60) : null;

  const rawPhone = typeof obj.phone === 'string' ? obj.phone.trim() : '';
  const phone = rawPhone || null;
  if (phone && !/^[+0-9][0-9 \-()]{5,120}$/.test(phone)) {
    errors.push({ field: 'phone', message: 'Indiquez un numéro de téléphone valide' });
  }

  const documentsConsent = obj.documentsConsent === true;

  if (obj.consent !== true) {
    errors.push({ field: 'consent', message: 'L’accord pour l’envoi de la carte est obligatoire' });
  }

  if (!documentsConsent) {
    errors.push({ field: 'documentsConsent', message: 'Cochez la case pour autoriser la transmission des documents au bureau et au Studio' });
  }

  if (errors.length > 0) {
    throw new ValidationException(errors);
  }

  return {
    fullName: cleanName,
    email,
    department,
    phone,
    documentsConsent,
    selfiePath: typeof obj.selfiePath === 'string' ? obj.selfiePath.trim() || null : null,
    identityPath: typeof obj.identityPath === 'string' ? obj.identityPath.trim() || null : null,
  };
}

export function validateReportInput(data: unknown): {
  suggestionId: string;
  reason: string;
} {
  const errors: ValidationError[] = [];
  if (!data || typeof data !== 'object') {
    throw new ValidationException([{ field: 'body', message: 'Corps JSON attendu' }]);
  }
  const obj = data as Record<string, unknown>;

  if (typeof obj.suggestionId !== 'string' || !obj.suggestionId.trim()) {
    errors.push({ field: 'suggestionId', message: 'Identifiant de suggestion manquant' });
  }

  if (typeof obj.reason !== 'string' || !obj.reason.trim()) {
    errors.push({ field: 'reason', message: 'Motif du signalement obligatoire' });
  }

  if (errors.length > 0) {
    throw new ValidationException(errors);
  }

  return {
    suggestionId: (obj.suggestionId as string).trim(),
    reason: (obj.reason as string).trim(),
  };
}
