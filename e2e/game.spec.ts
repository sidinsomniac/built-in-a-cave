import { expect, test, type Page } from "@playwright/test";

/** Story pop-ups appear on first visits; skip them whenever they show up. */
async function autoSkipScenes(page: Page) {
  await page.addLocatorHandler(page.getByTestId("scene-skip"), (skip) => skip.click(), { noWaitAfter: true });
}

async function setCode(page: Page, code: string) {
  const editor = page.getByTestId("editor").locator(".cm-content");
  await editor.click();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.press("Delete");
  await page.keyboard.insertText(code);
}

test.describe("with motion", () => {
  test.use({ contextOptions: { reducedMotion: "no-preference" } });
  test("JARVIS boots up once, can be skipped, and story lines type out", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("boot")).toBeVisible();
    await page.getByTestId("boot").click();
    await expect(page.getByTestId("boot")).toHaveCount(0);
    await expect(page.getByTestId("cutscene")).toContainText("Incoming transmission");
    await page.getByTestId("scene-next").click(); // finishes typing the line
    await expect(page.getByTestId("cutscene")).toContainText("Everywhere.");
    await page.reload();
    await expect(page.getByTestId("boot")).toHaveCount(0);
  });
});

test("the home screen shows the Phases, with one story at a time", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("cutscene")).toHaveCount(1);
  await expect(page.getByTestId("cutscene")).toContainText("Stark Expo");
  await page.getByTestId("scene-skip").click();
  await expect(page.getByRole("heading", { name: "The Cave" })).toBeVisible();
  await expect(page.getByTestId("case-b01")).toBeVisible();
});

test("a lesson: an ordered sequence and a prediction, each graded into a zone", async ({ page }) => {
  await autoSkipScenes(page);
  await page.goto("/#/lesson/p1-l03");
  await expect(page.getByTestId("diagram").first()).toBeVisible();
  // Jargon is underlined once, with a plain definition.
  await expect(page.locator("abbr.term", { hasText: "DNS" }).first()).toHaveAttribute("data-def", /phone book/);
  await expect(page.getByTestId("beat")).toContainText("reaches every resolver");
  await page.getByTestId("tab-warmup").click();

  // Put the DNS steps in order with the ▲ buttons.
  const answer = [
    "The browser checks its own cache",
    "The recursive resolver asks a root server",
    "The root server points to the .com TLD servers",
    "The .com servers point to stark.com's authoritative servers",
    "The authoritative server returns the address and its TTL",
    "The browser connects to the address",
  ];
  for (const [target, step] of answer.entries()) {
    const items = page.getByTestId("sequence").locator("li span");
    let pos = (await items.allTextContents()).indexOf(step);
    while (pos > target) {
      await page.getByRole("button", { name: `Move "${step}" up` }).click();
      pos--;
    }
  }
  await page.getByTestId("check").click();
  await expect(page.getByTestId("gauge")).toHaveAttribute("data-zone", "optimal");

  await page.getByTestId("tab-core").click();
  await page.getByTestId("option-0").click();
  await page.getByTestId("check").click();
  await expect(page.getByTestId("gauge")).toHaveAttribute("data-zone", "failing");
  await expect(page.getByTestId("audit")).toContainText("Walk through it");
  await page.getByTestId("option-1").click();
  await page.getByTestId("check").click();
  await expect(page.getByTestId("gauge")).toHaveAttribute("data-zone", "optimal");
  await expect(page.getByTestId("clue")).toContainText("last Tuesday");
});

test("a code mission runs in the sandbox: the starter fails with a question, a real debounce passes", async ({ page }) => {
  await autoSkipScenes(page);
  await page.goto("/#/lesson/p2-l03a");
  await page.getByTestId("tab-warmup").click();
  await page.getByTestId("run-tests").click();
  await expect(page.getByTestId("test-results")).toContainText("0 of 3 tests passed");
  await expect(page.getByTestId("test-results")).toContainText("Should anything run before 100 ms of quiet?");

  await setCode(
    page,
    [
      "export function debounce<T extends unknown[]>(fn: (...args: T) => void, wait: number) {",
      "  let timer: ReturnType<typeof setTimeout> | undefined;",
      "  return function (this: unknown, ...args: T) {",
      "    clearTimeout(timer);",
      "    timer = setTimeout(() => fn.apply(this, args), wait);",
      "  };",
      "}",
    ].join("\n"),
  );
  await page.getByTestId("run-tests").click();
  await expect(page.getByTestId("test-results")).toContainText("3 of 3 tests passed");
  await expect(page.getByTestId("gauge")).toHaveAttribute("data-zone", "optimal");
  await expect(page.getByTestId("level")).toBeVisible();

  // The ⭐ is a harder, race-safe search box: its starter carries only its goal.
  await page.getByTestId("tab-outstanding").click();
  await expect(page.getByTestId("editor")).toContainText("never show a stale answer");
  await page.getByTestId("run-tests").click();
  await expect(page.getByTestId("test-results")).toContainText("0 of 5 tests passed");
});

test("new formats: a quiz, a guided design table inside a lesson, and a trade-off", async ({ page }) => {
  await autoSkipScenes(page);

  // A quiz: answer all, with one wrong, then fix it.
  await page.goto("/#/lesson/p1-l01");
  await page.getByTestId("tab-core").click();
  const answers = [0, 1, 1, 2, 0, 1];
  for (const [i, a] of answers.entries()) await page.getByTestId(`quiz-${i}-${i === 3 ? 0 : a}`).click();
  await page.getByTestId("check").click();
  await expect(page.getByTestId("gauge")).toHaveAttribute("data-zone", "solid");
  await page.getByTestId("quiz-3-2").click();
  await page.getByTestId("check").click();
  await expect(page.getByTestId("gauge")).toHaveAttribute("data-zone", "optimal");

  // The ⭐: a guided design table in a lesson.
  await page.getByTestId("tab-outstanding").click();
  await expect(page.getByTestId("step-server")).toHaveAttribute("data-state", "now");
  await page.getByTestId("add-service").click();
  await connect(page, "clients", "🧩 Service");
  await expect(page.getByTestId("step-database")).toHaveAttribute("data-state", "now");
  await page.getByTestId("step-option-1").click();
  await page.getByTestId("add-sqldb").click();
  await connect(page, "service", "🛢️ SQL database");
  await expect(page.getByTestId("step-watch")).toHaveAttribute("data-state", "now");
  await page.getByTestId("run-sim").click();
  await expect(page.getByTestId("step-opening")).toHaveAttribute("data-state", "now");
  await page.getByTestId("step-number").fill("3000 / 1000");
  await page.getByTestId("step-check").click();
  await selectNode(page, "service");
  await (await inspector(page)).getByLabel("Replicas", { exact: true }).fill("4");
  await expect(page.getByTestId("steps-complete")).toBeVisible();
  await page.getByTestId("run-sim").click();
  await expect(page.getByTestId("gauge")).toHaveAttribute("data-zone", "optimal");

  // A trade-off: the right call for a wrong reason is only risky.
  await page.goto("/#/lesson/p1-l05");
  await page.getByTestId("tab-outstanding").click();
  await page.getByTestId("choice-0").click();
  for (const r of [0, 1, 2, 3]) await page.getByTestId(`reason-${r}`).check();
  await page.getByTestId("check").click();
  await expect(page.getByTestId("gauge")).toHaveAttribute("data-zone", "risky");
  await expect(page.getByTestId("audit")).toContainText("Not a real reason");
  await page.getByTestId("reason-3").uncheck();
  await page.getByTestId("check").click();
  await expect(page.getByTestId("gauge")).toHaveAttribute("data-zone", "optimal");
});

test("once the Phase 3 basics are passed, the URL shortener's briefing becomes a skippable recap", async ({ page }) => {
  const required = ["p3-l01", "p3-l03", "p3-l04a", "p3-l06a", "p3-l09"];
  const exercises = Object.fromEntries(required.flatMap((l) => ["warmup", "core"].map((slot) => [`${l}.${slot}`, { zone: "optimal", best: "optimal", attempts: 1, hintsUsed: 0 }])));
  const save = { state: { name: "", xp: 400, exercises, cases: {}, scenesSeen: { "phase:1": true, "case:b01": true }, drafts: {}, benches: {} }, version: 1 };
  await page.addInitScript((s) => localStorage.setItem("built-in-a-cave-save", s), JSON.stringify(save));
  await page.goto("/#/case/b01");
  await page.getByTestId("skip-briefing").click();
  await expect(page.getByTestId("gauge")).toHaveAttribute("data-zone", "solid");
  await page.getByTestId("next-station").click();
  await expect(page.getByTestId("station-interrogate")).toHaveAttribute("aria-selected", "true");
});

async function inspector(page: Page) {
  return page.getByTestId("inspector");
}

async function addAndConfigure(page: Page, kind: string, label: string, settings: Record<string, string | boolean>) {
  await page.getByTestId(`add-${kind}`).click();
  const panel = await inspector(page);
  await panel.getByRole("textbox").first().fill(label);
  for (const [name, value] of Object.entries(settings)) {
    const field = panel.getByLabel(name, { exact: true });
    if (typeof value === "boolean") await (value ? field.check() : field.uncheck());
    else if ((await field.evaluate((el) => el.tagName)) === "SELECT") await field.selectOption(value);
    else await field.fill(value);
  }
}

async function selectNode(page: Page, id: string) {
  await page.getByTestId(`node-${id}`).click();
}

async function connect(page: Page, from: string, toLabel: string) {
  await selectNode(page, from);
  const panel = await inspector(page);
  await panel.getByTestId("connect-select").selectOption({ label: toLabel });
  await panel.getByTestId("connect-button").click();
}

test("the URL shortener case, at Mark I, through the briefing and all seven stations", async ({ page }) => {
  test.setTimeout(180_000);
  await autoSkipScenes(page);
  await page.goto("/#/case/b01");

  // 0. The parts briefing (Mark I): one card per part, one question each.
  await expect(page.getByTestId("guide")).toBeVisible();
  await page.getByTestId("briefing-cache-0").click();
  await expect(page.getByTestId("briefing-cache")).toContainText("Not quite");
  for (const [kind, answer] of [["lb", 0], ["service", 1], ["kvstore", 0], ["cache", 1], ["queue", 1], ["worker", 0]] as const) await page.getByTestId(`briefing-${kind}-${answer}`).click();
  await expect(page.getByTestId("gauge")).toHaveAttribute("data-zone", "solid");
  await page.getByTestId("next-station").click();

  // 1. Interrogate Pepper - two junk questions first, then the ones that matter.
  for (const q of ["q-scale", "q-ratio", "q-latency", "q-analytics", "q-expiry", "q-alias"]) await page.getByTestId(`ask-${q}`).click();
  await expect(page.getByTestId("budget")).toContainText("6 / 6");
  await page.getByTestId("submit-station").click();
  await expect(page.getByTestId("gauge")).toHaveAttribute("data-zone", "optimal");
  await page.getByTestId("next-station").click();

  // 2. Estimation - with the calculator syntax the bench accepts.
  await page.getByTestId("estimate-writes").fill("100M / (30 * 86400)");
  await page.getByTestId("estimate-reads").fill("4000");
  await page.getByTestId("estimate-storage").fill("3");
  await page.getByTestId("check").click();
  await expect(page.getByTestId("gauge")).toHaveAttribute("data-zone", "optimal");
  await page.getByTestId("next-station").click();

  // 3. The design table, through JARVIS's guided build - with sizes that differ from
  // Rhodey's reference (one 32 GB cache, one links partition), to prove there's no single answer.
  const stepIs = (id: string) => expect(page.getByTestId(`step-${id}`)).toHaveAttribute("data-state", "now");
  const answerNumber = async (value: string) => {
    await page.getByTestId("step-number").fill(value);
    await page.getByTestId("step-check").click();
  };
  await stepIs("run-bare");
  await page.getByTestId("run-sim").click();
  await expect(page.getByTestId("gauge")).toHaveAttribute("data-zone", "failing");
  await expect(page.getByTestId("audit")).toContainText("A service with nowhere to keep its data");
  await expect(page.getByTestId("bottlenecks")).toContainText("Asked for 12,120 requests/s; can do 1,000 requests/s");

  await stepIs("store");
  await page.getByTestId("manual-kvstore").click();
  await expect(page.getByTestId("manual")).toContainText("10,000 reads a second");
  await page.getByRole("button", { name: "Close the Field Manual" }).click();
  await page.getByTestId("step-option-2").click();
  await expect(page.getByTestId("step-ask")).toContainText("Not quite");
  await page.getByTestId("step-option-0").click();
  await addAndConfigure(page, "kvstore", "Links store", {});
  await connect(page, "api", "🗄️ Links store");

  await stepIs("copies");
  await answerNumber("4000 / 1000");
  await selectNode(page, "api");
  let panel = await inspector(page);
  await panel.getByLabel("Replicas", { exact: true }).fill("5");

  await stepIs("clicks");
  await answerNumber("4000");
  await addAndConfigure(page, "queue", "Click events", {});
  await addAndConfigure(page, "worker", "Analytics workers", { Replicas: "2" });
  await addAndConfigure(page, "kvstore", "Analytics store", { Partitions: "2" });
  await connect(page, "api", "📬 Click events");
  await connect(page, "queue", "🛠️ Analytics workers");
  await connect(page, "worker", "🗄️ Analytics store");

  await stepIs("cache");
  await answerNumber("12000 * 0.4");
  await addAndConfigure(page, "cache", "Link cache", { "Memory (GB)": "32", "TTL (seconds, 0 = never expire)": "86400" });
  await connect(page, "api", "⚡ Link cache");

  await stepIs("spike");
  await answerNumber("12000 / 800");
  await page.getByTestId("run-sim").click();
  await expect(page.getByTestId("bottlenecks")).toContainText("Shortener service");
  await selectNode(page, "api");
  panel = await inspector(page);
  await expect(panel.getByTestId("readout")).toContainText("Can do 5,000 requests/s");
  await panel.getByLabel("Replicas", { exact: true }).fill("16");
  await selectNode(page, "worker");
  await panel.getByLabel("Replicas", { exact: true }).fill("8");
  await selectNode(page, "kvstore2");
  await panel.getByLabel("Partitions", { exact: true }).fill("6");

  await stepIs("codes");
  await page.getByTestId("step-option-0").click();
  await selectNode(page, "api");
  await panel.getByLabel("Short-code scheme", { exact: true }).selectOption("counter_base62");
  await panel.getByLabel("Rate-limit writes per user", { exact: true }).check();

  await stepIs("spares");
  await selectNode(page, "kvstore");
  await panel.getByLabel("Replicas", { exact: true }).fill("2");
  await selectNode(page, "kvstore2");
  await panel.getByLabel("Replicas", { exact: true }).fill("2");
  await expect(page.getByTestId("steps-complete")).toBeVisible();

  await page.getByTestId("run-sim").click();
  await expect(page.getByTestId("gauge")).toHaveAttribute("data-zone", "optimal");
  await expect(page.getByTestId("sim-report")).toContainText("A link goes viral");
  await page.getByTestId("show-reference").click();
  await expect(page.getByTestId("reference")).toContainText("one");
  await page.getByTestId("next-station").click();

  // 4. The API desk.
  const endpoint = async (i: number, purpose: string, method: string, path: string, status: string, options: string[]) => {
    await page.getByTestId("add-endpoint").click();
    const row = page.getByTestId(`endpoint-${i}`);
    await row.getByLabel("Purpose").selectOption(purpose);
    await row.getByLabel("Method").selectOption(method);
    await row.getByLabel("Path").fill(path);
    await row.getByLabel("Response status").selectOption(status);
    for (const o of options) await row.getByLabel(o).check();
  };
  await endpoint(0, "create", "POST", "/links", "201", ["Rate limited (429)"]);
  await endpoint(1, "redirect", "GET", "/:code", "301", []);
  await page.getByTestId("submit-station").click();
  await expect(page.getByTestId("gauge")).not.toHaveAttribute("data-zone", "optimal");
  await expect(page.getByTestId("audit")).toContainText("loses analytics");
  await page.getByTestId("endpoint-1").getByLabel("Response status").selectOption("302");
  await endpoint(2, "stats", "GET", "/links/:code/stats", "200", ["Requires authentication"]);
  await page.getByTestId("submit-station").click();
  await expect(page.getByTestId("gauge")).toHaveAttribute("data-zone", "optimal");
  await page.getByTestId("next-station").click();

  // 5. Deep dive: base62 in the sandbox.
  await setCode(
    page,
    [
      'const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";',
      "export function encode(n: number): string {",
      "  if (n === 0) return ALPHABET[0];",
      '  let code = "";',
      "  for (; n > 0; n = Math.floor(n / 62)) code = ALPHABET[n % 62] + code;",
      "  return code;",
      "}",
      "export function decode(code: string): number {",
      "  return [...code].reduce((acc, ch) => acc * 62 + ALPHABET.indexOf(ch), 0);",
      "}",
    ].join("\n"),
  );
  await page.getByTestId("run-tests").click();
  await expect(page.getByTestId("test-results")).toContainText("3 of 3 tests passed");
  await page.getByTestId("next-station").click();

  // 6. Curveballs on our own design.
  await page.getByTestId("run-sim").click();
  await expect(page.getByTestId("gauge")).toHaveAttribute("data-zone", "optimal");
  await page.getByTestId("next-station").click();

  // 7. The pitch: place every real statement, leave the decoys out.
  const place: Record<string, string> = { c1: "requirements", c2: "requirements", c3: "architecture", c4: "architecture", c5: "architecture", c6: "data", c7: "interface", c8: "optimisations", c9: "optimisations" };
  for (const [chip, section] of Object.entries(place)) {
    await page.getByTestId(`chip-${chip}`).click();
    await page.getByTestId(`section-${section}`).click();
  }
  await page.getByTestId("submit-station").click();
  await expect(page.getByTestId("gauge")).toHaveAttribute("data-zone", "optimal");
  await expect(page.getByTestId("case-complete")).toContainText("Case closed at Mark I");
  await expect(page.getByTestId("mark-3")).toBeEnabled();

  // Progress survives a reload.
  await page.reload();
  await expect(page.getByTestId("station-assemble")).toBeEnabled();
  // Mark III has no briefing: it starts at the interrogation.
  await page.getByTestId("mark-3").click();
  await expect(page.getByTestId("station-briefing")).toHaveCount(0);
  await expect(page.getByTestId("station-interrogate")).toHaveAttribute("aria-selected", "true");
  await expect(page.getByTestId("mark-3")).toBeEnabled();
});
