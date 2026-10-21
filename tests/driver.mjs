import {
  body,
  TYPES,
  canOccupy,
  distance,
  transfer,
} from "../src/simulation.js";
export function pathTo(s, x, y) {
  const a = body(s),
    r = s.carrying ? 0.9 : TYPES[a.type].radius,
    step = 0.5,
    start = [Math.round(a.x / step), Math.round(a.y / step)],
    end = [Math.round(x / step), Math.round(y / step)],
    key = (x, y) => `${x},${y}`;
  const queue = [start],
    prev = new Map([[key(...start), null]]);
  let found;
  for (let index = 0; index < queue.length; index++) {
    const p = queue[index];
    if (Math.abs(p[0] - end[0]) + Math.abs(p[1] - end[1]) === 0) {
      found = p;
      break;
    }
    for (const [dx, dy] of [
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, -1],
    ]) {
      const n = [p[0] + dx, p[1] + dy],
        k = key(...n);
      if (prev.has(k) || !canOccupy(s, n[0] * step, n[1] * step, r, a.type))
        continue;
      prev.set(k, p);
      queue.push(n);
    }
  }
  if (!found)
    throw Error(
      `No path for ${a.type} ${a.x.toFixed(1)},${a.y.toFixed(1)} -> ${x},${y}`,
    );
  const out = [];
  while (found) {
    out.push({ x: found[0] * step, y: found[1] * step });
    found = prev.get(key(...found));
  }
  out.reverse();
  out.push({ x, y });
  return out;
}
export function walk(game, x, y) {
  const path = pathTo(game.state, x, y);
  for (const target of path) {
    let n = 0;
    while (distance(body(game.state), target) > 0.055) {
      if (++n > 300)
        throw Error(
          `Movement stuck at ${JSON.stringify(body(game.state))} to ${JSON.stringify(target)}`,
        );
      if (game.state.mode !== "playing")
        throw Error(`Game stopped: ${game.state.message}`);
      const a = body(game.state),
        dx = target.x - a.x,
        dy = target.y - a.y,
        d = Math.hypot(dx, dy);
      game.step(Math.min(0.025, d / TYPES[a.type].speed), { x: dx, y: dy });
    }
  }
}
export function commonRoute(g) {
  walk(g, 17, 9.5);
  walk(g, 20, 9.5);
  walk(g, 23, 10);
  g.interact();
  if (!g.state.flags.maintenance) throw Error("Maintenance failed");
  walk(g, 20, 9.5);
  walk(g, 17, 9.5);
  walk(g, 12, 19);
  walk(g, 12, 22);
  if (!transfer(g.state, "h1")) throw Error("Cargo transfer failed");
  walk(g, 28.5, 30.5);
  g.interact();
  if (!g.state.carrying) throw Error("Pickup failed");
  walk(g, 26, 26.7);
  g.step(0.025, { x: 0, y: -1 });
  g.interact();
  if (!g.state.flags.plate)
    throw Error(`Plate failed ${JSON.stringify(g.state.crates)}`);
  walk(g, 39.5, 29.5);
  g.interact();
  if (!transfer(g.state, "s1")) throw Error("Security transfer failed");
  walk(g, 46, 27);
  g.interact();
  if (!g.state.flags.authorized) throw Error("Auth failed");
}
export function safeRoute(g) {
  commonRoute(g);
  if (!transfer(g.state, "c2")) throw Error("Cleaner transfer failed");
  walk(g, 48.5, 25.5);
  g.interact();
  walk(g, 51, 25.5);
  walk(g, 53.5, 25.5);
  walk(g, 53.5, 28.5);
  walk(g, 55.5, 28.5);
  walk(g, 55.5, 24);
  walk(g, 61.5, 24);
  walk(g, 61.5, 28.5);
  walk(g, 63.5, 28.5);
  walk(g, 63.5, 21);
  walk(g, 65, 14);
  g.interact();
  for (let i = 0; i < 100; i++) g.step(0.025);
  if (!g.state.flags.rescued) throw Error("Rescue failed");
  walk(g, 63.5, 28.5);
  walk(g, 61.5, 32);
  walk(g, 62, 37);
  g.interact();
  return g.state;
}
export function directRoute(g) {
  commonRoute(g);
  walk(g, 50, 17);
  g.interact();
  walk(g, 50, 10.5);
  walk(g, 54, 10.5);
  g.interact();
  walk(g, 63.5, 14);
  walk(g, 65, 14);
  g.interact();
  for (let i = 0; i < 100; i++) g.step(0.025);
  walk(g, 63.5, 24);
  g.interact();
  walk(g, 63.5, 27);
  walk(g, 61.5, 32);
  walk(g, 62, 37);
  g.interact();
  return g.state;
}
