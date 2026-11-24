const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { runInNewContext } = require("node:vm");

function scenario() {
  const player = { x: 0, z: 0, eye: 1.6, yaw: 0, pitch: 0 };
  const runtime = {
    player,
    TILE: 2.75,
    rand: (a, b) => (a + b) / 2,
    collides: () => false,
    lineOfSight: () => true,
    platformHeight: (e) => e.height ?? 0,
    document: {
      createElement: () => ({
        getContext: () => ({ createImageData: () => ({}) }),
      }),
    },
  };
  const smoke = runInNewContext(
    readFileSync(join(__dirname, "../smoke.js"), "utf8") + "\nsmoke",
    runtime,
  );
  smoke.reset();
  return { smoke, runtime };
}
test("smoke obscures only sight segments through its dense core and clears after expiry or replay", () => {
  const { smoke } = scenario();
  const beyond = { x: 8, z: 0 };
  smoke.update(4);
  assert.equal(smoke.obscures(beyond), false);
  smoke.update(3);
  assert.equal(smoke.obscures(beyond), true);
  assert.equal(smoke.obscures({ x: 2, z: 0 }), false);
  assert.equal(smoke.obscures({ x: 8, z: 4 }), false);
  assert.equal(smoke.obscures({ x: 8, z: 0, height: 5 }), false);
  smoke.update(5);
  assert.equal(smoke.obscures(beyond), false);
  smoke.update(7);
  smoke.update(3);
  assert.equal(smoke.obscures(beyond), true);
  smoke.reset();
  assert.equal(smoke.obscures(beyond), false);
});
test("a blocked landing site retries when a clear site becomes available", () => {
  const { smoke, runtime } = scenario();
  runtime.collides = () => true;
  smoke.update(4);
  smoke.update(3);
  assert.equal(smoke.obscures({ x: 8, z: 0 }), false);
  runtime.collides = () => false;
  smoke.update(1);
  smoke.update(3);
  assert.equal(smoke.obscures({ x: 8, z: 0 }), true);
});
