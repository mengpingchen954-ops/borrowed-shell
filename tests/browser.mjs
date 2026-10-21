import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { pathTo } from "./driver.mjs";
const base = process.env.GAME_URL || "http://127.0.0.1:5187/";
await fs.mkdir("artifacts", { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
page.on("response", (r) => {
  if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
});
const state = () => page.evaluate(() => __game.state());
async function shot(name) {
  await page.waitForTimeout(180);
  await page.screenshot({ path: `artifacts/${name}.png` });
}
async function walk(x, y) {
  const s = await state(),
    path = pathTo(s, x, y);
  await page.evaluate((points) => {
    const g = __game.game;
    for (const p of points) {
      let limit = 0;
      while (true) {
        const a = g.state.bodies.find((b) => b.id === g.state.active),
          dx = p.x - a.x,
          dy = p.y - a.y,
          d = Math.hypot(dx, dy);
        if (d < 0.055) break;
        if (g.state.mode !== "playing") throw Error(g.state.message);
        if (++limit > 400) throw Error("Movement blocked");
        g.step(Math.min(0.025, d / 3.15), { x: dx, y: dy });
      }
    }
    __game.updateUI();
  }, path);
}
async function space() {
  await page.keyboard.press("Space");
}
async function transfer(id) {
  for (let n = 0; n < 5; n++) {
    if ((await page.evaluate(() => __game.selected)) === id) break;
    await page.keyboard.press("q");
  }
  await page.keyboard.press("e");
  assert.equal((await state()).active, id);
}
async function common() {
  await walk(17, 9.5);
  await walk(20, 9.5);
  await walk(23, 10);
  await space();
  assert.ok((await state()).flags.maintenance);
  await shot("maintenance");
  await walk(20, 9.5);
  await walk(17, 9.5);
  await walk(12, 22);
  await transfer("h1");
  await walk(28.5, 30.5);
  await space();
  assert.ok((await state()).carrying);
  await shot("carrying");
  await walk(26, 26.7);
  await page.keyboard.down("ArrowUp");
  await page.waitForTimeout(45);
  await page.keyboard.up("ArrowUp");
  await space();
  assert.ok((await state()).flags.plate);
  await shot("pressure-plate");
  await walk(39.5, 29.5);
  await space();
  await transfer("s1");
  await walk(46, 27);
  await space();
  assert.ok((await state()).flags.authorized);
  await shot("authorized");
}
try {
  await page.goto(base + "?test=1");
  await page.waitForFunction(() => !!window.__game);
  await shot("title");
  await page.keyboard.press("Enter");
  const initial = await state();
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(350);
  await page.keyboard.up("ArrowRight");
  assert.ok((await state()).bodies[0].x > initial.bodies[0].x + 0.3);
  await page.keyboard.press("m");
  assert.equal((await state()).mode, "paused");
  await shot("facility-map");
  const paused = await state();
  await page.waitForTimeout(200);
  assert.equal((await state()).time, paused.time);
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await shot("pause");
  await page.locator("#motion").check();
  await page.locator("#volume").fill("0.2");
  await page.locator("#restart").click();
  await common();
  await transfer("c2");
  await walk(48.5, 25.5);
  await space();
  for (const p of [
    [51, 25.5],
    [53.5, 25.5],
    [53.5, 28.5],
    [55.5, 28.5],
    [55.5, 24],
    [61.5, 24],
    [61.5, 28.5],
    [63.5, 28.5],
    [63.5, 21],
    [65, 14],
  ])
    await walk(...p);
  await shot("safe-rescue");
  await space();
  await page.evaluate(() => __game.step(2.5));
  assert.ok((await state()).flags.rescued);
  for (const p of [
    [63.5, 28.5],
    [61.5, 32],
    [62, 37],
  ])
    await walk(...p);
  await space();
  assert.equal((await state()).mode, "won");
  await shot("safe-win");
  console.log("Safe route won", (await state()).time, "seconds");
  await page.keyboard.press("Enter");
  await common();
  for (const p of [
    [50, 17],
    [50, 10.5],
    [54, 10.5],
    [63.5, 14],
    [65, 14],
  ]) {
    await walk(...p);
    if (p[1] === 17) await space();
  }
  await shot("infected-rescue");
  await space();
  await page.evaluate(() => __game.step(2.5));
  for (const p of [
    [63.5, 24],
    [63.5, 27],
    [61.5, 32],
    [62, 37],
  ]) {
    await walk(...p);
    if (p[1] === 24) await space();
  }
  await space();
  assert.equal((await state()).mode, "won");
  await shot("direct-win");
  console.log("Direct route won", (await state()).time, "seconds");
  await page.keyboard.press("Enter");
  await common();
  await walk(42, 34);
  await space();
  const saved = await state();
  assert.match(saved.backupName, /B/);
  for (const p of [
    [50, 17],
    [50, 10.5],
    [54, 10.5],
    [55, 7],
  ])
    await walk(...p);
  await page.evaluate(() => __game.step(16));
  await shot("failure");
  assert.equal((await state()).mode, "dead");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Escape");
  const restored = await state();
  assert.deepEqual(restored.flags, saved.flags);
  assert.deepEqual(restored.crates, saved.crates);
  assert.equal(restored.active, saved.active);
  assert.equal(restored.backupName, saved.backupName);
  assert.ok(Math.abs(restored.bodies[2].x - saved.bodies[2].x) < 0.15);
  await shot("backup-restored");
  await page.keyboard.press("Escape");
  const perf = await page.evaluate(async () => {
    const gaps = [];
    let last = performance.now();
    await new Promise((resolve) => {
      function frame(t) {
        gaps.push(t - last);
        last = t;
        if (gaps.length >= 90) resolve();
        else requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
    gaps.sort((a, b) => a - b);
    return {
      medianMs: gaps[45],
      p95Ms: gaps[85],
      calls: __game.view.renderer.info.render.calls,
    };
  });
  console.log("Frame timing", JSON.stringify(perf));
  assert.ok(perf.medianMs < 45);
  assert.deepEqual(errors, []);
  await fs.writeFile(
    "artifacts/browser-report.json",
    JSON.stringify(
      {
        base,
        errors,
        perf,
        passed: [
          "real keyboard movement",
          "Q/E body transfers",
          "physical carrying and plate",
          "both full routes",
          "infection exposure",
          "backup restore",
          "pause/map/restart",
          "reduced motion and volume",
          "WebGL screenshots",
        ],
      },
      null,
      2,
    ),
  );
  console.log("BROWSER CHECKS PASSED", base);
} finally {
  await browser.close();
}
