// Plain-words glossary: underline the first use of each term in rendered HTML, with
// its definition as a hover/tap tooltip. Pure string work, so it runs (and is tested)
// without a DOM.
import { load as loadYaml } from "js-yaml";
import raw from "/content/glossary.yaml?raw";

export interface GlossaryEntry {
  def: string;
  match?: string[];
}

export const GLOSSARY = loadYaml(raw) as Record<string, GlossaryEntry>;

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const escapeAttr = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/** Every spelling → its glossary term, longest spellings first so "IP address" wins over "IP". */
const SPELLINGS: { spelling: string; term: string }[] = Object.entries(GLOSSARY)
  .flatMap(([term, e]) => [term, ...(e.match ?? [])].map((spelling) => ({ spelling, term })))
  .sort((a, b) => b.spelling.length - a.spelling.length);

const PATTERN = new RegExp(`(?<![\\w-])(${SPELLINGS.map((s) => escapeRe(s.spelling)).join("|")})(?![\\w-])`, "gi");
const termFor = (text: string) => SPELLINGS.find((s) => s.spelling.toLowerCase() === text.toLowerCase())?.term;

/** Tags whose text is never underlined. */
const SKIP = new Set(["code", "pre", "a", "abbr", "h1", "h2", "h3", "button", "kbd"]);

/**
 * Wraps the first use of each glossary term (per `seen` set) in an <abbr> tooltip.
 * `seen` is shared across calls so a lecture underlines a term once, not once per block.
 */
export function linkTerms(html: string, seen: Set<string> = new Set()): string {
  let skipDepth = 0;
  return html
    .split(/(<[^>]+>)/)
    .map((part) => {
      if (part.startsWith("<")) {
        const m = /^<(\/?)([a-z0-9]+)/i.exec(part);
        if (m && SKIP.has(m[2].toLowerCase()) && !part.endsWith("/>")) skipDepth += m[1] ? -1 : 1;
        skipDepth = Math.max(0, skipDepth);
        return part;
      }
      if (skipDepth > 0 || !part.trim()) return part;
      return part.replace(PATTERN, (match) => {
        const term = termFor(match);
        if (!term || seen.has(term)) return match;
        seen.add(term);
        return `<abbr class="term" tabindex="0" data-def="${escapeAttr(GLOSSARY[term].def)}">${match}</abbr>`;
      });
    })
    .join("");
}

/** All-caps words (2-5 letters) that need no glossary entry. */
const COMMON_CAPS = new Set(["OK", "UI", "US", "UK", "PM", "AM", "ID", "IDS", "GET", "POST", "PUT", "PATCH", "DELETE", "JSON", "URL", "URLS", "GB", "TB", "MB", "KB", "MS", "CPU", "RAM", "HUD", "FAQ", "README", "TODO", "ISP", "ETA", "SHIELD", "AIM", "AND", "OR", "NOT", "TS", "JS", "CSS", "HTML", "PR"]);

/** All-caps jargon in some prose that the glossary doesn't define (for the validator). */
export function undefinedAcronyms(text: string): string[] {
  const prose = text.replace(/```[\s\S]*?```/g, "").replace(/`[^`]*`/g, "");
  const known = new Set(SPELLINGS.map((s) => s.spelling.toUpperCase()));
  const found = new Set<string>();
  for (const m of prose.matchAll(/(?<![\w.-])([A-Z][A-Z0-9]{1,4})s?(?![\w-])/g)) {
    const word = m[1];
    if (!known.has(word) && !COMMON_CAPS.has(word) && !/^\d/.test(word) && !/^[A-Z]\d+$/.test(word)) found.add(word);
  }
  return [...found];
}
