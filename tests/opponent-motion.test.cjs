const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { runInNewContext } = require("node:vm");

function fixture() {
  const terrain = { blocked: false };
  const runtime = {
    TILE: 2.75,
    clamp: (v, lo, hi) => Math.max(lo, Math.min(hi, v)),
    collides: (_x, _z, radius) => terrain.blocked && radius >= 0.22,
    moveEntity: (e, dx, dz) => {
      if (!terrain.blocked) {
        e.x += dx;
        e.z += dz;
      }
    },
  };
  runInNewContext(
    readFileSync(join(__dirname, "../opponent-motion.js"), "utf8"),
    runtime,
  );
  return { runtime, terrain };
}
const unchanged = (a, b) => a.x === b.x && a.z === b.z && a.yaw === b.yaw;

test("every actor keeps the support sole fixed through approach, reversal, slow travel and a stop", () => {
  for (let i = 0; i < 8; i++) {
    const { runtime, terrain } = fixture(),
      dt = 1 / (30 + i * 5);
    const e = { x: 3 + i, z: 4, speed: 1.2 + i * 0.11 };
    e.gait = runtime.makeOpponentFootwork(e.x, e.z, (i * Math.PI) / 4);
    const swings = new Set();
    let contacts = 0;
    for (let tick = 0; tick < 520; tick++) {
      const x = e.x,
        z = e.z,
        yaw = e.gait.yaw,
        old = e.gait.feet.map((f) => ({ ...f }));
      terrain.blocked = tick > 400;
      const direction = tick < 120 ? 0 : tick < 245 ? Math.PI : Math.PI * 0.5;
      const walk = tick < 245 ? 1 : 0.042;
      runtime.steerOpponent(
        e,
        Math.cos(direction) * walk,
        Math.sin(direction) * walk,
        null,
        dt,
      );
      runtime.updateOpponentFootwork(e, x, z, dt);
      assert.ok(
        Math.abs(runtime.angleDelta(yaw, e.gait.yaw)) <= 4.4 * dt + 1e-10,
      );
      assert.ok(
        e.gait.feet.some(
          (f, k) => f.lift === 0 && old[k].lift === 0 && unchanged(f, old[k]),
        ),
      );
      for (const [k, f] of e.gait.feet.entries()) {
        assert.ok(
          Math.hypot(e.x - f.x, e.z - f.z) * 2.75 < 0.631,
          "hips outran a boot",
        );
        if (f.lift > 0.02 && tick < 245) swings.add(k);
        if (f.lift === 0 && old[k].lift > 0) contacts++;
      }
    }
    assert.equal(swings.size, 2);
    assert.ok(contacts >= 8);
    assert.equal(e.gait.active, -1);
    assert.ok(e.gait.feet.every((f) => f.lift === 0));
  }
});
test("a stationary half-turn lifts and replants both boots at the new heading", () => {
  const { runtime } = fixture();
  const e = {
    x: 0,
    z: 0,
    speed: 1.5,
    gait: runtime.makeOpponentFootwork(0, 0, 0),
  };
  const lifted = new Set();
  for (let i = 0; i < 240; i++) {
    runtime.steerOpponent(e, 0, 0, Math.PI, 1 / 60);
    runtime.updateOpponentFootwork(e, 0, 0, 1 / 60);
    e.gait.feet.forEach((f, k) => {
      if (f.lift > 0.01) lifted.add(k);
    });
  }
  assert.equal(lifted.size, 2);
  assert.equal(e.x, 0);
  assert.equal(e.z, 0);
  for (const f of e.gait.feet)
    assert.ok(Math.abs(runtime.angleDelta(f.yaw, Math.PI)) < 0.35);
});
test("sub-threshold movement accumulates into real steps at different frame rates", () => {
  for (const hz of [30, 60, 144]) {
    const { runtime } = fixture(),
      dt = 1 / hz,
      e = { x: 0, z: 0, gait: runtime.makeOpponentFootwork(0, 0, 0) };
    let lifted = new Set();
    for (let i = 0; i < hz * 8; i++) {
      const old = e.x;
      e.x += 0.045 * dt;
      runtime.updateOpponentFootwork(e, old, 0, dt);
      e.gait.feet.forEach((f, k) => {
        if (f.lift > 0.02) lifted.add(k);
      });
    }
    assert.equal(lifted.size, 2);
    for (const f of e.gait.feet) assert.ok(Math.abs(f.x - e.x) * 2.75 < 0.14);
  }
});
