import { describe, expect, it } from "vitest";
import { GLOSSARY, linkTerms, undefinedAcronyms } from "./glossary";

describe("the glossary", () => {
  it("underlines only the first use of a term, with its definition", () => {
    const html = linkTerms("<p>A cache is fast. Every cache helps.</p>");
    expect(html.match(/<abbr/g)?.length).toBe(1);
    expect(html).toContain(`data-def="${GLOSSARY.cache.def}"`);
  });

  it("shares first use across blocks when given one set", () => {
    const seen = new Set<string>();
    expect(linkTerms("<p>The TTL matters.</p>", seen)).toContain("<abbr");
    expect(linkTerms("<p>A short TTL spreads fast.</p>", seen)).not.toContain("<abbr");
  });

  it("matches other spellings and prefers the longest", () => {
    expect(linkTerms("<p>Two replicas.</p>")).toContain(">replicas</abbr>");
    expect(linkTerms("<p>An IP address.</p>")).toContain(">IP address</abbr>");
  });

  it("leaves code, links and headings alone", () => {
    expect(linkTerms("<pre><code>const cache = 1;</code></pre>")).not.toContain("<abbr");
    expect(linkTerms('<h2>Caching</h2><a href="#">cache</a>')).not.toContain("<abbr");
    expect(linkTerms("<p><code>cache</code> and a cache</p>")).toBe(`<p><code>cache</code> and a <abbr class="term" tabindex="0" data-def="${GLOSSARY.cache.def.replace(/"/g, "&quot;")}">cache</abbr></p>`);
  });

  it("never matches inside a longer word", () => {
    expect(linkTerms("<p>Cachet and tipping.</p>")).not.toContain("<abbr");
  });

  it("finds all-caps jargon the glossary doesn't define", () => {
    expect(undefinedAcronyms("DNS and TTL are defined, but QPS is not. `XYZ` in code is fine.")).toEqual(["QPS"]);
  });
});
