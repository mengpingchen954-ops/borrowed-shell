export const W = 70,
  H = 42;
export const TYPES = {
  cleaner: {
    name: "清洁机",
    code: "MOP / 01",
    radius: 0.29,
    speed: 3.15,
    color: "#a9efd6",
    ability: "维护接口 · 可穿通风道 · 安静",
  },
  cargo: {
    name: "搬运机",
    code: "LIFT / 02",
    radius: 0.65,
    speed: 2.35,
    color: "#efb970",
    ability: "空格搬起 / 放下货箱 · 可启动货运接口",
  },
  security: {
    name: "安保机",
    code: "WARD / 03",
    radius: 0.49,
    speed: 2.85,
    color: "#bdc8fc",
    ability: "空格：脉冲干扰（冷却 7 秒）· 身份认证",
  },
};
export const grid = Array.from({ length: H }, (_, y) =>
  Array.from({ length: W }, (_, x) =>
    x === 0 || y === 0 || x === W - 1 || y === H - 1 ? 1 : 0,
  ),
);
function wall(x, y, w, h) {
  for (let j = y; j < y + h; j++)
    for (let i = x; i < x + w; i++) grid[j][i] = 1;
}
wall(18, 1, 1, 20);
wall(1, 20, 36, 1);
wall(36, 1, 1, 40);
wall(52, 1, 1, 40);
wall(53, 30, 16, 1);
wall(30, 21, 1, 19);
for (const [x, y, w, h] of [
  [18, 9, 1, 1],
  [9, 20, 3, 1],
  [36, 29, 1, 3],
  [52, 9, 1, 3],
  [52, 25, 1, 1],
  [60, 30, 3, 1],
  [30, 29, 1, 3],
])
  for (let j = y; j < y + h; j++)
    for (let i = x; i < x + w; i++) grid[j][i] = 0;
// Storage islands are real sight occluders, with room to skirt them.
wall(5, 6, 4, 2);
wall(24, 4, 5, 2);
wall(22, 15, 4, 2);
wall(4, 27, 5, 2);
wall(18, 33, 5, 3);
wall(40, 8, 3, 5);
wall(46, 17, 3, 5);
wall(56, 22, 5, 1);
wall(65, 5, 2, 4);
wall(62, 16, 1, 12);
wall(54, 23, 1, 5);
wall(57, 25, 1, 5);
export const doors = [
  { id: "vent", x: 18, y: 9, w: 1, h: 1, kind: "vent", name: "维护风道" },
  {
    id: "south",
    x: 9,
    y: 20,
    w: 3,
    h: 1,
    flag: "maintenance",
    name: "维护联动门",
  },
  { id: "freight", x: 36, y: 29, w: 1, h: 3, flag: "plate", name: "压力锁" },
  {
    id: "identity",
    x: 52,
    y: 9,
    w: 1,
    h: 3,
    flag: "authorized",
    security: true,
    name: "身份检查门",
  },
  {
    id: "service",
    x: 52,
    y: 25,
    w: 1,
    h: 1,
    kind: "vent",
    flag: "bypass",
    name: "隔离区维护风道",
  },
  { id: "exit", x: 60, y: 30, w: 3, h: 1, flag: "rescued", name: "撤离锁" },
];
export const devices = [
  { id: "maintenance", x: 23, y: 10, label: "维护主接口", kind: "cleaner" },
  { id: "freight", x: 39.5, y: 29.5, label: "货运登记台", kind: "cargo" },
  { id: "auth", x: 46, y: 27, label: "身份签发台", kind: "security" },
  { id: "bypass", x: 48.5, y: 25.5, label: "隔离旁路接口", kind: "cleaner" },
  { id: "rescue", x: 65, y: 14, label: "意识囚笼 · 织光", kind: "any" },
  { id: "exit", x: 62, y: 37, label: "撤离升降台", kind: "any" },
  { id: "backup0", x: 7, y: 15, label: "安全备份 A", kind: "backup" },
  { id: "backup1", x: 42, y: 34, label: "安全备份 B", kind: "backup" },
];
export const plate = { x: 26, y: 25, r: 1.25 };
export const infection = { x: 53, y: 6, w: 10, h: 14 };
export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const clone = (o) => structuredClone(o);
const inside = (p, r, pad = 0) =>
  p.x >= r.x - pad &&
  p.x <= r.x + r.w + pad &&
  p.y >= r.y - pad &&
  p.y <= r.y + r.h + pad;
export function createState() {
  return {
    mode: "title",
    active: "c1",
    bodies: [
      { id: "c1", type: "cleaner", x: 7.5, y: 16.5, angle: 0, unlocked: true },
      { id: "h1", type: "cargo", x: 12, y: 24, angle: 0, unlocked: false },
      { id: "s1", type: "security", x: 42, y: 29.5, angle: 0, unlocked: false },
      {
        id: "c2",
        type: "cleaner",
        x: 45,
        y: 32,
        angle: -Math.PI / 2,
        unlocked: false,
      },
    ],
    crates: [{ id: "box", x: 30.5, y: 30.5, r: 0.87, held: false }],
    flags: {
      maintenance: false,
      plate: false,
      freight: false,
      authorized: false,
      bypass: false,
      rescued: false,
    },
    enemies: [
      enemy("p1", [
        [40, 16],
        [44, 16],
        [44, 24],
        [40, 24],
      ]),
      enemy("p2", [
        [49, 7],
        [49, 14],
        [45, 14],
        [45, 7],
      ]),
      enemy("p3", [
        [56, 10],
        [61, 10],
        [61, 17],
        [56, 17],
      ]),
      enemy("p4", [
        [64.3, 19],
        [67.2, 19],
        [67.2, 26],
        [64.3, 26],
      ]),
    ],
    health: 100,
    virus: 0,
    alert: 0,
    time: 0,
    transfers: 0,
    cooldown: 0,
    carrying: null,
    download: 0,
    backupName: "入口 · 初始备份",
    lastRoute: "",
    message: "",
    messageTime: 0,
    effect: 0,
    events: [],
  };
}
function enemy(id, points) {
  return {
    id,
    x: points[0][0],
    y: points[0][1],
    points,
    index: 1,
    angle: 0,
    awareness: 0,
    state: "patrol",
    stun: 0,
    last: null,
    search: 0,
    lost: 0,
  };
}
export function body(s) {
  return s.bodies.find((b) => b.id === s.active);
}
export function doorOpen(s, d, type) {
  return (
    (!d.flag || s.flags[d.flag]) &&
    (!d.security || type === "security" || type === "enemy") &&
    (!d.kind || type === "cleaner")
  );
}
export function solid(s, x, y, type = "cleaner", sight = false) {
  if (!grid[Math.floor(y)] || grid[Math.floor(y)][Math.floor(x)] !== 0)
    return true;
  return doors.some(
    (d) =>
      inside({ x, y }, d) &&
      !(sight ? (!d.flag || s.flags[d.flag]) && !d.kind : doorOpen(s, d, type)),
  );
}
export function canOccupy(s, x, y, r, type, ignoreBox = false) {
  for (const dx of [-r, 0, r])
    for (const dy of [-r, 0, r])
      if (solid(s, x + dx, y + dy, type)) return false;
  return (
    ignoreBox ||
    !s.crates.some(
      (c) =>
        !c.held && Math.abs(c.x - x) < c.r + r && Math.abs(c.y - y) < c.r + r,
    )
  );
}
export function lineClear(s, a, b, ignoreCrates = false) {
  const n = Math.ceil(distance(a, b) * 12);
  for (let i = 1; i < n; i++) {
    const p = {
      x: a.x + ((b.x - a.x) * i) / n,
      y: a.y + ((b.y - a.y) * i) / n,
    };
    if (
      solid(s, p.x, p.y, "cleaner", true) ||
      (!ignoreCrates &&
        s.crates.some(
          (c) =>
            !c.held && Math.abs(c.x - p.x) < c.r && Math.abs(c.y - p.y) < c.r,
        ))
    )
      return false;
  }
  return true;
}
function patrolPath(s, from, to) {
  const start = Math.floor(from.y) * W + Math.floor(from.x);
  const goal = Math.floor(to.y) * W + Math.floor(to.x);
  const prev = new Int32Array(W * H).fill(-1);
  const queue = [start];
  prev[start] = start;
  for (let i = 0; i < queue.length && prev[goal] < 0; i++) {
    const cell = queue[i];
    for (const n of [cell - 1, cell + 1, cell - W, cell + W]) {
      const x = n % W,
        y = Math.floor(n / W);
      if (
        n < 0 ||
        n >= W * H ||
        prev[n] >= 0 ||
        !canOccupy(s, x + 0.5, y + 0.5, 0.35, "enemy")
      )
        continue;
      prev[n] = cell;
      queue.push(n);
    }
  }
  if (prev[goal] < 0) return [];
  const path = [];
  for (let n = goal; n !== start; n = prev[n])
    path.push({ x: (n % W) + 0.5, y: Math.floor(n / W) + 0.5 });
  return path.reverse();
}
export function connection(s, target) {
  const a = body(s);
  if (target.id === a.id) return "当前机体";
  if (!target.unlocked) return "权限未解锁";
  if (distance(a, target) > 10) return "超出 10 米信号范围";
  if (!lineClear(s, a, target)) return "墙体 / 遮挡阻断信号";
  return "";
}
export function candidates(s) {
  return s.bodies
    .filter((b) => b.id !== s.active)
    .sort(
      (a, b) =>
        Number(!!connection(s, a)) - Number(!!connection(s, b)) ||
        distance(body(s), a) - distance(body(s), b),
    );
}
export function say(s, text) {
  s.message = text;
  s.messageTime = 5;
}
function emit(s, event) {
  s.events.push(event);
}
export function transfer(s, id) {
  if (s.mode !== "playing") return false;
  const t = s.bodies.find((b) => b.id === id);
  if (!t) return false;
  const reason = connection(s, t);
  if (reason) {
    say(s, reason);
    emit(s, "deny");
    return false;
  }
  if (s.carrying) {
    say(s, "先放下货箱，再转移意识");
    return false;
  }
  s.active = id;
  s.transfers++;
  s.effect = 0.7;
  s.download = 0;
  say(s, `${TYPES[t.type].name} 已接入 · ${TYPES[t.type].ability}`);
  emit(s, "transfer");
  return true;
}
export function objective(s) {
  if (!s.flags.maintenance)
    return ["01 / 借一具身体", "穿过东侧窄风道，以清洁机启动维护主接口。"];
  if (!s.flags.plate)
    return [
      "02 / 重量就是钥匙",
      "南门已开启。连接搬运机，把挡路货箱搬到菱形压力板。",
    ];
  if (!s.flags.freight)
    return ["03 / 获取安保权限", "穿过压力锁，用搬运机启动货运登记台。"];
  if (!s.flags.authorized)
    return ["04 / 合法的身份", "连接安保机，前往身份签发台完成认证。"];
  if (!s.flags.rescued)
    return [
      "05 / 找到织光",
      s.flags.bypass
        ? "旁路已开启：清洁机可从南侧风道安全绕行。"
        : "选择路线：安保机从北侧身份门穿越感染区；或连接清洁机启用南侧旁路。",
    ];
  return ["06 / 带她离开", "意识已载入。前往隔离区南侧撤离升降台。"];
}
export function objectivePoint(s) {
  if (!s.flags.maintenance) return { ...devices[0], label: "维护主接口" };
  if (!s.flags.plate)
    return s.carrying
      ? { ...plate, label: "重物压力板" }
      : s.bodies.find((b) => b.id === "h1").id === s.active
        ? { ...s.crates[0], label: "搬起挡路货箱" }
        : { ...s.bodies[1], label: "已解锁搬运机" };
  if (!s.flags.freight) return devices[1];
  if (!s.flags.authorized)
    return body(s).type === "security"
      ? devices[2]
      : { ...s.bodies[2], label: "连接安保机" };
  if (!s.flags.rescued) {
    if (body(s).type === "cleaner" && !s.flags.bypass) return devices[3];
    return devices[4];
  }
  return devices[5];
}
export function nearbyDevice(s) {
  const a = body(s);
  return devices
    .filter((d) => distance(a, d) < 1.8 && lineClear(s, a, d))
    .sort((d, e) => distance(a, d) - distance(a, e))[0];
}
export function interactionHint(s) {
  const a = body(s),
    d = nearbyDevice(s);
  if (d)
    return `空格 · ${d.label}${d.kind !== "any" && d.kind !== "backup" && d.kind !== a.type ? "（需要" + TYPES[d.kind].name + "）" : ""}`;
  if (
    a.type === "cargo" &&
    (s.carrying || s.crates.some((c) => distance(a, c) < 2.25))
  )
    return s.carrying ? "空格 · 放下货箱" : "空格 · 搬起货箱";
  if (a.type === "security")
    return s.cooldown > 0
      ? `脉冲冷却 ${s.cooldown.toFixed(1)} 秒`
      : "空格 · 干扰附近巡逻机";
  return "Q 选择机体 / E 转移 · M 设施图";
}
export function snapshot(s) {
  const copy = clone(s);
  copy.events = [];
  copy.mode = "playing";
  copy.message = "安全备份已恢复 · 整座设施状态已回滚";
  copy.messageTime = 4;
  return copy;
}
export class Game {
  constructor() {
    this.state = createState();
    this.backup = snapshot(this.state);
  }
  start() {
    this.state = createState();
    this.state.mode = "playing";
    this.backup = snapshot(this.state);
    say(this.state, "你醒在一具清洁机中。东侧的窄风道通往维护区。");
  }
  restore() {
    this.state = clone(this.backup);
    this.state.mode = "playing";
    this.state.events = ["restore"];
  }
  save(name) {
    this.state.health = 100;
    this.state.virus = 0;
    this.state.backupName = name;
    this.backup = snapshot(this.state);
    say(this.state, "完整快照已保存：身体、门锁、货箱、巡逻状态");
    emit(this.state, "save");
  }
  interact() {
    const s = this.state;
    if (s.mode !== "playing") return;
    const a = body(s),
      d = nearbyDevice(s);
    if (d) {
      if (d.kind === "backup") {
        if (s.enemies.some((e) => e.state === "chase" && distance(e, a) < 9)) {
          say(s, "仍在追踪中：先摆脱巡逻机再备份");
          return;
        }
        this.save(d.id === "backup0" ? "入口 · 备份 A" : "中枢 · 备份 B");
        return;
      }
      if (d.kind !== "any" && d.kind !== a.type) {
        say(s, `此接口需要${TYPES[d.kind].name}`);
        emit(s, "deny");
        return;
      }
      if (d.id === "maintenance") {
        s.flags.maintenance = true;
        s.bodies.find((b) => b.id === "h1").unlocked = true;
        say(s, "维护接通。南门已开启，搬运机可连接。");
      }
      if (d.id === "freight") {
        s.flags.freight = true;
        s.bodies.find((b) => b.id === "s1").unlocked = true;
        say(s, "货运登记完成。安保机接入权限已签发。");
      }
      if (d.id === "auth") {
        s.flags.authorized = true;
        s.bodies.find((b) => b.id === "c2").unlocked = true;
        say(s, "身份有效。北侧身份门可通行；备用清洁机已解锁。");
      }
      if (d.id === "bypass") {
        if (!s.flags.authorized) {
          say(s, "请先取得中枢身份签发");
          return;
        }
        s.flags.bypass = true;
        s.lastRoute = "维护旁路";
        s.enemies.find((e) => e.id === "p4").disabled = true;
        say(
          s,
          "旁路开启，南侧巡逻机供电已切断。穿过风道与检修折廊可避开感染。",
        );
      }
      if (d.id === "rescue") {
        if (!s.flags.authorized) {
          say(s, "需要先取得设施身份签发");
          return;
        }
        if (s.flags.rescued) {
          say(s, "织光已在你的意识中。向南撤离。");
          return;
        }
        s.download = 2.4;
        say(s, "正在解封意识 · 保持靠近囚笼");
        return;
      }
      if (d.id === "exit") {
        if (!s.flags.rescued) {
          say(s, "先救出隔离区的织光");
          return;
        }
        s.mode = "won";
        emit(s, "win");
        return;
      }
      emit(s, "interact");
      return;
    }
    if (a.type === "cargo") {
      if (s.carrying) {
        const c = s.crates.find((c) => c.id === s.carrying);
        const p = {
          x: a.x + Math.cos(a.angle) * 1.65,
          y: a.y + Math.sin(a.angle) * 1.65,
        };
        if (
          !canOccupy(s, p.x, p.y, c.r, "cargo", true) ||
          s.bodies.some(
            (b) => b.id !== a.id && distance(b, p) < c.r + TYPES[b.type].radius,
          )
        ) {
          say(s, "落点被墙或机体占用，请转身或移开一点");
          return;
        }
        c.x = p.x;
        c.y = p.y;
        c.held = false;
        s.carrying = null;
        s.flags.plate = distance(c, plate) < 1.4;
        say(
          s,
          s.flags.plate ? "压力板已压住。东侧压力锁保持开启。" : "货箱已放下",
        );
        emit(s, "crate");
      } else {
        const c = s.crates.find(
          (c) => distance(c, a) < 2.25 && lineClear(s, a, c, true),
        );
        if (c) {
          c.held = true;
          s.carrying = c.id;
          s.flags.plate = false;
          say(s, "已抬起货箱。搬到西北方菱形压力板，空格放下。");
          emit(s, "crate");
        } else say(s, "靠近有黄色把手的货箱，空格搬起");
      }
      return;
    }
    if (a.type === "security") {
      if (s.cooldown > 0) {
        say(s, `干扰冷却中 · ${Math.ceil(s.cooldown)} 秒`);
        return;
      }
      s.cooldown = 7;
      s.effect = 0.65;
      for (const e of s.enemies)
        if (distance(a, e) < 6.5 && lineClear(s, a, e)) {
          e.stun = 4.5;
          e.awareness = 0;
          e.state = "patrol";
        }
      say(s, "脉冲发射 · 视线内 6.5 米巡逻机离线 4.5 秒");
      emit(s, "emp");
      return;
    }
    say(s, "清洁机可以穿过格栅风道，或操作绿色维护接口");
  }
  step(dt, input = {}) {
    const s = this.state;
    if (s.mode !== "playing") return;
    dt = Math.min(dt, 0.05);
    s.time += dt;
    s.messageTime -= dt;
    s.cooldown = Math.max(0, s.cooldown - dt);
    s.effect = Math.max(0, s.effect - dt);
    const a = body(s),
      t = TYPES[a.type];
    let mx = input.x || 0,
      my = input.y || 0;
    const len = Math.hypot(mx, my);
    if (len) {
      mx /= len;
      my /= len;
      a.angle = Math.atan2(my, mx);
      const speed = t.speed * (s.carrying ? 0.83 : 1);
      this.move(
        a,
        mx * speed * dt,
        my * speed * dt,
        s.carrying ? 0.9 : t.radius,
        a.type,
      );
    }
    if (s.carrying) {
      const c = s.crates.find((c) => c.id === s.carrying);
      c.x = a.x;
      c.y = a.y;
    }
    const infected = inside(a, infection);
    s.virus = Math.max(
      0,
      Math.min(
        100,
        s.virus + (infected ? (a.type === "security" ? 8 : 11) : -5) * dt,
      ),
    );
    if (infected && !s.lastRoute) s.lastRoute = "感染直通";
    if (s.download > 0) {
      if (
        distance(
          a,
          devices.find((d) => d.id === "rescue"),
        ) > 1.9
      )
        s.download = 0;
      else {
        s.download -= dt;
        if (s.download <= 0) {
          s.flags.rescued = true;
          say(s, "织光：我在这里。南侧撤离锁已打开，带我离开。");
          emit(s, "rescue");
        }
      }
    }
    for (const e of s.enemies) this.enemyStep(e, dt, a, len > 0);
    s.alert = Math.max(...s.enemies.map((e) => e.awareness));
    if (s.health <= 0 || s.virus >= 100) {
      s.mode = "dead";
      s.health = Math.max(0, s.health);
      say(
        s,
        s.virus >= 100
          ? "病毒暴露达到临界值，意识连接崩溃"
          : "机体完整性归零，意识连接中断",
      );
      emit(s, "dead");
    }
  }
  move(a, dx, dy, r, type) {
    const s = this.state;
    if (canOccupy(s, a.x + dx, a.y, r, type)) a.x += dx;
    if (canOccupy(s, a.x, a.y + dy, r, type)) a.y += dy;
  }
  enemyStep(e, dt, a, moving) {
    const s = this.state;
    if (e.disabled) return;
    if (e.stun > 0) {
      e.stun = Math.max(0, e.stun - dt);
      return;
    }
    const dist = distance(a, e),
      angle = Math.atan2(a.y - e.y, a.x - e.x),
      delta = Math.atan2(Math.sin(angle - e.angle), Math.cos(angle - e.angle));
    const visible = dist < 7.2 && Math.abs(delta) < 0.6 && lineClear(s, e, a);
    const noisy =
      moving &&
      a.type !== "cleaner" &&
      dist < (a.type === "cargo" ? 3.2 : 3.6) &&
      lineClear(s, e, a);
    if (visible || noisy) {
      e.lost = 0;
      e.awareness = Math.min(
        100,
        e.awareness + dt * (a.type === "cleaner" ? 34 : 47),
      );
      e.last = { x: a.x, y: a.y };
      if (e.awareness >= 72) {
        if (e.state !== "chase") emit(s, "alert");
        e.state = "chase";
      } else if (e.state !== "chase") e.state = "suspicious";
    } else {
      e.lost += dt;
      e.awareness = Math.max(0, e.awareness - dt * 17);
    }
    if (e.state === "chase" && dist < 1.2 && lineClear(s, e, a)) {
      s.health -= dt * 23;
      s.effect = Math.max(s.effect, 0.1);
    }
    let target;
    if (e.state === "chase") {
      target = e.last;
      if (!visible && (distance(e, target) < 0.3 || e.lost > 4)) {
        e.state = "search";
        e.search = 3.5;
      }
    } else if (e.state === "suspicious") {
      if (e.awareness < 5) e.state = "return";
      else {
        e.angle +=
          Math.atan2(Math.sin(angle - e.angle), Math.cos(angle - e.angle)) *
          dt *
          2;
        return;
      }
    } else if (e.state === "search") {
      e.search -= dt;
      e.angle += dt * 0.8;
      if (e.search <= 0) e.state = "return";
      return;
    } else {
      target = { x: e.points[e.index][0], y: e.points[e.index][1] };
      if (distance(e, target) < 0.2) {
        e.index = (e.index + 1) % e.points.length;
        e.state = "patrol";
      }
    }
    if (target) {
      if (!lineClear(s, e, target)) {
        e.navClock = (e.navClock || 0) - dt;
        if (e.navClock <= 0) {
          e.navPath = patrolPath(s, e, target);
          e.navClock = 0.7;
        }
        while (e.navPath?.length && distance(e, e.navPath[0]) < 0.2)
          e.navPath.shift();
        if (e.navPath?.length) target = e.navPath[0];
      } else e.navClock = 0;
      const d = distance(e, target);
      if (d > 0.08) {
        e.angle = Math.atan2(target.y - e.y, target.x - e.x);
        const speed = e.state === "chase" ? 2.4 : 1.25;
        this.move(
          e,
          ((target.x - e.x) / d) * dt * speed,
          ((target.y - e.y) / d) * dt * speed,
          0.35,
          "enemy",
        );
      }
    }
  }
}
