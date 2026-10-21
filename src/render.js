import * as THREE from "three";
import {
  W,
  H,
  grid,
  doors,
  devices,
  plate,
  infection,
  TYPES,
  body,
  doorOpen,
  solid,
  lineClear,
  connection,
  distance,
  objectivePoint,
} from "./simulation.js";
const C = {
  floor: "#142b33",
  ink: "#c2e8df",
  mint: "#a9efd6",
  amber: "#efb970",
  blue: "#bdc8fc",
  red: "#fa7b78",
};
function canvas(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}
function round(c, x, y, w, h, r, fill, stroke) {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  if (fill) {
    c.fillStyle = fill;
    c.fill();
  }
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = 2;
    c.stroke();
  }
}
function line(c, points, color, width = 2) {
  c.beginPath();
  points.forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p)));
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke();
}
export function robotArt(type) {
  const cv = canvas(192, 192),
    c = cv.getContext("2d");
  c.translate(96, 96);
  c.shadowColor = "#0009";
  c.shadowBlur = 12;
  c.shadowOffsetY = 9;
  if (type === "cleaner") {
    round(c, -53, -37, 106, 80, 31, "#283d46", "#718b8c");
    c.shadowBlur = 0;
    for (const x of [-55, 41])
      round(c, x, -23, 14, 50, 6, "#101c25", "#4c626c");
    round(c, -43, -41, 86, 64, 25, "#a8d4c8", "#d6f4e9");
    round(c, -30, -30, 60, 35, 16, "#263d47", "#76998f");
    round(c, -22, -21, 44, 10, 5, "#b3ffe1");
    c.fillStyle = "#4b696c";
    c.fillRect(-26, 31, 52, 5);
    for (let i = -2; i < 3; i++)
      line(
        c,
        [
          [i * 12, 42],
          [i * 13, 56],
        ],
        "#a8d4c8",
        4,
      );
    c.fillStyle = "#152c35";
    c.font = "bold 12px monospace";
    c.fillText("M-01", -17, 19);
  } else if (type === "cargo") {
    for (const x of [-65, 43]) {
      round(c, x, -54, 22, 104, 7, "#101b25", "#4d5f64");
      for (let y = -46; y < 46; y += 12)
        line(
          c,
          [
            [x + 3, y],
            [x + 19, y],
          ],
          "#617279",
          3,
        );
    }
    round(c, -46, -50, 92, 94, 10, "#bb864d", "#f4c686");
    c.shadowBlur = 0;
    round(c, -36, -40, 72, 66, 6, "#34414a", "#dfab68");
    round(c, -29, -32, 58, 24, 4, "#192b35");
    for (const x of [-22, 0, 22]) round(c, x - 5, -27, 10, 12, 2, "#ffcb88");
    round(c, -29, 0, 58, 17, 3, "#dca464");
    for (const x of [-34, 22]) {
      round(c, x, 35, 12, 43, 3, "#d6c8a4", "#fff0bf");
      round(c, x - 4, 65, 20, 11, 2, "#6b7774");
    }
    line(
      c,
      [
        [-37, 30],
        [37, 30],
      ],
      "#ffe1a4",
      3,
    );
  } else {
    for (const x of [-60, 36])
      round(c, x, -18, 24, 56, 10, "#384c61", "#7a90ad");
    round(c, -35, -54, 70, 108, 22, "#a8b8da", "#dee6ff");
    c.shadowBlur = 0;
    round(c, -31, -49, 62, 56, 18, "#35465e", "#bdc8fc");
    round(c, -25, -36, 50, 14, 5, type === "enemy" ? "#ff817a" : "#a5b7ff");
    round(c, -24, 15, 48, 27, 7, "#536985", "#c3cee8");
    line(
      c,
      [
        [0, 20],
        [0, 36],
      ],
      "#d5e1ff",
      3,
    );
    line(
      c,
      [
        [-8, 28],
        [8, 28],
      ],
      "#d5e1ff",
      3,
    );
    for (const x of [-37, 23]) round(c, x, 45, 14, 21, 4, "#25374b", "#8899b9");
    round(c, 40, -51, 16, 49, 4, "#526683", "#c4d1eb");
  }
  c.shadowBlur = 0;
  c.fillStyle = "#eafff1";
  c.beginPath();
  c.moveTo(-6, -66);
  c.lineTo(6, -66);
  c.lineTo(0, -77);
  c.closePath();
  c.fill();
  return cv;
}
function floorArt() {
  const cv = canvas(W * 48, H * 48),
    c = cv.getContext("2d"),
    S = 48;
  c.fillStyle = "#0b1820";
  c.fillRect(0, 0, cv.width, cv.height);
  for (let y = 1; y < H - 1; y++)
    for (let x = 1; x < W - 1; x++) {
      if (grid[y][x]) continue;
      const alt = (x * 17 + y * 23) % 7;
      c.fillStyle = [
        "#182e36",
        "#1a3039",
        "#1a3239",
        "#1b333b",
        "#1b3038",
        "#192d35",
        "#1b3137",
      ][alt];
      c.fillRect(x * S + 1, y * S + 1, 46, 46);
      c.strokeStyle = "#30434a66";
      c.strokeRect(x * S + 5, y * S + 5, 38, 38);
      if ((x + y) % 5 === 0) {
        c.fillStyle = "#56707455";
        c.fillRect(x * S + 5, y * S + 5, 2, 2);
        c.fillRect(x * S + 40, y * S + 40, 2, 2);
      }
    }
  // Functional lighting and striped hazard floors are baked into one texture.
  c.fillStyle = "#8b464d44";
  c.fillRect(
    infection.x * S,
    infection.y * S,
    infection.w * S,
    infection.h * S,
  );
  c.save();
  c.beginPath();
  c.rect(infection.x * S, infection.y * S, infection.w * S, infection.h * S);
  c.clip();
  for (let i = -H * S; i < W * S; i += 32)
    line(
      c,
      [
        [i, infection.y * S],
        [i + infection.h * S, (infection.y + infection.h) * S],
      ],
      "#e58c8730",
      5,
    );
  c.restore();
  const zone = (x, y, n, en) => {
    c.fillStyle = "#9fc0bc38";
    c.font = "bold 56px sans-serif";
    c.fillText(n, x * S, y * S);
    c.font = "17px monospace";
    c.fillStyle = "#8fa8ac80";
    c.fillText(en, x * S, y * S + 30);
  };
  zone(3, 4, "入口", "01 / ARRIVAL");
  zone(21, 3, "维护区", "02 / MAINTENANCE");
  zone(3, 24, "仓储区", "03 / FREIGHT");
  zone(39, 5, "中枢", "ACCESS CONTROL");
  zone(55, 4, "隔离区", "04 / QUARANTINE");
  zone(55, 35, "出口", "05 / EXTRACTION");
  function path(points, col) {
    c.setLineDash([8, 10]);
    line(
      c,
      points.map(([x, y]) => [x * S, y * S]),
      col,
      3,
    );
    c.setLineDash([]);
  }
  path(
    [
      [11, 18],
      [11, 23],
      [26, 23],
      [26, 25],
    ],
    "#d1a86e70",
  );
  path(
    [
      [48, 26],
      [51, 26],
    ],
    "#a6e9d1aa",
  );
  c.font = "bold 27px sans-serif";
  c.fillStyle = "#f0b1a0aa";
  c.fillText("⚠ 病毒暴露区", 54 * S, 8 * S);
  c.font = "13px monospace";
  c.fillStyle = "#c89991";
  c.fillText("BIOHAZARD / EXPOSURE RISING", 54 * S, 8 * S + 26);
  for (const d of devices) {
    const x = d.x * S,
      y = d.y * S;
    round(c, x - 35, y - 28, 70, 66, 8, "#071820");
    round(c, x - 35, y - 33, 70, 66, 8, "#203942", "#50737a");
    c.strokeStyle = d.kind === "backup" ? "#9bdcca" : "#758d98";
    c.lineWidth = 2;
    c.strokeRect(x - 25, y - 24, 50, 38);
    c.fillStyle = d.kind === "backup" ? "#9bdcca" : "#607b84";
    c.font = "bold 22px monospace";
    c.textAlign = "center";
    c.fillText(
      d.kind === "backup"
        ? "↻"
        : d.id === "rescue"
          ? "◈"
          : d.id === "exit"
            ? "↑"
            : "⌘",
      x,
      y + 3,
    );
    if (d.id === "rescue") {
      round(c, x - 44, y - 57, 88, 103, 27, "#102a34", "#afdbcf");
      round(c, x - 36, y - 49, 72, 86, 25, "#1d454d", "#4b7d7f");
      const glow = c.createRadialGradient(x, y - 5, 1, x, y - 5, 38);
      glow.addColorStop(0, "#aaffdc88");
      glow.addColorStop(1, "#aaffdc00");
      c.fillStyle = glow;
      c.fillRect(x - 38, y - 45, 76, 76);
      c.strokeStyle = "#b6ffe0";
      c.lineWidth = 2;
      c.beginPath();
      c.ellipse(x, y - 5, 22, 30, -0.5, 0, Math.PI * 2);
      c.stroke();
      c.beginPath();
      c.ellipse(x, y - 5, 22, 30, 0.5, 0, Math.PI * 2);
      c.stroke();
      c.fillStyle = "#e3ffe6";
      c.font = "26px sans-serif";
      c.fillText("◈", x, y + 4);
      for (const xx of [-40, 40]) {
        c.fillStyle = "#89cbb2";
        c.fillRect(x + xx - 2, y - 18, 4, 39);
      }
    }
    if (d.id === "exit") {
      c.strokeStyle = "#b9e6d0";
      c.lineWidth = 2;
      c.beginPath();
      c.arc(x, y, 55, 0, Math.PI * 2);
      c.stroke();
      c.setLineDash([4, 6]);
      c.beginPath();
      c.arc(x, y, 47, 0, Math.PI * 2);
      c.stroke();
      c.setLineDash([]);
    }
    c.font = "13px sans-serif";
    c.fillStyle = "#d0e9e0";
    c.fillText(d.label, x, y + 70);
    c.textAlign = "left";
  }
  c.save();
  c.translate(plate.x * S, plate.y * S);
  c.rotate(Math.PI / 4);
  round(c, -37, -37, 74, 74, 4, "#394345", "#d9b47c");
  c.strokeStyle = "#a88b60";
  c.strokeRect(-26, -26, 52, 52);
  c.restore();
  c.fillStyle = "#d6b87e";
  c.font = "14px sans-serif";
  c.fillText("重物感应", plate.x * S - 29, plate.y * S + 64);
  // Walls have a dark side, raised caps, edge lights and fastener seams.
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (grid[y][x]) {
        c.fillStyle = "#08171e";
        c.fillRect(x * S, y * S, 48, 53);
        c.fillStyle = "#3b5058";
        c.fillRect(x * S + 2, y * S + 2, 44, 39);
        c.fillStyle = "#4b6268";
        c.fillRect(x * S + 4, y * S + 3, 40, 4);
        c.fillStyle = "#283c45";
        c.fillRect(x * S + 3, y * S + 33, 42, 9);
        if ((x + y) % 3 === 0) {
          c.fillStyle = "#769292";
          c.fillRect(x * S + 7, y * S + 12, 3, 3);
        }
        if (!grid[y + 1]?.[x]) {
          c.fillStyle = "#8ec9bc";
          c.fillRect(x * S + 9, y * S + 42, 30, 2);
        }
      }
  return cv;
}
export class View {
  constructor(parent) {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    this.renderer.setClearColor("#0a171e");
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    parent.appendChild(this.renderer.domElement);
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-14, 14, 9, -9, 0.1, 200);
    this.camera.position.set(9, -15, 100);
    this.camera.lookAt(9, -15, 0);
    this.art = {};
    this.textures = {};
    for (const t of ["cleaner", "cargo", "security", "enemy"]) {
      this.art[t] = robotArt(t);
      this.textures[t] = this.texture(this.art[t]);
    }
    this.floor = this.plane(this.texture(floorArt()), W, H, 0);
    this.floor.position.set(W / 2, -H / 2, 0);
    this.entities = new Map();
    this.cones = [];
    this.fx = new THREE.Group();
    this.scene.add(this.fx);
    this.link = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({
        color: C.mint,
        transparent: true,
        opacity: 0.6,
      }),
    );
    this.scene.add(this.link);
    this.ring = new THREE.Mesh(
      new THREE.RingGeometry(0.66, 0.7, 48),
      new THREE.MeshBasicMaterial({
        color: C.mint,
        transparent: true,
        opacity: 0.7,
      }),
    );
    this.scene.add(this.ring);
    this.targetRing = new THREE.Mesh(
      new THREE.RingGeometry(0.8, 0.84, 40),
      new THREE.MeshBasicMaterial({
        color: C.amber,
        transparent: true,
        opacity: 0.9,
      }),
    );
    this.scene.add(this.targetRing);
    this.clock = 0;
    this.lastCone = -1;
    this.resize();
    window.addEventListener("resize", () => this.resize());
    this.renderer.domElement.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      document.dispatchEvent(new CustomEvent("game-context-lost"));
    });
    this.renderer.domElement.addEventListener("webglcontextrestored", () =>
      location.reload(),
    );
  }
  texture(cv) {
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }
  plane(tex, w, h, z) {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        depthWrite: false,
      }),
    );
    m.position.z = z;
    this.scene.add(m);
    return m;
  }
  rectangle(w, h, color, z = 2, alpha = 1) {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({
        color,
        transparent: alpha < 1,
        opacity: alpha,
        depthWrite: false,
      }),
    );
    m.position.z = z;
    this.scene.add(m);
    return m;
  }
  resize() {
    this.width = innerWidth;
    this.height = innerHeight;
    this.renderer.setSize(this.width, this.height);
    const vh = Math.max(15, Math.min(22, (28 * this.height) / this.width));
    const vw = (vh * this.width) / this.height;
    this.camera.left = -vw / 2;
    this.camera.right = vw / 2;
    this.camera.top = vh / 2;
    this.camera.bottom = -vh / 2;
    this.camera.updateProjectionMatrix();
  }
  getEntity(id, make) {
    if (!this.entities.has(id)) this.entities.set(id, make());
    return this.entities.get(id);
  }
  render(s, selected, dt, reduced) {
    const a = body(s);
    this.clock += dt;
    const targetX = Math.min(
        W + 1 + this.camera.left,
        Math.max(-1 + this.camera.right, a.x),
      ),
      targetY = Math.min(
        H + 1 - this.camera.bottom,
        Math.max(-1 + this.camera.top, a.y),
      );
    const f = reduced ? 1 : Math.min(1, dt * 7);
    this.camera.position.x += (targetX - this.camera.position.x) * f;
    this.camera.position.y += (-targetY - this.camera.position.y) * f;
    for (const b of s.bodies) {
      const m = this.getEntity(b.id, () =>
        this.plane(
          this.textures[b.type],
          b.type === "cargo" ? 2.4 : b.type === "cleaner" ? 1.3 : 1.7,
          b.type === "cargo" ? 2.4 : b.type === "cleaner" ? 1.3 : 1.7,
          4,
        ),
      );
      m.position.set(b.x, -b.y, 4);
      m.rotation.z = -b.angle - Math.PI / 2;
      m.material.opacity = b.id === s.active ? 1 : b.unlocked ? 0.76 : 0.35;
    }
    for (const e of s.enemies) {
      const m = this.getEntity(e.id, () =>
        this.plane(this.textures.enemy, 1.7, 1.7, 4),
      );
      m.position.set(e.x, -e.y, 4);
      m.rotation.z = -e.angle - Math.PI / 2;
      m.material.opacity = e.stun > 0 || e.disabled ? 0.38 : 1;
      const bar = this.getEntity(e.id + "bar", () =>
        this.rectangle(0.9, 0.07, C.red, 6),
      );
      bar.visible = e.awareness > 0;
      bar.scale.x = e.awareness / 100;
      bar.position.set(e.x, -e.y + 0.9, 6);
    }
    for (const c of s.crates) {
      const m = this.getEntity(c.id, () => {
        const cv = canvas(128, 128),
          ctx = cv.getContext("2d");
        round(ctx, 4, 9, 120, 114, 7, "#22323b", "#c79d65");
        round(ctx, 12, 10, 104, 100, 5, "#725d43", "#e8be7c");
        for (const x of [20, 100]) {
          ctx.fillStyle = "#b69a70";
          ctx.fillRect(x, 12, 8, 96);
        }
        round(ctx, 42, 44, 44, 30, 3, "#2c3b41", "#efb970");
        ctx.fillStyle = "#efb970";
        ctx.font = "bold 15px monospace";
        ctx.fillText("84", 54, 65);
        return this.plane(this.texture(cv), 2, 2, 5);
      });
      m.position.set(c.x, -c.y, 5);
      m.scale.setScalar(c.held ? 0.83 : 1);
    }
    for (const d of doors) {
      const vent = d.kind === "vent";
      const m = this.getEntity(d.id + "door", () => {
        const cv = canvas(vent ? 64 : 128, 128),
          c = cv.getContext("2d");
        c.fillStyle = vent ? "#526c69" : "#4b5967";
        c.fillRect(0, 0, cv.width, 128);
        for (let i = 10; i < 128; i += 12)
          line(
            c,
            [
              [5, i],
              [cv.width - 5, i],
            ],
            vent ? "#1a3439" : "#23343e",
            vent ? 6 : 3,
          );
        return this.plane(this.texture(cv), d.w, d.h, 3);
      });
      const open = doorOpen(s, d, a.type);
      m.position.set(d.x + d.w / 2, -d.y - d.h / 2, 3);
      m.material.opacity = open ? (vent ? 0.65 : 0.16) : 0.95;
      const strip = this.getEntity(d.id + "strip", () =>
        this.rectangle(d.w, 0.065, C.mint, 5),
      );
      strip.position.set(d.x + d.w / 2, -d.y - 0.1, 5);
      strip.material.color.set(open ? C.mint : C.amber);
    }
    for (const d of devices) {
      const pulse = this.getEntity(
        d.id + "pulse",
        () =>
          new THREE.Mesh(
            new THREE.RingGeometry(0.5, 0.55, 32),
            new THREE.MeshBasicMaterial({
              color: C.mint,
              transparent: true,
              opacity: 0.5,
            }),
          ),
      );
      if (!pulse.parent) this.scene.add(pulse);
      pulse.position.set(d.x, -d.y, 2);
      pulse.material.opacity =
        0.3 + (reduced ? 0 : Math.sin(this.clock * 2) * 0.15);
    }
    const p = this.getEntity("plateLight", () =>
      this.rectangle(1.6, 1.6, C.mint, 1, 0.28),
    );
    p.position.set(plate.x, -plate.y, 1);
    p.visible = s.flags.plate;
    this.ring.position.set(a.x, -a.y, 3);
    const rad = TYPES[a.type].radius + 0.4;
    this.ring.scale.setScalar(
      rad / 0.7 + (reduced ? 0 : Math.sin(this.clock * 3) * 0.03),
    );
    this.ring.material.color.set(s.virus > 60 ? C.red : C.mint);
    const t = s.bodies.find((b) => b.id === selected);
    this.targetRing.visible = !!t && t.id !== a.id;
    if (t && t.id !== a.id) {
      this.targetRing.position.set(t.x, -t.y, 3);
      const ok = !connection(s, t);
      this.targetRing.material.color.set(ok ? C.mint : C.amber);
      this.link.visible = ok;
      this.link.geometry.dispose();
      this.link.geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(a.x, -a.y, 3),
        new THREE.Vector3(t.x, -t.y, 3),
      ]);
    } else this.link.visible = false;
    if (s.effect > 0) {
      this.ring.scale.multiplyScalar(1 + (1 - s.effect / 0.7) * 3);
      this.ring.material.opacity = s.effect;
    } else this.ring.material.opacity = 0.8;
    if (this.clock - this.lastCone > 0.1) {
      this.lastCone = this.clock;
      this.updateCones(s);
    }
    this.renderer.render(this.scene, this.camera);
  }
  updateCones(s) {
    for (const m of this.cones) {
      this.scene.remove(m);
      m.geometry.dispose();
      m.material.dispose();
    }
    this.cones = [];
    for (const e of s.enemies) {
      if (e.stun > 0 || e.disabled) continue;
      const vertices = [];
      for (let i = 0; i < 28; i++) {
        const ray = e.angle - 0.6 + (1.2 * i) / 28,
          next = e.angle - 0.6 + (1.2 * (i + 1)) / 28;
        const cast = (ang) => {
          let d = 0.2;
          for (; d < 7.2; d += 0.18) {
            const x = e.x + Math.cos(ang) * d,
              y = e.y + Math.sin(ang) * d;
            if (
              solid(s, x, y, "enemy", true) ||
              s.crates.some(
                (c) =>
                  !c.held && Math.abs(x - c.x) < c.r && Math.abs(y - c.y) < c.r,
              )
            )
              break;
          }
          return [e.x + Math.cos(ang) * d, -e.y - Math.sin(ang) * d, 1.5];
        };
        vertices.push(e.x, -e.y, 1.5, ...cast(ray), ...cast(next));
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(vertices, 3),
      );
      const m = new THREE.Mesh(
        geo,
        new THREE.MeshBasicMaterial({
          color: e.awareness > 50 ? C.red : C.amber,
          transparent: true,
          opacity: e.awareness > 50 ? 0.21 : 0.095,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      this.scene.add(m);
      this.cones.push(m);
    }
  }
  projectWorld(x, y) {
    const v = new THREE.Vector3(x, -y, 0).project(this.camera);
    return {
      x: ((v.x + 1) / 2) * this.width,
      y: ((1 - v.y) / 2) * this.height,
    };
  }
  screenToWorld(x, y) {
    const v = new THREE.Vector3(
      (x / this.width) * 2 - 1,
      (-y / this.height) * 2 + 1,
      0,
    );
    v.unproject(this.camera);
    return { x: v.x, y: -v.y };
  }
  drawMap(cv, s, full = false) {
    const c = cv.getContext("2d"),
      scale = cv.width / W;
    c.clearRect(0, 0, cv.width, cv.height);
    c.fillStyle = "#0a1b24ed";
    c.fillRect(0, 0, cv.width, cv.height);
    c.fillStyle = "#537077";
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++)
        if (grid[y][x]) c.fillRect(x * scale, y * scale, scale, scale);
    c.fillStyle = "#f9837850";
    c.fillRect(
      infection.x * scale,
      infection.y * scale,
      infection.w * scale,
      infection.h * scale,
    );
    for (const d of doors) {
      c.fillStyle = doorOpen(s, d, body(s).type) ? C.mint : C.amber;
      c.fillRect(
        d.x * scale,
        d.y * scale,
        Math.max(2, d.w * scale),
        Math.max(2, d.h * scale),
      );
    }
    for (const d of devices) {
      c.fillStyle = d.id === "rescue" && !s.flags.rescued ? C.amber : C.mint;
      c.fillRect(d.x * scale - 2, d.y * scale - 2, 4, 4);
    }
    for (const e of s.enemies) {
      c.fillStyle = C.red;
      c.beginPath();
      c.arc(e.x * scale, e.y * scale, full ? 3 : 1.5, 0, Math.PI * 2);
      c.fill();
    }
    const objective = objectivePoint(s);
    c.strokeStyle = C.amber;
    c.lineWidth = 1.5;
    c.beginPath();
    c.arc(
      objective.x * scale,
      objective.y * scale,
      full ? 8 : 5,
      0,
      Math.PI * 2,
    );
    c.stroke();
    for (const b of s.bodies) {
      c.fillStyle =
        b.id === s.active
          ? "#fff"
          : b.unlocked
            ? TYPES[b.type].color
            : "#53636c";
      c.beginPath();
      c.arc(
        b.x * scale,
        b.y * scale,
        b.id === s.active ? 4 : 2.5,
        0,
        Math.PI * 2,
      );
      c.fill();
    }
    if (full) {
      c.font = "14px sans-serif";
      c.fillStyle = "#e1eee6";
      for (const [name, x, y] of [
        ["入口", 3, 3],
        ["维护区", 21, 3],
        ["仓储区", 3, 23],
        ["中枢", 39, 3],
        ["隔离区", 55, 3],
        ["出口", 55, 35],
      ])
        c.fillText(name, x * scale, y * scale);
      c.setLineDash([5, 5]);
      line(
        c,
        [
          [48, 26],
          [53.5, 26],
          [53.5, 28.7],
          [55.5, 28.7],
          [55.5, 24],
          [59, 24],
          [61.5, 24],
          [61.5, 28.7],
          [63.5, 28.7],
          [65, 21],
          [65, 14],
        ].map((p) => p.map((n) => n * scale)),
        C.mint,
        2,
      );
      line(
        c,
        [
          [47, 10],
          [54, 10],
          [63, 14],
        ].map((p) => p.map((n) => n * scale)),
        C.red,
        2,
      );
      c.setLineDash([]);
    }
  }
}
