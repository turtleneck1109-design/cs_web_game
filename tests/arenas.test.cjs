const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { arenas, chooseRoundSpawns } = vm.runInNewContext(
  fs.readFileSync(path.join(__dirname, "../arenas.js"), "utf8") +
    "\n;({arenas,chooseRoundSpawns})",
);
for (const scene of Object.values(arenas)) {
  test(
    scene.code +
      " has connected lanes and reachable ground and rooftop positions",
    () => {
      const { grid, starts, targets } = scene;
      const width = grid[0].length,
        height = grid.length;
      assert.ok(
        grid.every(
          (row, z) =>
            row.length === width &&
            row.startsWith("#") &&
            row.endsWith("#") &&
            ((z > 0 && z < height - 1) || /^#+$/.test(row)),
        ),
      );
      const visited = new Set(),
        queue = [[Math.floor(starts[0][0]), Math.floor(starts[0][1])]];
      for (let i = 0; i < queue.length; i++) {
        const [x, z] = queue[i],
          key = x + "," + z;
        if (grid[z]?.[x] !== "." || visited.has(key)) continue;
        visited.add(key);
        queue.push([x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]);
      }
      assert.equal(visited.size, grid.join("").split(".").length - 1);
      for (const [sx, sz] of starts) {
        assert.ok(visited.has(Math.floor(sx) + "," + Math.floor(sz)));
        const eligible = targets.filter(
          ([x, z]) => Math.hypot(x - sx, z - sz) >= 4.5,
        );
        assert.ok(eligible.filter((t) => t[2]).length >= 2);
        assert.ok(eligible.filter((t) => !t[2]).length >= 6);
      }
      for (const [i, [x, z]] of targets.entries()) {
        for (const [a, b] of targets.slice(i + 1))
          assert.ok(Math.hypot(a - x, b - z) >= 1.5, "placements too close");
      }
      for (const [x, z, perched] of targets) {
        const col = Math.floor(x),
          row = Math.floor(z);
        if (perched) {
          assert.equal(grid[row][col], "#");
          assert.ok(
            [
              [1, 0],
              [-1, 0],
              [0, 1],
              [0, -1],
            ].some(([dx, dz]) => visited.has(col + dx + "," + (row + dz))),
          );
        } else assert.ok(visited.has(col + "," + row));
      }
    },
  );
  test(
    scene.code + " selects a fresh player start and a full, spaced roster",
    () => {
      let previous;
      for (let i = 0; i < 100; i++) {
        const { start, targets } = chooseRoundSpawns(scene, previous);
        assert.notEqual(start, previous);
        assert.ok(scene.starts.includes(start));
        previous = start;
        assert.equal(new Set(targets).size, 8);
        assert.equal(targets.filter((t) => t[2]).length, 2);
        for (const [x, z] of targets)
          assert.ok(Math.hypot(x - start[0], z - start[1]) >= 4.5);
      }
    },
  );
}
