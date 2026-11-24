// Yaw and foot contacts belong to the actor, independently of the camera.
// Positions are map tiles. Lift, leg lengths and speed are in metres.
function angleDelta(from, to) {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}
function approachYaw(from, to, rate, dt) {
  return from + clamp(angleDelta(from, to), -rate * dt, rate * dt);
}

function stancePoint(x, z, yaw, index) {
  const lateral = (index === 0 ? -0.145 : 0.145) / TILE;
  return { x: x - Math.sin(yaw) * lateral, z: z + Math.cos(yaw) * lateral };
}
function makeOpponentFootwork(x, z, yaw) {
  return {
    yaw,
    chest: yaw,
    look: yaw,
    velocity: 0,
    speed: 0,
    active: -1,
    next: 0,
    phase: 0,
    duration: 0.23,
    feet: [0, 1].map((i) => ({ ...stancePoint(x, z, yaw, i), yaw, lift: 0 })),
  };
}

function steerOpponent(enemy, vx, vz, aim, dt) {
  const g = enemy.gait;
  // Remove an obstructed component before choosing the heading (wall slides).
  const step = enemy.speed * dt;
  if (collides(enemy.x + vx * step, enemy.z, 0.22)) vx = 0;
  if (collides(enemy.x, enemy.z + vz * step, 0.22)) vz = 0;
  const amount = Math.hypot(vx, vz);
  const desired = amount > 0.001 ? Math.atan2(vz, vx) : (aim ?? g.yaw);
  g.yaw = approachYaw(g.yaw, desired, 4.4, dt);
  const error = angleDelta(g.yaw, desired);
  // Take weight off the moving leg before a reversal; accelerate out of the turn.
  const targetSpeed = enemy.speed * amount * Math.max(0, Math.cos(error));
  g.velocity += clamp(targetSpeed - g.velocity, -12 * dt, 7 * dt);
  if (amount > 0.001) {
    moveEntity(
      enemy,
      Math.cos(g.yaw) * g.velocity * dt,
      Math.sin(g.yaw) * g.velocity * dt,
      0.22,
    );
  }
  const look = aim ?? desired;
  g.chest = approachYaw(
    g.chest,
    g.yaw + clamp(angleDelta(g.yaw, look), -0.62, 0.62),
    5.2,
    dt,
  );
  g.look = approachYaw(
    g.look,
    g.chest + clamp(angleDelta(g.chest, look), -0.55, 0.55),
    6.8,
    dt,
  );
}

function landingPoint(enemy, index, leadX, leadZ) {
  const point = stancePoint(enemy.x, enemy.z, enemy.gait.yaw, index);
  if (enemy.perched) return point;
  const x = point.x + leadX,
    z = point.z + leadZ;
  // Keep soles on traversable ground when a predicted stride reaches cover.
  if (!collides(x, z, 0.045)) return { x, z };
  for (const fraction of [0.65, 0.3, 0]) {
    const px = point.x + leadX * fraction,
      pz = point.z + leadZ * fraction;
    if (!collides(px, pz, 0.045)) return { x: px, z: pz };
  }
  return { x: enemy.x, z: enemy.z };
}

function updateOpponentFootwork(enemy, oldX, oldZ, dt) {
  if (dt <= 0) return;
  const g = enemy.gait;
  // The root must wait for the next contact if it would outrun the supporting
  // leg. Limit the accepted movement, never pull a planted boot after the hips.
  const support = g.feet[1 - (g.active < 0 ? g.next : g.active)];
  const dx = enemy.x - oldX,
    dz = enemy.z - oldZ;
  const ox = oldX - support.x,
    oz = oldZ - support.z;
  const radius = Math.max(0.63 / TILE, Math.hypot(ox, oz));
  if (Math.hypot(enemy.x - support.x, enemy.z - support.z) > radius + 1e-9) {
    const a = dx * dx + dz * dz,
      b = ox * dx + oz * dz;
    const c = ox * ox + oz * oz - radius * radius;
    const t = clamp((-b + Math.sqrt(Math.max(0, b * b - a * c))) / a, 0, 1);
    enemy.x = oldX;
    enemy.z = oldZ;
    moveEntity(enemy, dx * t, dz * t, 0.22);
  }
  const vx = (enemy.x - oldX) / dt,
    vz = (enemy.z - oldZ) / dt;
  const speed = Math.hypot(vx, vz) * TILE;
  g.speed = speed;
  if (g.active < 0) {
    const errors = g.feet.map((foot, i) => {
      const home = stancePoint(enemy.x, enemy.z, g.yaw, i);
      return (
        Math.hypot(foot.x - home.x, foot.z - home.z) * TILE +
        0.08 * Math.abs(angleDelta(foot.yaw, g.yaw))
      );
    });
    // At a crawl, small displacements accumulate against a fixed world contact.
    // Rotation also creates an error, so a stationary pivot picks up its boots.
    const moving = speed > 0.22;
    if (!moving && Math.max(...errors) < 0.095) return;
    const i = moving ? g.next : errors[0] > errors[1] ? 0 : 1;
    const f = g.feet[i];
    g.active = i;
    g.phase = 0;
    g.duration = clamp(0.38 - 0.042 * speed, 0.172, 0.34);
    g.start = { x: f.x, z: f.z, yaw: f.yaw };
    g.peak = clamp(0.055 + speed * 0.032, 0.06, 0.21);
    g.goal = landingPoint(
      enemy,
      i,
      vx * g.duration * 1.45,
      vz * g.duration * 1.45,
    );
    g.goalYaw = g.yaw;
  }
  const i = g.active,
    foot = g.feet[i];
  g.phase = Math.min(1, g.phase + dt / g.duration);
  const t = g.phase;
  if (t < 0.72) {
    const lead = g.duration * (1.45 - t);
    g.goal = landingPoint(enemy, i, vx * lead, vz * lead);
    g.goalYaw = g.yaw;
  }
  const blend = t * t * (3 - 2 * t);
  foot.x = g.start.x + (g.goal.x - g.start.x) * blend;
  foot.z = g.start.z + (g.goal.z - g.start.z) * blend;
  // During a sharp turn the swing target can change after takeoff. Keep
  // the airborne boot within leg reach before it becomes the next contact.
  const reach = Math.hypot(foot.x - enemy.x, foot.z - enemy.z) * TILE;
  if (reach > 0.63) {
    foot.x = enemy.x + ((foot.x - enemy.x) * 0.63) / reach;
    foot.z = enemy.z + ((foot.z - enemy.z) * 0.63) / reach;
  }
  foot.yaw = g.start.yaw + angleDelta(g.start.yaw, g.goalYaw) * blend;
  foot.lift = g.peak * Math.sin(Math.PI * t) ** 2;
  if (t === 1) {
    foot.lift = 0;
    g.active = -1;
    g.next = 1 - i;
  }
}
