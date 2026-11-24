// Positions and radii are in map tiles. Smoke only advances during a running round.
const smoke = (() => {
  let grenade = null,
    nextDrop = 0;
  const fuse = 0.9,
    lifetime = 8;
  const surface = document.createElement("canvas");
  surface.width = 160;
  surface.height = 90;
  const paint = surface.getContext("2d");
  const frame = paint.createImageData(surface.width, surface.height);
  // A repeatable smooth noise field moves through the volume as it rises.
  const noise = new Float32Array(16 ** 3);
  let seed = 7361;
  for (let i = 0; i < noise.length; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    noise[i] = seed / 4294967296;
  }
  function mist(x, y, z) {
    const ix = Math.floor(x),
      iy = Math.floor(y),
      iz = Math.floor(z);
    const a = x - ix,
      b = y - iy,
      c = z - iz;
    const row = (j, k) => {
      const base = ((k & 15) * 16 + (j & 15)) * 16;
      return (
        noise[base + (ix & 15)] * (1 - a) + noise[base + ((ix + 1) & 15)] * a
      );
    };
    return (
      (row(iy, iz) * (1 - b) + row(iy + 1, iz) * b) * (1 - c) +
      (row(iy, iz + 1) * (1 - b) + row(iy + 1, iz + 1) * b) * c
    );
  }
  function reset() {
    grenade = null;
    nextDrop = rand(3, 5);
  }
  function drop() {
    for (let i = 0; i < 45; i++) {
      const yaw = player.yaw + rand(-1, 1) * (i < 28 ? 0.65 : Math.PI);
      const distance = rand(2.6, 5.8);
      const x = player.x + Math.cos(yaw) * distance,
        z = player.z + Math.sin(yaw) * distance;
      if (collides(x, z, 0.38) || !lineOfSight(player.x, player.z, x, z))
        continue;
      const angle = rand(0, Math.PI * 2);
      const dx = 0.48 * Math.cos(angle),
        dz = 0.48 * Math.sin(angle);
      if (
        collides(x + dx, z + dz, 0.12) ||
        collides(x + dx / 2, z + dz / 2, 0.12)
      )
        continue;
      grenade = {
        x,
        z,
        age: 0,
        dx,
        dz,
        seed: rand(0, 15),
      };
      return true;
    }
    return false;
  }
  function update(dt) {
    if (grenade) {
      grenade.age += dt;
      if (grenade.age >= lifetime) grenade = null;
    }
    nextDrop -= dt;
    if (nextDrop <= 0 && !grenade) nextDrop = drop() ? rand(12, 18) : 1;
  }
  function volume() {
    if (!grenade || grenade.age <= fuse) return null;
    const t = grenade.age - fuse;
    const spread = 1 - Math.exp(-t * 1.5);
    return {
      x: grenade.x,
      z: grenade.z,
      y: 0.11 + 0.32 * spread,
      r: 0.16 + 1.03 * spread,
      h: 0.15 + 0.49 * spread,
      opacity:
        Math.min(1, t * 1.6) * Math.min(1, (lifetime - grenade.age) / 2.4),
      t,
      seed: grenade.seed,
    };
  }
  // Measure the sight segment passing through the dense core of the cloud.
  function obscures(enemy) {
    const v = volume();
    if (!v) return false;
    const dx = (enemy.x - player.x) / v.r,
      dz = (enemy.z - player.z) / v.r;
    const dy =
      (platformHeight(enemy) + 1.35 - (enemy.crouch || 0) - player.eye) /
      TILE /
      v.h;
    const x = (player.x - v.x) / v.r,
      y = (player.eye / TILE - v.y) / v.h,
      z = (player.z - v.z) / v.r;
    const a = dx * dx + dy * dy + dz * dz;
    if (a < 1e-8) return false;
    const b = x * dx + y * dy + z * dz,
      disc = b * b - a * (x * x + y * y + z * z - 0.8);
    if (disc <= 0) return false;
    const span =
      Math.min(1, (-b + Math.sqrt(disc)) / a) -
      Math.max(0, (-b - Math.sqrt(disc)) / a);
    return span * Math.sqrt(a) * v.opacity > 0.5;
  }
  function layers() {
    if (!grenade) return [];
    const { x, z, age, dx, dz } = grenade;
    const cos = Math.cos(player.yaw),
      sin = Math.sin(player.yaw);
    const depth = (x - player.x) * cos + (z - player.z) * sin;
    const side = -(x - player.x) * sin + (z - player.z) * cos;
    const horizon = H / 2 + Math.tan(player.pitch) * PROJ;
    const items = [];
    const roll = Math.max(0, 1 - age / fuse);
    const canDepth = depth + (dx * cos + dz * sin) * roll * roll;
    let scene;
    const sample = (u, v) => (scene ??= sceneDepth())(u, v);
    if (canDepth > 0.04) {
      const sx =
        W / 2 +
        ((side + (-dx * sin + dz * cos) * roll * roll) * PROJ) / canDepth;
      const height = 0.085 + 0.65 * roll * Math.abs(Math.cos(age * 6));
      const sy = horizon - ((height - player.eye) * PROJ) / (canDepth * TILE);
      if (
        sx >= 0 &&
        sx < W &&
        sy >= 0 &&
        sy < H &&
        canDepth <= sample(sx / W, sy / H) + 0.01
      )
        items.push({
          s: { depth: canDepth },
          draw() {
            const scale = PROJ / (canDepth * TILE);
            ctx.save();
            ctx.translate(sx, sy);
            ctx.rotate(0.25 + roll * 5);
            ctx.scale(scale, scale);
            ctx.fillStyle = "#485654";
            ctx.fillRect(-0.13, -0.067, 0.26, 0.134);
            ctx.fillStyle = "#e8ad62";
            ctx.fillRect(-0.06, -0.067, 0.06, 0.134);
            ctx.fillStyle = "#b7c5bd";
            ctx.fillRect(0.1, -0.055, 0.038, 0.11);
            ctx.restore();
          },
        });
    }
    const v = volume();
    if (
      !v ||
      depth + v.r <= 0.02 ||
      Math.abs(side) > Math.max(0, depth) * Math.tan(FOV / 2) + 2 * v.r
    )
      return items;
    // Composite depth slices alongside actors. Each pixel stops at the first scene surface.
    const slices = 8,
      step = (2 * v.r) / slices;
    for (let i = 0; i < slices; i++) {
      const near = Math.max(0.012, depth - v.r + i * step),
        far = depth - v.r + (i + 1) * step;
      if (far <= near) continue;
      const d = (near + far) / 2;
      items.push({
        s: { depth: d },
        draw() {
          drawSlice(v, d, near, far, side, depth, horizon, cos, sin, sample);
        },
      });
    }
    return items;
  }
  function drawSlice(
    v,
    d,
    near,
    far,
    side,
    centerDepth,
    horizon,
    cos,
    sin,
    sample,
  ) {
    const w = surface.width,
      h = surface.height;
    const half =
      v.r * Math.sqrt(Math.max(0, 1 - ((d - centerDepth) / v.r) ** 2));
    const left = clamp(
      Math.floor((0.5 + ((side - half) * PROJ) / (d * W)) * w) - 1,
      0,
      w,
    );
    const right = clamp(
      Math.ceil((0.5 + ((side + half) * PROJ) / (d * W)) * w) + 1,
      0,
      w,
    );
    const top = clamp(
      Math.floor(
        ((horizon - ((v.y + v.h - player.eye / TILE) * PROJ) / d) * h) / H,
      ) - 1,
      0,
      h,
    );
    const bottom = clamp(
      Math.ceil(
        ((horizon - ((v.y - v.h - player.eye / TILE) * PROJ) / d) * h) / H,
      ) + 1,
      0,
      h,
    );
    if (right <= left || bottom <= top) return;
    const data = frame.data;
    for (let iy = top; iy < bottom; iy++) {
      const sy = (iy + 0.5) / h,
        rise = (horizon - sy * H) / PROJ;
      const y = (player.eye / TILE + rise * d - v.y) / v.h;
      for (let ix = left; ix < right; ix++) {
        const idx = (iy * w + ix) * 4,
          sx = (ix + 0.5) / w;
        data[idx + 3] = 0;
        const lateral = ((sx * W - W / 2) * d) / PROJ - side;
        const f = d - centerDepth;
        const radial = (lateral * lateral + f * f) / (v.r * v.r) + y * y;
        if (radial >= 1) continue;
        const floor = rise < 0 ? -(player.eye / TILE) / rise : Infinity;
        const length = Math.min(far, sample(sx, sy), floor) - near;
        if (length <= 0) continue;
        const wx = (f * cos - lateral * sin) / v.r,
          wz = (f * sin + lateral * cos) / v.r;
        const billow =
          mist(wx * 3 + v.seed, y * 3 - v.t * 0.3, wz * 3) +
          0.37 * mist(wx * 7, y * 7 - v.t * 0.47, wz * 7 + v.seed);
        const density =
          clamp((1 - radial) * 1.8 + billow * 1.8 - 1.16, 0, 1) *
          clamp((1 - radial) * 5, 0, 1);
        const light = 129 + 23 * y - 9 * wx + 68 * billow;
        data[idx] = light + 5;
        data[idx + 1] = light + 6;
        data[idx + 2] = light + 3;
        data[idx + 3] =
          255 * (1 - Math.exp((-3.6 * v.opacity * density * length) / v.r));
      }
    }
    paint.putImageData(frame, 0, 0, left, top, right - left, bottom - top);
    ctx.drawImage(
      surface,
      left,
      top,
      right - left,
      bottom - top,
      (left * W) / w,
      (top * H) / h,
      ((right - left) * W) / w,
      ((bottom - top) * H) / h,
    );
  }
  return { reset, update, obscures, layers };
})();
