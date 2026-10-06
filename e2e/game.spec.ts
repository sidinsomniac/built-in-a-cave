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

test("the URL shortener case, at Mark I, through all seven stations", async ({ page }) => {
  test.setTimeout(180_000);
  await autoSkipScenes(page);
  await page.goto("/#/case/b01");

  // 1. Interrogate Pepper - two junk questions first, then the ones that matter.
  await expect(page.getByTestId("guide")).toBeVisible();
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

  // 3. The design table: first a bare design that fails, then a real one.
  await page.getByTestId("run-sim").click();
  await expect(page.getByTestId("gauge")).toHaveAttribute("data-zone", "failing");
  await expect(page.getByTestId("audit")).toContainText("A service with nowhere to keep its data");

  await selectNode(page, "api");
  let panel = await inspector(page);
  await panel.getByLabel("Replicas", { exact: true }).fill("16");
  await panel.getByLabel("Short-code scheme", { exact: true }).selectOption("counter_base62");
  await panel.getByLabel("Rate-limit writes per user", { exact: true }).check();
  await addAndConfigure(page, "cache", "Link cache", { Replicas: "2", "Memory (GB)": "16", "TTL (seconds, 0 = never expire)": "86400" });
  await addAndConfigure(page, "kvstore", "Links store", { Partitions: "4", Replicas: "3" });
  await addAndConfigure(page, "queue", "Click events", {});
  await addAndConfigure(page, "worker", "Analytics workers", { Replicas: "8" });
  await addAndConfigure(page, "kvstore", "Analytics store", { Partitions: "6", Replicas: "2" });
  await connect(page, "api", "⚡ Link cache");
  await connect(page, "api", "🗄️ Links store");
  await connect(page, "api", "📬 Click events");
  await connect(page, "queue", "🛠️ Analytics workers");
  await connect(page, "worker", "🗄️ Analytics store");
  await page.getByTestId("run-sim").click();
  await expect(page.getByTestId("gauge")).toHaveAttribute("data-zone", "optimal");
  await expect(page.getByTestId("sim-report")).toContainText("A link goes viral");
  await page.getByTestId("show-reference").click();
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
  await expect(page.getByTestId("mark-3")).toBeEnabled();
});
