import "./style.css";
import {
  Game,
  body,
  TYPES,
  candidates,
  connection,
  objective,
  interactionHint,
  distance,
  objectivePoint,
} from "./simulation.js";
import { View } from "./render.js";
const app = document.querySelector("#app");
app.innerHTML = `<main id="world" aria-label="借壳游戏场景"></main><div id="vignette"></div><section id="hud" hidden><header class="brand"><b>借 壳</b><span>BORROWED SHELL / FACILITY 09</span><button id="pause" title="暂停 Esc">Ⅱ</button></header><div class="objective"><span id="chapter"></span><p id="goal"></p></div><div class="telemetry"><div><span>警觉 <b id="alertText"></b></span><meter id="alert" min="0" max="100"></meter></div><div><span>感染 <b id="virusText"></b></span><meter id="virus" min="0" max="100"></meter></div><small id="integrity"></small></div><div id="toast" role="status" aria-live="polite"></div><div class="body-card"><img id="bodyIcon" alt="当前机体"><div><span id="bodyCode"></span><strong id="bodyName"></strong><small id="ability"></small></div></div><div id="targets" aria-label="可选择机体"></div><div class="minimap"><canvas id="mini" width="280" height="168"></canvas><button id="mapButton">M · 设施图</button></div><div id="waypoint"></div><div id="prompt"></div><div id="backup"></div><span class="keyboard-help">WASD / 方向键 移动 <i>·</i> Q 选机体 <i>·</i> E 转移 <i>·</i> 空格 交互</span></section><section id="overlay"></section><div id="mapDialog" hidden role="dialog" aria-modal="true" aria-label="设施地图"><div class="map-panel"><div class="eyebrow">FACILITY 09 / SIGNAL MAP</div><h2>每一具身体，都是一条路。</h2><canvas id="fullMap" width="980" height="588"></canvas><p><b class="mint">虚线：清洁机维护旁路</b>　 <b class="coral">虚线：安保机感染直通</b></p><p>白点：当前机体　小圆点：机体 / 巡逻机　方点：接口 · 备份 · 目标</p><p>连接规则：10 米内空闲机体；实体墙、风道格栅、关闭门和货箱会阻断信号。</p><button id="closeMap">继续潜入 <kbd>M / Esc</kbd></button></div></div>`;
const $ = (id) => document.getElementById(id);
const game = new Game();
let view;
try {
  view = new View($("world"));
} catch (e) {
  $("overlay").innerHTML =
    '<div class="menu"><h1>需要 WebGL</h1><p>请在浏览器开启硬件加速后重新载入。</p></div>';
  throw e;
}
const artURLs = Object.fromEntries(
  Object.entries(view.art).map(([k, v]) => [k, v.toDataURL()]),
);
let selected = "h1",
  keys = new Set(),
  mapOpen = false,
  menuMode = "",
  last = performance.now(),
  uiClock = 0;
let volume = Number(localStorage.getItem("borrowed-shell-volume") ?? 0.35);
let reduced =
  localStorage.getItem("borrowed-shell-motion") === "1" ||
  matchMedia("(prefers-reduced-motion: reduce)").matches;
let audio;
function sound(event) {
  if (!volume) return;
  try {
    audio ??= new AudioContext();
    audio.resume();
    const notes = {
      transfer: [340, 680, 920],
      interact: [520, 700],
      crate: [160, 230],
      deny: [170, 140],
      save: [400, 600, 800],
      emp: [200, 80],
      alert: [740, 580, 740],
      rescue: [450, 680, 900, 1120],
      win: [440, 660, 880, 1320],
      dead: [180, 100, 60],
      restore: [220, 440, 660],
    };
    (notes[event] || [440]).forEach((f, i) => {
      const o = audio.createOscillator(),
        g = audio.createGain();
      o.type = event === "emp" ? "sawtooth" : "sine";
      o.frequency.setValueAtTime(f, audio.currentTime + i * 0.09);
      g.gain.setValueAtTime(0, audio.currentTime + i * 0.09);
      g.gain.linearRampToValueAtTime(
        volume * 0.12,
        audio.currentTime + i * 0.09 + 0.015,
      );
      g.gain.exponentialRampToValueAtTime(
        0.001,
        audio.currentTime + i * 0.09 + 0.23,
      );
      o.connect(g).connect(audio.destination);
      o.start(audio.currentTime + i * 0.09);
      o.stop(audio.currentTime + i * 0.09 + 0.24);
    });
  } catch {
    /* Audio is optional when the browser denies an audio device. */
  }
}
function settings() {
  return `<div class="settings"><label>音量 <input aria-label="音量" id="volume" type="range" min="0" max="1" step="0.05" value="${volume}"></label><label class="check"><input id="motion" type="checkbox" ${reduced ? "checked" : ""}> 减少动态效果</label></div>`;
}
function connectSettings() {
  $("volume").oninput = (e) => {
    volume = Number(e.target.value);
    localStorage.setItem("borrowed-shell-volume", String(volume));
  };
  $("motion").onchange = (e) => {
    reduced = e.target.checked;
    localStorage.setItem("borrowed-shell-motion", reduced ? "1" : "0");
  };
}
function showMenu(mode) {
  if (menuMode === mode) return;
  menuMode = mode;
  keys.clear();
  const s = game.state;
  let content = "";
  if (mode === "title") {
    content = `<div class="title-copy"><div class="eyebrow">A CONSCIOUSNESS WITHOUT A BODY</div><h1>借壳<span>BORROWED SHELL</span></h1><p class="tagline">身体可以更换。<br>你要救的人，不能。</p><p class="intro">潜入一座封锁设施，在清洁、搬运与安保机体间转移意识。<br>观察巡逻，改变环境，为被囚禁的意识找到出口。</p><button id="start" class="primary">建立连接 <span>↗</span></button><small class="start-hint">Enter 开始 · 三种机体 · 两条潜入路线</small>${settings()}<p class="title-foot">原创科幻潜入解谜 / 浏览器可玩版 / 01</p></div><div class="title-art" aria-hidden="true"><div class="orbital o1"></div><div class="orbital o2"></div><div class="signal-core">◈</div><img class="art-cleaner" src="${artURLs.cleaner}"><img class="art-cargo" src="${artURLs.cargo}"><img class="art-security" src="${artURLs.security}"><span class="art-label l1">01 / 清洁<br><em>穿过缝隙</em></span><span class="art-label l2">02 / 搬运<br><em>改变空间</em></span><span class="art-label l3">03 / 安保<br><em>借用权限</em></span><div class="art-bottom">THREE SHELLS. ONE MIND.</div></div>`;
  }
  if (mode === "paused") {
    content = `<div class="menu"><div class="eyebrow">CONNECTION ON HOLD</div><h2>信号已暂停</h2><p>WASD / 方向键移动 · 空格使用能力或交互<br>Q 选择机体 · E 转移 · 鼠标也可选择机体<br>M 查看路线图 · Esc 暂停 / 继续</p><p class="rule">只有 10 米内、已解锁且视线无遮挡的空闲机体能连接。<br>风道只能通行清洁机；安保身份门只允许安保机。</p><button class="primary" id="resume">继续潜入</button><button id="restore">恢复安全备份</button><button id="restart">从头开始</button>${settings()}</div>`;
  }
  if (mode === "dead") {
    content = `<div class="menu"><div class="eyebrow coral">SIGNAL LOST / BACKUP AVAILABLE</div><h2>连接中断</h2><p>${s.message}</p><p>最近安全备份：${s.backupName}<br>恢复会回滚整座设施，包括任务、身体、门、货箱与巡逻机。</p><button class="primary" id="restore">恢复安全备份 <kbd>Enter</kbd></button><button id="restart">重新开始</button></div>`;
  }
  if (mode === "won") {
    content = `<div class="menu won"><div class="eyebrow">TWO MINDS / ONE WAY HOME</div><div class="rescue-symbol">◈</div><h2>我们一起离开。</h2><p>“我以为，再也不会有人记得我。”</p><div class="stats"><div><b>${Math.floor(s.time / 60)}:${String(Math.floor(s.time % 60)).padStart(2, "0")}</b><span>设施内用时</span></div><div><b>${s.transfers}</b><span>意识转移</span></div><div><b>${s.lastRoute || "自由探索"}</b><span>抵达路线</span></div></div><button class="primary" id="restart">再借一具身体 <kbd>Enter</kbd></button><p class="rule">试试另一条路线：安全维护旁路 / 感染区身份直通</p></div>`;
  }
  $("overlay").className = mode === "title" ? "title-screen" : "shade";
  $("overlay").innerHTML = content;
  $("overlay").hidden = false;
  $("hud").hidden = mode === "title";
  if ($("start")) $("start").onclick = start;
  if ($("resume")) $("resume").onclick = resume;
  if ($("restore")) $("restore").onclick = restore;
  if ($("restart")) $("restart").onclick = start;
  if ($("volume")) connectSettings();
  setTimeout(
    () =>
      $(
        mode === "title"
          ? "start"
          : mode === "dead"
            ? "restore"
            : mode === "won"
              ? "restart"
              : "resume",
      )?.focus(),
    20,
  );
}
function hideMenu() {
  menuMode = "";
  $("overlay").hidden = true;
  $("hud").hidden = false;
}
function start() {
  game.start();
  selected = "h1";
  keys.clear();
  mapOpen = false;
  $("mapDialog").hidden = true;
  hideMenu();
  sound("transfer");
  updateUI();
}
function resume() {
  game.state.mode = "playing";
  keys.clear();
  hideMenu();
}
function restore() {
  game.restore();
  selected = candidates(game.state)[0]?.id;
  keys.clear();
  hideMenu();
  updateUI();
}
function pause() {
  if (game.state.mode === "playing") {
    game.state.mode = "paused";
    showMenu("paused");
  } else if (game.state.mode === "paused") resume();
}
function toggleMap() {
  if (game.state.mode !== "playing" && !mapOpen) return;
  mapOpen = !mapOpen;
  keys.clear();
  $("mapDialog").hidden = !mapOpen;
  if (mapOpen) {
    game.state.mode = "paused";
    view.drawMap($("fullMap"), game.state, true);
    $("closeMap").focus();
  } else {
    game.state.mode = "playing";
    menuMode = "";
  }
}
$("pause").onclick = pause;
$("mapButton").onclick = toggleMap;
$("closeMap").onclick = toggleMap;
function updateUI() {
  const s = game.state,
    a = body(s),
    t = TYPES[a.type],
    [chapter, goal] = objective(s);
  $("chapter").textContent = chapter;
  $("goal").textContent = goal;
  $("bodyIcon").src = artURLs[a.type];
  $("bodyCode").textContent = t.code;
  $("bodyName").textContent = t.name;
  $("ability").textContent = t.ability;
  $("alert").value = s.alert;
  $("virus").value = s.virus;
  $("alertText").textContent =
    s.alert > 70
      ? "追踪 " + Math.ceil(s.alert) + "%"
      : s.alert > 5
        ? "怀疑 " + Math.ceil(s.alert) + "%"
        : "未发现";
  $("virusText").textContent =
    Math.ceil(s.virus) + "%" + (s.virus > 70 ? " 临界" : "");
  $("integrity").textContent = "机体完整性 " + Math.ceil(s.health) + "%";
  $("backup").textContent = "↻ " + s.backupName;
  $("toast").textContent = s.messageTime > 0 ? s.message : "";
  $("toast").classList.toggle("show", s.messageTime > 0);
  $("prompt").textContent =
    s.download > 0
      ? `解封中 ${Math.ceil(((2.4 - s.download) / 2.4) * 100)}% · 保持靠近`
      : interactionHint(s);
  const list = candidates(s);
  if (!list.some((b) => b.id === selected)) selected = list[0]?.id;
  const html = list
    .map((b) => {
      const reason = connection(s, b);
      return `<button class="target ${selected === b.id ? "selected" : ""} ${reason ? "unavailable" : ""}" data-target="${b.id}" aria-pressed="${selected === b.id}"><span>${b.type === "cleaner" ? "◉" : b.type === "cargo" ? "▣" : "⬡"} ${TYPES[b.type].name}${b.id === "c2" ? " B" : ""} <small>${distance(a, b).toFixed(1)}m</small></span><em>${reason || (selected === b.id ? "E 确认转移" : "可连接 · Q 选择")}</em></button>`;
    })
    .join("");
  if ($("targets").innerHTML !== html) {
    $("targets").innerHTML = html;
    $("targets")
      .querySelectorAll("button")
      .forEach(
        (b) =>
          (b.onclick = () => {
            selected = b.dataset.target;
            updateUI();
          }),
      );
  }
  view.drawMap($("mini"), s);
  const point = objectivePoint(s),
    pixel = view.projectWorld(point.x, point.y - 1.2),
    off =
      pixel.x < 80 ||
      pixel.x > innerWidth - 110 ||
      pixel.y < 225 ||
      pixel.y > innerHeight - 205;
  const wp = $("waypoint");
  wp.style.left = Math.max(85, Math.min(innerWidth - 110, pixel.x)) + "px";
  wp.style.top = Math.max(225, Math.min(innerHeight - 210, pixel.y)) + "px";
  wp.textContent =
    (off ? "◇ " : "⌄ ") +
    point.label +
    " · " +
    Math.ceil(distance(a, point)) +
    "m";
}
window.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  if (
    [
      " ",
      "arrowup",
      "arrowdown",
      "arrowleft",
      "arrowright",
      "escape",
      "tab",
    ].includes(k) &&
    !["INPUT", "BUTTON"].includes(document.activeElement?.tagName)
  )
    e.preventDefault();
  if (e.target.tagName === "INPUT") return;
  if (k === "escape") {
    if (mapOpen) toggleMap();
    else if (!e.repeat) pause();
    return;
  }
  if (k === "enter" && !e.repeat) {
    if (game.state.mode === "title" || game.state.mode === "won") start();
    else if (game.state.mode === "dead") restore();
    return;
  }
  if (k === "m" && !e.repeat) {
    toggleMap();
    return;
  }
  if (game.state.mode !== "playing") return;
  keys.add(k);
  if (e.repeat) return;
  if (k === "q") {
    const list = candidates(game.state);
    selected =
      list[(list.findIndex((b) => b.id === selected) + 1) % list.length]?.id;
    updateUI();
  }
  if (k === "e") {
    if (transferSelected()) updateUI();
  }
  if (k === " ") {
    e.preventDefault();
    game.interact();
    updateUI();
  }
});
function transferSelected() {
  const ok =
    game.state.mode === "playing" &&
    selected &&
    game.state.active !== selected &&
    game.state.bodies.some((b) => b.id === selected);
  if (!ok) return false;
  const old = game.state.active;
  const done =
    game.state && game.state.mode === "playing" && transferAction(selected);
  if (done) {
    selected = old;
    keys.clear();
  }
  return done;
}
import { transfer } from "./simulation.js";
function transferAction(id) {
  return transfer(game.state, id);
}
window.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));
window.addEventListener("blur", () => {
  keys.clear();
  if (game.state.mode === "playing") pause();
});
document.addEventListener("game-context-lost", () => {
  if (game.state.mode === "playing") pause();
});
view.renderer.domElement.addEventListener("pointerdown", (e) => {
  if (game.state.mode !== "playing") return;
  const p = view.screenToWorld(e.clientX, e.clientY);
  const b = game.state.bodies
    .filter((b) => b.id !== game.state.active && distance(p, b) < 1.5)
    .sort((a, b) => distance(p, a) - distance(p, b))[0];
  if (b) {
    selected = b.id;
    updateUI();
  }
});
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  const x =
      Number(keys.has("d") || keys.has("arrowright")) -
      Number(keys.has("a") || keys.has("arrowleft")),
    y =
      Number(keys.has("s") || keys.has("arrowdown")) -
      Number(keys.has("w") || keys.has("arrowup"));
  if (!mapOpen) game.step(dt, { x, y });
  const s = game.state;
  for (const event of s.events.splice(0)) sound(event);
  if (["dead", "won"].includes(s.mode)) showMenu(s.mode);
  view.render(s, selected, dt, reduced);
  uiClock += dt;
  if (uiClock > 0.12) {
    updateUI();
    uiClock = 0;
  }
}
showMenu("title");
updateUI();
requestAnimationFrame(frame);
// Test instrumentation is opt-in and absent on ordinary public play sessions.
if (new URLSearchParams(location.search).has("test"))
  window.__game = {
    game,
    view,
    start,
    updateUI,
    get selected() {
      return selected;
    },
    select: (id) => (selected = id),
    transfer: (id) => transfer(game.state, id),
    step: (dt, input) => {
      for (let t = 0; t < dt; t += 0.025)
        game.step(Math.min(0.025, dt - t), input);
      updateUI();
    },
    state: () => structuredClone(game.state),
  };
