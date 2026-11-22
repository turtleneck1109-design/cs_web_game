// World coordinates are map tiles. Each planted foot stays at its last contact
// point until the other boot has landed, even when the camera moves.
const opponentRig = {
  width: 251,
  height: 640,
  hip: 298,
  knee: 446,
  ankle: 563,
  soles: [26, 199],
  soleY: 637,
};

function makeOpponentFootwork() {
  return { feet: null, swing: 0, phase: 0, length: 0, weight: 0 };
}

function updateOpponentFootwork(enemy, oldX, oldZ, dt) {
  const gait = enemy.gait;
  const dx = enemy.x - oldX,
    dz = enemy.z - oldZ;
  const distance = Math.hypot(dx, dz);
  const bearing = Math.atan2(enemy.z - player.z, enemy.x - player.x);
  const rightX = -Math.sin(bearing),
    rightZ = Math.cos(bearing);
  const offsets = opponentRig.soles.map(
    (x) => ((x / opponentRig.width - 0.5) * (86 / 200) * 1.72) / TILE,
  );
  if (!gait.feet) {
    gait.feet = offsets.map((offset) => {
      const x = oldX + rightX * offset,
        z = oldZ + rightZ * offset;
      return { x, z, startX: x, startZ: z, lift: 0 };
    });
  }

  if (distance < 0.00001) {
    // Finish lowering the raised boot without dragging either sole sideways.
    const foot = gait.feet[gait.swing];
    foot.lift = Math.max(0, foot.lift - dt * 1.55);
    gait.weight = Math.max(0, gait.weight - dt * 8);
    if (foot.lift === 0) {
      foot.startX = foot.x;
      foot.startZ = foot.z;
      gait.phase = 0;
    }
    return;
  }

  const ux = dx / distance,
    uz = dz / distance;
  const lateral = Math.abs(ux * rightX + uz * rightZ);
  const speed = (distance * TILE) / dt;
  const stride = clamp(0.59 + speed * 0.12 - lateral * 0.25, 0.47, 1.21) / TILE;
  if (gait.weight === 0 && gait.phase === 0) {
    gait.swing = ux * rightX + uz * rightZ > 0 ? 1 : 0;
    const foot = gait.feet[gait.swing];
    foot.startX = foot.x;
    foot.startZ = foot.z;
  }
  gait.weight = Math.min(1, gait.weight + dt * 12);
  let remaining = distance;
  while (remaining > 1e-8) {
    if (gait.phase === 0) gait.length = stride;
    const advance = Math.min(remaining, (1 - gait.phase) * gait.length);
    const t = Math.min(1, gait.phase + advance / gait.length);
    remaining -= advance;
    const foot = gait.feet[gait.swing];
    // At touchdown the foot is half a stance ahead of the hips. Predict from
    // the current direction so a corner or blocked axis affects the next step.
    const lead = (1.5 - t) * gait.length - remaining;
    const targetX = enemy.x + rightX * offsets[gait.swing] + ux * lead;
    const targetZ = enemy.z + rightZ * offsets[gait.swing] + uz * lead;
    const blend = t * t * (3 - 2 * t);
    foot.x = foot.startX + (targetX - foot.startX) * blend;
    foot.z = foot.startZ + (targetZ - foot.startZ) * blend;
    foot.lift =
      Math.sin(Math.PI * t) ** 2 * clamp(0.065 + speed * 0.026, 0.08, 0.215);
    gait.phase = t;
    if (t >= 1 - 1e-8) {
      foot.lift = 0;
      gait.swing = 1 - gait.swing;
      const next = gait.feet[gait.swing];
      next.startX = next.x;
      next.startZ = next.z;
      gait.phase = 0;
    }
  }
}

// Separate the illustrated legs once. The shared hip overlap is covered by the
// jacket, and all three moving leg sections meet at identical transformed edges.
function prepareOpponentLayers(source, fallback = false) {
  const { width, height, hip } = opponentRig;
  const makeLayer = () => {
    const image = document.createElement("canvas");
    image.width = width;
    image.height = height;
    return image;
  };
  const body = makeLayer();
  const c = body.getContext("2d");
  const hipY = fallback ? 361 : hip;
  const splitY = fallback ? 408 : 354;
  c.drawImage(source, 0, 0, width, height);
  const legs = [0, 1].map((index) => {
    const layer = makeLayer(),
      g = layer.getContext("2d");
    g.beginPath();
    const edge = index === 0 ? 0 : width;
    g.moveTo(edge, hipY);
    g.lineTo(width * 0.53, hipY);
    g.lineTo(width * 0.49, splitY);
    g.lineTo(width * 0.49, height);
    g.lineTo(edge, height);
    g.closePath();
    g.clip();
    g.drawImage(body, 0, 0);
    return layer;
  });
  c.clearRect(0, hipY + 12, width, height);
  return { body, legs, hipY, soles: fallback ? [66, 161] : opponentRig.soles };
}

function projectOpponentPose(enemy, s) {
  const gait = enemy.gait,
    h = s.syFeet - s.syTop;
  const left = s.sx - s.w / 2;
  const base = { left, top: s.syTop, right: left + s.w, bottom: s.syFeet };
  if (!gait.feet) return { bounds: base, feet: null };
  const cos = Math.cos(player.yaw),
    sin = Math.sin(player.yaw);
  const horizon = H * 0.5 + Math.tan(player.pitch) * PROJ;
  const feet = gait.feet.map((foot) => {
    const x = foot.x - player.x,
      z = foot.z - player.z;
    const depth = Math.max(0.08, x * cos + z * sin);
    const screenX = W * 0.5 + ((-x * sin + z * cos) * PROJ) / depth;
    const groundY = horizon + (player.eye * PROJ) / (depth * TILE);
    return {
      x: screenX,
      groundY,
      y: groundY - (foot.lift * PROJ) / (depth * TILE),
      depth,
      lift: foot.lift,
    };
  });
  const support = 1 - gait.swing;
  const transfer = Math.sin(Math.PI * gait.phase) ** 2 * gait.weight;
  const bodyX = (support === 0 ? -1 : 1) * s.w * 0.033 * transfer;
  // Lower the hips as the stance widens, so a long lateral step bends the
  // supporting leg instead of stretching both legs to full extension.
  const spread =
    Math.hypot(
      gait.feet[0].x - gait.feet[1].x,
      gait.feet[0].z - gait.feet[1].z,
    ) * TILE;
  const bodyY =
    h * (clamp((spread - 0.58) * 0.095, 0, 0.057) - 0.012 * transfer);
  const margin = s.w * 0.23;
  return {
    feet,
    bodyX,
    bodyY,
    bounds: {
      left: Math.min(
        left + Math.min(0, bodyX),
        ...feet.map((f) => f.x - margin),
      ),
      right: Math.max(
        left + s.w + Math.max(0, bodyX),
        ...feet.map((f) => f.x + margin),
      ),
      top: s.syTop + bodyY,
      bottom: Math.max(s.syFeet, ...feet.map((f) => f.groundY)) + h * 0.014,
    },
  };
}

function drawOpponentPose(ctx, s, pose, layers) {
  const { width, height, knee, ankle, soleY } = opponentRig;
  const h = s.syFeet - s.syTop,
    left = s.sx - s.w / 2;
  ctx.save();
  ctx.translate(left, s.syTop);
  ctx.scale(s.w / width, h / height);
  const bx = ((pose.bodyX || 0) * width) / s.w,
    by = ((pose.bodyY || 0) * height) / h;
  const order =
    pose.feet && pose.feet[0].depth < pose.feet[1].depth ? [1, 0] : [0, 1];
  for (const i of order) {
    const f = pose.feet?.[i],
      sole = layers.soles[i];
    const fx = f ? ((f.x - left) * width) / s.w - sole : 0;
    const fy = f ? ((f.y - s.syTop) * height) / h - soleY : 0;
    const lift = f ? (f.lift / 1.72) * height : 0;
    const bend = (i === 0 ? -1 : 1) * lift * 0.12;
    const joints = [
      [layers.hipY, bx, by],
      [knee, bx * 0.5 + fx * 0.5 + bend, by * 0.5 + fy * 0.5 - lift * 0.4],
      [ankle, fx, fy],
      [height, fx, fy],
    ];
    for (let j = 0; j < 3; j++) {
      const [y0, x0, dy0] = joints[j],
        [y1, x1, dy1] = joints[j + 1];
      const span = y1 - y0;
      ctx.save();
      ctx.transform(
        1,
        0,
        (x1 - x0) / span,
        1 + (dy1 - dy0) / span,
        x0,
        y0 + dy0,
      );
      ctx.drawImage(layers.legs[i], 0, y0, width, span, 0, 0, width, span);
      ctx.restore();
    }
  }
  ctx.drawImage(layers.body, bx, by);
  ctx.restore();
}
