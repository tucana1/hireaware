/**
 * Text preparation.
 *
 * cleanText() + prepForModel() mirror clean_text() + prep() in
 * trial-modeling-news/model-recruitment-risk.py exactly, so the TypeScript classifier gives the same
 * scores as scikit-learn (checked by test/parity.test.ts). Don't change one side without the other.
 */
import type { Lang } from './types';

/** Characters Python's re `\s` matches in str patterns (str.isspace()). JS `\s` differs slightly. */
const PY_SPACE = '\\t\\n\\v\\f\\r\\x1c-\\x1f \\x85\\xa0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000';
const PY_SPACE_RUN = new RegExp(`[${PY_SPACE}]+`, 'g');

/** Windows-1252 mapping Python's html.unescape applies to numeric references 0x80-0x9F. */
const CP1252: Record<number, string> = {
  0x80: '€', 0x82: '‚', 0x83: 'ƒ', 0x84: '„', 0x85: '…', 0x86: '†', 0x87: '‡',
  0x88: 'ˆ', 0x89: '‰', 0x8a: 'Š', 0x8b: '‹', 0x8c: 'Œ', 0x8e: 'Ž', 0x91: '‘',
  0x92: '’', 0x93: '“', 0x94: '”', 0x95: '•', 0x96: '–', 0x97: '—', 0x98: '˜',
  0x99: '™', 0x9a: 'š', 0x9b: '›', 0x9c: 'œ', 0x9e: 'ž', 0x9f: 'Ÿ', 0x0d: '\r',
};

/** The named entities people actually meet in job ads. Python knows all 2,231; these cover real input. */
const NAMED: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—',
  hellip: '…', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', bull: '•',
  middot: '·', copy: '©', reg: '®', trade: '™', euro: '€', pound: '£',
  yen: '¥', cent: '¢', times: '×', laquo: '«', raquo: '»', deg: '°',
  rarr: '→', larr: '←', check: '✓', star: '☆', hearts: '♥', iexcl: '¡',
  iquest: '¿', aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú',
  ntilde: 'ñ', ccedil: 'ç', atilde: 'ã', otilde: 'õ', agrave: 'à', egrave: 'è',
  ecirc: 'ê', ocirc: 'ô', uuml: 'ü',
};
/** Entities Python also decodes without a trailing semicolon (HTML5 legacy entities). */
const LEGACY = new Set(['amp', 'lt', 'gt', 'quot', 'nbsp', 'copy', 'reg', 'deg', 'times', 'laquo', 'raquo', 'cent',
  'pound', 'yen', 'iexcl', 'iquest', 'aacute', 'eacute', 'iacute', 'oacute', 'uacute', 'ntilde', 'ccedil',
  'atilde', 'otilde', 'agrave', 'egrave', 'ecirc', 'ocirc', 'uuml', 'middot']);

export function decodeEntities(input: string): string {
  return input.replace(/&(#[0-9]+;?|#[xX][0-9a-fA-F]+;?|[A-Za-z][A-Za-z0-9]{0,31};?)/g, (whole, body: string) => {
    if (body.startsWith('#')) {
      const hex = body[1] === 'x' || body[1] === 'X';
      const num = parseInt(body.replace(/;$/, '').slice(hex ? 2 : 1), hex ? 16 : 10);
      if (num in CP1252) return CP1252[num]!;
      if (num === 0 || (num >= 0xd800 && num <= 0xdfff) || num > 0x10ffff) return '�';
      return String.fromCodePoint(num);
    }
    const name = body.endsWith(';') ? body.slice(0, -1) : body;
    if (NAMED[name] !== undefined && (body.endsWith(';') || LEGACY.has(name))) return NAMED[name]!;
    return whole;
  });
}

/** Mirrors clean_text(): html.unescape, strip tags, collapse whitespace, strip, lowercase. */
export function cleanText(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) return '';
  let value = decodeEntities(String(raw));
  value = value.replace(/<[^>]*>/g, ' ');
  value = value.replace(PY_SPACE_RUN, ' ').replace(/^ +| +$/g, '');
  return value.toLowerCase();
}

/** Mirrors prep(): NFKC (undoes 𝗳𝗮𝗻𝗰𝘆 letters) then lowercase. */
export function prepForModel(cleaned: string): string {
  return cleaned.normalize('NFKC').toLowerCase();
}

/**
 * Text for the red-flag rules: like the model input, plus zero-width characters removed and
 * quotes/dashes unified so patterns stay simple. Not used by the classifier.
 */
export function normalizeForRules(raw: string): string {
  return prepForModel(cleanText(raw))
    .replace(/[­​-‍⁠﻿]/g, '')
    .replace(/[‘’ʼ`´]/g, "'")
    .replace(/[“”„«»]/g, '"')
    .replace(/[‐-―−]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

export function wordCount(text: string): number {
  return (text.match(/[\p{L}\p{N}]+/gu) ?? []).length;
}

/** Small stop-word based language guess for the tipline and chatbot. Falls back to English. */
const LANG_HINTS: Record<Exclude<Lang, 'en'>, RegExp> = {
  fil: /(?<![\p{L}])(ang|ng|mga|sa|lang|po|ka|mo|kami|namin|bawal|wala|walang|kada|hindi|pag|ito|yung|kung|para sa|sahod|trabaho|magbayad|libre)(?![\p{L}])/giu,
  es: /(?<![\p{L}])(el|los|las|que|por|con|una|del|trabajo|pago|sueldo|empresa|usted|tu|te|para|cuentas|también|ningún|aquí)(?![\p{L}])|ción(?![\p{L}])/giu,
  pt: /(?<![\p{L}])(você|não|com|uma|vaga|salário|pagamento|empresa|para|seu|sua|também|aqui|está|são)(?![\p{L}])|ção(?![\p{L}])|ões(?![\p{L}])/giu,
  fr: /(?<![\p{L}])(le|les|des|et|pour|avec|vous|une|est|sur|dans|travail|salaire|emploi|votre|nous|pas|ne)(?![\p{L}])/giu,
  sw: /(?<![\p{L}])(na|ya|wa|kwa|ni|za|kazi|kila|hakuna|mshahara|tuma|lipa|sana|yako|kupitia|nafasi|wewe|sisi)(?![\p{L}])/giu,
  id: /(?<![\p{L}])(dan|yang|di|untuk|dengan|ini|itu|kerja|gaji|tidak|kami|akan|lowongan|bisa|anda|dari|ke)(?![\p{L}])/giu,
  hi: /(?<![\p{L}])(hai|ka|ki|ke|mein|aur|karo|kar|nahi|hoga|chahiye|paise|milega|hain|bhai|aap|apna)(?![\p{L}])|[ऀ-ॿ]{2,}/giu,
};
const EN_HINT = /(?<![\p{L}])(the|and|you|your|for|with|this|that|are|will|job|pay|work|our|we|is|to|of)(?![\p{L}])/giu;

export function detectLanguage(text: string): Lang {
  const sample = text.slice(0, 2000).toLowerCase();
  const en = (sample.match(EN_HINT) ?? []).length;
  let best: Lang = 'en';
  let bestScore = 0;
  for (const [lang, re] of Object.entries(LANG_HINTS) as Array<[Exclude<Lang, 'en'>, RegExp]>) {
    const score = (sample.match(re) ?? []).length;
    if (score > bestScore) {
      best = lang;
      bestScore = score;
    }
  }
  // Code-mixed text (Taglish, Hinglish) usually has plenty of English too; the other language wins
  // when it shows up at least half as often.
  return bestScore >= 2 && bestScore * 2 >= en ? best : 'en';
}
