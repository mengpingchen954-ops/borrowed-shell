import test from "node:test";
import assert from "node:assert/strict";
import {
  Game,
  TYPES,
  body,
  canOccupy,
  connection,
  lineClear,
  transfer,
  snapshot,
} from "../src/simulation.js";
import { safeRoute, directRoute, walk, commonRoute } from "./driver.mjs";
test("body geometry, vents, identity permissions, walls and transfer validation", () => {
  const g = new Game();
  g.start();
  const s = g.state;
  assert.ok(TYPES.cleaner.radius < TYPES.security.radius);
  assert.ok(TYPES.cleaner.radius < TYPES.cargo.radius);
  assert.ok(canOccupy(s, 18.5, 9.5, 0.29, "cleaner"));
  assert.ok(!canOccupy(s, 18.5, 9.5, 0.65, "cargo"));
  assert.ok(!canOccupy(s, 18.5, 9.5, 0.49, "security"));
  s.flags.authorized = true;
  assert.ok(canOccupy(s, 52.5, 10.5, 0.49, "security"));
  assert.ok(!canOccupy(s, 52.5, 10.5, 0.29, "cleaner"));
  const t = s.bodies[1];
  t.unlocked = true;
  t.x = 20;
  t.y = 12;
  body(s).x = 17;
  body(s).y = 12;
  assert.match(connection(s, t), /阻断/);
  assert.ok(!transfer(s, t.id));
  assert.equal(s.active, "c1");
  t.x = 40;
  assert.match(connection(s, t), /范围/);
  t.x = 16;
  t.y = 12;
  assert.ok(transfer(s, t.id));
  assert.equal(s.bodies.length, 4);
  assert.equal(s.bodies[0].x, 17);
});
test("complete safe route with physical crate and all live patrols", () => {
  const g = new Game();
  g.start();
  let peakVirus = 0;
  const step = g.step.bind(g);
  g.step = (...args) => {
    step(...args);
    peakVirus = Math.max(peakVirus, g.state.virus);
  };
  const s = safeRoute(g);
  assert.equal(s.mode, "won");
  assert.equal(s.lastRoute, "维护旁路");
  assert.ok(s.flags.plate);
  assert.ok(s.flags.bypass);
  assert.equal(s.flags.rescued, true);
  assert.equal(s.virus, 0);
  assert.equal(peakVirus, 0);
  assert.ok(s.transfers >= 3);
  console.log(
    "safe route",
    s.time.toFixed(1) + " sec",
    Math.ceil(s.health) + " integrity",
  );
});
test("complete security/infected route with live detection and exposure", () => {
  const g = new Game();
  g.start();
  let peakVirus = 0;
  const step = g.step.bind(g);
  g.step = (...args) => {
    step(...args);
    peakVirus = Math.max(peakVirus, g.state.virus);
  };
  const s = directRoute(g);
  assert.equal(s.mode, "won");
  assert.equal(s.flags.bypass, false);
  assert.equal(s.lastRoute, "感染直通");
  assert.ok(peakVirus > 15 && peakVirus < 100);
  console.log(
    "direct route",
    s.time.toFixed(1) + " sec",
    Math.ceil(s.health) + " integrity",
  );
});
test("returning guards navigate around solid islands instead of getting stuck", () => {
  const g = new Game();
  g.start();
  const e = g.state.enemies[0];
  e.x = 50;
  e.y = 20;
  e.state = "return";
  e.index = 0;
  for (let i = 0; i < 1200; i++) g.step(0.025);
  assert.equal(e.state, "patrol");
  assert.ok(e.x < 46);
});
test("virus is gradual, retreat reduces exposure, complete snapshot restores all state", () => {
  const g = new Game();
  g.start();
  commonRoute(g);
  g.save("test");
  const expected = structuredClone(g.backup);
  body(g.state).x = 55;
  body(g.state).y = 8;
  g.state.enemies.forEach((e) => (e.stun = 200));
  for (let i = 0; i < 100; i++) g.step(0.025);
  assert.ok(g.state.virus > 15 && g.state.virus < 25);
  body(g.state).x = 64;
  for (let i = 0; i < 80; i++) g.step(0.025);
  assert.ok(g.state.virus < 15);
  body(g.state).x = 55;
  for (let i = 0; i < 800; i++) g.step(0.025);
  assert.equal(g.state.mode, "dead");
  g.state.flags.rescued = true;
  g.state.crates[0].x = 60;
  g.restore();
  assert.equal(g.state.active, expected.active);
  assert.deepEqual(g.state.bodies, expected.bodies);
  assert.deepEqual(g.state.flags, expected.flags);
  assert.deepEqual(g.state.crates, expected.crates);
  assert.deepEqual(g.state.enemies, expected.enemies);
  assert.equal(g.state.virus, expected.virus);
  assert.equal(g.state.mode, "playing");
});
test("enemy walls occlude sight, suspicion escalates, EMP stuns and pause freezes", () => {
  const g = new Game();
  g.start();
  const s = g.state,
    e = s.enemies[0],
    a = body(s);
  e.x = 40;
  e.y = 15;
  e.angle = 0;
  a.x = 44;
  a.y = 15;
  for (let i = 0; i < 120; i++) g.step(0.025);
  assert.ok(e.awareness > 70);
  assert.equal(e.state, "chase");
  a.x = 34;
  a.y = 15;
  assert.ok(!lineClear(s, e, a));
  for (let i = 0; i < 400; i++) g.step(0.025);
  assert.ok(e.awareness < 5);
  s.active = "s1";
  const b = body(s);
  b.x = 44;
  b.y = 26;
  e.x = 44;
  e.y = 24;
  s.mode = "playing";
  g.interact();
  assert.ok(e.stun > 0);
  const copy = snapshot(s);
  s.mode = "paused";
  g.step(0.05, { x: 1 });
  assert.deepEqual(s.bodies, copy.bodies);
  assert.equal(s.time, copy.time);
});
