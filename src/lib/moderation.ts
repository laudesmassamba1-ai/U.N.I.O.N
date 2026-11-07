import forbidden from '../../forbidden-ethnonyms.json' with { type: 'json' };
import { SUGGESTION_MAX, SUGGESTION_MIN } from './suggestions.js';

export type ModerationCode =
  | 'too_short'
  | 'too_long'
  | 'category'
  | 'personal'
  | 'link'
  | 'hate'
  | 'duplicate';

export interface ModerationResult {
  ok: boolean;
  code: ModerationCode | null;
  flagged?: boolean;
  flagReason?: string;
}

const urlPattern = /(https?:\/\/|www\.|[a-z0-9-]+\.(?:com|org|net|cd|cg|fr|io)\b)/i;
const emailPattern = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
const phonePattern = /(?:\+?242|0)\s?[0-9](?:[\s./-]?[0-9]){7,}/;
const longDigitsPattern = /(?:\d[\s./-]?){8,}/;
const namePattern =
  /(?:je m['’]?appelle|mon nom est|mon pr[ée]nom est|nomm[ée]e?\s+[A-ZÉÈÀÂÎÔÛ])/i;
const repeatedPattern = /(.)\1{8,}/;

const ethnonyms: string[] = forbidden.ethnonyms;
const hateMarkers: string[] = forbidden.hateMarkers;

export function moderationMessage(code: ModerationCode): string {
  switch (code) {
    case 'too_short':
      return 'La suggestion doit contenir au moins 20 caractères.';
    case 'too_long':
      return 'La suggestion ne doit pas dépasser 600 caractères.';
    case 'category':
      return 'Choisissez une catégorie.';
    case 'personal':
      return 'Retirez les numéros de téléphone, les adresses et les e-mails.';
    case 'link':
      return 'Les liens ne sont pas acceptés.';
    case 'hate':
      return 'Ce texte contient des insultes ou des propos haineux qui ne sont pas acceptés.';
    case 'duplicate':
      return 'Cette suggestion a déjà été déposée.';
    default:
      return 'La suggestion ne peut pas être déposée.';
  }
}

export function normaliseForComparison(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function analyseSuggestion(input: {
  text: string;
  category: string;
  existingTexts?: string[];
}): ModerationResult {
  const text = input.text.trim();
  const normalised = normaliseForComparison(text);
  if (!input.category) return { ok: false, code: 'category' };
  if (text.length < SUGGESTION_MIN) return { ok: false, code: 'too_short' };
  if (text.length > SUGGESTION_MAX) return { ok: false, code: 'too_long' };
  if (repeatedPattern.test(text)) return { ok: false, code: 'hate' };
  if (emailPattern.test(text) || phonePattern.test(text) || longDigitsPattern.test(text)) {
    return { ok: false, code: 'personal' };
  }
  if (urlPattern.test(text)) return { ok: false, code: 'link' };
  if (namePattern.test(text)) return { ok: false, code: 'personal' };

  // Hate markers are strictly refused at submission
  if (hateMarkers.some((term) => containsTerm(normalised, term))) {
    return { ok: false, code: 'hate' };
  }

  if (
    input.existingTexts?.some(
      (existing) => normaliseForComparison(existing) === normalised,
    )
  ) {
    return { ok: false, code: 'duplicate' };
  }

  // Ethnonyms are flagged for human review in moderation queue rather than rejected on input
  const foundEthnonym = ethnonyms.find((term) => containsTerm(normalised, term));
  if (foundEthnonym) {
    return { ok: true, code: null, flagged: true, flagReason: `ethnonyme: ${foundEthnonym}` };
  }

  return { ok: true, code: null };
}

function containsTerm(normalised: string, term: string): boolean {
  const target = normaliseForComparison(term);
  if (!target) return false;
  return new RegExp(`(^| )${escapeRegExp(target)}( |$)`).test(normalised);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
