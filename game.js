const canvas = document.getElementById("stage");
const ctx = canvas.getContext("2d");

const hpEl = document.getElementById("hp");
const ammoEl = document.getElementById("ammo");
const enemiesEl = document.getElementById("enemies");
const timerEl = document.getElementById("timer");
const restartBtn = document.getElementById("restart");

const W = canvas.width;
const H = canvas.height;
const FOV = Math.PI * 0.405;
const TILE = 2.75;
const PROJ = W / (2 * Math.tan(FOV / 2));
const MAX_DIST = 24;

const worldMap = [
  "####################",
  "#..#......#.......##",
  "#..#..##..#........#",
  "#.....##.....###...#",
  "#.............#....#",
  "#.######..#...#....#",
  "#.#....#..#...###..#",
  "#.#....#......#....#",
  "#.#....####...#....#",
  "#......#......#....#",
  "###....#...##.#....#",
  "#......#...##.#....#",
  "#..##.........#....#",
  "#..##..####...#....#",
  "#......#......#....#",
  "#...#..#..#...#....#",
  "#...#.....#........#",
  "#.........#........#",
  "##.............#...#",
  "####################",
];

const MAP_W = worldMap[0].length;
const MAP_H = worldMap.length;

const state = {
  running: false,
  ended: false,
  timeLeft: 100,
  flashTimer: 0,
  hitText: "",
  hitTextTimer: 0,
};

const arena = document.getElementById("arena");
const startButton = document.getElementById("start");
const reserveEl = document.getElementById("reserve");
const healthBar = document.getElementById("health-bar");
const missionTitle = document.getElementById("mission-title");
const missionInfo = document.getElementById("mission-info");
const missionLabel = document.getElementById("mission-label");
const inputError = document.getElementById("input-error");
const sprite = makeTargetSprite();
const detailedOpponent = document.getElementById("training-opponent");
detailedOpponent
  .decode()
  .then(() => {
    needsFrame = true;
  })
  .catch(() => {});
const worldCanvas = document.getElementById("world");
let depot = null;
try {
  depot = createDepot(worldCanvas, worldMap, TILE, () => {
    lastView.width = 0;
    needsFrame = true;
  });
} catch (error) {
  console.warn("Using the canvas renderer", error);
}
worldCanvas.addEventListener("webglcontextlost", () => {
  depot = null;
  cover.length = 0;
  needsFrame = true;
});
let needsFrame = true;
const cover = depot?.cover || [];

const keys = new Set();
const mouse = { down: false };

const player = {
  x: 2.9,
  z: 4.18,
  yaw: 0,
  pitch: 0,
  eye: 1.6,
  radius: 0.26,
  hp: 100,
  speed: 3.3,
  sprintMul: 1.5,
  fireDelay: 0.11,
  fireCd: 0,
  ammo: 30,
  magSize: 30,
  reserve: 120,
  reloadTime: 1.25,
  reloadTimer: 0,
};

const enemies = [];
const depthBuffer = new Float32Array(W);

let pendingLock = false;
let last = performance.now();
let audioCtx = null;

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function ensureAudio() {
  if (!audioCtx) {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return;
    audioCtx = new AudioCtor();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
}

function tone(freq, start, duration, gain) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  osc.type = "triangle";
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(gain, start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(g);
  g.connect(audioCtx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

function playKillSound(headshot) {
  ensureAudio();
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  if (headshot) {
    tone(620, t, 0.08, 0.18);
    tone(860, t + 0.075, 0.09, 0.16);
    tone(1080, t + 0.15, 0.11, 0.14);
  } else {
    tone(420, t, 0.09, 0.16);
    tone(520, t + 0.09, 0.11, 0.14);
  }
}

function isWall(x, z) {
  const mx = Math.floor(x);
  const mz = Math.floor(z);
  if (mx < 0 || mz < 0 || mx >= MAP_W || mz >= MAP_H) return true;
  return worldMap[mz][mx] === "#";
}

function collides(x, z, radius) {
  for (const block of cover) {
    const dx = x - clamp(x, block.x, block.x + block.w);
    const dz = z - clamp(z, block.z, block.z + block.d);
    if (dx * dx + dz * dz < radius * radius) return true;
  }
  const minX = Math.floor(x - radius);
  const maxX = Math.floor(x + radius);
  const minZ = Math.floor(z - radius);
  const maxZ = Math.floor(z + radius);

  for (let mz = minZ; mz <= maxZ; mz += 1) {
    for (let mx = minX; mx <= maxX; mx += 1) {
      if (
        mx < 0 ||
        mz < 0 ||
        mx >= MAP_W ||
        mz >= MAP_H ||
        worldMap[mz][mx] === "#"
      ) {
        const nearestX = clamp(x, mx, mx + 1);
        const nearestZ = clamp(z, mz, mz + 1);
        const dx = x - nearestX;
        const dz = z - nearestZ;
        if (dx * dx + dz * dz < radius * radius) {
          return true;
        }
      }
    }
  }
  return false;
}

function moveEntity(entity, dx, dz, radius) {
  const nx = entity.x + dx;
  if (!collides(nx, entity.z, radius)) {
    entity.x = nx;
  }
  const nz = entity.z + dz;
  if (!collides(entity.x, nz, radius)) {
    entity.z = nz;
  }
}

function castRay(originX, originZ, angle) {
  const rayDirX = Math.cos(angle);
  const rayDirZ = Math.sin(angle);

  let mapX = Math.floor(originX);
  let mapZ = Math.floor(originZ);

  const deltaDistX = Math.abs(1 / (rayDirX || 1e-6));
  const deltaDistZ = Math.abs(1 / (rayDirZ || 1e-6));

  let stepX;
  let stepZ;
  let sideDistX;
  let sideDistZ;

  if (rayDirX < 0) {
    stepX = -1;
    sideDistX = (originX - mapX) * deltaDistX;
  } else {
    stepX = 1;
    sideDistX = (mapX + 1 - originX) * deltaDistX;
  }

  if (rayDirZ < 0) {
    stepZ = -1;
    sideDistZ = (originZ - mapZ) * deltaDistZ;
  } else {
    stepZ = 1;
    sideDistZ = (mapZ + 1 - originZ) * deltaDistZ;
  }

  let hit = false;
  let side = 0;
  let dist = MAX_DIST;

  while (!hit) {
    if (sideDistX < sideDistZ) {
      sideDistX += deltaDistX;
      mapX += stepX;
      side = 0;
    } else {
      sideDistZ += deltaDistZ;
      mapZ += stepZ;
      side = 1;
    }

    if (mapX < 0 || mapZ < 0 || mapX >= MAP_W || mapZ >= MAP_H) {
      hit = true;
      dist = MAX_DIST;
      break;
    }

    if (worldMap[mapZ][mapX] === "#") {
      hit = true;
      if (side === 0) {
        dist = (mapX - originX + (1 - stepX) / 2) / (rayDirX || 1e-6);
      } else {
        dist = (mapZ - originZ + (1 - stepZ) / 2) / (rayDirZ || 1e-6);
      }
      dist = Math.max(0.001, dist);
    }

    if (Math.min(sideDistX, sideDistZ) > MAX_DIST) {
      hit = true;
      dist = MAX_DIST;
    }
  }

  return { dist, side };
}

function lineOfSight(x1, z1, x2, z2) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const len = Math.hypot(dx, dz);
  if (len < 0.001) return true;
  const step = 0.08;
  const ux = dx / len;
  const uz = dz / len;
  for (let t = 0.2; t < len; t += step) {
    if (isWall(x1 + ux * t, z1 + uz * t)) return false;
  }
  return true;
}

function enemyScreenData(enemy) {
  const dx = enemy.x - player.x;
  const dz = enemy.z - player.z;

  const cos = Math.cos(player.yaw);
  const sin = Math.sin(player.yaw);

  // Camera basis after movement refactor:
  // forward = (cos(yaw), sin(yaw)), right = (-sin(yaw), cos(yaw))
  const relX = -dx * sin + dz * cos;
  const relZ = dx * cos + dz * sin;
  if (relZ <= 0.05) return null;

  const pitchOffset = Math.tan(player.pitch) * PROJ;
  const sx = W * 0.5 + (relX / relZ) * PROJ;

  const yTop = 1.72;
  const yBodyTop = 1.28;
  const yFeet = 0.0;

  const syTop =
    H * 0.5 - ((yTop - player.eye) / (relZ * TILE)) * PROJ + pitchOffset;
  const syBodyTop =
    H * 0.5 - ((yBodyTop - player.eye) / (relZ * TILE)) * PROJ + pitchOffset;
  const syFeet =
    H * 0.5 - ((yFeet - player.eye) / (relZ * TILE)) * PROJ + pitchOffset;

  const h = syFeet - syTop;
  if (h <= 2) return null;

  const w = (h * sprite.width) / sprite.height;
  return {
    sx,
    syTop,
    syBodyTop,
    syFeet,
    w,
    depth: relZ,
  };
}

function spawnEnemies() {
  enemies.length = 0;
  const spots = [
    [9.4, 4.42],
    [17.2, 5.2],
    [11.8, 7.4],
    [15.4, 9.7],
    [7.2, 12.3],
    [13.2, 14.6],
    [16.2, 16.1],
    [9.8, 17.1],
  ];

  for (const [x, z] of spots) {
    enemies.push({
      x,
      z,
      hp: 100,
      alive: true,
      speed: rand(1.2, 2.0),
      shootCd: rand(0.3, 1.3),
      wanderDir: rand(0, Math.PI * 2),
      wanderT: rand(0.4, 1.3),
    });
  }
}

function updateHud() {
  hpEl.textContent = `${Math.max(0, Math.ceil(player.hp))}`;
  ammoEl.textContent = player.ammo;
  reserveEl.textContent = "/ " + player.reserve;
  healthBar.style.width = Math.max(0, player.hp) + "%";
  enemiesEl.textContent = `${enemies.filter((e) => e.alive).length}`;
  const seconds = Math.max(0, Math.ceil(state.timeLeft));
  timerEl.textContent =
    Math.floor(seconds / 60) + ":" + String(seconds % 60).padStart(2, "0");
}

function showHitText(text) {
  state.hitText = text;
  state.hitTextTimer = 0.35;
}

function resetGame() {
  player.x = 2.9;
  player.z = 4.18;
  player.yaw = -0.1;
  player.pitch = 0.045;
  player.hp = 100;
  player.ammo = 30;
  player.reserve = 120;
  player.fireCd = 0;
  player.reloadTimer = 0;

  state.running = false;
  state.ended = false;
  state.timeLeft = 100;
  state.flashTimer = 0;
  state.hitText = "";
  state.hitTextTimer = 0;

  spawnEnemies();
  updateHud();

  setScreen(
    "ready",
    "沙港训练场",
    "在 100 秒内清除场内的 8 个目标。",
    "进入训练",
  );
  document.getElementById("controls").open = false;
}

function startReload() {
  if (player.reloadTimer > 0) return;
  if (player.ammo >= player.magSize) return;
  if (player.reserve <= 0) return;
  player.reloadTimer = player.reloadTime;
}

function finishReload() {
  const need = player.magSize - player.ammo;
  const got = Math.min(need, player.reserve);
  player.ammo += got;
  player.reserve -= got;
}

function applyShot() {
  const cx = W * 0.5;
  const cy = H * 0.5;

  let best = null;

  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    const s = enemyScreenData(enemy);
    if (!s) continue;

    const halfW = s.w * 0.5;
    const insideX = cx >= s.sx - halfW && cx <= s.sx + halfW;
    const insideY = cy >= s.syTop && cy <= s.syFeet;
    if (!insideX || !insideY) continue;

    if (!lineOfSight(player.x, player.z, enemy.x, enemy.z)) continue;

    const sampleX = clamp(Math.floor(s.sx), 0, W - 1);
    if (!depot && s.depth > depthBuffer[sampleX] + 0.06) continue;

    if (!best || s.depth < best.depth) {
      best = { enemy, s, depth: s.depth };
    }
  }

  if (!best) return;

  if (blockedShot(best.depth)) return;
  const isHeadshot = cy <= best.s.syBodyTop;
  const damage = isHeadshot ? 95 : 36;

  best.enemy.hp -= damage;
  showHitText(isHeadshot ? "HEADSHOT" : "HIT");

  if (best.enemy.hp <= 0) {
    best.enemy.alive = false;
    playKillSound(isHeadshot);
    showHitText(isHeadshot ? "HEADSHOT KILL" : "KILL");
  }
}

function endGame(won) {
  state.running = false;
  state.ended = true;
  const cleared = enemies.filter((e) => !e.alive).length;
  const result = won ? "训练完成" : player.hp <= 0 ? "生命值耗尽" : "时间已到";
  setScreen(
    "ended",
    result,
    "本轮已清除 " + cleared + " / " + enemies.length + " 个目标。",
    "再来一局",
  );
  document.exitPointerLock?.();
}

function updatePlayer(dt) {
  const sin = Math.sin(player.yaw);
  const cos = Math.cos(player.yaw);

  let moveX = 0;
  let moveZ = 0;

  if (keys.has("KeyW")) {
    moveX += cos;
    moveZ += sin;
  }
  if (keys.has("KeyS")) {
    moveX -= cos;
    moveZ -= sin;
  }
  if (keys.has("KeyA")) {
    moveX += sin;
    moveZ -= cos;
  }
  if (keys.has("KeyD")) {
    moveX -= sin;
    moveZ += cos;
  }

  if (moveX || moveZ) {
    const len = Math.hypot(moveX, moveZ) || 1;
    const sprint = keys.has("ShiftLeft") || keys.has("ShiftRight");
    const speed = player.speed * (sprint ? player.sprintMul : 1);
    moveEntity(
      player,
      (moveX / len) * speed * dt,
      (moveZ / len) * speed * dt,
      player.radius,
    );
  }

  if (player.fireCd > 0) player.fireCd -= dt;

  if (player.reloadTimer > 0) {
    player.reloadTimer -= dt;
    if (player.reloadTimer <= 0) {
      player.reloadTimer = 0;
      finishReload();
    }
  }

  if (mouse.down && player.fireCd <= 0 && player.reloadTimer <= 0) {
    if (player.ammo > 0) {
      player.fireCd = player.fireDelay;
      player.ammo -= 1;
      applyShot();
    } else {
      startReload();
    }
  }
}

function updateEnemies(dt) {
  for (const enemy of enemies) {
    if (!enemy.alive) continue;

    const dx = player.x - enemy.x;
    const dz = player.z - enemy.z;
    const dist = Math.hypot(dx, dz);
    const canSee = lineOfSight(enemy.x, enemy.z, player.x, player.z);

    let vx = 0;
    let vz = 0;

    if (canSee && dist < 11) {
      if (dist > 2.8) {
        vx = dx / (dist || 1);
        vz = dz / (dist || 1);
      } else {
        vx = -dz / (dist || 1);
        vz = dx / (dist || 1);
      }

      enemy.shootCd -= dt;
      if (enemy.shootCd <= 0 && dist < 10) {
        enemy.shootCd = rand(0.55, 1.05);
        const s = enemyScreenData(enemy);
        let visibleToPlayer = false;
        if (s) {
          const onScreen =
            s.sx >= -s.w && s.sx <= W + s.w && s.syFeet >= 0 && s.syTop <= H;
          if (onScreen) {
            const sampleX = clamp(Math.floor(s.sx), 0, W - 1);
            visibleToPlayer =
              Boolean(depot) || s.depth <= depthBuffer[sampleX] + 0.08;
          }
        }

        // Prevent "shot by invisible enemy" frustration:
        // enemies can only deal damage when they are actually visible to the player.
        const hitChance = clamp(0.35 + (10 - dist) * 0.045, 0.2, 0.78);
        if (visibleToPlayer && Math.random() < hitChance) {
          const damage = rand(6, 13);
          player.hp -= damage;
          state.flashTimer = 0.14;
        }
      }
    } else {
      enemy.wanderT -= dt;
      if (enemy.wanderT <= 0) {
        enemy.wanderT = rand(0.5, 1.4);
        enemy.wanderDir = rand(0, Math.PI * 2);
      }
      vx = Math.cos(enemy.wanderDir);
      vz = Math.sin(enemy.wanderDir);
    }

    moveEntity(enemy, vx * enemy.speed * dt, vz * enemy.speed * dt, 0.22);

    // Keep a small personal space so enemies don't pop directly into the camera.
    const pdx = enemy.x - player.x;
    const pdz = enemy.z - player.z;
    const minDist = 0.95;
    const curDist = Math.hypot(pdx, pdz);
    if (curDist < minDist && curDist > 0.0001) {
      const push = (minDist - curDist) * 0.6;
      enemy.x += (pdx / curDist) * push;
      enemy.z += (pdz / curDist) * push;
      if (collides(enemy.x, enemy.z, 0.22)) {
        enemy.x -= (pdx / curDist) * push;
        enemy.z -= (pdz / curDist) * push;
      }
    }
  }
}

function updateGame(dt) {
  if (!state.running) return;

  if (state.timeLeft <= 0) {
    state.timeLeft = 0;
    endGame(false);
    updateHud();
    return;
  }

  if (state.flashTimer > 0) state.flashTimer -= dt;
  if (state.hitTextTimer > 0) state.hitTextTimer -= dt;

  updatePlayer(dt);
  updateEnemies(dt);

  if (player.hp <= 0) {
    player.hp = 0;
    endGame(false);
  }

  if (enemies.every((e) => !e.alive)) {
    endGame(true);
  }

  updateHud();
}

function renderFallback() {
  const pitchOffset = Math.tan(player.pitch) * PROJ;
  const horizonY = clamp(H * 0.5 + pitchOffset, 0, H);

  const sky = ctx.createLinearGradient(0, 0, 0, horizonY);
  sky.addColorStop(0, "#8cbec8");
  sky.addColorStop(0.52, "#b1d1ce");
  sky.addColorStop(1, "#ead4ae");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, horizonY);

  const sunX = W * 0.76;
  const sunY = horizonY * 0.34;
  const sunGlow = ctx.createRadialGradient(sunX, sunY, 14, sunX, sunY, 120);
  sunGlow.addColorStop(0, "rgba(255, 247, 188, 0.95)");
  sunGlow.addColorStop(0.35, "rgba(255, 180, 97, 0.52)");
  sunGlow.addColorStop(1, "rgba(255, 140, 56, 0)");
  ctx.fillStyle = sunGlow;
  ctx.fillRect(0, 0, W, horizonY);

  ctx.fillStyle = "rgba(255,255,255,0.1)";
  ctx.fillRect(W * 0.08, horizonY * 0.2, W * 0.22, 8);
  ctx.fillRect(W * 0.14, horizonY * 0.24, W * 0.12, 6);
  ctx.fillRect(W * 0.58, horizonY * 0.26, W * 0.2, 7);
  ctx.fillRect(W * 0.65, horizonY * 0.31, W * 0.11, 5);

  const floor = ctx.createLinearGradient(0, horizonY, 0, H);
  floor.addColorStop(0, "#c2af91");
  floor.addColorStop(0.46, "#aa987f");
  floor.addColorStop(1, "#998269");
  ctx.fillStyle = floor;
  ctx.fillRect(0, horizonY, W, H - horizonY);

  ctx.strokeStyle = "rgba(170, 220, 142, 0.14)";
  for (let i = 1; i <= 9; i += 1) {
    const y = horizonY + ((H - horizonY) * i) / 10;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  const stripe = 2;
  for (let x = 0; x < W; x += stripe) {
    const cameraX = (2 * x) / W - 1;
    const rayAngle = player.yaw + Math.atan(cameraX * Math.tan(FOV / 2));
    const hit = castRay(player.x, player.z, rayAngle);

    const corrected = hit.dist * Math.cos(rayAngle - player.yaw);
    depthBuffer[x] = corrected;
    if (stripe === 2 && x + 1 < W) depthBuffer[x + 1] = corrected;

    const wallH = (3.2 / TILE / Math.max(0.0001, corrected)) * PROJ;
    const yTop = H * 0.5 - wallH * 0.5 + pitchOffset;

    const shadeBase = hit.side === 0 ? 182 : 142;
    const distDark = clamp(1 - corrected / MAX_DIST, 0.22, 1);
    const c = Math.floor(shadeBase * distDark);
    ctx.fillStyle = `rgb(${c + 36}, ${c + 13}, ${c - 17})`;
    ctx.fillRect(x, yTop, stripe + 1, wallH);
    ctx.fillStyle = "rgba(245,223,189,.5)";
    ctx.fillRect(x, yTop + wallH * 0.035, stripe + 1, wallH * 0.035);
    ctx.fillStyle = "rgba(73,98,85,.34)";
    ctx.fillRect(x, yTop + wallH * 0.77, stripe + 1, wallH * 0.07);
  }
}

// Intersect a horizontal ray with the near edge of a cargo crate (in map units).
function crateDistance(block, dx, dz) {
  const axis = (origin, direction, low, high) => {
    if (Math.abs(direction) < 1e-7)
      return origin >= low && origin <= high
        ? [-Infinity, Infinity]
        : [Infinity, -Infinity];
    const a = (low - origin) / direction,
      b = (high - origin) / direction;
    return a < b ? [a, b] : [b, a];
  };
  const x = axis(player.x, dx, block.x, block.x + block.w),
    z = axis(player.z, dz, block.z, block.z + block.d);
  const near = Math.max(0, x[0], z[0]);
  return near < Math.min(x[1], z[1]) ? near : Infinity;
}

function blockedShot(depth) {
  return cover.some((block) => {
    const d = crateDistance(block, Math.cos(player.yaw), Math.sin(player.yaw));
    return (
      d < depth && player.eye / TILE + Math.tan(player.pitch) * d < block.h
    );
  });
}

function renderEnemies() {
  const targets = enemies
    .filter((e) => e.alive)
    .map((enemy) => ({ enemy, s: enemyScreenData(enemy) }))
    .filter(
      (item) =>
        item.s && item.s.sx + item.s.w / 2 >= 0 && item.s.sx - item.s.w / 2 < W,
    )
    .sort((a, b) => b.s.depth - a.s.depth);
  const cos = Math.cos(player.yaw),
    sin = Math.sin(player.yaw);
  const horizon = H / 2 + Math.tan(player.pitch) * PROJ;
  for (const { enemy, s } of targets) {
    const left = s.sx - s.w / 2,
      h = s.syFeet - s.syTop;
    const start = Math.max(0, Math.floor(left)),
      end = Math.min(W, Math.ceil(left + s.w));
    // Clip the sprite one strip at a time against the exact wall and low-cover silhouettes.
    ctx.save();
    ctx.beginPath();
    for (let x = start; x < end; x += 2) {
      const u = (x + 1 - W / 2) / PROJ,
        dx = cos - u * sin,
        dz = sin + u * cos;
      if (depot) {
        const ray = castRay(player.x, player.z, Math.atan2(dz, dx));
        depthBuffer[x] = ray.dist / Math.hypot(dx, dz);
        if (x + 1 < W) depthBuffer[x + 1] = depthBuffer[x];
      }
      if (s.depth > depthBuffer[x] + 0.015) continue;
      let bottom = s.syFeet + Math.max(2, s.w * 0.105);
      for (const block of cover) {
        const d = crateDistance(block, dx, dz);
        if (d < s.depth)
          bottom = Math.min(
            bottom,
            horizon + ((player.eye / TILE - block.h) * PROJ) / d,
          );
      }
      if (bottom > s.syTop) ctx.rect(x, s.syTop, 2, bottom - s.syTop);
    }
    ctx.clip();
    ctx.fillStyle = "rgba(56,49,33,.25)";
    ctx.beginPath();
    ctx.ellipse(
      s.sx,
      s.syFeet - 1,
      s.w * 0.44,
      Math.max(1.5, s.w * 0.09),
      0,
      0,
      2 * Math.PI,
    );
    ctx.fill();
    ctx.drawImage(
      detailedOpponent.complete && detailedOpponent.naturalWidth
        ? detailedOpponent
        : sprite,
      left,
      s.syTop,
      s.w,
      h,
    );
    if (enemy.hp < 100) {
      ctx.fillStyle = "#282f29";
      ctx.fillRect(left, s.syTop, s.w, 3);
      ctx.fillStyle = "#e9b988";
      ctx.fillRect(left, s.syTop, (s.w * enemy.hp) / 100, 3);
    }
    ctx.restore();
  }
}

function renderMiniMap() {
  const scale = 5;
  const pad = 20;
  const mapW = MAP_W * scale;
  const mapH = MAP_H * scale;
  const x0 = W - mapW - pad;
  const y0 = pad;

  ctx.fillStyle = "rgba(8, 14, 22, 0.72)";
  ctx.fillRect(x0 - 6, y0 - 6, mapW + 12, mapH + 12);

  for (let z = 0; z < MAP_H; z += 1) {
    for (let x = 0; x < MAP_W; x += 1) {
      if (worldMap[z][x] === "#") {
        ctx.fillStyle = "#939783";
        ctx.fillRect(x0 + x * scale, y0 + z * scale, scale, scale);
      } else {
        ctx.fillStyle = "rgba(82, 115, 90, 0.35)";
        ctx.fillRect(x0 + x * scale, y0 + z * scale, scale, scale);
      }
    }
  }

  const px = x0 + player.x * scale;
  const pz = y0 + player.z * scale;
  const fovLen = 16;
  const left = player.yaw - FOV * 0.5;
  const right = player.yaw + FOV * 0.5;

  ctx.strokeStyle = "rgba(120, 240, 255, 0.45)";
  ctx.beginPath();
  ctx.moveTo(px, pz);
  ctx.lineTo(px + Math.cos(left) * fovLen, pz + Math.sin(left) * fovLen);
  ctx.moveTo(px, pz);
  ctx.lineTo(px + Math.cos(right) * fovLen, pz + Math.sin(right) * fovLen);
  ctx.stroke();

  ctx.fillStyle = "#eef186";
  ctx.beginPath();
  ctx.arc(px, pz, 2.8, 0, Math.PI * 2);
  ctx.fill();

  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    ctx.fillStyle = "#ed8f6c";
    ctx.beginPath();
    ctx.arc(x0 + enemy.x * scale, y0 + enemy.z * scale, 2.3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = "rgba(208, 227, 255, 0.5)";
  ctx.strokeRect(x0 - 0.5, y0 - 0.5, mapW + 1, mapH + 1);
}

function renderCrosshair() {
  const cx = W * 0.5;
  const cy = H * 0.5;
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 10, cy);
  ctx.lineTo(cx - 2, cy);
  ctx.moveTo(cx + 2, cy);
  ctx.lineTo(cx + 10, cy);
  ctx.moveTo(cx, cy - 10);
  ctx.lineTo(cx, cy - 2);
  ctx.moveTo(cx, cy + 2);
  ctx.lineTo(cx, cy + 10);
  ctx.stroke();
}

function renderOverlays() {
  if (state.flashTimer > 0) {
    const alpha = clamp(state.flashTimer / 0.14, 0, 1) * 0.35;
    ctx.fillStyle = `rgba(255,40,40,${alpha})`;
    ctx.fillRect(0, 0, W, H);
  }

  if (player.reloadTimer > 0) {
    const text = "换弹中";
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(W * 0.5 - 78, H - 165, 156, 34);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px Segoe UI";
    ctx.textAlign = "center";
    ctx.fillText(text, W * 0.5, H - 142);
  }

  if (state.hitTextTimer > 0) {
    ctx.fillStyle = "#ffe082";
    ctx.font = "bold 28px Segoe UI";
    ctx.textAlign = "center";
    ctx.fillText(
      {
        HIT: "命中",
        HEADSHOT: "精准命中",
        KILL: "目标清除",
        "HEADSHOT KILL": "精准清除",
      }[state.hitText],
      W * 0.5,
      H * 0.5 - 42,
    );
  }
}

const lastView = { x: NaN, z: NaN, yaw: NaN, pitch: NaN, width: 0 };
let slowFrames = 0;
function drawBackground() {
  if (
    lastView.x === player.x &&
    lastView.z === player.z &&
    lastView.yaw === player.yaw &&
    lastView.pitch === player.pitch &&
    lastView.width === worldCanvas.width
  )
    return;
  depot.draw(player, FOV);
  for (const key of ["x", "z", "yaw", "pitch"]) lastView[key] = player[key];
  lastView.width = worldCanvas.width;
}

function render() {
  ctx.clearRect(0, 0, W, H);
  if (depot) drawBackground();
  else renderFallback();
  renderEnemies();
  if (!state.running) return;
  renderMiniMap();
  drawCarbine(
    ctx,
    W,
    H,
    player,
    ["KeyW", "KeyS", "KeyA", "KeyD"].some((key) => keys.has(key)),
  );
  renderCrosshair();
  renderOverlays();
}

function loop(now) {
  const elapsed = Math.max(0, (now - last) / 1000);
  last = now;
  if (state.running) {
    // Keep the round clock on wall time and substep movement after a slow frame.
    state.timeLeft = Math.max(0, state.timeLeft - elapsed);
    let remaining = Math.min(elapsed, 0.18);
    while (remaining > 0 && state.running) {
      const step = Math.min(remaining, 1 / 60);
      updateGame(step);
      remaining -= step;
    }
    if (depot && elapsed > 0.044) slowFrames++;
    else slowFrames = Math.max(0, slowFrames - 1);
    if (slowFrames >= 7 && worldCanvas.width > 720) {
      worldCanvas.width = worldCanvas.width === 1280 ? 960 : 720;
      worldCanvas.height = (worldCanvas.width * 9) / 16;
      slowFrames = 0;
    }
  }
  if (state.running || needsFrame) {
    render();
    needsFrame = false;
  }

  requestAnimationFrame(loop);
}

function setScreen(mode, title, info, button) {
  arena.dataset.mode = mode;
  if (worldCanvas.width !== 1280) {
    worldCanvas.width = 1280;
    worldCanvas.height = 720;
  }
  slowFrames = 0;
  missionLabel.textContent =
    mode === "ready" ? "训练地图 / SANDPORT" : "沙港训练场 / SANDPORT";
  missionTitle.textContent = title;
  missionInfo.textContent = info;
  startButton.firstChild.textContent = button + " ";
  inputError.textContent = "";
  keys.clear();
  mouse.down = false;
  needsFrame = true;
}
function pauseGame() {
  if (!state.running) return;
  state.running = false;
  setScreen(
    "paused",
    "训练暂停",
    "剩余目标 " + enemies.filter((e) => e.alive).length + " 个。",
    "继续训练",
  );
}
function begin() {
  if (pendingLock || state.running) return;
  if (state.ended) resetGame();
  ensureAudio();
  if (!canvas.requestPointerLock) {
    inputError.textContent = "请使用支持鼠标锁定的桌面浏览器。";
    return;
  }
  pendingLock = true;
  try {
    canvas.requestPointerLock()?.catch(lockError);
  } catch {
    lockError();
  }
}
function lockError() {
  pendingLock = false;
  inputError.textContent = "浏览器未锁定鼠标，请再次点击进入训练。";
}
document.addEventListener("pointerlockerror", lockError);
document.addEventListener("pointerlockchange", () => {
  const locked = document.pointerLockElement === canvas;
  pendingLock = false;
  if (locked && !state.ended) {
    canvas.focus();
    state.running = true;
    arena.dataset.mode = "playing";
    needsFrame = true;
    last = performance.now();
  } else pauseGame();
});
startButton.addEventListener("click", begin);
canvas.addEventListener("click", begin);
canvas.addEventListener("mousedown", (ev) => {
  if (state.running && ev.button === 0) mouse.down = true;
});
window.addEventListener("mouseup", () => {
  mouse.down = false;
});
window.addEventListener("keydown", (ev) => {
  if (!state.running) return;
  keys.add(ev.code);
  if (ev.code === "KeyR") startReload();
  if (ev.code === "Escape") {
    pauseGame();
    document.exitPointerLock?.();
  }
});
window.addEventListener("keyup", (ev) => keys.delete(ev.code));
window.addEventListener("blur", () => {
  pauseGame();
  if (document.pointerLockElement === canvas) document.exitPointerLock();
});
document.addEventListener("mousemove", (ev) => {
  if (!state.running || document.pointerLockElement !== canvas) return;
  player.yaw += ev.movementX * 0.0025;
  player.pitch = clamp(player.pitch - ev.movementY * 0.0021, -0.52, 0.52);
});
restartBtn.addEventListener("click", () => {
  if (document.pointerLockElement === canvas) document.exitPointerLock();
  resetGame();
});
resetGame();
requestAnimationFrame(loop);
